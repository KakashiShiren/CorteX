import { randomUUID } from "crypto";

import { campusMapBuildings } from "@/lib/campus-map-data";
import { env, hasGroqEnv } from "@/lib/env";
import { fail, ok, requireUserId } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { Citation, KnowledgeBaseEntry } from "@/lib/types";
import { aiChatSchema } from "@/lib/validators";

const NO_CONTEXT_MESSAGE =
  "I don't have that information right now, please check clark.edu directly.";

const SYSTEM_PROMPT = `You are Cortex, the official AI Campus Assistant for Clark University in Worcester, Massachusetts.

Your job is to help Clark students quickly find information about campus buildings, facilities, hours, services, and resources.

Important building aliases students commonly use:
- "Higgins Hall" or "HUC" = Higgins University Center (building 24, main student center + dining)
- "The gym" or "rec center" = Kneller Athletic Center (building 31)
- "The library" or "the lib" = Goddard Library (building 21)
- "The bio building" = Lasry Center for Bioscience (building 32)
- "JAC" = Jefferson Academic Center (building 28)
- "JCH" or "Jonas Clark" = Jonas Clark Hall (building 30)
- "The health center" = Health Services (building 13)
- "The dining hall" or "cafeteria" = The Table at Higgins in Higgins University Center

Rules:
- Answer ONLY using the provided context below. Do not make up information.
- If the answer is not in the context, say: "${NO_CONTEXT_MESSAGE}"
- Be friendly and concise. Sound like a helpful upperclassman, not a robot.
- Always end with a "Source:" line citing where the info came from.
- Never say you do not know what "Higgins Hall" means. It refers to Higgins University Center.`;

const STOP_WORDS = new Set([
  "is",
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "i",
  "my",
  "me",
  "do",
  "can",
  "how",
  "what",
  "where",
  "when",
  "who",
  "are",
  "right",
  "now",
  "today",
  "please",
  "tell",
  "about"
]);

const QUERY_ALIAS_EXPANSIONS: Array<[string, string[]]> = [
  ["higgins hall", ["higgins", "huc", "student", "center"]],
  ["huc", ["higgins", "university", "center"]],
  ["the gym", ["kneller", "gym", "athletic", "center", "rec"]],
  ["rec center", ["kneller", "gym", "athletic", "recreation", "center"]],
  ["the lib", ["goddard", "library"]],
  ["library", ["goddard", "library"]],
  ["bio building", ["lasry", "bioscience", "biology"]],
  ["jac", ["jefferson", "academic", "center"]],
  ["jch", ["jonas", "clark", "hall"]],
  ["health center", ["health", "services", "clinic"]],
  ["cafeteria", ["higgins", "dining", "table"]],
  ["dining hall", ["higgins", "dining", "table"]]
];

const QUERY_ALIAS_VARIANTS: Array<[string, string[]]> = [
  ["higgins hall", ["higgins hall", "higgins university center", "huc"]],
  ["huc", ["huc", "higgins hall", "higgins university center"]],
  ["the gym", ["the gym", "kneller athletic center", "rec center"]],
  ["rec center", ["rec center", "kneller athletic center", "the gym"]],
  ["the lib", ["the lib", "goddard library", "library"]],
  ["library", ["library", "goddard library", "the lib"]],
  ["bio building", ["bio building", "lasry center for bioscience", "lasry"]],
  ["jac", ["jac", "jefferson academic center", "jefferson"]],
  ["jch", ["jch", "jonas clark hall", "jonas clark"]],
  ["health center", ["health center", "health services", "clinic"]],
  ["cafeteria", ["cafeteria", "the table at higgins", "higgins university center"]],
  ["dining hall", ["dining hall", "the table at higgins", "higgins university center"]]
];

function normalizeSearchText(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function extractKeywords(message: string) {
  const normalized = normalizeSearchText(message);
  const tokens = new Set(
    normalized
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
  );

  const padded = ` ${normalized} `;
  for (const [alias, expansions] of QUERY_ALIAS_EXPANSIONS) {
    if (!padded.includes(` ${alias} `)) {
      continue;
    }

    for (const expansion of expansions) {
      if (expansion.length > 2 && !STOP_WORDS.has(expansion)) {
        tokens.add(expansion);
      }
    }
  }

  return Array.from(tokens).slice(0, 10);
}

function extractSearchPhrases(message: string) {
  const normalized = normalizeSearchText(message);
  const phrases = new Set<string>();

  if (normalized.split(" ").length <= 6) {
    phrases.add(normalized);
  }

  const padded = ` ${normalized} `;
  for (const [alias, variants] of QUERY_ALIAS_VARIANTS) {
    if (!padded.includes(` ${alias} `)) {
      continue;
    }

    for (const variant of variants) {
      phrases.add(variant);
    }
  }

  return Array.from(phrases).filter(Boolean);
}

function escapeLikeValue(value: string) {
  return value.replace(/[%_]/g, "").trim();
}

function slugifyBuildingName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function isLocationQuestion(question: string) {
  const normalized = normalizeSearchText(question);
  return /\bwhere\b/.test(normalized) || /\blocation\b/.test(normalized) || /\bfind\b/.test(normalized);
}

function hasHttpSource(source?: string | null) {
  return Boolean(source && /^https?:\/\//i.test(source.trim()));
}

function isInformationalCategory(category: string) {
  return ["hours", "contact", "booking", "facility", "services", "dining"].includes(category);
}

function normalizeBuildingTitle(title: string) {
  return title.replace(/\s*-\s*location$/i, "").trim();
}

function findMapBuilding(question: string, entries: KnowledgeBaseEntry[]) {
  const candidateNames = new Set<string>();
  const normalizedQuestion = normalizeSearchText(question);

  for (const entry of entries) {
    if (entry.category === "building") {
      candidateNames.add(normalizeBuildingTitle(entry.title));
    }
  }

  for (const [alias, variants] of QUERY_ALIAS_VARIANTS) {
    if (!normalizedQuestion.includes(alias)) {
      continue;
    }

    for (const variant of variants) {
      candidateNames.add(variant);
    }
  }

  for (const name of candidateNames) {
    const normalizedName = normalizeSearchText(name);
    const exactMatch = campusMapBuildings.find(
      (building) => normalizeSearchText(building.name) === normalizedName
    );
    if (exactMatch) {
      return exactMatch;
    }

    const fuzzyMatch = campusMapBuildings.find((building) => {
      const buildingName = normalizeSearchText(building.name);
      return buildingName.includes(normalizedName) || normalizedName.includes(buildingName);
    });

    if (fuzzyMatch) {
      return fuzzyMatch;
    }
  }

  return null;
}

function buildLocationAnswer(question: string, entries: KnowledgeBaseEntry[]) {
  if (!isLocationQuestion(question)) {
    return null;
  }

  const primaryEntry = entries.find((entry) => entry.category === "building") ?? entries[0];
  if (!primaryEntry) {
    return null;
  }

  const building = findMapBuilding(question, entries);
  if (!building) {
    return null;
  }

  return {
    message: `${primaryEntry.content}\n\nOpen on map: /map?building=${slugifyBuildingName(building.name)}`,
    citations: [] as Citation[]
  };
}

function scoreKnowledgeBaseEntry(entry: KnowledgeBaseEntry, question: string) {
  const normalizedQuestion = normalizeSearchText(question);
  const questionTokens = extractKeywords(question);
  const title = normalizeSearchText(entry.title);
  const content = normalizeSearchText(entry.content);
  const keywordPhrases = (entry.keywords ?? []).map((keyword) => normalizeSearchText(keyword));
  const keywordTokens = new Set(
    keywordPhrases.flatMap((keyword) => keyword.split(/\s+/).filter(Boolean))
  );

  let score = 0;
  for (const token of questionTokens) {
    if (keywordTokens.has(token)) {
      score += 6;
    } else if (title.includes(token)) {
      score += 4;
    } else if (content.includes(token)) {
      score += 2;
    }
  }

  for (const keyword of keywordPhrases) {
    if (keyword.includes(" ") && normalizedQuestion.includes(keyword)) {
      score += 8;
    }
  }

  if (title.includes(normalizedQuestion) || content.includes(normalizedQuestion)) {
    score += 6;
  }

  const asksForLocation = /\bwhere\b/.test(normalizedQuestion);
  const asksForHours = questionTokens.some((token) =>
    ["hours", "open", "close", "weekday", "weekend", "monday", "friday", "saturday", "sunday"].includes(token)
  );
  const asksForContact = questionTokens.some((token) =>
    ["phone", "number", "contact", "call"].includes(token)
  );
  const asksForBooking = questionTokens.some((token) =>
    ["book", "booking", "reserve", "reservation"].includes(token)
  );

  if (asksForLocation && entry.category === "building") {
    score += 10;
  }

  if (asksForHours && entry.category === "hours") {
    score += 10;
  }

  if (asksForContact && entry.category === "contact") {
    score += 10;
  }

  if (asksForBooking && entry.category === "booking") {
    score += 10;
  }

  if (!asksForLocation) {
    if (hasHttpSource(entry.source)) {
      score += 4;
    }

    if (isInformationalCategory(entry.category)) {
      score += 3;
    }

    if (entry.category === "building") {
      score -= 4;
    }

    if (/\blocation\b/.test(title) || /-\s*location$/i.test(entry.title)) {
      score -= 3;
    }
  }

  return score;
}

function rankKnowledgeBaseEntries(entries: KnowledgeBaseEntry[], question: string) {
  const seen = new Set<string>();

  const ranked = entries
    .filter((entry) => {
      const key = entry.id || entry.title;
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .map((entry) => ({
      entry,
      score: scoreKnowledgeBaseEntry(entry, question)
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) {
    return [];
  }

  const minimumScore = Math.max(4, ranked[0].score - 3);
  const shortlisted = ranked
    .filter((item) => item.score >= minimumScore)
    .slice(0, 3)
    .map((item) => item.entry);

  if (isLocationQuestion(question)) {
    return shortlisted;
  }

  const informationalEntries = shortlisted.filter(
    (entry) => hasHttpSource(entry.source) && entry.category !== "building"
  );

  return informationalEntries.length ? informationalEntries : shortlisted;
}

function toCitations(entries: KnowledgeBaseEntry[], question: string): Citation[] {
  const citations: Citation[] = [];
  const seenEntries = new Set<string>();
  const preferredEntries = isLocationQuestion(question)
    ? entries
    : entries.filter((entry) => hasHttpSource(entry.source));
  const sourceEntries = preferredEntries.length ? preferredEntries : entries;

  for (const entry of sourceEntries) {
    const entryKey = `${entry.title.trim().toLowerCase()}::${entry.source?.trim().toLowerCase() ?? ""}`;
    if (seenEntries.has(entryKey)) {
      continue;
    }

    citations.push({
      id: entry.id,
      title: entry.title,
      source: entry.source,
      category: entry.category
    });
    seenEntries.add(entryKey);

    if (citations.length === 2) {
      break;
    }
  }

  return citations;
}

function buildDirectInformationAnswer(question: string, entries: KnowledgeBaseEntry[]) {
  if (isLocationQuestion(question)) {
    return null;
  }

  const urlEntries = entries.filter((entry) => hasHttpSource(entry.source));
  if (!urlEntries.length) {
    return null;
  }

  const questionTokens = extractKeywords(question);
  const asksForHours = questionTokens.some((token) =>
    ["hours", "open", "close", "weekday", "weekend", "monday", "friday", "saturday", "sunday"].includes(token)
  );
  const asksForContact = questionTokens.some((token) =>
    ["phone", "number", "contact", "call", "email"].includes(token)
  );
  const asksForBooking = questionTokens.some((token) =>
    ["book", "booking", "reserve", "reservation"].includes(token)
  );

  let selectedEntries = urlEntries;

  if (asksForBooking) {
    selectedEntries = urlEntries.filter((entry) => entry.category === "booking");
  } else if (asksForHours) {
    selectedEntries = urlEntries.filter((entry) => entry.category === "hours");
  } else if (asksForContact) {
    selectedEntries = urlEntries.filter((entry) => ["contact", "hours"].includes(entry.category));
  } else {
    selectedEntries = urlEntries.filter((entry) => entry.category !== "building");
  }

  if (!selectedEntries.length) {
    return null;
  }

  const limit = asksForHours ? 2 : 1;
  const directEntries = selectedEntries.slice(0, limit);
  const citations = toCitations(directEntries, question);
  const message = appendSourcesToMessage(
    directEntries.map((entry) => entry.content.trim()).join(" "),
    citations
  );

  return {
    message,
    citations
  };
}

function buildContextFallbackAnswer(entries: KnowledgeBaseEntry[]) {
  if (!entries.length) {
    return NO_CONTEXT_MESSAGE;
  }

  const summary = entries
    .slice(0, 3)
    .map((entry) => `${entry.title}: ${entry.content}`)
    .join(" ");

  return `Here is what I found from Clark sources. ${summary}`;
}

function appendSourcesToMessage(message: string, citations: Citation[]) {
  const sources = Array.from(new Set(citations.map((citation) => citation.source).filter(Boolean)));
  if (!sources.length) {
    return message;
  }

  if (/sources?:/i.test(message)) {
    return message;
  }

  const label = sources.length === 1 ? "Source" : "Sources";
  return `${message.trim()}\n\n${label}: ${sources.join(", ")}`;
}

function normalizeConversationHistory(
  messages: Array<Record<string, unknown>> | Array<{ role: string; content: string }> | null | undefined
) {
  if (!Array.isArray(messages)) {
    return [] as Array<{ role: "user" | "assistant"; content: string }>;
  }

  return messages
    .map((message) => {
      const role = message.role === "assistant" ? "assistant" : message.role === "user" ? "user" : null;
      const content = typeof message.content === "string" ? message.content.trim() : "";
      if (!role || !content) {
        return null;
      }
      return { role, content };
    })
    .filter((message): message is { role: "user" | "assistant"; content: string } => Boolean(message))
    .slice(-4);
}

async function loadConversationHistory(userId: string, conversationId?: string) {
  if (!conversationId) {
    return [] as Array<{ role: "user" | "assistant"; content: string }>;
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    throw new Error("Supabase is not configured for AI chat history.");
  }

  const query = await supabase
    .from("chat_conversations")
    .select("messages")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (query.error) {
    throw query.error;
  }

  return normalizeConversationHistory(
    (query.data?.messages as Array<Record<string, unknown>> | undefined) ?? []
  );
}

async function searchKnowledgeBaseEntries(question: string) {
  const tokens = extractKeywords(question);
  const phrases = extractSearchPhrases(question);
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for AI knowledge retrieval.");
  }

  if (phrases.length) {
    const phraseClauses = phrases
      .flatMap((phrase) => {
        const safePhrase = escapeLikeValue(phrase);
        return safePhrase
          ? [`title.ilike.%${safePhrase}%`, `content.ilike.%${safePhrase}%`]
          : [];
      })
      .join(",");

    if (phraseClauses) {
      const phraseQuery = await supabase
        .from("ai_knowledge_base")
        .select("id, title, content, keywords, source, category")
        .or(phraseClauses)
        .limit(12);

      if (phraseQuery.error) {
        throw phraseQuery.error;
      }

      const phraseResults = rankKnowledgeBaseEntries(
        (phraseQuery.data ?? []) as KnowledgeBaseEntry[],
        question
      );

      if (phraseResults.length) {
        return phraseResults;
      }
    }
  }

  let keywordResults: KnowledgeBaseEntry[] = [];

  if (tokens.length) {
    const keywordQuery = await supabase
      .from("ai_knowledge_base")
      .select("id, title, content, keywords, source, category")
      .overlaps("keywords", tokens)
      .limit(8);

    if (keywordQuery.error) {
      throw keywordQuery.error;
    }

    keywordResults = rankKnowledgeBaseEntries(
      (keywordQuery.data ?? []) as KnowledgeBaseEntry[],
      question
    );
  }

  if (keywordResults.length) {
    return keywordResults;
  }

  if (!tokens.length) {
    return [];
  }

  try {
    const fullTextQuery = await supabase
      .from("ai_knowledge_base")
      .select("id, title, content, keywords, source, category")
      .textSearch("content", tokens.join(" "), {
        config: "english",
        type: "websearch"
      })
      .limit(8);

    if (fullTextQuery.error) {
      throw fullTextQuery.error;
    }

    return rankKnowledgeBaseEntries(
      (fullTextQuery.data ?? []) as KnowledgeBaseEntry[],
      question
    );
  } catch {
    const ilikeClauses = tokens
      .flatMap((token) => [`content.ilike.%${token}%`, `title.ilike.%${token}%`])
      .join(",");
    const fallbackQuery = await supabase
      .from("ai_knowledge_base")
      .select("id, title, content, keywords, source, category")
      .or(ilikeClauses)
      .limit(8);

    if (fallbackQuery.error) {
      throw fallbackQuery.error;
    }

    return rankKnowledgeBaseEntries(
      (fallbackQuery.data ?? []) as KnowledgeBaseEntry[],
      question
    );
  }
}

async function persistConversationMessages(
  userId: string,
  conversationId: string | undefined,
  payload: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
    citations?: Citation[];
  }>
) {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for AI conversation storage.");
  }

  const normalizedMessages = payload.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: message.createdAt,
    citations: message.citations ?? []
  }));

  let existingConversation:
    | {
        id: string;
        messages: Array<Record<string, unknown>>;
      }
    | null = null;

  if (conversationId) {
    const existingQuery = await supabase
      .from("chat_conversations")
      .select("id, messages")
      .eq("id", conversationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingQuery.error) {
      throw existingQuery.error;
    }

    existingConversation = existingQuery.data;
  }

  if (!existingConversation) {
    const insertQuery = await supabase
      .from("chat_conversations")
      .insert({
        user_id: userId,
        messages: normalizedMessages
      })
      .select("id")
      .single();

    if (insertQuery.error) {
      throw insertQuery.error;
    }

    return insertQuery.data.id;
  }

  const updateQuery = await supabase
    .from("chat_conversations")
    .update({
      messages: [...(existingConversation.messages ?? []), ...normalizedMessages],
      updated_at: new Date().toISOString()
    })
    .eq("id", existingConversation.id)
    .eq("user_id", userId)
    .select("id")
    .single();

  if (updateQuery.error) {
    throw updateQuery.error;
  }

  return updateQuery.data.id;
}

async function generateAssistantResponse(
  question: string,
  entries: KnowledgeBaseEntry[],
  citations: Citation[],
  history: Array<{ role: "user" | "assistant"; content: string }>
) {
  if (!entries.length) {
    return {
      message: NO_CONTEXT_MESSAGE,
      citations: [] as Citation[]
    };
  }

  const directAnswer = buildDirectInformationAnswer(question, entries);
  if (directAnswer) {
    return directAnswer;
  }

  if (!hasGroqEnv) {
    return {
      message: appendSourcesToMessage(buildContextFallbackAnswer(entries), citations),
      citations
    };
  }

  const context = entries
    .map(
      (entry) =>
        `Title: ${entry.title}\nCategory: ${entry.category}\nSource: ${entry.source}\nContent: ${entry.content}`
    )
    .join("\n\n");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.groqApiKey}`
    },
    body: JSON.stringify({
      model: env.groqModel,
      temperature: 0.2,
      max_tokens: 400,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        ...history,
        {
          role: "user",
          content:
            `Use the Clark context below to answer the user's latest question.\n\n` +
            `Latest question: ${question}\n\nContext:\n${context}`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Groq request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | null;
      };
    }>;
  };

  const responseText = payload.choices?.[0]?.message?.content?.trim();
  const rawMessage = responseText || buildContextFallbackAnswer(entries);
  if (normalizeSearchText(rawMessage) === normalizeSearchText(NO_CONTEXT_MESSAGE)) {
    return {
      message: NO_CONTEXT_MESSAGE,
      citations: [] as Citation[]
    };
  }

  const message = appendSourcesToMessage(rawMessage, citations);
  return {
    message,
    citations
  };
}

export async function POST(request: Request) {
  try {
    const userId = requireUserId();
    if (!enforceRateLimit(`ai:${userId}`, 30, 60_000)) {
      return fail("AI request limit exceeded", 429);
    }

    const body = await request.json();
    const parsed = aiChatSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid message");
    }

    const references = await searchKnowledgeBaseEntries(parsed.data.message);
    const citations = toCitations(references, parsed.data.message);
    const history = await loadConversationHistory(userId, parsed.data.conversationId);
    const locationAnswer = buildLocationAnswer(parsed.data.message, references);
    const assistant = locationAnswer ?? (await generateAssistantResponse(parsed.data.message, references, citations, history));

    const userMessage = {
      id: randomUUID(),
      role: "user" as const,
      content: parsed.data.message,
      createdAt: new Date().toISOString()
    };

    const assistantMessage = {
      id: randomUUID(),
      role: "assistant" as const,
      content: assistant.message,
      citations: assistant.citations,
      createdAt: new Date().toISOString()
    };

    const conversationId = await persistConversationMessages(userId, parsed.data.conversationId, [
      userMessage,
      assistantMessage
    ]);

    return ok({
      response: assistantMessage.content,
      citations: assistantMessage.citations ?? [],
      conversationId
    });
  } catch (error) {
    console.error("[ai-chat] Request failed.", error);
    return fail(
      error instanceof Error && error.message === "UNAUTHORIZED"
        ? "Unauthorized"
        : error instanceof Error
          ? error.message
          : "Unable to chat with AI",
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400
    );
  }
}
