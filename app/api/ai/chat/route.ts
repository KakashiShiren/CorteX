import { randomUUID } from "crypto";

import { campusMapBuildings } from "@/lib/campus-map-data";
import { env, hasGeminiEnv, hasGroqEnv, hasOpenAIEnv } from "@/lib/env";
import { fail, ok, requireUserId } from "@/lib/http";
import { createEmbedding, serializeEmbedding } from "@/lib/knowledge-base-embeddings";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { Citation, KnowledgeBaseEntry } from "@/lib/types";
import { getCurrentUserUniversity } from "@/lib/university";
import { buildKnowledgeContextString } from "@/lib/university-knowledge-base";
import { aiChatSchema } from "@/lib/validators";

const CLARK_NO_CONTEXT_MESSAGE =
  "I don't have that information right now, please check clark.edu directly.";

const CLARK_SYSTEM_PROMPT = `You are the Grove Campus Assistant for Clark University in Worcester, Massachusetts.

Your job is to help Clark students quickly find information about campus buildings, facilities, hours, services, resources, and campus life.

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
- If the answer is not in the context, say: "${CLARK_NO_CONTEXT_MESSAGE}"
- Be friendly and concise. Sound like a helpful upperclassman, not a robot.
- Do not include "Source:" lines or raw URLs in the answer body. Citations are returned separately.
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

const QUERY_INTENT_EXPANSIONS: Array<{ pattern: RegExp; expansions: string[] }> = [
  {
    pattern: /\b(what should i do|what can i do|i m bored|im bored|things to do|something to do)\b/,
    expansions: [
      "activities",
      "events",
      "fun",
      "things to do",
      "hang out",
      "grind",
      "xbox",
      "playstation",
      "board games",
      "corq",
      "campus park"
    ]
  },
  {
    pattern: /\b(based on my interests|for me|personalized)\b/,
    expansions: ["activities", "events", "things to do", "social"]
  },
  {
    pattern: /\b(around to study with|study with|study buddy|who s around)\b/,
    expansions: ["study", "studying", "library", "study spot", "idle"]
  },
  {
    pattern: /\b(between my classes|between classes)\b/,
    expansions: ["study spot", "coffee", "hang out", "activities", "library"]
  }
];

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
] as const;

const GENERAL_RESTAURANTS_TITLE = "Restaurants Near Clark University";
const CONVENIENCE_STORES_TITLE = "Convenience Stores Near Clark University";
const LEGACY_CONVENIENCE_STORES_TITLE = "Convenience Stores Near Clark";
const LEGACY_LATE_NIGHT_FOOD_TITLE = "Late Night Food Options Near Clark";

const GENERAL_RESTAURANTS_MAPS_URL =
  "https://www.google.com/maps/search/restaurants+near+Clark+University+Worcester+MA/@42.260834,-71.8324706,5100m/data=!3m2!1e3!4b1!4m2!2m1!6e5";
const CONVENIENCE_STORES_MAPS_URL =
  "https://www.google.com/maps/search/convenience+store+near+Clark+University+Worcester+MA/@42.2529639,-71.8254135,1257m/data=!3m1!1e3!4m8!2m7!3m5!2sClark+University!3s0x89e38aa31dacf93f:0x55302c069e5d1e52!4m2!1d-71.8245381!2d42.2520353!6e2";

const LATE_NIGHT_RESTAURANT_MAPS_URLS_BY_DAY: Record<(typeof WEEKDAY_NAMES)[number], string> = {
  Sunday:
    "https://www.google.com/maps/search/restaurants+near+Clark+University+Worcester+MA/@42.2608399,-71.8215543,2550m/data=!3m2!1e3!4b1!4m7!2m6!5m4!20m3!2e7!4m1!1i23!6e5",
  Monday:
    "https://www.google.com/maps/search/restaurants+near+Clark+University+Worcester+MA/@42.260839,-71.8215543,2550m/data=!3m2!1e3!4b1!4m7!2m6!5m4!20m3!2e1!4m1!1i23!6e5",
  Tuesday:
    "https://www.google.com/maps/search/restaurants+near+Clark+University+Worcester+MA/@42.260838,-71.8215543,2550m/data=!3m2!1e3!4b1!4m7!2m6!5m4!20m3!2e2!4m1!1i23!6e5",
  Wednesday:
    "https://www.google.com/maps/search/restaurants+near+Clark+University+Worcester+MA/@42.260838,-71.8215543,2550m/data=!3m1!1e3!4m7!2m6!5m4!20m3!2e3!4m1!1i23!6e5",
  Thursday:
    "https://www.google.com/maps/search/restaurants+near+Clark+University+Worcester+MA/@42.2608362,-71.8215543,2550m/data=!3m2!1e3!4b1!4m7!2m6!5m4!20m3!2e4!4m1!1i23!6e5",
  Friday:
    "https://www.google.com/maps/search/restaurants+near+Clark+University+Worcester+MA/@42.2608353,-71.8215543,2550m/data=!3m2!1e3!4b1!4m7!2m6!5m4!20m3!2e5!4m1!1i23!6e5",
  Saturday:
    "https://www.google.com/maps/search/restaurants+near+Clark+University+Worcester+MA/@42.2608344,-71.8215543,2550m/data=!3m2!1e3!4b1!4m7!2m6!5m4!20m3!2e6!4m1!1i23!6e5"
};

type ChatUserProfileRow = {
  name: string | null;
  major: string | null;
  year: string | null;
  residence: string | null;
  interests: string[] | null;
};

type ChatUserStatusRow = {
  activity: string | null;
  location: string | null;
  custom_text: string | null;
};

type PersonalizationContext = {
  promptBlock: string;
  activeStudentsSummary: string;
  currentTime: string;
};

type UniversityContext = {
  universityId: string | null;
  universityName: string;
  universityDomain: string | null;
  isClark: boolean;
};

type ActiveUserRow = {
  id: string;
};

const FOOD_QUERY_PATTERN =
  /\b(food|eat|eating|hungry|restaurant|restaurants|lunch|dinner|breakfast|meal|where to eat)\b/;
const LATE_NIGHT_FOOD_HINT_PATTERN = /\b(after 11|after 11pm|late night|midnight|open late|night food|food at night)\b/;

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

  for (const intentExpansion of QUERY_INTENT_EXPANSIONS) {
    if (!intentExpansion.pattern.test(normalized)) {
      continue;
    }

    for (const expansion of intentExpansion.expansions) {
      if (expansion.length > 2 && !STOP_WORDS.has(expansion)) {
        tokens.add(expansion);
      }
    }
  }

  const currentHour = getCampusHour();
  const isBaseFoodQuery = FOOD_QUERY_PATTERN.test(normalized);
  const isLateNightFoodQuery =
    isExplicitLateNightFoodQuestion(message) || ((currentHour >= 23 || currentHour < 5) && isBaseFoodQuery);

  const prioritizedTokens: string[] = [];
  if (isLateNightFoodQuery) {
    prioritizedTokens.push(getWeekdayName(0).toLowerCase(), "late night");
  }

  prioritizedTokens.push(...tokens);

  return Array.from(new Set(prioritizedTokens)).slice(0, 12);
}

function extractSearchPhrases(message: string) {
  const normalized = normalizeSearchText(message);
  const phrases = new Set<string>();
  const reducedVariants = [normalized]
    .map((value) =>
      value
        .replace(/^(what is|what s|where can i|where do i|where is|where are|what time does|what time do|is there|are there any)\s+/i, "")
        .replace(/\b(on campus|right now|near campus)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);

  if (normalized.split(" ").length <= 6) {
    phrases.add(normalized);
  }

  for (const variant of reducedVariants) {
    if (variant !== normalized) {
      phrases.add(variant);
    }
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
  return /\bwhere is\b/.test(normalized) || /\bwhere are\b/.test(normalized) || /\blocation\b/.test(normalized);
}

function isExplicitLateNightFoodQuestion(question: string) {
  const normalized = normalizeSearchText(question);
  return (
    (FOOD_QUERY_PATTERN.test(normalized) && LATE_NIGHT_FOOD_HINT_PATTERN.test(normalized)) ||
    normalized.includes("what s open late") ||
    normalized.includes("whats open late")
  );
}

function isFoodQuestion(question: string) {
  const normalized = normalizeSearchText(question);
  return FOOD_QUERY_PATTERN.test(normalized) || isExplicitLateNightFoodQuestion(question);
}

function isLateNightFoodQuestion(question: string) {
  return isExplicitLateNightFoodQuestion(question);
}

function isConvenienceStoreQuestion(question: string) {
  const normalized = normalizeSearchText(question);
  return /\b(convenience store|convenience stores|store near campus|stores near campus|snacks|7 eleven|7-eleven|family farms|corner store|late night snack)\b/.test(
    normalized
  );
}

function isBoredOrFreeTimeQuestion(question: string) {
  const normalized = normalizeSearchText(question);
  return /\b(bored|free time|what should i do|what can i do|things to do|something to do|nothing to do)\b/.test(
    normalized
  );
}

function hasHttpSource(source?: string | null) {
  return Boolean(source && /^https?:\/\//i.test(source.trim()));
}

function isGenericClarkHomepage(source?: string | null) {
  if (!source) {
    return false;
  }

  try {
    const url = new URL(source.trim());
    const hostname = url.hostname.toLowerCase();
    const normalizedPath = url.pathname.replace(/\/+$/, "") || "/";
    const isClarkHomepage = ["clarku.edu", "www.clarku.edu", "clark.edu", "www.clark.edu"].includes(
      hostname
    );

    return isClarkHomepage && normalizedPath === "/";
  } catch {
    return false;
  }
}

function shouldShowCitation(entry: KnowledgeBaseEntry) {
  if (!hasHttpSource(entry.source)) {
    return false;
  }

  if (entry.category === "activities" && isGenericClarkHomepage(entry.source)) {
    return false;
  }

  return true;
}

function getWeekdayName(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "America/New_York"
  }).format(date) as (typeof WEEKDAY_NAMES)[number];
  return WEEKDAY_NAMES.find((day) => day === weekday) ?? WEEKDAY_NAMES[date.getDay()];
}

function getCampusHour(date = new Date()) {
  const hour = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone: "America/New_York"
  })
    .formatToParts(date)
    .find((part) => part.type === "hour")?.value;

  const parsed = Number(hour);
  return Number.isFinite(parsed) ? parsed : date.getHours();
}

function getRequestedOrCurrentWeekday(question: string) {
  return extractRequestedWeekday(question) ?? getWeekdayName(0);
}

function isLateNightContext(question: string) {
  const currentHour = getCampusHour();
  return isLateNightFoodQuestion(question) || ((currentHour >= 23 || currentHour < 5) && isFoodQuestion(question));
}

function getLateNightFoodTitle(day = getWeekdayName(0)) {
  return `Late Night Food Near Clark - ${day}`;
}

function isLegacyDaySpecificRestaurantEntry(entry: Pick<KnowledgeBaseEntry, "title">) {
  return entry.title.startsWith("Restaurants Near Clark University - ");
}

function isLateNightFoodEntry(entry: Pick<KnowledgeBaseEntry, "title">) {
  return entry.title.startsWith("Late Night Food Near Clark - ");
}

function extractRequestedWeekday(question: string) {
  const normalized = question.toLowerCase();

  const explicitDay = WEEKDAY_NAMES.find((day) => normalized.includes(day.toLowerCase()));
  if (explicitDay) {
    return explicitDay;
  }

  if (/\btomorrow\b/.test(normalized)) {
    return getWeekdayName(1);
  }

  if (/\b(today|tonight)\b/.test(normalized)) {
    return getWeekdayName(0);
  }

  return null;
}

function formatPromptValue(value?: string | null, fallback = "Not set") {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function formatCampusLocalTime(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  }).format(date);
}

function describeStudentActivity(status?: ChatUserStatusRow | null) {
  if (!status?.activity) {
    return "not set";
  }

  const location = status.location?.trim();
  const customText = status.custom_text?.trim();

  switch (status.activity) {
    case "at_library":
      return location ? `studying at ${location}` : "studying at the library";
    case "studying":
      return location ? `studying at ${location}` : customText ? `studying (${customText})` : "studying";
    case "eating":
      return location ? `eating at ${location}` : customText ? `eating (${customText})` : "eating";
    case "working_out":
      return location
        ? `working out at ${location}`
        : customText
          ? `working out (${customText})`
          : "working out";
    case "in_class":
      return location ? `in class at ${location}` : customText ? `in class (${customText})` : "in class";
    case "at_dorm":
      return location ? `at ${location}` : customText ? `at their dorm (${customText})` : "at their dorm";
    case "idle":
      return location
        ? `free to hang out at ${location}`
        : customText
          ? `free to hang out (${customText})`
          : "free to hang out";
    case "offline":
      return "offline";
    default: {
      const normalizedActivity = status.activity.replace(/_/g, " ");
      return location
        ? `${normalizedActivity} at ${location}`
        : customText
          ? `${normalizedActivity} (${customText})`
          : normalizedActivity;
    }
  }
}

function summarizeActiveStudents(statuses: ChatUserStatusRow[]) {
  const grouped = new Map<string, number>();

  for (const status of statuses) {
    const summary = describeStudentActivity(status);
    if (!summary || summary === "not set" || summary === "offline") {
      continue;
    }

    grouped.set(summary, (grouped.get(summary) ?? 0) + 1);
  }

  if (!grouped.size) {
    return "No other visible student activity is set right now.";
  }

  const parts = Array.from(grouped.entries())
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0]);
    })
    .slice(0, 4)
    .map(([summary, count]) => `${count} ${count === 1 ? "student" : "students"} ${summary}`);

  return `Currently on campus: ${parts.join(", ")}.`;
}

function buildPersonalizationPromptBlock(params: {
  profile: ChatUserProfileRow | null;
  userStatus: ChatUserStatusRow | null;
  activeStudentsSummary: string;
  currentTime: string;
  universityName: string;
}) {
  const interests =
    params.profile?.interests?.filter((interest) => interest.trim().length > 0).join(", ") || "None listed";

  return [
    "Current student profile:",
    `Name: ${formatPromptValue(params.profile?.name, `Current ${params.universityName} student`)}`,
    `Major: ${formatPromptValue(params.profile?.major)}`,
    `Year: ${formatPromptValue(params.profile?.year)}`,
    `Residence: ${formatPromptValue(params.profile?.residence)}`,
    `Interests: ${interests}`,
    `Current status: ${describeStudentActivity(params.userStatus)}`,
    "Class schedule: Not available in the current system context yet.",
    "",
    "Current campus activity (other visible students right now):",
    params.activeStudentsSummary,
    `Current day on campus: ${getWeekdayName(0)}`,
    `Current local time on campus: ${params.currentTime}`
  ].join("\n");
}

function buildNoContextMessage(universityContext: UniversityContext) {
  if (universityContext.isClark) {
    return CLARK_NO_CONTEXT_MESSAGE;
  }

  return `I don't have specific information about ${universityContext.universityName} yet. Please check your university's official website. Grove's knowledge base for your campus will be populated soon.`;
}

function isGroveFeatureQuestion(question: string) {
  const normalized = normalizeSearchText(question);

  return [
    "grove",
    "feed",
    "post",
    "status",
    "message",
    "messages",
    "connection",
    "connections",
    "find people",
    "profile",
    "map",
    "assistant"
  ].some((term) => normalized.includes(term));
}

function buildSystemPrompt(
  personalizationContext: string,
  universityContext: UniversityContext,
  universityKnowledgeString: string
) {
  if (!universityContext.isClark) {
    return `You are the Grove Campus Assistant for ${universityContext.universityName}.

COMPREHENSIVE CAMPUS KNOWLEDGE BASE FOR ${universityContext.universityName.toUpperCase()}:
${universityKnowledgeString}

Rules:
- Only answer campus-specific questions for ${universityContext.universityName}. If the student asks for another university's campus information, say you can only help with their own campus knowledge in Grove.
- Answer questions using the knowledge base above.
- If the answer is not in the knowledge base, say you don't have that specific information and suggest they check the university's official website.
- Be friendly and conversational - sound like a helpful upperclassman, not a robot.
- Use student slang and nicknames from the knowledge base when relevant.
- Provide specific details (hours, locations, pro tips) when available.
- Do not include raw URLs in the answer body. Citations are returned separately.

Personalization context:
${personalizationContext}`;
  }

  return `${CLARK_SYSTEM_PROMPT}

COMPREHENSIVE CAMPUS KNOWLEDGE BASE:
${universityKnowledgeString}

IMPORTANT BEHAVIORAL RULES:
- Only answer Clark University campus-specific questions for Clark users. If the student asks for another university's campus information, say you can only help with their own campus knowledge in Grove.
- If a student says they are bored, have free time, or asks what to do, respond in this priority order:
  1. Games and activities first: The Grind in the HUC basement for pool table and Pac-Man, MACD floor 2 for Xbox, PlayStation, and board games.
  2. Social/events second: Corq app, game nights, events at Asher Suite or MACD.
  3. Chill spots third: campus park by the pond, room 402 in the library, or the corner room in MACD.
  4. Only mention food if they specifically ask about food separately.
- FOOD RULES:
  - General food question (where to eat, restaurants, hungry, no late-night mention) -> use the Restaurants Near Clark University record and its general Google Maps link. Never mention Ziggy Bomb here.
  - Late night food question (after 11, late night, midnight, what's open late, or it is after 11PM in Worcester and they ask about food) -> use the Late Night Food Near Clark record matching today's day. Include Ziggy Bomb, 7-Eleven, Family Farms, DoorDash, and Uber Eats.
  - Convenience store question -> use the Convenience Stores Near Clark University record and its Google Maps link.
  - I'm bored or answering activities questions -> never mention food unless they ask about it separately.
- Do not include Source lines or raw URLs in the answer body. Citations are returned separately.
- Do not surface generic Clark homepage citations.
- The current day and time in Worcester are included in the personalization context below.

Personalization rules:
- You also have access to the student's profile, current status, current local time, and a live summary of other visible students on campus.
- Use that personalization context when it is relevant to the question.
- If the student asks what to do, weigh their interests, time of day, and whether other students are free to hang out or study.
- If other visible students seem available, mention that as an option in a natural way.
- If class schedule data is not present in the personalization context, do not pretend you know their exact classes or breaks.

Personalization context:
${personalizationContext}`;
}

function getCitationSource(entry: KnowledgeBaseEntry, question: string) {
  if (!shouldShowCitation(entry)) {
    return null;
  }

  if (entry.category === "activities") {
    if (entry.title === GENERAL_RESTAURANTS_TITLE) {
      return GENERAL_RESTAURANTS_MAPS_URL;
    }

    if (isLateNightFoodEntry(entry)) {
      return entry.source;
    }

    if (entry.title === CONVENIENCE_STORES_TITLE || entry.title === LEGACY_CONVENIENCE_STORES_TITLE) {
      return CONVENIENCE_STORES_MAPS_URL;
    }
  }

  return entry.source;
}

function isInformationalCategory(category: string) {
  return ["hours", "contact", "booking", "facility", "services", "dining", "activities"].includes(category);
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

  const primaryEntry = entries[0];
  if (!primaryEntry || primaryEntry.category !== "building") {
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
  const questionPhrases = extractSearchPhrases(question);
  const title = normalizeSearchText(entry.title);
  const content = normalizeSearchText(entry.content);
  const keywordPhrases = (entry.keywords ?? []).map((keyword) => normalizeSearchText(keyword));
  const keywordTokens = new Set(
    keywordPhrases.flatMap((keyword) => keyword.split(/\s+/).filter(Boolean))
  );

  let score = 0;
  if (typeof entry.similarity === "number" && Number.isFinite(entry.similarity)) {
    score += Math.round(entry.similarity * 16);

    if (entry.similarity >= 0.75) {
      score += 6;
    }
  }

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

  for (const phrase of questionPhrases) {
    if (!phrase || phrase === normalizedQuestion) {
      continue;
    }

    if (title.includes(phrase)) {
      score += 12;
    } else if (content.includes(phrase)) {
      score += 6;
    }
  }

  if (title.includes(normalizedQuestion) || content.includes(normalizedQuestion)) {
    score += 6;
  }

  const asksForLocation = /\bwhere\b/.test(normalizedQuestion);
  const asksForHours = questionTokens.some((token) =>
    ["hours", "open", "close", "weekday", "weekend", "monday", "friday", "saturday", "sunday", "time"].includes(token)
  );
  const asksForContact = questionTokens.some((token) =>
    ["phone", "number", "contact", "call"].includes(token)
  );
  const asksForBooking = questionTokens.some((token) =>
    ["book", "booking", "reserve", "reservation"].includes(token)
  );
  const timeTokens = new Set([
    "hours",
    "open",
    "close",
    "weekday",
    "weekend",
    "monday",
    "friday",
    "saturday",
    "sunday",
    "time"
  ]);
  const substantiveTokens = questionTokens.filter((token) => !timeTokens.has(token));
  const hasSubstantiveMatch =
    !substantiveTokens.length ||
    substantiveTokens.some(
      (token) => keywordTokens.has(token) || title.includes(token) || content.includes(token)
    );
  const asksToPlayPool =
    /\bplay pool\b/.test(normalizedQuestion) ||
    /\bpool table\b/.test(normalizedQuestion) ||
    /\bbilliards\b/.test(normalizedQuestion);
  const asksToPlayBasketball =
    /\bplay basketball\b/.test(normalizedQuestion) ||
    /\bbasketball court\b/.test(normalizedQuestion) ||
    /\bshoot hoops\b/.test(normalizedQuestion);
  const asksWhatToDo = isBoredOrFreeTimeQuestion(question);
  const asksForFood = isFoodQuestion(question);
  const asksForConvenienceStore = isConvenienceStoreQuestion(question);

  if (asksForLocation && entry.category === "building") {
    score += 10;
  }

  if (asksForHours && entry.category === "hours") {
    score += hasSubstantiveMatch ? 10 : 2;
  }

  if (
    asksForHours &&
    entry.category === "activities" &&
    hasSubstantiveMatch &&
    (content.includes("open") || content.includes("hour"))
  ) {
    score += 6;
  }

  if (asksToPlayPool) {
    if (
      title.includes("grind") ||
      content.includes("pool table") ||
      keywordPhrases.includes("pool table") ||
      keywordPhrases.includes("billiards")
    ) {
      score += 18;
    }

    if (title.includes("swimming pool") || keywordTokens.has("swim") || keywordTokens.has("swimming")) {
      score -= 8;
    }
  }

  if (asksToPlayBasketball) {
    if (
      title.includes("basketball") ||
      keywordPhrases.includes("basketball court") ||
      keywordPhrases.includes("pickup basketball")
    ) {
      score += 12;
    }

    if (entry.category === "building") {
      score -= 4;
    }
  }

  if (asksForContact && entry.category === "contact") {
    score += 10;
  }

  if (asksForBooking && entry.category === "booking") {
    score += 10;
  }

  if (asksWhatToDo) {
    if (
      [
        "Things to Do When Bored on Campus",
        "The Grind at Higgins University Center",
        "Gaming Consoles and Board Games at MACD",
        "Game Nights and Campus Events",
        "Hidden Spots and Best Views on Campus",
        "Campus Park and Outdoor Chill Spots",
        "Late Night Study Spots on Campus"
      ].includes(entry.title)
    ) {
      score += 16;
    }

    if (
      entry.title === GENERAL_RESTAURANTS_TITLE ||
      entry.title === CONVENIENCE_STORES_TITLE ||
      entry.title === LEGACY_CONVENIENCE_STORES_TITLE ||
      entry.title === LEGACY_LATE_NIGHT_FOOD_TITLE ||
      isLateNightFoodEntry(entry) ||
      isLegacyDaySpecificRestaurantEntry(entry)
    ) {
      score -= 14;
    }
  }

  if (asksForFood) {
    if (isLateNightContext(question)) {
      if (entry.title === getLateNightFoodTitle()) {
        score += 24;
      }

      if (isLateNightFoodEntry(entry)) {
        score += 10;
      }

      if (entry.title === CONVENIENCE_STORES_TITLE || entry.title === LEGACY_CONVENIENCE_STORES_TITLE) {
        score += 10;
      }

      if (entry.title === GENERAL_RESTAURANTS_TITLE) {
        score -= 10;
      }

      if (entry.title === LEGACY_LATE_NIGHT_FOOD_TITLE || isLegacyDaySpecificRestaurantEntry(entry)) {
        score -= 12;
      }
    } else {
      if (entry.title === GENERAL_RESTAURANTS_TITLE) {
        score += 24;
      }

      if (
        isLateNightFoodEntry(entry) ||
        entry.title === CONVENIENCE_STORES_TITLE ||
        entry.title === LEGACY_CONVENIENCE_STORES_TITLE ||
        entry.title === LEGACY_LATE_NIGHT_FOOD_TITLE ||
        isLegacyDaySpecificRestaurantEntry(entry)
      ) {
        score -= 12;
      }
    }
  }

  if (asksForConvenienceStore) {
    if (entry.title === CONVENIENCE_STORES_TITLE || entry.title === LEGACY_CONVENIENCE_STORES_TITLE) {
      score += 24;
    }

    if (
      entry.title === GENERAL_RESTAURANTS_TITLE ||
      entry.title === LEGACY_LATE_NIGHT_FOOD_TITLE ||
      isLateNightFoodEntry(entry) ||
      isLegacyDaySpecificRestaurantEntry(entry)
    ) {
      score -= 8;
    }
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
    : entries.filter((entry) => shouldShowCitation(entry));
  const sourceEntries = preferredEntries.length ? preferredEntries : entries;

  for (const entry of sourceEntries) {
    const citationSource = getCitationSource(entry, question);
    if (!citationSource) {
      continue;
    }

    const entryKey = `${entry.title.trim().toLowerCase()}::${citationSource.trim().toLowerCase()}`;
    if (seenEntries.has(entryKey)) {
      continue;
    }

    citations.push({
      id: entry.id,
      title: entry.title,
      source: citationSource,
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
  const asksForFood = isFoodQuestion(question);
  const asksForConvenienceStore = isConvenienceStoreQuestion(question);

  if (!asksForBooking && !asksForHours && !asksForContact && !asksForFood && !asksForConvenienceStore) {
    return null;
  }

  let selectedEntries = urlEntries;

  if (asksForConvenienceStore) {
    selectedEntries = urlEntries.filter((entry) =>
      [CONVENIENCE_STORES_TITLE, LEGACY_CONVENIENCE_STORES_TITLE].includes(entry.title)
    );
  } else if (asksForFood && isLateNightContext(question)) {
    selectedEntries = urlEntries.filter((entry) => entry.title === getLateNightFoodTitle());

    if (!selectedEntries.length) {
      selectedEntries = urlEntries.filter((entry) => isLateNightFoodEntry(entry));
    }
  } else if (asksForFood) {
    selectedEntries = urlEntries.filter((entry) => entry.title === GENERAL_RESTAURANTS_TITLE);

    if (!selectedEntries.length) {
      selectedEntries = urlEntries.filter((entry) => isLegacyDaySpecificRestaurantEntry(entry));
    }
  } else if (asksForBooking) {
    selectedEntries = urlEntries.filter((entry) => entry.category === "booking");
  } else if (asksForHours) {
    selectedEntries = urlEntries.filter((entry) =>
      ["hours", "activities"].includes(entry.category)
    );
  } else if (asksForContact) {
    selectedEntries = urlEntries.filter((entry) => ["contact", "hours"].includes(entry.category));
  } else {
    selectedEntries = urlEntries.filter((entry) => entry.category !== "building");
  }

  if (!selectedEntries.length) {
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

function buildContextFallbackAnswer(entries: KnowledgeBaseEntry[], fallbackMessage = CLARK_NO_CONTEXT_MESSAGE) {
  if (!entries.length) {
    return fallbackMessage;
  }

  const summary = entries
    .slice(0, 3)
    .map((entry) => `${entry.title}: ${entry.content}`)
    .join(" ");

  return `Here is what I found from Clark sources. ${summary}`;
}

function appendSourcesToMessage(message: string, citations: Citation[]) {
  const cleanMessage = message.replace(/\n*\s*Sources?:\s*[\s\S]*$/i, "").trim();
  return cleanMessage;
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

async function loadPersonalizationContext(
  userId: string,
  universityContext: UniversityContext
): Promise<PersonalizationContext> {
  const currentTime = formatCampusLocalTime();
  const fallbackSummary = "No other visible student activity is set right now.";
  const fallbackPromptBlock = buildPersonalizationPromptBlock({
    profile: null,
    userStatus: null,
    activeStudentsSummary: fallbackSummary,
    currentTime,
    universityName: universityContext.universityName
  });
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return {
      promptBlock: fallbackPromptBlock,
      activeStudentsSummary: fallbackSummary,
      currentTime
    };
  }

  const nowIso = new Date().toISOString();
  const [profileQuery, userStatusQuery] = await Promise.all([
    supabase
      .from("users")
      .select("name, major, year, residence, interests")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("user_status")
      .select("activity, location, custom_text")
      .eq("user_id", userId)
      .maybeSingle()
  ]);

  if (profileQuery.error) {
    console.warn("[ai-chat] Unable to load user profile for personalization.", profileQuery.error);
  }

  if (userStatusQuery.error) {
    console.warn("[ai-chat] Unable to load user status for personalization.", userStatusQuery.error);
  }

  const profile = (profileQuery.data ?? null) as ChatUserProfileRow | null;
  const userStatus = (userStatusQuery.data ?? null) as ChatUserStatusRow | null;
  let activeStudents: ChatUserStatusRow[] = [];

  if (universityContext.universityId) {
    const activeUsersQuery = await supabase
      .from("users")
      .select("id")
      .eq("university_id", universityContext.universityId)
      .neq("id", userId)
      .limit(40);

    if (activeUsersQuery.error) {
      console.warn("[ai-chat] Unable to load same-campus students for personalization.", activeUsersQuery.error);
    } else {
      const activeUserIds = ((activeUsersQuery.data ?? []) as ActiveUserRow[]).map((row) => row.id);

      if (activeUserIds.length) {
        const activeStudentsQuery = await supabase
          .from("user_status")
          .select("activity, location, custom_text")
          .eq("is_visible", true)
          .gt("expires_at", nowIso)
          .in("user_id", activeUserIds)
          .limit(10);

        if (activeStudentsQuery.error) {
          console.warn("[ai-chat] Unable to load live campus activity for personalization.", activeStudentsQuery.error);
        } else {
          activeStudents = ((activeStudentsQuery.data ?? []) as ChatUserStatusRow[]).filter(
            (status) => status.activity && status.activity !== "offline"
          );
        }
      }
    }
  }

  const activeStudentsSummary = summarizeActiveStudents(activeStudents);

  return {
    promptBlock: buildPersonalizationPromptBlock({
      profile,
      userStatus,
      activeStudentsSummary,
      currentTime,
      universityName: universityContext.universityName
    }),
    activeStudentsSummary,
    currentTime
  };
}

function normalizeKnowledgeBaseEntries(rows: Array<Record<string, unknown>> | null | undefined) {
  return (rows ?? []).map((row) => ({
    id: typeof row.id === "string" ? row.id : "",
    title: typeof row.title === "string" ? row.title : "",
    content: typeof row.content === "string" ? row.content : "",
    keywords: Array.isArray(row.keywords)
      ? row.keywords.filter((keyword): keyword is string => typeof keyword === "string")
      : [],
    source: typeof row.source === "string" ? row.source : "",
    category: typeof row.category === "string" ? row.category : "",
    similarity: typeof row.similarity === "number" ? row.similarity : null
  })) as KnowledgeBaseEntry[];
}

function mergeKnowledgeBaseEntries(
  prioritizedEntries: KnowledgeBaseEntry[],
  fallbackEntries: KnowledgeBaseEntry[]
) {
  const merged = new Map<string, KnowledgeBaseEntry>();

  for (const entry of [...prioritizedEntries, ...fallbackEntries]) {
    const key = entry.id || entry.title.trim().toLowerCase();
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, entry);
      continue;
    }

    merged.set(key, {
      ...existing,
      ...entry,
      similarity:
        typeof existing.similarity === "number" && typeof entry.similarity === "number"
          ? Math.max(existing.similarity, entry.similarity)
          : entry.similarity ?? existing.similarity ?? null
    });
  }

  return Array.from(merged.values());
}

async function searchKnowledgeBaseEntriesByKeyword(
  supabase: NonNullable<ReturnType<typeof getSupabaseServiceClient>>,
  question: string
) {
  const tokens = extractKeywords(question);
  const phrases = extractSearchPhrases(question);
  const candidates: KnowledgeBaseEntry[] = [];

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
        .limit(24);

      if (phraseQuery.error) {
        throw phraseQuery.error;
      }
      candidates.push(...normalizeKnowledgeBaseEntries((phraseQuery.data ?? []) as Array<Record<string, unknown>>));
    }
  }

  if (tokens.length) {
    const keywordQuery = await supabase
      .from("ai_knowledge_base")
      .select("id, title, content, keywords, source, category")
      .overlaps("keywords", tokens)
      .limit(24);

    if (keywordQuery.error) {
      throw keywordQuery.error;
    }
    candidates.push(...normalizeKnowledgeBaseEntries((keywordQuery.data ?? []) as Array<Record<string, unknown>>));
  }

  if (!tokens.length) {
    return candidates;
  }

  try {
    const fullTextQuery = await supabase
      .from("ai_knowledge_base")
      .select("id, title, content, keywords, source, category")
      .textSearch("content", tokens.join(" "), {
        config: "english",
        type: "websearch"
      })
      .limit(24);

    if (fullTextQuery.error) {
      throw fullTextQuery.error;
    }
    candidates.push(...normalizeKnowledgeBaseEntries((fullTextQuery.data ?? []) as Array<Record<string, unknown>>));
  } catch {
    const ilikeClauses = tokens
      .flatMap((token) => [`content.ilike.%${token}%`, `title.ilike.%${token}%`])
      .join(",");
    const fallbackQuery = await supabase
      .from("ai_knowledge_base")
      .select("id, title, content, keywords, source, category")
      .or(ilikeClauses)
      .limit(24);

    if (fallbackQuery.error) {
      throw fallbackQuery.error;
    }
    candidates.push(...normalizeKnowledgeBaseEntries((fallbackQuery.data ?? []) as Array<Record<string, unknown>>));
  }

  return candidates;
}

async function searchKnowledgeBaseEntries(question: string) {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for AI knowledge retrieval.");
  }

  const keywordCandidates = await searchKnowledgeBaseEntriesByKeyword(supabase, question);

  if (!hasOpenAIEnv && !hasGeminiEnv) {
    return rankKnowledgeBaseEntries(keywordCandidates, question);
  }

  try {
    const queryEmbedding = await createEmbedding(question);
    const vectorQuery = await supabase.rpc("match_knowledge_base", {
      query_embedding: serializeEmbedding(queryEmbedding),
      match_threshold: 0.7,
      match_count: 8
    });

    if (vectorQuery.error) {
      throw vectorQuery.error;
    }

    const vectorCandidates = normalizeKnowledgeBaseEntries(
      (vectorQuery.data ?? []) as Array<Record<string, unknown>>
    );

    return rankKnowledgeBaseEntries(
      mergeKnowledgeBaseEntries(vectorCandidates, keywordCandidates),
      question
    );
  } catch (error) {
    console.warn("[ai-chat] Hybrid retrieval failed, falling back to keyword search.", error);
    return rankKnowledgeBaseEntries(keywordCandidates, question);
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
  history: Array<{ role: "user" | "assistant"; content: string }>,
  personalizationContext: PersonalizationContext,
  universityContext: UniversityContext,
  universityKnowledgeString: string
) {
  if (!universityContext.isClark && !isGroveFeatureQuestion(question) && !universityKnowledgeString) {
    return {
      message: buildNoContextMessage(universityContext),
      citations: [] as Citation[]
    };
  }

  if (!entries.length && !hasGroqEnv) {
    return {
      message: buildNoContextMessage(universityContext),
      citations: [] as Citation[]
    };
  }

  const directAnswer = universityContext.isClark && entries.length ? buildDirectInformationAnswer(question, entries) : null;
  if (directAnswer) {
    return directAnswer;
  }

  if (!hasGroqEnv) {
    return {
      message: appendSourcesToMessage(buildContextFallbackAnswer(entries, buildNoContextMessage(universityContext)), citations),
      citations
    };
  }

  const knowledgeContext = entries.length
    ? entries
        .map(
          (entry) =>
            `Title: ${entry.title}\nCategory: ${entry.category}\nSource: ${entry.source}\nContent: ${entry.content}`
        )
        .join("\n\n")
    : "No matching knowledge-base records were retrieved for this question.";

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.groqApiKey}`
    },
    body: JSON.stringify({
      model: env.groqModel,
      temperature: 0.2,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(
            personalizationContext.promptBlock,
            universityContext,
            universityKnowledgeString
          )
        },
        ...history,
        {
          role: "user",
          content:
            `Use the ${universityContext.universityName} knowledge base and any matching context below to answer the user's latest question.\n\n` +
            `Latest question: ${question}\n\nKnowledge context:\n${knowledgeContext}`
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

  const noContextMessage = buildNoContextMessage(universityContext);
  const responseText = payload.choices?.[0]?.message?.content?.trim();
  const rawMessage = responseText || buildContextFallbackAnswer(entries, noContextMessage);
  if (normalizeSearchText(rawMessage) === normalizeSearchText(noContextMessage)) {
    return {
      message: noContextMessage,
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

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return fail("Supabase is not configured for AI chat.", 500);
    }

    const university = await getCurrentUserUniversity(supabase, userId);
    const universityContext: UniversityContext = {
      universityId: university.universityId,
      universityName: university.universityName ?? "Your campus",
      universityDomain: university.universityDomain,
      isClark: university.universityDomain === "clarku.edu"
    };

    const universityKnowledgeString = buildKnowledgeContextString(universityContext.universityDomain ?? "");
    const references = universityContext.isClark ? await searchKnowledgeBaseEntries(parsed.data.message) : [];
    const citations = toCitations(references, parsed.data.message);
    const history = await loadConversationHistory(userId, parsed.data.conversationId);
    const personalizationContext = await loadPersonalizationContext(userId, universityContext);
    const locationAnswer = universityContext.isClark ? buildLocationAnswer(parsed.data.message, references) : null;
    const assistant =
      locationAnswer ??
      (await generateAssistantResponse(
        parsed.data.message,
        references,
        citations,
        history,
        personalizationContext,
        universityContext,
        universityKnowledgeString
      ));

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
