import { AvatarColorPreset } from "@/lib/types";

const customAvatarPrefix = "cortex-avatar:";

export const avatarColorOptions: Array<{
  value: AvatarColorPreset;
  label: string;
  classes: string;
}> = [
  {
    value: "rose",
    label: "Rose",
    classes:
      "border-[#e9bfd6] bg-[radial-gradient(circle_at_top,_#fde8f3,_#e8b0d9_60%,_#d68ac0)] text-[#4f1d3f]"
  },
  {
    value: "gold",
    label: "Gold",
    classes:
      "border-[#e7c99c] bg-[radial-gradient(circle_at_top,_#fff1d8,_#f0c57b_60%,_#dd9b43)] text-[#56340d]"
  },
  {
    value: "sky",
    label: "Sky",
    classes:
      "border-[#b9d6ea] bg-[radial-gradient(circle_at_top,_#e8f6ff,_#a5d4f4_60%,_#72aad7)] text-[#183b58]"
  },
  {
    value: "mint",
    label: "Mint",
    classes:
      "border-[#bad8cf] bg-[radial-gradient(circle_at_top,_#e6fbf3,_#a7dbc7_60%,_#79b7a0)] text-[#164538]"
  },
  {
    value: "violet",
    label: "Violet",
    classes:
      "border-[#d2c2f2] bg-[radial-gradient(circle_at_top,_#f3ecff,_#ccb9f4_60%,_#a88bdf)] text-[#36215d]"
  }
];

export function isAvatarColorPreset(value: unknown): value is AvatarColorPreset {
  return avatarColorOptions.some((option) => option.value === value);
}

function hashName(name: string) {
  let hash = 0;

  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }

  return Math.abs(hash);
}

export function getAvatarColorClasses(name: string, avatarColor?: AvatarColorPreset) {
  const selectedOption =
    avatarColorOptions.find((option) => option.value === avatarColor) ??
    avatarColorOptions[hashName(name) % avatarColorOptions.length];

  return selectedOption.classes;
}

export function encodeAvatarProfilePicture(avatarColor: AvatarColorPreset) {
  return `${customAvatarPrefix}${avatarColor}`;
}

export function parseAvatarProfilePicture(profilePictureUrl?: string | null): {
  profilePictureUrl?: string;
  avatarColor?: AvatarColorPreset;
} {
  if (!profilePictureUrl) {
    return {};
  }

  if (!profilePictureUrl.startsWith(customAvatarPrefix)) {
    return {
      profilePictureUrl
    };
  }

  const avatarColor = profilePictureUrl.slice(customAvatarPrefix.length);

  return isAvatarColorPreset(avatarColor)
    ? {
        avatarColor
      }
    : {};
}
