import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const message =
      "message" in error && typeof error.message === "string"
        ? error.message
        : JSON.stringify(error, null, 2);
    return message || "Unknown error";
  }

  return "Unknown error";
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

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
      if (separatorIndex === -1) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // Ignore missing env files.
  }
}

async function main() {
  await loadEnvFile(".env.local");
  await loadEnvFile(".env");

  const { getSupabaseServiceClient } = await import("../lib/supabase/server");
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Supabase environment variables are missing. Add them to .env.local before cleanup.");
  }

  const qaQuery = await supabase
    .from("users")
    .select("id, email")
    .like("email", "qa.%@clarku.edu");

  if (qaQuery.error) {
    throw new Error(`Failed to list QA users: ${formatError(qaQuery.error)}`);
  }

  const codexQuery = await supabase
    .from("users")
    .select("id, email")
    .like("email", "codex.qa.%@clarku.edu");

  if (codexQuery.error) {
    throw new Error(`Failed to list Codex QA users: ${formatError(codexQuery.error)}`);
  }

  const rows = Array.from(
    new Map(
      [...((qaQuery.data ?? []) as Array<{ id: string; email: string }>), ...((codexQuery.data ?? []) as Array<{ id: string; email: string }>)]
        .map((row) => [row.id, row])
    ).values()
  );
  if (!rows.length) {
    console.log("[cleanup] No QA users found");
    return;
  }

  for (const row of rows) {
    await supabase.auth.admin.deleteUser(row.id).catch(() => null);
  }

  const deleteQuery = await supabase.from("users").delete().in(
    "id",
    rows.map((row) => row.id)
  );

  if (deleteQuery.error) {
    throw new Error(`Failed to delete QA users: ${formatError(deleteQuery.error)}`);
  }

  console.log(`[cleanup] Deleted ${rows.length} QA users`);
}

main().catch((error) => {
  console.error(`[cleanup] ${formatError(error)}`);
  process.exit(1);
});
