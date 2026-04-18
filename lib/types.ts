export type ActivityType =
  | "studying"
  | "eating"
  | "working_out"
  | "in_class"
  | "at_library"
  | "at_dorm"
  | "idle"
  | "offline";

export type ConnectionStatus = "pending" | "accepted" | "rejected";

export type MessagePermission = "anyone" | "connected" | "none";

export interface PrivacySettings {
  searchable: boolean;
  showMajor: boolean;
  showYear: boolean;
  showResidence: boolean;
  showInterests: boolean;
  showOnlineStatus: boolean;
  messagePermission: MessagePermission;
  blockedUsers: string[];
}

export interface NotificationSettings {
  messages: boolean;
  digest: "immediately" | "hourly" | "never";
  sounds: boolean;
  connectionRequests: boolean;
  campusAlerts: boolean;
  emailDigests: boolean;
}

export interface AppearanceSettings {
  theme: "light" | "dark" | "auto";
  compactMode: boolean;
  fontScale: "sm" | "md" | "lg";
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  major: string;
  year: string;
  residence: string;
  bio: string;
  profilePictureUrl?: string;
  interests: string[];
  isVerified: boolean;
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
  privacy: PrivacySettings;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
}

export interface UserStatus {
  id: string;
  userId: string;
  activity: ActivityType;
  emoji: string;
  location?: string;
  customText?: string;
  durationMinutes?: number;
  isVisible: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface Student extends UserProfile {
  currentStatus?: UserStatus;
  connectionStatus?: ConnectionStatus | "message";
}

export interface Connection {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: ConnectionStatus;
  createdAt: string;
  respondedAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessage: string;
  lastMessageSenderId: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface Citation {
  id: string;
  title: string;
  source: string;
  category: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  citations?: Citation[];
}

export interface ChatConversation {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export type BuildingCategory =
  | "academic"
  | "residential"
  | "dining"
  | "recreation"
  | "library"
  | "health"
  | "parking"
  | "services";

export interface Building {
  id: string;
  name: string;
  code: string;
  category: BuildingCategory;
  latitude: number;
  longitude: number;
  address: string;
  phone?: string;
  email?: string;
  hours: Record<string, { open: string; close: string }>;
  facilities: string[];
  description: string;
  imageUrl?: string;
}

export interface KnowledgeBaseEntry {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  source: string;
  category: string;
}

export interface DirectionStep {
  id: string;
  instruction: string;
  distanceMeters: number;
}

export interface SearchFilters {
  q?: string;
  major?: string;
  year?: string;
  residence?: string;
  liveStatus?: "available" | "unavailable";
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
