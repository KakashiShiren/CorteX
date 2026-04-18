import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type SampleStatus = {
  activity: "studying" | "eating" | "working_out" | "in_class" | "at_library" | "at_dorm" | "idle" | "offline";
  emoji: string;
  location: string;
  customText: string;
};

type SampleProfile = {
  id: string;
  email: string;
  name: string;
  major: string;
  year: string;
  residence: string;
  bio: string;
  interests: string[];
  isOnline: boolean;
  status?: SampleStatus;
};

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

const sampleProfiles: readonly SampleProfile[] = [
  {
    id: "3c9d14de-c3a3-4ef5-b5a4-7fb4df01e101",
    email: "demo.jonah.reyes@clarku.edu",
    name: "Jonah Reyes",
    major: "Economics",
    year: "Senior",
    residence: "Bullock Hall",
    bio: "Always up for a late-night case study or pickup soccer.",
    interests: ["Finance", "Soccer", "Study Groups"],
    isOnline: true,
    status: {
      activity: "studying",
      emoji: "📚",
      location: "Goddard Library",
      customText: "Working through macro notes before lunch."
    }
  },
  {
    id: "5492f5db-fb84-44ea-a963-ec3fcc900202",
    email: "demo.layla.patel@clarku.edu",
    name: "Layla Patel",
    major: "Biology",
    year: "Sophomore",
    residence: "Dana Commons",
    bio: "Pre-med, community garden volunteer, and library regular.",
    interests: ["Research", "Public Health", "Volunteering"],
    isOnline: true,
    status: {
      activity: "at_library",
      emoji: "📖",
      location: "Quiet Floor, Goddard Library",
      customText: "Reviewing lab writeups and flashcards."
    }
  },
  {
    id: "60d16178-e2a8-4a80-bab7-6c7da0db0303",
    email: "demo.ethan.park@clarku.edu",
    name: "Ethan Park",
    major: "Interactive Media",
    year: "Junior",
    residence: "Johnson Sanford Center",
    bio: "Designing game interfaces and always looking for collaborators.",
    interests: ["Game Design", "UI", "Animation"],
    isOnline: true,
    status: {
      activity: "eating",
      emoji: "🍽️",
      location: "The Table at Higgins",
      customText: "Open to chatting about product ideas over lunch."
    }
  },
  {
    id: "7b0ea68f-635b-4102-9830-b2e5ba760404",
    email: "demo.nina.romero@clarku.edu",
    name: "Nina Romero",
    major: "Political Science",
    year: "Senior",
    residence: "Maywood Hall",
    bio: "Debate team, policy nerd, and usually halfway through a cold brew.",
    interests: ["Debate", "Public Policy", "Writing"],
    isOnline: true,
    status: {
      activity: "in_class",
      emoji: "🎓",
      location: "Jonas Clark Hall",
      customText: "In seminar until 3 PM but free after."
    }
  },
  {
    id: "8b41af51-29f6-4fa0-85f4-5ec11d2d0505",
    email: "demo.omar.farouk@clarku.edu",
    name: "Omar Farouk",
    major: "Data Science",
    year: "Graduate",
    residence: "Off Campus",
    bio: "GIS and data viz person. Ask me about maps.",
    interests: ["Mapping", "Machine Learning", "Urbanism"],
    isOnline: true
  },
  {
    id: "960aa915-a097-4bd1-aa42-8e21f7d90606",
    email: "demo.fatima.ali@clarku.edu",
    name: "Fatima Ali",
    major: "Business Management",
    year: "Graduate",
    residence: "Off Campus",
    bio: "MBA student balancing classes, consulting projects, and gym time.",
    interests: ["Startups", "Consulting", "Wellness"],
    isOnline: false
  }
];

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

function buildCurrentStatus(profile: SampleProfile) {
  if (!profile.status) {
    return null;
  }

  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  return {
    id: profile.id,
    userId: profile.id,
    activity: profile.status.activity,
    emoji: profile.status.emoji,
    location: profile.status.location,
    customText: profile.status.customText,
    isVisible: true,
    createdAt,
    expiresAt
  };
}

async function main() {
  await loadEnvFile(".env.local");
  await loadEnvFile(".env");

  const { getSupabaseServiceClient } = await import("../lib/supabase/server");
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Supabase environment variables are missing. Add them to .env.local before seeding profiles.");
  }

  const users = sampleProfiles.map((profile) => ({
    id: profile.id,
    email: profile.email,
    name: profile.name,
    major: profile.major,
    year: profile.year,
    residence: profile.residence,
    bio: profile.bio,
    profile_picture_url: `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(profile.name)}`,
    interests: profile.interests,
    is_verified: true,
    is_online: profile.isOnline,
    searchable: true,
    show_major: true,
    show_year: true,
    show_residence: true,
    show_interests: true,
    show_online_status: true,
    message_permission: "connected",
    blocked_users: []
  }));

  const userQuery = await supabase.from("users").upsert(users, { onConflict: "id" });
  if (userQuery.error) {
    throw new Error(`Failed to seed users: ${formatError(userQuery.error)}`);
  }

  const students = sampleProfiles.map((profile) => ({
    id: profile.id,
    user_id: profile.id,
    email: profile.email,
    name: profile.name,
    major: profile.major,
    year: profile.year,
    residence: profile.residence,
    bio: profile.bio,
    profile_picture_url: `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(profile.name)}`,
    interests: profile.interests,
    is_verified: true,
    is_online: profile.isOnline,
    current_status: buildCurrentStatus(profile)
  }));

  const studentQuery = await supabase.from("students").upsert(students, { onConflict: "id" });
  if (studentQuery.error) {
    throw new Error(`Failed to seed students: ${formatError(studentQuery.error)}`);
  }

  const statusRows = sampleProfiles
    .filter((profile) => profile.status)
    .map((profile) => ({
      user_id: profile.id,
      activity: profile.status!.activity,
      emoji: profile.status!.emoji,
      location: profile.status!.location,
      custom_text: profile.status!.customText,
      is_visible: true,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }));

  if (statusRows.length) {
    const statusQuery = await supabase.from("user_status").upsert(statusRows, { onConflict: "user_id" });
    if (statusQuery.error) {
      throw new Error(`Failed to seed user statuses: ${formatError(statusQuery.error)}`);
    }
  }

  console.log(
    `[seed] Seeded ${users.length} sample users, ${students.length} student profiles, and ${statusRows.length} live statuses`
  );
}

main().catch((error) => {
  console.error(`[seed] ${formatError(error)}`);
  process.exit(1);
});
