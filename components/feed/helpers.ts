import { format, formatDistanceToNowStrict } from "date-fns";

import { parseAvatarProfilePicture } from "@/lib/avatar-colors";
import { normalizeCurrentStatus } from "@/lib/supabase/mappers";
import type { FeedPost, FeedPostType, TrendingFeedPost, UserStatus } from "@/lib/types";

export type CampusStudentRow = {
  id: string;
  user_id: string;
  name: string;
  major: string | null;
  year: string | null;
  profile_picture_url: string | null;
  current_status: unknown;
  university_id: string | null;
  updated_at: string;
};

export type CampusStudent = {
  id: string;
  name: string;
  major?: string;
  year?: string;
  profilePictureUrl?: string;
  currentStatus?: UserStatus;
  universityId?: string;
  updatedAt: string;
};

type FeedAvatarPalette = {
  backgroundClass: string;
  textClass: string;
};

type PostTypeAppearance = {
  label: string;
  accentColor: string;
  badgeClassName: string;
};

const feedAvatarPalettes: Array<{
  letters: string[];
  palette: FeedAvatarPalette;
}> = [
  {
    letters: ["A", "B"],
    palette: {
      backgroundClass: "bg-[#8B6914]",
      textClass: "text-[#F6E6B5]"
    }
  },
  {
    letters: ["C", "D"],
    palette: {
      backgroundClass: "bg-[#7C3454]",
      textClass: "text-[#F8D9E7]"
    }
  },
  {
    letters: ["E", "F", "G"],
    palette: {
      backgroundClass: "bg-[#1E5A3A]",
      textClass: "text-[#D7EFDF]"
    }
  },
  {
    letters: ["H", "I", "J"],
    palette: {
      backgroundClass: "bg-[#1A4A6B]",
      textClass: "text-[#D9ECFB]"
    }
  },
  {
    letters: ["K", "L", "M"],
    palette: {
      backgroundClass: "bg-[#4A2A7C]",
      textClass: "text-[#E8DCF9]"
    }
  },
  {
    letters: ["N", "O", "P"],
    palette: {
      backgroundClass: "bg-[#9A5635]",
      textClass: "text-[#F5DFC8]"
    }
  },
  {
    letters: ["Q", "R", "S"],
    palette: {
      backgroundClass: "bg-[#1F6864]",
      textClass: "text-[#D8F0EE]"
    }
  },
  {
    letters: ["T", "U", "V"],
    palette: {
      backgroundClass: "bg-[#3F454D]",
      textClass: "text-[#E5E8EB]"
    }
  },
  {
    letters: ["W", "X", "Y", "Z"],
    palette: {
      backgroundClass: "bg-[#5D4130]",
      textClass: "text-[#F3E1D2]"
    }
  }
];

const postTypeAppearanceMap: Record<FeedPostType, PostTypeAppearance> = {
  event: {
    label: "Event",
    accentColor: "#8B6914",
    badgeClassName: "border border-[#EDD58A] bg-[#FDF0D5] text-[#8B6914]"
  },
  party: {
    label: "Party",
    accentColor: "#7C3454",
    badgeClassName: "border border-[#E8A8C4] bg-[#FCE7F0] text-[#7C3454]"
  },
  trip: {
    label: "Trip / Hike",
    accentColor: "#1E5A3A",
    badgeClassName: "border border-[#8FD4AC] bg-[#E6F4ED] text-[#1E5A3A]"
  },
  lostfound: {
    label: "Lost & Found",
    accentColor: "#1A4A6B",
    badgeClassName: "border border-[#8ABDE8] bg-[#E6F0F8] text-[#1A4A6B]"
  },
  rideshare: {
    label: "Ride Share",
    accentColor: "#4A2A7C",
    badgeClassName: "border border-[#B8A0E8] bg-[#EEE6F8] text-[#4A2A7C]"
  },
  shoutout: {
    label: "Shoutout",
    accentColor: "#3C3489",
    badgeClassName: "border border-[#AFA9EC] bg-[#EEEDFE] text-[#3C3489]"
  },
  general: {
    label: "General",
    accentColor: "#3A3530",
    badgeClassName: "border border-[#D3D1C7] bg-[#F1EFE8] text-[#5F5E5A]"
  }
};

export function mapCampusStudentRow(row: CampusStudentRow): CampusStudent {
  const avatar = parseAvatarProfilePicture(row.profile_picture_url);

  return {
    id: row.user_id,
    name: row.name,
    major: row.major ?? undefined,
    year: row.year ?? undefined,
    profilePictureUrl: avatar.profilePictureUrl,
    currentStatus: normalizeCurrentStatus(row.current_status),
    universityId: row.university_id ?? undefined,
    updatedAt: row.updated_at
  };
}

export function getPostTypeLabel(type: FeedPostType) {
  return postTypeAppearanceMap[type].label;
}

export function getPostTypeBadgeClass(type: FeedPostType) {
  return postTypeAppearanceMap[type].badgeClassName;
}

export function getPostTypeAccent(type: FeedPostType) {
  return postTypeAppearanceMap[type].accentColor;
}

export function deriveEventTitle(content: string, fallback?: string) {
  const firstLine = content
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (firstLine && firstLine.length <= 72) {
    return firstLine;
  }

  return fallback ?? undefined;
}

export function deriveTrendingTitle(post: Pick<FeedPost, "content" | "eventLocation" | "postType"> | TrendingFeedPost) {
  if (post.postType === "event" || post.postType === "party" || post.postType === "trip") {
    return deriveEventTitle(post.content, post.eventLocation) ?? post.content.slice(0, 30);
  }

  return post.content.length > 30 ? `${post.content.slice(0, 30).trim()}...` : post.content;
}

export function formatPostAge(date: string) {
  return formatDistanceToNowStrict(new Date(date), {
    addSuffix: true
  });
}

export function formatEventDate(date?: string) {
  if (!date) {
    return null;
  }

  return format(new Date(date), "EEE, MMM d '•' h:mm a");
}

export function formatStatusExpiry(expiresAt?: string) {
  if (!expiresAt) {
    return "Expires soon";
  }

  return `Expires in ${formatRemainingTime(expiresAt, "long")}`;
}

export function formatRemainingTime(expiresAt: string, mode: "short" | "long" = "short") {
  const remainingMs = Math.max(0, new Date(expiresAt).getTime() - Date.now());
  const totalMinutes = Math.max(0, Math.round(remainingMs / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return mode === "long" ? `${minutes}m` : `${minutes} min`;
  }

  if (!minutes) {
    return mode === "long" ? `${hours}h` : `${hours}h left`;
  }

  return mode === "long" ? `${hours}h ${minutes}m` : `${hours}h ${minutes}m left`;
}

export function getStatusActivityLabel(status?: UserStatus) {
  if (!status) {
    return "No live status";
  }

  const location = status.location?.trim();

  switch (status.activity) {
    case "studying":
    case "free_to_study":
      return location ? `Studying at ${location}` : "Studying";
    case "idle":
    case "free_to_hang":
      return location ? `Free to hang at ${location}` : "Free to hang";
    case "eating":
      return location ? `Eating at ${location}` : "Eating";
    case "working_out":
      return location ? `Working out at ${location}` : "Working out";
    case "in_class":
      return location ? `In class at ${location}` : "In class";
    case "at_library":
      return location ? `At ${location}` : "At the library";
    case "at_dorm":
      return location ? `At ${location}` : "At the dorm";
    default:
      return status.customText?.trim() || location || "Live right now";
  }
}

export function getCompactStatusLabel(status?: UserStatus) {
  if (!status) {
    return "No live status";
  }

  const location = status.location?.trim();
  const emoji = status.emoji ? `${status.emoji} ` : "";

  switch (status.activity) {
    case "studying":
    case "free_to_study":
      return `${emoji}Studying${location ? ` · ${location}` : ""}`;
    case "idle":
    case "free_to_hang":
      return `${emoji}Free to hang${location ? ` · ${location}` : ""}`;
    case "eating":
      return `${emoji}Eating${location ? ` · ${location}` : ""}`;
    case "working_out":
      return `${emoji}Working out${location ? ` · ${location}` : ""}`;
    case "in_class":
      return `${emoji}In class${location ? ` · ${location}` : ""}`;
    case "at_library":
      return `${emoji}At library${location ? ` · ${location}` : ""}`;
    case "at_dorm":
      return `${emoji}At the dorm${location ? ` · ${location}` : ""}`;
    default:
      return `${emoji}${status.customText?.trim() || location || "Live right now"}`;
  }
}

export function isFreeNowStatus(status?: UserStatus) {
  if (!status) {
    return false;
  }

  return ["idle", "studying", "free_to_hang", "free_to_study"].includes(status.activity);
}

export function getStatusProgress(status?: UserStatus, now = Date.now()) {
  if (!status) {
    return 0;
  }

  const startsAt = new Date(status.createdAt).getTime();
  const endsAt = new Date(status.expiresAt).getTime();
  const total = Math.max(1, endsAt - startsAt);
  const remaining = Math.max(0, endsAt - now);

  return Math.max(0, Math.min(1, remaining / total));
}

export function getPulseDensityLabel(count: number) {
  if (count <= 0) {
    return "Quiet";
  }

  if (count <= 2) {
    return "Normal";
  }

  if (count <= 5) {
    return "Busy";
  }

  return "Packed";
}

export function shouldShowFreeChip(content: string) {
  return !/\$\d+|tickets?|entry fee|cover|paid/i.test(content);
}

export function isEventLikeType(type: FeedPostType) {
  return type === "event" || type === "party" || type === "trip";
}

export function getFeedAvatarInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function getFeedAvatarPalette(name: string): FeedAvatarPalette {
  const firstLetter = name.trim().charAt(0).toUpperCase();
  const match = feedAvatarPalettes.find((item) => item.letters.includes(firstLetter));

  return (
    match?.palette ?? {
      backgroundClass: "bg-[#5D4130]",
      textClass: "text-[#F3E1D2]"
    }
  );
}
