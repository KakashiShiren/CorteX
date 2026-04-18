import { randomUUID } from "crypto";

import { env, hasGroqEnv } from "@/lib/env";
import { Citation, ChatMessage, KnowledgeBaseEntry } from "@/lib/types";

const CAMPUS_SYSTEM_PROMPT = `You are the Cortex Campus Assistant for Clark University.
Answer only using the provided context. If the answer is not
in the context, say 'I don't have that information right now,
please check clark.edu directly.' Always be friendly and concise.
Always cite your source at the end of your response.`;

function buildCitations(entries: KnowledgeBaseEntry[]): Citation[] {
  return entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    source: entry.source,
    category: entry.category
  }));
}

function buildFallbackAnswer(question: string, entries: KnowledgeBaseEntry[]) {
  if (!entries.length) {
    return {
      message:
        "I don't have that information right now, please check clark.edu directly.",
      citations: []
    };
  }

  const summary = entries
    .slice(0, 3)
    .map((entry) => `${entry.title}: ${entry.content}`)
    .join(" ");

  const lead =
    question.toLowerCase().includes("where")
      ? "Here is the quickest Clark-specific answer I found."
      : "Here is what the Clark campus data says.";

  return {
    message: `${lead} ${summary}`,
    citations: buildCitations(entries)
  };
}

export async function generateCampusAnswer(question: string, entries: KnowledgeBaseEntry[]) {
  const fallback = buildFallbackAnswer(question, entries);

  if (!hasGroqEnv) {
    return fallback;
  }

  try {
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
            content: CAMPUS_SYSTEM_PROMPT
          },
          {
            role: "user",
            content: [
              `Question: ${question}`,
              "",
              "Context:",
              entries.length
                ? entries
                    .map(
                      (entry) =>
                        `Title: ${entry.title}\nCategory: ${entry.category}\nSource: ${entry.source}\nContent: ${entry.content}`
                    )
                    .join("\n\n")
                : "No matching records found."
            ].join("\n")
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

    return {
      message: payload.choices?.[0]?.message?.content?.trim() || fallback.message,
      citations: buildCitations(entries)
    };
  } catch {
    return fallback;
  }
}

export function createAssistantMessage(content: string, citations: Citation[] = []): ChatMessage {
  return {
    id: randomUUID(),
    role: "assistant",
    content,
    citations,
    createdAt: new Date().toISOString()
  };
}

export function createUserMessage(content: string): ChatMessage {
  return {
    id: randomUUID(),
    role: "user",
    content,
    createdAt: new Date().toISOString()
  };
}
