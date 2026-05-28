export type GroveImageBucket = "avatars" | "posts" | "events";

export type LegacyImageBucket = "housing" | "rides" | "marketplace";

export type ImageBucket = GroveImageBucket | LegacyImageBucket;

export const allowedImageMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;

export const maxImageBytes = 5 * 1024 * 1024;

export function getImageExtension(mimeType: string) {
  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "jpg";
}

export function normalizeBucketName(bucketName: ImageBucket): GroveImageBucket {
  if (bucketName === "housing" || bucketName === "rides" || bucketName === "marketplace") {
    return "posts";
  }

  return bucketName;
}

function cleanPathPart(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 120);
}

export function generateImagePath({
  bucketName,
  userId,
  postId,
  eventId,
  mimeType,
  suffix,
  pathPrefix
}: {
  bucketName: ImageBucket;
  userId: string;
  postId?: string;
  eventId?: string;
  mimeType: string;
  suffix?: string;
  pathPrefix?: string;
}) {
  const bucket = normalizeBucketName(bucketName);
  const extension = getImageExtension(mimeType);
  const timestamp = Date.now();
  const safeSuffix = suffix ? `-${cleanPathPart(suffix)}` : "";

  if (pathPrefix) {
    const safePrefix = pathPrefix
      .split("/")
      .map(cleanPathPart)
      .filter(Boolean)
      .join("/");

    return `${safePrefix}/${timestamp}${safeSuffix}.${extension}`;
  }

  if (bucket === "avatars") {
    return `${userId}/avatar.${extension}`;
  }

  if (bucket === "events") {
    return `${eventId ?? "unassigned"}/${timestamp}${safeSuffix}.${extension}`;
  }

  return `${userId}/${postId ?? "unassigned"}/${timestamp}${safeSuffix}.${extension}`;
}
