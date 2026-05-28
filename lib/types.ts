export type ActivityType =
  | "studying"
  | "free_to_study"
  | "eating"
  | "working_out"
  | "in_class"
  | "at_library"
  | "at_dorm"
  | "idle"
  | "free_to_hang"
  | "offline";

export type ConnectionStatus = "pending" | "accepted" | "rejected";
export type StudentConnectionStatus = "none" | "outgoing_pending" | "incoming_pending" | "connected";
export type AvatarColorPreset = "rose" | "gold" | "sky" | "mint" | "violet";

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
  universityId?: string;
  universityName?: string;
  universityDomain?: string;
  major: string;
  year: string;
  residence: string;
  bio: string;
  profilePictureUrl?: string;
  avatarColor?: AvatarColorPreset;
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
  connectionId?: string;
  connectionStatus: StudentConnectionStatus;
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

export interface ConversationPeer {
  id: string;
  name: string;
  major: string;
  year: string;
  residence: string;
  profilePictureUrl?: string;
  avatarColor?: AvatarColorPreset;
}

export interface ConversationSummary extends Conversation {
  peer?: ConversationPeer;
}

export interface ConnectionRequest {
  id: string;
  status: ConnectionStatus;
  createdAt: string;
  respondedAt?: string;
  direction: "incoming" | "outgoing";
  student: Student;
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
  similarity?: number | null;
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

export type FeedPostType = "general" | "event" | "party" | "trip" | "lostfound" | "rideshare" | "shoutout";

export type FeedPostRsvpStatus = "going" | "not_interested";

export interface FeedPostAuthor {
  id: string;
  name: string;
  universityId?: string;
  universityName?: string;
  universityDomain?: string;
  major?: string;
  year?: string;
  profilePictureUrl?: string;
  avatarColor?: AvatarColorPreset;
}

export interface FeedPost {
  id: string;
  userId: string;
  universityId?: string;
  content: string;
  imageUrl?: string;
  postType: FeedPostType;
  eventDate?: string;
  eventLocation?: string;
  isAnonymous: boolean;
  expiresAt?: string | null;
  likesCount: number;
  commentsCount: number;
  rsvpGoingCount: number;
  createdAt: string;
  updatedAt: string;
  author: FeedPostAuthor;
  viewerHasLiked: boolean;
  viewerRsvpStatus?: FeedPostRsvpStatus;
}

export interface FeedCommentAuthor {
  id: string;
  name: string;
  major?: string;
  year?: string;
  profilePictureUrl?: string;
  avatarColor?: AvatarColorPreset;
}

export interface FeedComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  author: FeedCommentAuthor;
}

export interface TrendingFeedPost {
  id: string;
  postType: FeedPostType;
  content: string;
  eventLocation?: string;
  likesCount: number;
  rsvpGoingCount: number;
  createdAt: string;
}
