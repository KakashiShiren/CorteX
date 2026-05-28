import type { SupabaseClient } from "@supabase/supabase-js";

import { ImageBucket, normalizeBucketName } from "@/lib/storage/generatePath";

export async function deleteImage({
  supabase,
  bucketName,
  path
}: {
  supabase: SupabaseClient;
  bucketName: ImageBucket;
  path: string;
}) {
  const bucket = normalizeBucketName(bucketName);
  const deleteQuery = await supabase.storage.from(bucket).remove([path]);

  if (deleteQuery.error) {
    throw new Error(deleteQuery.error.message);
  }

  return deleteQuery.data;
}
