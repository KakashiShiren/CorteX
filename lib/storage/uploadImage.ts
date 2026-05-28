import type { SupabaseClient } from "@supabase/supabase-js";

import {
  allowedImageMimeTypes,
  generateImagePath,
  ImageBucket,
  maxImageBytes,
  normalizeBucketName
} from "@/lib/storage/generatePath";

export function validateImageFile(file: File) {
  if (!allowedImageMimeTypes.includes(file.type as (typeof allowedImageMimeTypes)[number])) {
    return "Use a JPG, PNG, or WebP image.";
  }

  if (file.size > maxImageBytes) {
    return "Images must be 5MB or smaller.";
  }

  return null;
}

export async function ensureImageBucket(supabase: SupabaseClient, bucketName: ImageBucket) {
  const bucket = normalizeBucketName(bucketName);
  const listQuery = await supabase.storage.listBuckets();

  if (listQuery.error) {
    throw new Error(listQuery.error.message);
  }

  if (listQuery.data.some((item) => item.name === bucket || item.id === bucket)) {
    return bucket;
  }

  const createQuery = await supabase.storage.createBucket(bucket, {
    public: false,
    fileSizeLimit: maxImageBytes,
    allowedMimeTypes: [...allowedImageMimeTypes]
  });

  if (createQuery.error) {
    throw new Error(createQuery.error.message);
  }

  return bucket;
}

export async function createSignedImageUpload({
  supabase,
  bucketName,
  userId,
  file,
  suffix,
  pathPrefix,
  postId,
  eventId
}: {
  supabase: SupabaseClient;
  bucketName: ImageBucket;
  userId: string;
  file: File;
  suffix?: string;
  pathPrefix?: string;
  postId?: string;
  eventId?: string;
}) {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const bucket = await ensureImageBucket(supabase, bucketName);
  const path = generateImagePath({
    bucketName: bucket,
    userId,
    postId,
    eventId,
    mimeType: file.type,
    suffix,
    pathPrefix
  });
  const signedUploadQuery = await supabase.storage.from(bucket).createSignedUploadUrl(path, {
    upsert: bucket === "avatars"
  });

  if (signedUploadQuery.error || !signedUploadQuery.data) {
    throw new Error(signedUploadQuery.error?.message ?? "Unable to create signed upload URL.");
  }

  return {
    bucket,
    path,
    token: signedUploadQuery.data.token,
    signedUrl: signedUploadQuery.data.signedUrl
  };
}

export async function uploadImage({
  supabase,
  bucketName,
  userId,
  file,
  suffix,
  pathPrefix,
  postId,
  eventId
}: {
  supabase: SupabaseClient;
  bucketName: ImageBucket;
  userId: string;
  file: File;
  suffix?: string;
  pathPrefix?: string;
  postId?: string;
  eventId?: string;
}) {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const bucket = await ensureImageBucket(supabase, bucketName);
  const path = generateImagePath({
    bucketName: bucket,
    userId,
    postId,
    eventId,
    mimeType: file.type,
    suffix,
    pathPrefix
  });
  const arrayBuffer = await file.arrayBuffer();
  const uploadQuery = await supabase.storage.from(bucket).upload(path, arrayBuffer, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: bucket === "avatars"
  });

  if (uploadQuery.error) {
    throw new Error(uploadQuery.error.message);
  }

  const signedUrlQuery = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 7);

  return {
    bucket,
    path,
    url: signedUrlQuery.data?.signedUrl ?? ""
  };
}

export const uploadPublicImage = uploadImage;
export const ensurePublicImageBucket = ensureImageBucket;
