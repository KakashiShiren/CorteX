"use client";

import { useEffect, useRef, useState } from "react";
import { GripVertical, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import {
  marketplaceCategories,
  marketplaceConditions,
  type MarketplaceItem
} from "@/lib/marketplace";
import type { ApiResponse } from "@/lib/types";

type UploadResponse = {
  itemId: string;
  urls: string[];
};

async function uploadMarketplaceImages(files: File[], itemId?: string) {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  if (itemId) {
    formData.append("itemId", itemId);
  }

  const response = await fetch("/api/marketplace/upload", {
    method: "POST",
    body: formData
  });
  const json = (await response.json()) as ApiResponse<UploadResponse>;

  if (!response.ok || !json.success || !json.data?.urls) {
    throw new Error(json.error ?? "Unable to upload images.");
  }

  return json.data;
}

function validateFiles(files: File[]) {
  if (!files.length) {
    return "Upload at least one image.";
  }

  if (files.length > 5) {
    return "Upload at most five images.";
  }

  for (const file of files) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return "Use JPG, PNG, or WebP images.";
    }

    if (file.size > 5 * 1024 * 1024) {
      return "Each image must be 5MB or smaller.";
    }
  }

  return null;
}

export function PostItemModal({
  open,
  item,
  onClose,
  onSaved
}: {
  open: boolean;
  item?: MarketplaceItem | null;
  onClose: () => void;
  onSaved: (item: MarketplaceItem) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(marketplaceCategories[0]);
  const [condition, setCondition] = useState<string>(marketplaceConditions[0]);
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [localPickup, setLocalPickup] = useState(true);
  const [shippingAvailable, setShippingAvailable] = useState(false);
  const [contactPreference, setContactPreference] = useState<"direct_message" | "phone_call">("direct_message");
  const [phone, setPhone] = useState("");
  const [allowsNegotiation, setAllowsNegotiation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    setTitle(item?.title ?? "");
    setCategory(item?.category ?? marketplaceCategories[0]);
    setCondition(item?.condition ?? marketplaceConditions[0]);
    setPrice(item ? String(item.price) : "");
    setDescription(item?.description ?? "");
    setImageFiles([]);
    setExistingImageUrls(item?.imageUrls ?? []);
    setLocalPickup(item?.localPickup ?? true);
    setShippingAvailable(item?.shippingAvailable ?? false);
    setContactPreference(item?.contactPreference === "phone_call" ? "phone_call" : "direct_message");
    setPhone(item?.contactPhone ?? "");
    setAllowsNegotiation(Boolean(item?.allowsNegotiation));
    setErrorMessage(null);
  }, [item, open]);

  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
    };
  }, [imageFiles]);

  if (!open) {
    return null;
  }

  const allImageCount = existingImageUrls.length + imageFiles.length;

  const submit = async (status: "active" | "draft") => {
    setErrorMessage(null);

    if (!title.trim() || title.trim().length > 100) {
      setErrorMessage("Add an item title under 100 characters.");
      return;
    }

    if (!description.trim() || description.length > 500) {
      setErrorMessage("Add a description under 500 characters.");
      return;
    }

    if (!price || Number(price) <= 0) {
      setErrorMessage("Add a valid price.");
      return;
    }

    if (!localPickup && !shippingAvailable) {
      setErrorMessage("Choose pickup, shipping, or both.");
      return;
    }

    if (contactPreference === "phone_call" && !phone.trim()) {
      setErrorMessage("Add a phone number or use direct message.");
      return;
    }

    if (!item) {
      const fileError = validateFiles(imageFiles);
      if (fileError) {
        setErrorMessage(fileError);
        return;
      }
    } else if (!allImageCount) {
      setErrorMessage("Keep at least one image on the listing.");
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrls = [...existingImageUrls];
      let itemId = item?.id;

      if (imageFiles.length) {
        const upload = await uploadMarketplaceImages(imageFiles, itemId);
        itemId = upload.itemId;
        imageUrls = [...imageUrls, ...upload.urls];
      }

      const payload = {
        ...(itemId ? { id: itemId } : {}),
        title: title.trim(),
        category,
        condition,
        price: Number(price),
        description: description.trim(),
        image_urls: imageUrls,
        local_pickup: localPickup,
        shipping_available: shippingAvailable,
        contact_preference: contactPreference,
        contact_phone: contactPreference === "phone_call" ? phone.trim() : null,
        allows_negotiation: allowsNegotiation,
        status
      };

      const saved = item
        ? await apiFetch<MarketplaceItem>(`/api/marketplace/${item.id}`, {
            method: "PUT",
            body: JSON.stringify(payload)
          })
        : await apiFetch<MarketplaceItem>("/api/marketplace", {
            method: "POST",
            body: JSON.stringify(payload)
          });

      onSaved(saved);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4 backdrop-blur-[2px]">
      <div className="flex min-h-full items-start justify-center py-4 sm:py-8">
        <div className="cortex-panel max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto p-6 sm:max-h-[calc(100vh-4rem)] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="eyebrow">Marketplace</div>
              <div className="mt-3 font-display text-3xl">{item ? "Edit Item" : "List an Item"}</div>
            </div>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>

          <div className="mt-7 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Item Title</label>
              <Input value={title} onChange={(event) => setTitle(event.target.value.slice(0, 100))} placeholder="What are you selling?" />
              <div className="text-right text-xs text-black/42 dark:text-white/46">{title.length}/100</div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-black/8 bg-[#fffaf3]/88 px-4 text-sm text-cortex-ink outline-none dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                >
                  {marketplaceCategories.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Price</label>
                <Input type="number" min={1} step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="$50" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Condition</label>
              <div className="grid gap-2 sm:grid-cols-4">
                {marketplaceConditions.map((option) => (
                  <label key={option} className="rounded-[18px] border border-black/8 bg-white/38 px-4 py-3 text-sm text-black/62 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/64">
                    <input
                      type="radio"
                      name="condition"
                      checked={condition === option}
                      onChange={() => setCondition(option)}
                      className="mr-2 accent-[#3f5f55]"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value.slice(0, 500))}
                placeholder="Describe the item, why you're selling, any defects, etc."
                maxLength={500}
              />
              <div className="text-right text-xs text-black/42 dark:text-white/46">{description.length}/500</div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium">Images</div>
                <div className="mt-1 text-xs text-black/45 dark:text-white/48">Required. JPG, PNG, or WebP, max 5 images and 5MB each.</div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  setImageFiles(Array.from(event.dataTransfer.files ?? []).slice(0, 5 - existingImageUrls.length));
                }}
                className="flex w-full flex-col items-center justify-center rounded-[22px] border border-dashed border-black/12 bg-white/40 px-5 py-7 text-center transition hover:border-black/18 hover:bg-white/62 dark:border-white/12 dark:bg-white/[0.03]"
              >
                <Upload className="h-5 w-5 text-cortex-garnet dark:text-cortex-gold" />
                <div className="mt-3 text-sm font-medium text-cortex-ink dark:text-white">Drag images or click to upload</div>
                <div className="mt-2 text-xs text-black/46 dark:text-white/48">{allImageCount}/5 selected</div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(event) => {
                  const nextFiles = Array.from(event.target.files ?? []).slice(0, 5 - existingImageUrls.length);
                  setImageFiles(nextFiles);
                }}
              />
              {existingImageUrls.length || previewUrls.length ? (
                <div className="grid gap-3 sm:grid-cols-5">
                  {existingImageUrls.map((url, index) => (
                    <div key={url} className="relative h-24 overflow-hidden rounded-[14px]">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded-full bg-white/86 p-1 text-[#9f1d2c]"
                        onClick={() => setExistingImageUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {previewUrls.map((url, index) => (
                    <div key={url} className="relative h-24 overflow-hidden rounded-[14px]">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <div className="absolute left-1 top-1 rounded-full bg-white/86 p-1 text-black/54">
                        <GripVertical className="h-3 w-3" />
                      </div>
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded-full bg-white/86 p-1 text-[#9f1d2c]"
                        onClick={() => setImageFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 rounded-[20px] border border-black/8 bg-white/38 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-sm font-medium">Shipping & Pickup</div>
                <label className="flex items-center gap-2 text-sm text-black/62 dark:text-white/64">
                  <input type="checkbox" checked={localPickup} onChange={(event) => setLocalPickup(event.target.checked)} className="accent-[#3f5f55]" />
                  Local pickup only
                </label>
                <label className="flex items-center gap-2 text-sm text-black/62 dark:text-white/64">
                  <input type="checkbox" checked={shippingAvailable} onChange={(event) => setShippingAvailable(event.target.checked)} className="accent-[#3f5f55]" />
                  Shipping available
                </label>
                {shippingAvailable ? <p className="text-xs text-black/46 dark:text-white/48">Estimate shipping in messages before handoff.</p> : null}
              </div>

              <div className="space-y-3 rounded-[20px] border border-black/8 bg-white/38 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-sm font-medium">Contact Preference</div>
                <label className="flex items-center gap-2 text-sm text-black/62 dark:text-white/64">
                  <input
                    type="radio"
                    checked={contactPreference === "direct_message"}
                    onChange={() => setContactPreference("direct_message")}
                    className="accent-[#3f5f55]"
                  />
                  Direct message
                </label>
                <label className="flex items-center gap-2 text-sm text-black/62 dark:text-white/64">
                  <input
                    type="radio"
                    checked={contactPreference === "phone_call"}
                    onChange={() => setContactPreference("phone_call")}
                    className="accent-[#3f5f55]"
                  />
                  Phone call
                </label>
                {contactPreference === "phone_call" ? (
                  <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="(508) 555-0123" />
                ) : null}
              </div>
            </div>

            <label className="flex items-center gap-2 rounded-[18px] border border-black/8 bg-white/42 px-4 py-3 text-sm text-black/62 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/64">
              <input type="checkbox" checked={allowsNegotiation} onChange={(event) => setAllowsNegotiation(event.target.checked)} className="accent-[#3f5f55]" />
              Asking for negotiation
            </label>
          </div>

          {errorMessage ? <p className="mt-6 text-sm text-[#8f2430] dark:text-[#f1a4af]">{errorMessage}</p> : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" disabled={isSubmitting} onClick={() => void submit("draft")}>
              Save as Draft
            </Button>
            <Button disabled={isSubmitting} onClick={() => void submit("active")}>
              {isSubmitting ? "Posting..." : item ? "Save Changes" : "Post Item"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
