import { ActivityType, BuildingCategory } from "@/lib/types";

export const activityOptions: Array<{
  value: ActivityType;
  emoji: string;
  label: string;
  description: string;
}> = [
  { value: "studying", emoji: "\u{1F4DA}", label: "Studying", description: "Locking in on coursework." },
  { value: "eating", emoji: "\u{1F37D}\uFE0F", label: "Eating", description: "Grabbing a meal or coffee." },
  { value: "working_out", emoji: "\u{1F4AA}", label: "Working Out", description: "At the gym or on the move." },
  { value: "in_class", emoji: "\u{1F393}", label: "In Class", description: "In a lecture or lab right now." },
  { value: "at_library", emoji: "\u{1F4D6}", label: "At Library", description: "Posted up in the library." },
  { value: "at_dorm", emoji: "\u{1F6CF}\uFE0F", label: "At Dorm", description: "Back at the residence hall." },
  { value: "idle", emoji: "\u2615", label: "Free", description: "Available for a quick connection." },
  { value: "offline", emoji: "\u{1F319}", label: "Offline", description: "Keeping a low profile for now." }
];

export const statusDurationValues = [30, 60, 120, 240, 480, 1440] as const;

export const statusDurationOptions: Array<{
  value: (typeof statusDurationValues)[number];
  label: string;
  description: string;
}> = [
  { value: 30, label: "30 min", description: "Quick live window." },
  { value: 60, label: "1 hour", description: "Good for a class block or meetup." },
  { value: 120, label: "2 hours", description: "Useful for longer study sessions." },
  { value: 240, label: "4 hours", description: "Stay visible through the afternoon." },
  { value: 480, label: "8 hours", description: "Covers most of the day." },
  { value: 1440, label: "24 hours", description: "Keep it up until tomorrow." }
];

export const buildingCategories: BuildingCategory[] = [
  "academic",
  "library",
  "recreation",
  "dining",
  "residential",
  "health",
  "parking",
  "services"
];

export const suggestedQuestions = [
  "What are the library hours?",
  "Is the gym open right now?",
  "Where is Higgins Hall?",
  "How do I book a study room?",
  "What's the health center phone number?",
  "Where are the dorms on campus?"
];

export const quickTips = [
  "Set a status before heading to the library so classmates can find you faster.",
  "Search a building name to jump straight into map mode and directions.",
  "Use the AI assistant for hours, facility details, and quick campus contacts."
];

export const majors = [
  "Computer Science",
  "Economics",
  "Biology",
  "Psychology",
  "Business Management",
  "Data Science",
  "Political Science",
  "Interactive Media"
];

export const classYears = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"];

export const residences = [
  "Johnson Hall",
  "Bullock Hall",
  "Dana Commons",
  "Maywood Street",
  "Blackstone Hall",
  "Off Campus"
];

export const faqItems = [
  {
    question: "How does verification work?",
    answer:
      "Cortex only allows Clark University email addresses. In production mode, Supabase email verification confirms access before protected features unlock."
  },
  {
    question: "Can I hide parts of my profile?",
    answer:
      "Yes. Privacy settings let you hide your major, year, residence, interests, and online presence while keeping your account active."
  },
  {
    question: "Does AI cite sources?",
    answer:
      "Every AI answer is grounded in campus knowledge base records and returns citations so students can trust what they are reading."
  }
];

export const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/find-people", label: "Find People" },
  { href: "/map", label: "Map" },
  { href: "/ai-chat", label: "AI Chat" },
  { href: "/messages", label: "Messages" },
  { href: "/settings", label: "Settings" }
];
