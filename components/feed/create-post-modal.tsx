"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import type { ApiResponse, FeedPost } from "@/lib/types";

type ComposePreset = "general" | "event" | "party" | "trip" | "lostfound" | "rideshare" | "shoutout" | "photo";
type ExpiryOption = "event_auto" | "never" | "60" | "360" | "720" | "1440" | "4320" | "10080";

const composeTypeOptions: Array<{
  value: ComposePreset;
  label: string;
}> = [
  { value: "general", label: "General" },
  { value: "event", label: "Event" },
  { value: "party", label: "Party" },
  { value: "trip", label: "Trip / Hike" },
  { value: "lostfound", label: "Lost & Found" },
  { value: "rideshare", label: "Ride Share" },
  { value: "shoutout", label: "Shoutout" }
];

const fixedExpiryOptions: Array<{
  value: Exclude<ExpiryOption, "event_auto">;
  label: string;
  helper: string;
}> = [
  { value: "never", label: "Never", helper: "Keep it visible until deleted" },
  { value: "60", label: "1 hour", helper: "Quick campus update" },
  { value: "360", label: "6 hours", helper: "Good for today" },
  { value: "720", label: "12 hours", helper: "Through the day" },
  { value: "1440", label: "24 hours", helper: "One full day" },
  { value: "4320", label: "3 days", helper: "Long weekend" },
  { value: "10080", label: "7 days", helper: "Full week" }
];

function normalizeInitialType(preset?: ComposePreset) {
  if (!preset || preset === "photo") {
    return "general";
  }

  return preset;
}

function getDefaultExpiryOption(type: ComposePreset): ExpiryOption {
  return type === "event" || type === "party" || type === "trip" ? "event_auto" : "never";
}

async function uploadPostImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/posts/upload", {
    method: "POST",
    body: formData
  });
  const json = (await response.json()) as ApiResponse<{ url: string }>;

  if (!response.ok || !json.success || !json.data?.url) {
    throw new Error(json.error ?? "Unable to upload the image.");
  }

  return json.data.url;
}

export function CreatePostModal({
  open,
  onClose,
  onCreated,
  initialType
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (post: FeedPost) => void;
  initialType?: ComposePreset;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedType, setSelectedType] = useState<ComposePreset>(normalizeInitialType(initialType));
  const [content, setContent] = useState("");
  const [expiryOption, setExpiryOption] = useState<ExpiryOption>(getDefaultExpiryOption(normalizeInitialType(initialType)));
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showEventFields = selectedType === "event" || selectedType === "party" || selectedType === "trip";
  const allowAnonymous = selectedType === "lostfound" || selectedType === "shoutout";
  const showUploadHint = initialType === "photo";
  const characterCount = content.length;

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedType(normalizeInitialType(initialType));
    setContent("");
    setExpiryOption(getDefaultExpiryOption(normalizeInitialType(initialType)));
    setEventDate("");
    setEventLocation("");
    setIsAnonymous(false);
    setImageFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
  }, [initialType, open]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  useEffect(() => {
    if (!allowAnonymous) {
      setIsAnonymous(false);
    }
  }, [allowAnonymous]);

  useEffect(() => {
    if (!showEventFields && expiryOption === "event_auto") {
      setExpiryOption("never");
    }
  }, [expiryOption, showEventFields]);

  const postButtonLabel = useMemo(() => {
    if (isSubmitting) {
      return "Posting...";
    }

    return "Post";
  }, [isSubmitting]);

  const handleSelectType = (nextType: ComposePreset) => {
    const previousShowEventFields = selectedType === "event" || selectedType === "party" || selectedType === "trip";
    const nextShowEventFields = nextType === "event" || nextType === "party" || nextType === "trip";

    setSelectedType(nextType);
    setExpiryOption((current) => {
      if (current === "event_auto" && !nextShowEventFields) {
        return "never";
      }

      if (!previousShowEventFields && nextShowEventFields && current === "never") {
        return "event_auto";
      }

      return current;
    });
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/72 p-4 backdrop-blur-md dark:bg-black/78">
      <div className="flex min-h-full items-center justify-center py-6">
        <div className="w-full max-w-xl overflow-hidden rounded-[28px] border border-black/10 bg-[#fffaf3] text-cortex-ink shadow-[0_28px_90px_rgba(0,0,0,0.28)] dark:border-white/12 dark:bg-[#171311] dark:text-[#f7efe3] dark:shadow-[0_32px_100px_rgba(0,0,0,0.56)]">
          <div className="flex items-start justify-between gap-4 border-b border-black/8 px-6 py-5 dark:border-white/10">
            <div>
              <div className="eyebrow">Feed</div>
              <div className="mt-2 font-display text-[2rem] leading-none">Create a post</div>
            </div>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>

          <div className="max-h-[calc(100vh-13rem)] space-y-6 overflow-y-auto overscroll-contain px-6 py-6">
            <div>
              <div className="text-sm font-medium">Post type</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {composeTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelectType(option.value)}
                    className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${
                      selectedType === option.value
                        ? "border-cortex-ink bg-cortex-ink text-cortex-parchment shadow-[0_12px_24px_rgba(18,17,15,0.14)] dark:border-cortex-gold/40 dark:bg-cortex-gold/18 dark:text-cortex-gold"
                        : "border-black/8 bg-white/68 text-black/62 hover:border-black/14 hover:bg-white/88 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/66 dark:hover:bg-white/[0.08]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">What&apos;s happening on campus?</label>
              <Textarea
                value={content}
                onChange={(event) => setContent(event.target.value.slice(0, 500))}
                placeholder="What's happening on campus?"
                maxLength={500}
              />
              <div className="text-right text-xs text-black/42 dark:text-white/46">{characterCount}/500</div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium">Post expiry</div>
                <div className="mt-1 text-xs text-black/45 dark:text-white/48">
                  Choose when this post should disappear from the feed.
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {showEventFields ? (
                  <button
                    type="button"
                    onClick={() => setExpiryOption("event_auto")}
                    className={`rounded-[18px] border px-4 py-3 text-left transition ${
                      expiryOption === "event_auto"
                        ? "border-cortex-ink bg-cortex-ink text-cortex-parchment shadow-[0_12px_24px_rgba(18,17,15,0.14)] dark:border-white dark:bg-white dark:text-cortex-ink"
                        : "border-black/8 bg-white/50 text-black/62 hover:bg-white/74 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/66 dark:hover:bg-white/[0.07]"
                    }`}
                  >
                    <div className="text-sm font-semibold">After event</div>
                    <div className="mt-1 text-[11px] opacity-70">Expires 6 hours after start time</div>
                  </button>
                ) : null}
                {fixedExpiryOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setExpiryOption(option.value)}
                    className={`rounded-[18px] border px-4 py-3 text-left transition ${
                      expiryOption === option.value
                        ? "border-cortex-ink bg-cortex-ink text-cortex-parchment shadow-[0_12px_24px_rgba(18,17,15,0.14)] dark:border-white dark:bg-white dark:text-cortex-ink"
                        : "border-black/8 bg-white/50 text-black/62 hover:bg-white/74 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/66 dark:hover:bg-white/[0.07]"
                    }`}
                  >
                    <div className="text-sm font-semibold">{option.label}</div>
                    <div className="mt-1 text-[11px] opacity-70">{option.helper}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium">Image</div>
                  <div className="mt-1 text-xs text-black/45 dark:text-white/48">
                    Drop an image or click to upload. 5MB max, JPG or PNG only.
                  </div>
                </div>
                {showUploadHint ? (
                  <div className="rounded-full border border-cortex-gold/24 bg-cortex-gold/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-cortex-garnet dark:border-cortex-gold/18 dark:bg-cortex-gold/10 dark:text-cortex-gold">
                    Photo
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const file = event.dataTransfer.files?.[0];
                  if (file) {
                    setImageFile(file);
                  }
                }}
                className="flex w-full flex-col items-center justify-center rounded-[24px] border border-dashed border-black/12 bg-white/40 px-5 py-8 text-center transition hover:border-black/18 hover:bg-white/62 dark:border-white/12 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
              >
                <div className="text-sm font-medium text-cortex-ink dark:text-white">
                  {imageFile ? imageFile.name : "Drop an image or click to upload"}
                </div>
                <div className="mt-2 text-xs text-black/46 dark:text-white/48">
                  {imageFile ? `${Math.round(imageFile.size / 1024)} KB selected` : "Optional for any post type"}
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setImageFile(file);
                }}
              />
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Post preview"
                  className="h-40 w-full rounded-[24px] object-cover"
                />
              ) : null}
            </div>

            {showEventFields ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Event Date &amp; Time</label>
                  <Input
                    type="datetime-local"
                    value={eventDate}
                    onChange={(event) => setEventDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    value={eventLocation}
                    onChange={(event) => setEventLocation(event.target.value)}
                    placeholder="Where is this happening?"
                  />
                </div>
              </div>
            ) : null}

            {allowAnonymous ? (
              <div className="flex items-center justify-between rounded-[24px] border border-black/8 bg-white/56 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                <div>
                  <div className="text-sm font-medium">Post anonymously</div>
                  <div className="mt-1 text-xs text-black/46 dark:text-white/48">
                    Your name, major, and year will be hidden on this post.
                  </div>
                </div>
                <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              </div>
            ) : null}
            {errorMessage ? (
              <p className="rounded-[16px] border border-[#8f2430]/15 bg-[#8f2430]/8 px-4 py-3 text-sm text-[#8f2430] dark:border-[#f1a4af]/18 dark:bg-[#f1a4af]/8 dark:text-[#f1a4af]">
                {errorMessage}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 border-t border-black/8 px-6 py-5 dark:border-white/10 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setErrorMessage(null);

                if (!content.trim()) {
                  setErrorMessage("Write something before you post.");
                  return;
                }

                if (content.trim().length > 500) {
                  setErrorMessage("Posts can be at most 500 characters.");
                  return;
                }

                if (showEventFields && !eventDate) {
                  setErrorMessage("Add a date and time for events, parties, and trips.");
                  return;
                }

                if (imageFile && !["image/jpeg", "image/png"].includes(imageFile.type)) {
                  setErrorMessage("Use a JPG or PNG image.");
                  return;
                }

                if (imageFile && imageFile.size > 5 * 1024 * 1024) {
                  setErrorMessage("Images must be 5MB or smaller.");
                  return;
                }

                setIsSubmitting(true);

                try {
                  const imageUrl = imageFile ? await uploadPostImage(imageFile) : undefined;
                  const expiryPayload =
                    expiryOption === "event_auto"
                      ? {}
                      : {
                          expiry_minutes: expiryOption === "never" ? null : Number(expiryOption)
                        };
                  const post = await apiFetch<FeedPost>("/api/posts", {
                    method: "POST",
                    body: JSON.stringify({
                      content: content.trim(),
                      post_type: selectedType === "photo" ? "general" : selectedType,
                      event_date: showEventFields && eventDate ? new Date(eventDate).toISOString() : null,
                      event_location: showEventFields ? eventLocation.trim() || null : null,
                      image_url: imageUrl,
                      is_anonymous: allowAnonymous ? isAnonymous : false,
                      ...expiryPayload
                    })
                  });

                  onCreated(post);
                  onClose();
                } catch (error) {
                  setErrorMessage(error instanceof Error ? error.message : "Unable to create your post right now.");
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
            >
              {postButtonLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
