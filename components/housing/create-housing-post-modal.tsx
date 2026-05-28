"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import type { HousingPost } from "@/lib/housing";
import type { ApiResponse } from "@/lib/types";

type GeocodeResponse = {
  lat: number;
  lng: number;
  formatted_address: string;
};

type UploadResponse = {
  urls: string[];
};

const amenityOptions = [
  "WiFi",
  "Parking",
  "Furnished",
  "Laundry",
  "Air Conditioning",
  "Heat included",
  "Pet-friendly",
  "Yard/Patio",
  "Gym access",
  "Utilities included"
];

const bathroomOptions = ["0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4"];
const leaseOptions = [
  { label: "Any length", value: "any" },
  { label: "Semester", value: "semester" },
  { label: "1 Year", value: "year" },
  { label: "Negotiable", value: "negotiable" }
];

async function uploadHousingImages(files: File[]) {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const response = await fetch("/api/housing/upload", {
    method: "POST",
    body: formData
  });
  const json = (await response.json()) as ApiResponse<UploadResponse>;

  if (!response.ok || !json.success || !json.data?.urls) {
    throw new Error(json.error ?? "Unable to upload images.");
  }

  return json.data.urls;
}

export function CreateHousingPostModal({
  open,
  currentUserEmail,
  onClose,
  onCreated
}: {
  open: boolean;
  currentUserEmail?: string;
  onClose: () => void;
  onCreated: (listing: HousingPost) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [geocodedLabel, setGeocodedLabel] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [price, setPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("1");
  const [bathrooms, setBathrooms] = useState("1");
  const [squareFeet, setSquareFeet] = useState("");
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [leaseType, setLeaseType] = useState("year");
  const [availableFrom, setAvailableFrom] = useState("");
  const [contactEmail, setContactEmail] = useState(currentUserEmail ?? "");
  const [contactPhone, setContactPhone] = useState("");
  const [showPhone, setShowPhone] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [highlight, setHighlight] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
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

    setTitle("");
    setLocation("");
    setGeocodedLabel("");
    setLat(null);
    setLng(null);
    setPrice("");
    setBedrooms("1");
    setBathrooms("1");
    setSquareFeet("");
    setDescription("");
    setAmenities([]);
    setLeaseType("year");
    setAvailableFrom("");
    setContactEmail(currentUserEmail ?? "");
    setContactPhone("");
    setShowPhone(false);
    setImageFiles([]);
    setPreviewUrls([]);
    setHighlight(false);
    setErrorMessage(null);
  }, [currentUserEmail, open]);

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

  const handleGeocode = async () => {
    const query = location.trim();
    if (!query) {
      return;
    }

    setIsGeocoding(true);
    setErrorMessage(null);

    try {
      const result = await apiFetch<GeocodeResponse>(`/api/housing/geocode?address=${encodeURIComponent(query)}`);
      setLat(result.lat);
      setLng(result.lng);
      setGeocodedLabel(result.formatted_address);
      setLocation(result.formatted_address);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to geocode that address.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const submit = async (status: "active" | "draft") => {
    setErrorMessage(null);

    if (!title.trim() || title.trim().length > 100) {
      setErrorMessage("Add a property title under 100 characters.");
      return;
    }

    if (!location.trim()) {
      setErrorMessage("Add a property location.");
      return;
    }

    if (lat === null || lng === null) {
      setErrorMessage("Geocode the location before submitting.");
      return;
    }

    if (!price || Number(price) <= 0) {
      setErrorMessage("Add a valid monthly price.");
      return;
    }

    if (status === "active" && !description.trim()) {
      setErrorMessage("Add a full description before publishing.");
      return;
    }

    if (description.length > 1000) {
      setErrorMessage("Descriptions can be at most 1,000 characters.");
      return;
    }

    if (status === "active" && !availableFrom) {
      setErrorMessage("Choose an available date.");
      return;
    }

    if (!contactEmail.trim()) {
      setErrorMessage("Add a contact email.");
      return;
    }

    if (status === "active" && imageFiles.length < 1) {
      setErrorMessage("Upload at least one image.");
      return;
    }

    if (imageFiles.length > 5) {
      setErrorMessage("Upload at most five images.");
      return;
    }

    for (const file of imageFiles) {
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        setErrorMessage("Use JPG or PNG images.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("Each image must be 5MB or smaller.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const imageUrls = imageFiles.length ? await uploadHousingImages(imageFiles) : [];
      const listing = await apiFetch<HousingPost>("/api/housing", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          location: geocodedLabel || location.trim(),
          latitude: lat,
          longitude: lng,
          price_per_month: Number(price),
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms),
          square_feet: squareFeet ? Number(squareFeet) : null,
          amenities: highlight ? [...amenities, "Highlighted"] : amenities,
          available_from: availableFrom || null,
          lease_length: leaseType,
          contact_email: contactEmail.trim(),
          contact_phone: showPhone ? contactPhone.trim() || null : null,
          images_url: imageUrls,
          status
        })
      });

      onCreated(listing);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to publish listing.");
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
              <div className="eyebrow">Housing</div>
              <div className="mt-3 font-display text-3xl">Post Your Property</div>
            </div>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>

          <div className="mt-7 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Property Title</label>
              <Input value={title} onChange={(event) => setTitle(event.target.value.slice(0, 100))} placeholder="e.g. Spacious 3-bed near campus" />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Location</label>
              <div className="flex gap-2">
                <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="123 Main St, Worcester MA" />
                <Button type="button" variant="secondary" onClick={handleGeocode} disabled={isGeocoding}>
                  {isGeocoding ? "..." : "Find"}
                </Button>
              </div>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-[18px] border border-dashed border-black/12 bg-white/38 px-4 py-4 text-left text-xs text-black/52 dark:border-white/12 dark:bg-white/[0.03] dark:text-white/56"
                onClick={handleGeocode}
              >
                <MapPin className="h-4 w-4" />
                {lat !== null && lng !== null ? `Selected: ${lat.toFixed(5)}, ${lng.toFixed(5)}` : "Geocode address to place the pin"}
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Price per month</label>
                <Input type="number" min={1} value={price} onChange={(event) => setPrice(event.target.value)} placeholder="$800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bedrooms</label>
                <Input type="number" min={0} value={bedrooms} onChange={(event) => setBedrooms(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bathrooms</label>
                <select
                  value={bathrooms}
                  onChange={(event) => setBathrooms(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-black/8 bg-[#fffaf3]/88 px-4 text-sm text-cortex-ink outline-none dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                >
                  {bathroomOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Square footage</label>
              <Input type="number" min={0} value={squareFeet} onChange={(event) => setSquareFeet(event.target.value)} placeholder="1200 sq ft" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Full Description</label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value.slice(0, 1000))}
                placeholder="Describe the property, highlight features, mention house rules, etc."
                maxLength={1000}
              />
              <div className="text-right text-xs text-black/42 dark:text-white/46">{description.length}/1000</div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Amenities</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {amenityOptions.map((amenity) => {
                  const checked = amenities.includes(amenity);
                  return (
                    <label key={amenity} className="flex items-center gap-2 text-sm text-black/62 dark:text-white/64">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setAmenities((current) =>
                            checked ? current.filter((item) => item !== amenity) : [...current, amenity]
                          )
                        }
                        className="accent-[#1E5A3A]"
                      />
                      {amenity}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Lease Type</label>
                <div className="space-y-2 rounded-[18px] border border-black/8 bg-white/42 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                  {leaseOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 text-sm text-black/62 dark:text-white/64">
                      <input
                        type="radio"
                        name="createLeaseType"
                        checked={leaseType === option.value}
                        onChange={() => setLeaseType(option.value)}
                        className="accent-[#1E5A3A]"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Available From</label>
                <Input type="date" value={availableFrom} onChange={(event) => setAvailableFrom(event.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} placeholder="(508) 555-0123" />
                <label className="flex items-center gap-2 text-xs text-black/52 dark:text-white/54">
                  <input type="checkbox" checked={showPhone} onChange={(event) => setShowPhone(event.target.checked)} className="accent-[#1E5A3A]" />
                  Show my phone number to inquiries
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium">Images</div>
                <div className="mt-1 text-xs text-black/45 dark:text-white/48">Required to publish. JPG or PNG, max 5 images and 5MB each.</div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const files = Array.from(event.dataTransfer.files ?? []).slice(0, 5);
                  setImageFiles(files);
                }}
                className="flex w-full flex-col items-center justify-center rounded-[22px] border border-dashed border-black/12 bg-white/40 px-5 py-7 text-center transition hover:border-black/18 hover:bg-white/62 dark:border-white/12 dark:bg-white/[0.03]"
              >
                <div className="text-sm font-medium text-cortex-ink dark:text-white">Drag images or click to upload</div>
                <div className="mt-2 text-xs text-black/46 dark:text-white/48">{imageFiles.length}/5 selected</div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                multiple
                className="hidden"
                onChange={(event) => setImageFiles(Array.from(event.target.files ?? []).slice(0, 5))}
              />
              {previewUrls.length ? (
                <div className="grid gap-3 sm:grid-cols-5">
                  {previewUrls.map((url, index) => (
                    <div key={url} className="relative h-24 overflow-hidden rounded-[14px]">
                      <img src={url} alt="" className="h-full w-full object-cover" />
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

            <label className="flex items-center gap-2 rounded-[18px] border border-black/8 bg-white/42 px-4 py-3 text-sm text-black/62 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/64">
              <input type="checkbox" checked={highlight} onChange={(event) => setHighlight(event.target.checked)} className="accent-[#1E5A3A]" />
              Highlight this listing
            </label>
          </div>

          {errorMessage ? <p className="mt-6 text-sm text-[#8f2430] dark:text-[#f1a4af]">{errorMessage}</p> : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" disabled={isSubmitting} onClick={() => void submit("draft")}>
              Save as Draft
            </Button>
            <Button disabled={isSubmitting} onClick={() => void submit("active")}>
              {isSubmitting ? "Publishing..." : "Publish Listing"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
