import {
  Building,
  ChatConversation,
  Connection,
  Conversation,
  KnowledgeBaseEntry,
  Message,
  UserProfile,
  UserStatus
} from "@/lib/types";

const now = new Date("2026-04-17T09:30:00.000Z").toISOString();

const defaultPrivacy = {
  searchable: true,
  showMajor: true,
  showYear: true,
  showResidence: true,
  showInterests: true,
  showOnlineStatus: true,
  messagePermission: "connected" as const,
  blockedUsers: []
};

const defaultNotifications = {
  messages: true,
  digest: "immediately" as const,
  sounds: true,
  connectionRequests: true,
  campusAlerts: true,
  emailDigests: false
};

const defaultAppearance = {
  theme: "auto" as const,
  compactMode: false,
  fontScale: "md" as const
};

export const demoUsers: UserProfile[] = [
  {
    id: "user-1",
    email: "maya@clarku.edu",
    name: "Maya Chen",
    major: "Computer Science",
    year: "Junior",
    residence: "Johnson Hall",
    bio: "Building campus tools, usually with an iced coffee nearby.",
    interests: ["AI", "Hackathons", "Running"],
    isVerified: true,
    isOnline: true,
    createdAt: now,
    updatedAt: now,
    privacy: defaultPrivacy,
    notifications: defaultNotifications,
    appearance: defaultAppearance
  },
  {
    id: "user-2",
    email: "jonah@clarku.edu",
    name: "Jonah Reyes",
    major: "Economics",
    year: "Senior",
    residence: "Bullock Hall",
    bio: "Always up for a late-night case study or pickup soccer.",
    interests: ["Finance", "Soccer", "Study Groups"],
    isVerified: true,
    isOnline: true,
    createdAt: now,
    updatedAt: now,
    privacy: defaultPrivacy,
    notifications: defaultNotifications,
    appearance: defaultAppearance
  },
  {
    id: "user-3",
    email: "layla@clarku.edu",
    name: "Layla Patel",
    major: "Biology",
    year: "Sophomore",
    residence: "Dana Commons",
    bio: "Pre-med, community garden volunteer, and library regular.",
    interests: ["Research", "Public Health", "Volunteering"],
    isVerified: true,
    isOnline: false,
    createdAt: now,
    updatedAt: now,
    privacy: defaultPrivacy,
    notifications: defaultNotifications,
    appearance: defaultAppearance
  },
  {
    id: "user-4",
    email: "omar@clarku.edu",
    name: "Omar Farouk",
    major: "Data Science",
    year: "Graduate",
    residence: "Off Campus",
    bio: "GIS and data viz person. Ask me about maps.",
    interests: ["Mapping", "Machine Learning", "Urbanism"],
    isVerified: true,
    isOnline: true,
    createdAt: now,
    updatedAt: now,
    privacy: defaultPrivacy,
    notifications: defaultNotifications,
    appearance: defaultAppearance
  },
  {
    id: "user-5",
    email: "sophia@clarku.edu",
    name: "Sophia Williams",
    major: "Psychology",
    year: "Freshman",
    residence: "Blackstone Hall",
    bio: "New to campus and collecting all the good study spots.",
    interests: ["Peer Mentoring", "Music", "Coffee Chats"],
    isVerified: true,
    isOnline: true,
    createdAt: now,
    updatedAt: now,
    privacy: defaultPrivacy,
    notifications: defaultNotifications,
    appearance: defaultAppearance
  },
  {
    id: "user-6",
    email: "nina.romero@clarku.edu",
    name: "Nina Romero",
    major: "Political Science",
    year: "Senior",
    residence: "Maywood Street",
    bio: "Debate team, policy nerd, and usually halfway through a cold brew.",
    interests: ["Debate", "Public Policy", "Writing"],
    isVerified: true,
    isOnline: true,
    createdAt: now,
    updatedAt: now,
    privacy: defaultPrivacy,
    notifications: defaultNotifications,
    appearance: defaultAppearance
  },
  {
    id: "user-7",
    email: "ethan.park@clarku.edu",
    name: "Ethan Park",
    major: "Interactive Media",
    year: "Junior",
    residence: "Johnson Hall",
    bio: "Designing game interfaces and always looking for collaborators.",
    interests: ["Game Design", "UI", "Animation"],
    isVerified: true,
    isOnline: true,
    createdAt: now,
    updatedAt: now,
    privacy: defaultPrivacy,
    notifications: defaultNotifications,
    appearance: defaultAppearance
  },
  {
    id: "user-8",
    email: "fatima.ali@clarku.edu",
    name: "Fatima Ali",
    major: "Business Management",
    year: "Graduate",
    residence: "Off Campus",
    bio: "MBA student balancing classes, consulting projects, and gym time.",
    interests: ["Startups", "Consulting", "Wellness"],
    isVerified: true,
    isOnline: true,
    createdAt: now,
    updatedAt: now,
    privacy: defaultPrivacy,
    notifications: defaultNotifications,
    appearance: defaultAppearance
  },
  {
    id: "user-9",
    email: "liam.donovan@clarku.edu",
    name: "Liam Donovan",
    major: "Data Science",
    year: "Sophomore",
    residence: "Bullock Hall",
    bio: "Usually toggling between stats homework, pickup basketball, and dining hall runs.",
    interests: ["Basketball", "Analytics", "Study Groups"],
    isVerified: true,
    isOnline: false,
    createdAt: now,
    updatedAt: now,
    privacy: defaultPrivacy,
    notifications: defaultNotifications,
    appearance: defaultAppearance
  }
];

export const demoStatuses: UserStatus[] = [
  {
    id: "status-1",
    userId: "user-1",
    activity: "studying",
    emoji: "📚",
    location: "Goddard Library",
    customText: "Grinding through systems homework.",
    isVisible: true,
    createdAt: now,
    expiresAt: new Date("2026-04-18T09:30:00.000Z").toISOString()
  },
  {
    id: "status-2",
    userId: "user-2",
    activity: "working_out",
    emoji: "💪",
    location: "Kneller Athletic Center",
    customText: "Quick lift before class.",
    isVisible: true,
    createdAt: now,
    expiresAt: new Date("2026-04-18T09:30:00.000Z").toISOString()
  },
  {
    id: "status-3",
    userId: "user-3",
    activity: "at_library",
    emoji: "📖",
    location: "Floor 3 Quiet Zone",
    customText: "Need anatomy flashcards.",
    isVisible: true,
    createdAt: now,
    expiresAt: new Date("2026-04-18T09:30:00.000Z").toISOString()
  },
  {
    id: "status-4",
    userId: "user-6",
    activity: "in_class",
    emoji: "🎓",
    location: "Jonas Clark Hall",
    customText: "In seminar until 3 PM.",
    isVisible: true,
    createdAt: now,
    expiresAt: new Date("2026-04-18T09:30:00.000Z").toISOString()
  },
  {
    id: "status-5",
    userId: "user-7",
    activity: "eating",
    emoji: "🍽️",
    location: "The Table at Higgins",
    customText: "Sketchbook open if you want to talk UI.",
    isVisible: true,
    createdAt: now,
    expiresAt: new Date("2026-04-18T09:30:00.000Z").toISOString()
  },
  {
    id: "status-6",
    userId: "user-8",
    activity: "at_dorm",
    emoji: "🛏️",
    location: "Off Campus",
    customText: "On Zoom for a consulting call.",
    isVisible: true,
    createdAt: now,
    expiresAt: new Date("2026-04-18T09:30:00.000Z").toISOString()
  },
  {
    id: "status-7",
    userId: "user-9",
    activity: "idle",
    emoji: "☕",
    location: "Higgins University Center",
    customText: "Free for a stats study group later.",
    isVisible: true,
    createdAt: now,
    expiresAt: new Date("2026-04-18T09:30:00.000Z").toISOString()
  }
];

const correctedStatusEmojis: Record<string, string> = {
  "status-1": "\u{1F4DA}",
  "status-2": "\u{1F4AA}",
  "status-3": "\u{1F4D6}",
  "status-4": "\u{1F393}",
  "status-5": "\u{1F37D}\uFE0F",
  "status-6": "\u{1F6CF}\uFE0F",
  "status-7": "\u2615"
};

for (const status of demoStatuses) {
  status.emoji = correctedStatusEmojis[status.id] ?? status.emoji;
}

export const demoConnections: Connection[] = [
  {
    id: "connection-1",
    fromUserId: "user-1",
    toUserId: "user-2",
    status: "accepted",
    createdAt: now,
    respondedAt: now
  },
  {
    id: "connection-2",
    fromUserId: "user-5",
    toUserId: "user-1",
    status: "pending",
    createdAt: now
  }
];

export const demoConversations: Conversation[] = [
  {
    id: "conversation-1",
    participantIds: ["user-1", "user-2"],
    lastMessage: "Meet you outside Higgins in 5.",
    lastMessageSenderId: "user-2",
    lastMessageAt: now,
    createdAt: now
  }
];

export const demoMessages: Message[] = [
  {
    id: "message-1",
    conversationId: "conversation-1",
    senderId: "user-1",
    receiverId: "user-2",
    content: "Do you still want to walk over to Higgins together?",
    isRead: true,
    readAt: now,
    createdAt: new Date("2026-04-17T09:20:00.000Z").toISOString()
  },
  {
    id: "message-2",
    conversationId: "conversation-1",
    senderId: "user-2",
    receiverId: "user-1",
    content: "Yep. Meet you outside Higgins in 5.",
    isRead: false,
    createdAt: new Date("2026-04-17T09:25:00.000Z").toISOString()
  }
];

export const demoChatConversations: ChatConversation[] = [
  {
    id: "ai-conversation-1",
    userId: "user-1",
    messages: [
      {
        id: "ai-message-1",
        role: "assistant",
        content:
          "Ask about buildings, hours, directions, or campus facilities and I will answer with Clark-specific citations.",
        createdAt: now
      }
    ],
    createdAt: now,
    updatedAt: now
  }
];

export const demoBuildings: Building[] = [
  {
    id: "building-1",
    name: "Jonas Clark Hall",
    code: "JCH",
    category: "academic",
    latitude: 42.250712,
    longitude: -71.823883,
    address: "950 Main St, Worcester, MA 01610",
    phone: "(508) 793-7000",
    email: "info@clarku.edu",
    hours: {
      monday: { open: "8:00 AM", close: "8:00 PM" },
      tuesday: { open: "8:00 AM", close: "8:00 PM" },
      wednesday: { open: "8:00 AM", close: "8:00 PM" },
      thursday: { open: "8:00 AM", close: "8:00 PM" },
      friday: { open: "8:00 AM", close: "5:00 PM" }
    },
    facilities: ["wifi", "accessible", "study_spaces"],
    description: "Historic campus landmark with classrooms and student services."
  },
  {
    id: "building-2",
    name: "Higgins University Center",
    code: "HIG",
    category: "services",
    latitude: 42.251406,
    longitude: -71.823235,
    address: "950 Main St, Worcester, MA 01610",
    phone: "(508) 793-7443",
    hours: {
      monday: { open: "7:00 AM", close: "11:00 PM" },
      tuesday: { open: "7:00 AM", close: "11:00 PM" },
      wednesday: { open: "7:00 AM", close: "11:00 PM" },
      thursday: { open: "7:00 AM", close: "11:00 PM" },
      friday: { open: "7:00 AM", close: "9:00 PM" }
    },
    facilities: ["dining", "student_services", "wifi", "charging"],
    description: "Student hub with meeting spaces, dining, and campus services."
  },
  {
    id: "building-3",
    name: "Goddard Library",
    code: "LIB",
    category: "library",
    latitude: 42.251762,
    longitude: -71.824594,
    address: "950 Main St, Worcester, MA 01610",
    phone: "(508) 793-7478",
    hours: {
      monday: { open: "8:00 AM", close: "12:00 AM" },
      tuesday: { open: "8:00 AM", close: "12:00 AM" },
      wednesday: { open: "8:00 AM", close: "12:00 AM" },
      thursday: { open: "8:00 AM", close: "12:00 AM" },
      friday: { open: "8:00 AM", close: "8:00 PM" },
      saturday: { open: "10:00 AM", close: "6:00 PM" },
      sunday: { open: "12:00 PM", close: "12:00 AM" }
    },
    facilities: ["quiet_study", "group_rooms", "wifi", "charging", "accessible"],
    description: "Clark's library with study rooms, quiet zones, and research support."
  },
  {
    id: "building-4",
    name: "Kneller Athletic Center",
    code: "KAC",
    category: "recreation",
    latitude: 42.2523,
    longitude: -71.826198,
    address: "57 Downing St, Worcester, MA 01610",
    phone: "(508) 793-7686",
    hours: {
      monday: { open: "6:00 AM", close: "10:00 PM" },
      tuesday: { open: "6:00 AM", close: "10:00 PM" },
      wednesday: { open: "6:00 AM", close: "10:00 PM" },
      thursday: { open: "6:00 AM", close: "10:00 PM" },
      friday: { open: "6:00 AM", close: "8:00 PM" }
    },
    facilities: ["gym", "pool", "locker_rooms", "accessible"],
    description: "Fitness center, courts, and athletics facilities."
  },
  {
    id: "building-5",
    name: "Health Services",
    code: "HLT",
    category: "health",
    latitude: 42.249958,
    longitude: -71.822353,
    address: "950 Main St, Worcester, MA 01610",
    phone: "(508) 793-7467",
    email: "healthservices@clarku.edu",
    hours: {
      monday: { open: "8:30 AM", close: "5:00 PM" },
      tuesday: { open: "8:30 AM", close: "5:00 PM" },
      wednesday: { open: "8:30 AM", close: "5:00 PM" },
      thursday: { open: "8:30 AM", close: "5:00 PM" },
      friday: { open: "8:30 AM", close: "5:00 PM" }
    },
    facilities: ["medical", "counseling", "accessible"],
    description: "Primary on-campus health and wellness support."
  }
];

export const demoKnowledgeBase: KnowledgeBaseEntry[] = [
  {
    id: "kb-1",
    title: "Goddard Library Hours - Weekdays",
    content:
      "Goddard Library is open Monday through Thursday from 8:00 AM until midnight and Friday from 8:00 AM to 8:00 PM.",
    keywords: ["library", "hours", "goddard", "weekday", "open", "close"],
    source: "https://clarku.libcal.com/hours",
    category: "hours"
  },
  {
    id: "kb-2",
    title: "Goddard Library Hours - Weekend",
    content:
      "Goddard Library is open Saturday from 10:00 AM to 6:00 PM and Sunday from noon until midnight.",
    keywords: ["library", "hours", "goddard", "weekend", "saturday", "sunday"],
    source: "https://clarku.libcal.com/hours",
    category: "hours"
  },
  {
    id: "kb-3",
    title: "Kneller Athletic Center - Hours",
    content:
      "The Kneller Athletic Center gym is open Monday through Friday from 6:00 AM to 10:00 PM and Saturday through Sunday from 9:00 AM to 8:00 PM.",
    keywords: ["gym", "kneller", "rec center", "athletic center", "hours", "open", "close"],
    source: "https://clarkathletics.com/sports/2023/4/5/facilities-Facility-Hours.aspx",
    category: "hours"
  },
  {
    id: "kb-4",
    title: "Higgins University Center - Location",
    content:
      "Higgins University Center, also called Higgins Hall or HUC, is building 24 on the Clark University campus map. It is the main student center and home to The Table at Higgins dining hall, lounges, and student organization space.",
    keywords: ["higgins", "higgins hall", "huc", "student center", "dining hall", "where", "location", "building 24"],
    source: "https://www.clarku.edu/offices/student-engagement/higgins-university-center/",
    category: "building"
  },
  {
    id: "kb-5",
    title: "Goddard Library - Location",
    content:
      "Goddard Library, also called the library or the lib, is building 21 on the Clark University campus map. It is the main campus library for study rooms, printing, books, and research support.",
    keywords: ["goddard", "library", "the lib", "where", "location", "study room", "printing", "building 21"],
    source: "https://clarku.libcal.com/hours",
    category: "building"
  },
  {
    id: "kb-6",
    title: "Kneller Athletic Center - Location",
    content:
      "Kneller Athletic Center, also called the gym or rec center, is building 31 on the Clark University campus map. It is the main athletics and fitness facility on campus.",
    keywords: ["kneller", "gym", "rec center", "athletic center", "where", "location", "building 31"],
    source: "https://clarkathletics.com/sports/2023/4/5/facilities-Facility-Hours.aspx",
    category: "building"
  },
  {
    id: "kb-7",
    title: "Health Services Contact",
    content:
      "Clark University Health Services can be reached at (508) 793-7467. It is building 13 on the campus map and is open Monday through Friday from 8:30 AM to 5:00 PM.",
    keywords: ["health", "health center", "phone", "clinic", "number", "building 13"],
    source: "https://www.clarku.edu/offices/health-services/",
    category: "contact"
  },
  {
    id: "kb-8",
    title: "Library Study Room Booking",
    content:
      "Students can reserve study rooms at Goddard Library through the online LibCal booking system. Rooms can typically be booked up to 7 days in advance for up to 2 hours.",
    keywords: ["study room", "book", "reserve", "library", "libcal", "booking"],
    source: "https://clarku.libcal.com/hours",
    category: "booking"
  },
  {
    id: "kb-9",
    title: "Residence Halls on Campus",
    content:
      "Clark residence halls include Blackstone Hall, Bullock Hall, Carlson Hall, Dana Hall, Dodd Hall, Estabrook Hall, Hughes Hall, Johnson Sanford Center, Maywood Hall, and Wright Hall.",
    keywords: ["dorms", "residence hall", "housing", "where are the dorms", "live on campus"],
    source: "Clark University Campus Map",
    category: "building"
  },
  {
    id: "kb-10",
    title: "The Table at Higgins Dining",
    content:
      "The Table at Higgins is the main dining hall inside Higgins University Center. Its live menu and rotating offerings are published on the official Harvest Table Clark dining page.",
    keywords: ["cafeteria", "menu", "higgins", "dining", "food", "the table"],
    source: "https://clark.nmcfood.com/locations/the-table-at-higgins/",
    category: "dining"
  }
];
