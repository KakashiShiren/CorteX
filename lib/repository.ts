import { randomUUID } from "crypto";

import {
  demoBuildings,
  demoChatConversations,
  demoConnections,
  demoConversations,
  demoKnowledgeBase,
  demoMessages,
  demoStatuses,
  demoUsers
} from "@/lib/demo-data";
import {
  ChatConversation,
  Connection,
  Conversation,
  Message,
  SearchFilters,
  Student,
  UserProfile,
  UserStatus
} from "@/lib/types";

type AuthRecord = {
  userId: string;
  password: string;
};

type DemoStore = {
  users: UserProfile[];
  statuses: UserStatus[];
  connections: Connection[];
  conversations: Conversation[];
  messages: Message[];
  chatConversations: ChatConversation[];
  auth: Record<string, AuthRecord>;
};

declare global {
  var __cortexStore: DemoStore | undefined;
}

function getStore(): DemoStore {
  if (!global.__cortexStore) {
    const seededAuth = Object.fromEntries(
      demoUsers.map((user) => [user.email.toLowerCase(), { userId: user.id, password: "Password123" }])
    );

    global.__cortexStore = {
      users: structuredClone(demoUsers),
      statuses: structuredClone(demoStatuses),
      connections: structuredClone(demoConnections),
      conversations: structuredClone(demoConversations),
      messages: structuredClone(demoMessages),
      chatConversations: structuredClone(demoChatConversations),
      auth: seededAuth
    };
  }

  return global.__cortexStore;
}

function getStatusForUser(userId: string) {
  return getStore().statuses.find(
    (status) => status.userId === userId && new Date(status.expiresAt).getTime() > Date.now()
  );
}

function getConnectionState(currentUserId: string, otherUserId: string) {
  const connection = getStore().connections.find(
    (item) =>
      (item.fromUserId === currentUserId && item.toUserId === otherUserId) ||
      (item.fromUserId === otherUserId && item.toUserId === currentUserId)
  );

  if (!connection) {
    return undefined;
  }

  return connection.status === "accepted" ? "message" : connection.status;
}

function toStudent(user: UserProfile, currentUserId?: string): Student {
  return {
    ...user,
    currentStatus: getStatusForUser(user.id),
    connectionStatus: currentUserId ? getConnectionState(currentUserId, user.id) : undefined
  };
}

export function listStudents(filters: SearchFilters = {}, currentUserId?: string) {
  const { q, major, year, residence, page = 1, limit = 12 } = filters;
  const query = q?.trim().toLowerCase();

  let students = getStore().users
    .filter((user) => user.isVerified)
    .map((user) => toStudent(user, currentUserId));

  if (currentUserId) {
    students = students.filter((student) => student.id !== currentUserId);
  }

  if (query) {
    students = students.filter((student) =>
      [student.name, student.major, student.year, student.residence, student.bio, student.currentStatus?.location]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
    );
  }

  if (major) {
    students = students.filter((student) => student.major === major);
  }

  if (year) {
    students = students.filter((student) => student.year === year);
  }

  if (residence) {
    students = students.filter((student) => student.residence === residence);
  }

  const start = (page - 1) * limit;
  const paginated = students.slice(start, start + limit);

  return {
    students: paginated,
    total: students.length,
    hasMore: start + limit < students.length
  };
}

export function getStudentById(id: string, currentUserId?: string) {
  const user = getStore().users.find((item) => item.id === id);
  return user ? toStudent(user, currentUserId) : null;
}

export function getCurrentUser(userId: string) {
  return getStore().users.find((user) => user.id === userId) ?? null;
}

export function authenticateUser(email: string, password: string) {
  const authRecord = getStore().auth[email.toLowerCase()];

  if (!authRecord || authRecord.password !== password) {
    return null;
  }

  return getCurrentUser(authRecord.userId);
}

export function registerUser(input: {
  email: string;
  name: string;
  password: string;
}) {
  const store = getStore();
  const normalizedEmail = input.email.toLowerCase();

  if (store.auth[normalizedEmail]) {
    throw new Error("An account already exists for that email.");
  }

  const now = new Date().toISOString();
  const user: UserProfile = {
    id: randomUUID(),
    email: normalizedEmail,
    name: input.name,
    major: "Undeclared",
    year: "Freshman",
    residence: "Off Campus",
    bio: "New Cortex member.",
    interests: [],
    isVerified: true,
    isOnline: true,
    createdAt: now,
    updatedAt: now,
    privacy: {
      searchable: true,
      showMajor: true,
      showYear: true,
      showResidence: true,
      showInterests: true,
      showOnlineStatus: true,
      messagePermission: "connected",
      blockedUsers: []
    },
    notifications: {
      messages: true,
      digest: "immediately",
      sounds: true,
      connectionRequests: true,
      campusAlerts: true,
      emailDigests: false
    },
    appearance: {
      theme: "auto",
      compactMode: false,
      fontScale: "md"
    }
  };

  store.users.unshift(user);
  store.auth[normalizedEmail] = {
    userId: user.id,
    password: input.password
  };

  return user;
}

export function updateCurrentUser(
  userId: string,
  payload: Partial<Pick<UserProfile, "name" | "major" | "year" | "residence" | "bio" | "interests">>
) {
  const user = getCurrentUser(userId);
  if (!user) {
    throw new Error("User not found");
  }

  Object.assign(user, payload, { updatedAt: new Date().toISOString() });
  return user;
}

export function updateUserSettings(
  userId: string,
  payload: Partial<UserProfile["privacy"] & UserProfile["notifications"] & UserProfile["appearance"]>
) {
  const user = getCurrentUser(userId);
  if (!user) {
    throw new Error("User not found");
  }

  user.privacy = {
    ...user.privacy,
    searchable: payload.searchable ?? user.privacy.searchable,
    showMajor: payload.showMajor ?? user.privacy.showMajor,
    showYear: payload.showYear ?? user.privacy.showYear,
    showResidence: payload.showResidence ?? user.privacy.showResidence,
    showInterests: payload.showInterests ?? user.privacy.showInterests,
    showOnlineStatus: payload.showOnlineStatus ?? user.privacy.showOnlineStatus,
    messagePermission: payload.messagePermission ?? user.privacy.messagePermission,
    blockedUsers: payload.blockedUsers ?? user.privacy.blockedUsers
  };

  user.notifications = {
    ...user.notifications,
    messages: payload.messages ?? user.notifications.messages,
    digest: payload.digest ?? user.notifications.digest,
    sounds: payload.sounds ?? user.notifications.sounds,
    connectionRequests: payload.connectionRequests ?? user.notifications.connectionRequests,
    campusAlerts: payload.campusAlerts ?? user.notifications.campusAlerts,
    emailDigests: payload.emailDigests ?? user.notifications.emailDigests
  };

  user.appearance = {
    ...user.appearance,
    theme: payload.theme ?? user.appearance.theme,
    compactMode: payload.compactMode ?? user.appearance.compactMode,
    fontScale: payload.fontScale ?? user.appearance.fontScale
  };

  user.updatedAt = new Date().toISOString();
  return user;
}

export function blockUser(userId: string, blockedUserId: string) {
  const user = getCurrentUser(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (!user.privacy.blockedUsers.includes(blockedUserId)) {
    user.privacy.blockedUsers.push(blockedUserId);
  }

  user.updatedAt = new Date().toISOString();
  return user;
}

export function getConnectionsForUser(userId: string) {
  const accepted = getStore().connections.filter(
    (connection) =>
      connection.status === "accepted" &&
      (connection.fromUserId === userId || connection.toUserId === userId)
  );

  return accepted.map((connection) => {
    const peerId = connection.fromUserId === userId ? connection.toUserId : connection.fromUserId;
    const peer = getStudentById(peerId, userId);
    return {
      ...connection,
      peer
    };
  });
}

export function requestConnection(fromUserId: string, toUserId: string) {
  const store = getStore();
  const existing = store.connections.find(
    (connection) =>
      (connection.fromUserId === fromUserId && connection.toUserId === toUserId) ||
      (connection.fromUserId === toUserId && connection.toUserId === fromUserId)
  );

  if (existing) {
    return existing;
  }

  const connection: Connection = {
    id: randomUUID(),
    fromUserId,
    toUserId,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  store.connections.push(connection);
  return connection;
}

export function respondToConnection(userId: string, connectionId: string, status: "accepted" | "rejected") {
  const connection = getStore().connections.find((item) => item.id === connectionId);

  if (!connection) {
    throw new Error("Connection not found");
  }

  if (connection.toUserId !== userId) {
    throw new Error("Only the recipient can respond");
  }

  connection.status = status;
  connection.respondedAt = new Date().toISOString();
  return connection;
}

export function listConversations(userId: string) {
  return getStore().conversations
    .filter((conversation) => conversation.participantIds.includes(userId))
    .map((conversation) => {
      const peerId = conversation.participantIds.find((id) => id !== userId)!;
      return {
        ...conversation,
        peer: getStudentById(peerId, userId)
      };
    })
    .sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));
}

export function getConversationById(userId: string, conversationId: string) {
  const conversation = getStore().conversations.find((item) => item.id === conversationId);
  if (!conversation || !conversation.participantIds.includes(userId)) {
    return null;
  }

  return conversation;
}

export function getOrCreateConversation(userId: string, peerId: string) {
  const store = getStore();
  const existing = store.conversations.find(
    (conversation) =>
      conversation.participantIds.includes(userId) && conversation.participantIds.includes(peerId)
  );

  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: randomUUID(),
    participantIds: [userId, peerId],
    lastMessage: "",
    lastMessageSenderId: userId,
    lastMessageAt: now,
    createdAt: now
  };

  store.conversations.unshift(conversation);
  return conversation;
}

export function listMessages(conversationId: string, userId: string) {
  const conversation = getConversationById(userId, conversationId);
  if (!conversation) {
    throw new Error("Conversation not found");
  }

  return getStore().messages
    .filter((message) => message.conversationId === conversationId)
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
}

export function sendMessage(conversationId: string, senderId: string, content: string) {
  const conversation = getConversationById(senderId, conversationId);
  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const receiverId = conversation.participantIds.find((id) => id !== senderId);
  if (!receiverId) {
    throw new Error("Receiver not found");
  }

  const message: Message = {
    id: randomUUID(),
    conversationId,
    senderId,
    receiverId,
    content,
    isRead: false,
    createdAt: new Date().toISOString()
  };

  getStore().messages.push(message);
  conversation.lastMessage = content;
  conversation.lastMessageAt = message.createdAt;
  conversation.lastMessageSenderId = senderId;

  return message;
}

export function markMessageRead(messageId: string, userId: string) {
  const message = getStore().messages.find((item) => item.id === messageId && item.receiverId === userId);
  if (!message) {
    throw new Error("Message not found");
  }

  message.isRead = true;
  message.readAt = new Date().toISOString();
  return message;
}

export function setUserStatus(
  userId: string,
  payload: Pick<UserStatus, "activity" | "emoji" | "location" | "customText">
) {
  const store = getStore();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const existing = store.statuses.find((item) => item.userId === userId);

  if (existing) {
    existing.activity = payload.activity;
    existing.emoji = payload.emoji;
    existing.location = payload.location;
    existing.customText = payload.customText;
    existing.createdAt = now.toISOString();
    existing.expiresAt = expiresAt;
    existing.isVisible = true;
    return existing;
  }

  const status: UserStatus = {
    id: randomUUID(),
    userId,
    activity: payload.activity,
    emoji: payload.emoji,
    location: payload.location,
    customText: payload.customText,
    isVisible: true,
    createdAt: now.toISOString(),
    expiresAt
  };

  store.statuses.push(status);
  return status;
}

export function clearUserStatus(userId: string) {
  const store = getStore();
  store.statuses = store.statuses.filter((status) => status.userId !== userId);
  global.__cortexStore = store;
}

export function getUserStatus(userId: string) {
  return getStatusForUser(userId) ?? null;
}

export function listBuildings() {
  return demoBuildings;
}

export function getBuildingById(id: string) {
  return demoBuildings.find((building) => building.id === id) ?? null;
}

export function searchKnowledgeBase(query: string) {
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);

  return demoKnowledgeBase
    .map((entry) => {
      const haystack = [entry.title, entry.content, ...entry.keywords].join(" ").toLowerCase();
      const score = tokens.reduce((accumulator, token) => accumulator + (haystack.includes(token) ? 1 : 0), 0);
      return { entry, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((item) => item.entry);
}

export function listChatConversations(userId: string) {
  return getStore().chatConversations.filter((conversation) => conversation.userId === userId);
}

export function getChatConversation(userId: string, conversationId: string) {
  return getStore().chatConversations.find(
    (conversation) => conversation.userId === userId && conversation.id === conversationId
  );
}

export function upsertChatConversation(userId: string, conversationId?: string) {
  const store = getStore();
  const existing = conversationId ? getChatConversation(userId, conversationId) : undefined;
  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const conversation: ChatConversation = {
    id: randomUUID(),
    userId,
    messages: [],
    createdAt: now,
    updatedAt: now
  };

  store.chatConversations.unshift(conversation);
  return conversation;
}

export function appendChatMessages(
  userId: string,
  conversationId: string,
  messages: ChatConversation["messages"]
) {
  const conversation = getChatConversation(userId, conversationId);
  if (!conversation) {
    throw new Error("Conversation not found");
  }

  conversation.messages.push(...messages);
  conversation.updatedAt = new Date().toISOString();
  return conversation;
}

export function deleteChatConversation(userId: string, conversationId: string) {
  const store = getStore();
  store.chatConversations = store.chatConversations.filter(
    (conversation) => !(conversation.userId === userId && conversation.id === conversationId)
  );
  global.__cortexStore = store;
}
