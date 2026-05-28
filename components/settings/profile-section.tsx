"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Trash2, Upload } from "lucide-react";

import { avatarColorOptions } from "@/lib/avatar-colors";
import { apiFetch } from "@/lib/api";
import { ApiResponse, AvatarColorPreset, UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ProfileSection() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [form, setForm] = useState({
    name: "",
    major: "",
    year: "",
    residence: "",
    bio: "",
    interests: "",
    avatarColor: "auto" as "auto" | AvatarColorPreset,
    profilePictureUrl: ""
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        major: user.major,
        year: user.year,
        residence: user.residence,
        bio: user.bio,
        interests: user.interests.join(", "),
        avatarColor: user.avatarColor ?? "auto",
        profilePictureUrl: user.profilePictureUrl ?? ""
      });
      setImageFile(null);
      setPreviewUrl(null);
      setImageRemoved(false);
      setErrorMessage(null);
    }
  }, [user]);

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

  const previewName = form.name.trim() || user?.name || "Grove Student";
  const previewImageUrl = previewUrl ?? (imageRemoved ? undefined : form.profilePictureUrl || undefined);

  async function uploadProfileImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/users/me/avatar", {
      method: "POST",
      body: formData
    });
    const json = (await response.json()) as ApiResponse<{ url: string }>;

    if (!response.ok || !json.success || !json.data?.url) {
      throw new Error(json.error ?? "Unable to upload profile picture.");
    }

    return json.data.url;
  }

  return (
    <div className="cortex-panel p-6 sm:p-8">
      <div className="eyebrow">Profile</div>
      <div className="mt-3 text-3xl">Shape how your campus sees you</div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Full name" />
        <Input value={form.major} onChange={(event) => setForm({ ...form, major: event.target.value })} placeholder="Major" />
        <Input value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} placeholder="Year" />
        <Input value={form.residence} onChange={(event) => setForm({ ...form, residence: event.target.value })} placeholder="Residence" />
      </div>
      <div className="mt-4 grid gap-4">
        <Textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} placeholder="Short bio" />
        <Input
          value={form.interests}
          onChange={(event) => setForm({ ...form, interests: event.target.value })}
          placeholder="Interests separated by commas"
        />
      </div>
      <div className="mt-6 rounded-[28px] border border-black/8 bg-white/50 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              name={previewName}
              imageUrl={previewImageUrl}
              avatarColor={form.avatarColor === "auto" ? undefined : form.avatarColor}
              size="lg"
              className="h-20 w-20 text-xl"
            />
            <div>
              <div className="text-lg font-semibold">Profile picture</div>
              <p className="mt-1 max-w-xl text-sm text-black/56 dark:text-white/60">
                Upload a JPG or PNG under 5MB. This will appear on your profile, feed posts, messages, and comments.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Photo
            </Button>
            {previewImageUrl ? (
              <Button
                variant="outline"
                onClick={() => {
                  setImageFile(null);
                  setPreviewUrl(null);
                  setImageRemoved(true);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
            ) : null}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setErrorMessage(null);

            if (!file) {
              setImageFile(null);
              return;
            }

            if (!["image/jpeg", "image/png"].includes(file.type)) {
              setErrorMessage("Use a JPG or PNG image.");
              event.target.value = "";
              return;
            }

            if (file.size > 5 * 1024 * 1024) {
              setErrorMessage("Profile pictures must be 5MB or smaller.");
              event.target.value = "";
              return;
            }

            setImageRemoved(false);
            setImageFile(file);
          }}
        />
        {imageFile ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#1E5A3A]/18 bg-[#1E5A3A]/8 px-3 py-2 text-xs font-semibold text-[#1E5A3A] dark:text-[#8FD4AC]">
            <Camera className="h-3.5 w-3.5" />
            {imageFile.name}
          </div>
        ) : null}
      </div>
      <div className="mt-6 rounded-[28px] border border-black/8 bg-white/50 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-lg font-semibold">Avatar color</div>
            <p className="mt-1 max-w-xl text-sm text-black/56 dark:text-white/60">
              Choose the color used for your initials avatar. This shows anywhere Grove renders your profile without a
              custom image.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-black/8 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.05]">
            <Avatar
              name={previewName}
              imageUrl={previewImageUrl}
              avatarColor={form.avatarColor === "auto" ? undefined : form.avatarColor}
              size="lg"
            />
            <div>
              <div className="text-sm font-medium">Live preview</div>
              <div className="text-xs text-black/52 dark:text-white/56">{previewName}</div>
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <button
            type="button"
            onClick={() => setForm({ ...form, avatarColor: "auto" })}
            className={cn(
              "flex items-center gap-3 rounded-[22px] border px-4 py-3 text-left transition",
              form.avatarColor === "auto"
                ? "border-cortex-ember bg-cortex-ember/8"
                : "border-black/8 bg-white/70 hover:border-cortex-ember/35 dark:border-white/10 dark:bg-white/[0.05]"
            )}
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-black/18 text-sm font-semibold dark:border-white/20">
              A
            </span>
            <span>
              <span className="block text-sm font-medium">Auto</span>
              <span className="block text-xs text-black/52 dark:text-white/56">Pick a color automatically</span>
            </span>
          </button>
          {avatarColorOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setForm({ ...form, avatarColor: option.value })}
              className={cn(
                "flex items-center gap-3 rounded-[22px] border px-4 py-3 text-left transition",
                form.avatarColor === option.value
                  ? "border-cortex-ember bg-cortex-ember/8"
                  : "border-black/8 bg-white/70 hover:border-cortex-ember/35 dark:border-white/10 dark:bg-white/[0.05]"
              )}
            >
              <span className={cn("h-10 w-10 rounded-full border shadow-sm", option.classes)} />
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
      {errorMessage ? (
        <p className="mt-5 text-sm text-[#8f2430] dark:text-[#f1a4af]">{errorMessage}</p>
      ) : null}
      <div className="mt-6">
        <Button
          disabled={isSaving}
          onClick={async () => {
            try {
              setIsSaving(true);
              setErrorMessage(null);
              const uploadedImageUrl = imageFile ? await uploadProfileImage(imageFile) : undefined;
              const avatarPayload =
                uploadedImageUrl !== undefined
                  ? {
                      profilePictureUrl: uploadedImageUrl
                    }
                  : imageRemoved || form.avatarColor !== (user?.avatarColor ?? "auto")
                    ? {
                        avatarColor: form.avatarColor === "auto" ? null : form.avatarColor
                      }
                    : {};
              const updated = await apiFetch<UserProfile>("/api/users/me", {
                method: "PUT",
                body: JSON.stringify({
                  ...form,
                  profilePictureUrl: undefined,
                  ...avatarPayload,
                  interests: form.interests
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                })
              });
              setUser(updated);
              queryClient.setQueryData(["me"], (current: Record<string, unknown> | undefined) =>
                current ? { ...current, ...updated } : updated
              );
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["students"] }),
                queryClient.invalidateQueries({ queryKey: ["connections"] }),
                queryClient.invalidateQueries({ queryKey: ["student"] })
              ]);
              setImageFile(null);
              setPreviewUrl(null);
              setImageRemoved(false);
            } catch (error) {
              setErrorMessage(error instanceof Error ? error.message : "Unable to save your profile.");
            } finally {
              setIsSaving(false);
            }
          }}
        >
          {isSaving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
      <div className="mt-8 rounded-[28px] border border-[#8f2430]/20 bg-[#8f2430]/[0.06] p-5 dark:border-[#f1a4af]/20 dark:bg-[#f1a4af]/[0.08]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-lg font-semibold text-[#8f2430] dark:text-[#f1a4af]">Delete account</div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-black/60 dark:text-white/62">
              Permanently remove your Grove profile, posts, messages, listings, Canvas data, and account login. Type
              DELETE to confirm.
            </p>
          </div>
          <div className="w-full lg:w-[280px]">
            <Input
              value={deleteConfirm}
              onChange={(event) => setDeleteConfirm(event.target.value)}
              placeholder="Type DELETE"
            />
            <Button
              className="mt-3 w-full"
              variant="outline"
              disabled={deleteConfirm !== "DELETE" || isDeleting}
              onClick={async () => {
                try {
                  setIsDeleting(true);
                  setErrorMessage(null);
                  await apiFetch<{ deleted: boolean }>("/api/users/me", { method: "DELETE" });
                  setUser(null);
                  queryClient.clear();
                  router.push("/auth?mode=signup&step=1");
                  router.refresh();
                } catch (error) {
                  setErrorMessage(error instanceof Error ? error.message : "Unable to delete your account.");
                } finally {
                  setIsDeleting(false);
                }
              }}
            >
              {isDeleting ? "Deleting..." : "Delete Account Permanently"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
