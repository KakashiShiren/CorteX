import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type KnowledgeBaseRow = {
  id: string;
  title: string;
  content: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "Unknown error";
}

function isMissingEmbeddingColumnError(message: string) {
  return /column .*embedding does not exist/i.test(message);
}

async function loadEnvFile(filename: string) {
  const fullPath = path.join(projectRoot, filename);

  try {
    const content = await readFile(fullPath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code !== "ENOENT") {
      throw error;
    }
  }
}

function chunk<T>(items: readonly T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function buildKnowledgeBaseEmbeddingInput(row: KnowledgeBaseRow) {
  return `${row.title.trim()}\n\n${row.content.trim()}`;
}

function serializeEmbedding(embedding: readonly number[]) {
  return `[${embedding.join(",")}]`;
}

async function fetchRowsMissingEmbeddings(
  supabase: SupabaseClient
) {
  const allRows: KnowledgeBaseRow[] = [];
  const pageSize = 500;

  for (let start = 0; ; start += pageSize) {
    const query = await supabase
      .from("ai_knowledge_base")
      .select("id, title, content")
      .is("embedding", null)
      .order("created_at", { ascending: true })
      .range(start, start + pageSize - 1);

    if (query.error) {
      const message = formatError(query.error);
      if (isMissingEmbeddingColumnError(message)) {
        throw new Error(
          "The ai_knowledge_base.embedding column does not exist yet. Run supabase/migrations/004_add_ai_knowledge_base_embeddings.sql in Supabase SQL Editor first."
        );
      }

      throw new Error(message);
    }

    const rows = (query.data ?? []) as KnowledgeBaseRow[];
    allRows.push(...rows);

    if (rows.length < pageSize) {
      break;
    }
  }

  return {
    rows: allRows
  };
}

async function main() {
  await loadEnvFile(".env.local");
  await loadEnvFile(".env");

  const geminiApiKey = process.env.GEMINI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is missing. Add it to .env.local or .env before generating embeddings.");
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase environment variables are missing. Add them to .env.local or .env before running.");
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  const { rows } = await fetchRowsMissingEmbeddings(supabase);

  if (!rows.length) {
    console.log("[embeddings] No knowledge-base rows are missing embeddings.");
    return;
  }

  console.log(`[embeddings] Generating embeddings for ${rows.length} knowledge-base rows`);

  let processed = 0;
  for (const batch of chunk(rows, 25)) {
    const embeddings = await Promise.all(
      batch.map(async (row) => {
        const result = await embeddingModel.embedContent(buildKnowledgeBaseEmbeddingInput(row));
        return result.embedding.values;
      })
    );

    for (let index = 0; index < batch.length; index += 1) {
      const row = batch[index];
      const embedding = embeddings[index];

      const update = await supabase
        .from("ai_knowledge_base")
        .update({
          embedding: serializeEmbedding(embedding)
        })
        .eq("id", row.id);

      if (update.error) {
        const message = formatError(update.error);
        if (isMissingEmbeddingColumnError(message)) {
          throw new Error(
            "The ai_knowledge_base.embedding column does not exist yet. Run supabase/migrations/004_add_ai_knowledge_base_embeddings.sql in Supabase SQL Editor first."
          );
        }

        throw new Error(message);
      }

      processed += 1;
      console.log(`[embeddings] ${processed}/${rows.length} updated: ${row.title}`);
    }
  }

  console.log(`[embeddings] Finished updating ${processed} knowledge-base embeddings`);
}

main().catch((error) => {
  console.error(`[embeddings] ${formatError(error)}`);
  process.exit(1);
});
