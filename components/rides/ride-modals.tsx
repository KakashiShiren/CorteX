"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/lib/types";
import type { RidePost } from "@/lib/rides";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

async function uploadRideImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/rides/upload", {
    method: "POST",
    body: formData
  });
  const json = (await response.json()) as ApiResponse<{ url: string }>;

  if (!response.ok || !json.success || !json.data?.url) {
    throw new Error(json.error ?? "Unable to upload the image.");
  }

  return json.data.url;
}

function combineDateTime(date: string, time: string) {
  if (!date) {
    return null;
  }

  return new Date(`${date}T${time || "12:00"}`).toISOString();
}

export function CreateRidePostModal({
  open,
  onClose,
  onCreated
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (ride: RidePost) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [tab, setTab] = useState<"driver" | "passenger">("driver");
  const [departureLocation, setDepartureLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState("1");
  const [cost, setCost] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<string[]>([]);
  const [flexibleTiming, setFlexibleTiming] = useState(true);
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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

    setTab("driver");
    setDepartureLocation("");
    setDestination("");
    setDate("");
    setTime("");
    setSeats("1");
    setCost("");
    setIsRecurring(false);
    setRecurringDays([]);
    setFlexibleTiming(true);
    setDescription("");
    setImageFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
  }, [open]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  if (!open) {
    return null;
  }

  const submitLabel = tab === "driver" ? "Post Ride Available" : "Post Ride Request";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4 backdrop-blur-[2px]">
      <div className="flex min-h-full items-start justify-center py-4 sm:py-8">
        <div className="cortex-panel max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto p-6 sm:max-h-[calc(100vh-4rem)] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="eyebrow">Rides</div>
              <div className="mt-3 font-display text-3xl">Post a Ride</div>
            </div>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>

          <div className="mt-7 grid gap-2 rounded-[20px] border border-black/8 bg-white/50 p-2 dark:border-white/10 dark:bg-white/[0.04] sm:grid-cols-2">
            {[
              { value: "driver", label: "🚗 I'm Driving" },
              { value: "passenger", label: "👥 Need a Ride" }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTab(option.value as "driver" | "passenger")}
                className={`h-11 rounded-full text-sm font-semibold transition ${
                  tab === option.value
                    ? "bg-[#1C1A17] text-[#F7F0E3] dark:bg-white dark:text-[#1C1A17]"
                    : "border border-black/8 text-black/58 dark:border-white/10 dark:text-white/62"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-7 space-y-6">
            {tab === "driver" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Departure location</label>
                  <Input value={departureLocation} onChange={(event) => setDepartureLocation(event.target.value)} placeholder="Clark University" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Destination</label>
                  <Input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Boston, NYC, Logan..." />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Destination</label>
                <Input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Where do you need to go?" />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{tab === "driver" ? "Departure date" : "Preferred date"}</label>
                <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </div>
              {tab === "driver" || !flexibleTiming ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{tab === "driver" ? "Departure time" : "Preferred time"}</label>
                  <Input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
                </div>
              ) : null}
            </div>

            {tab === "driver" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-[20px] border border-black/8 bg-white/56 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                  <div>
                    <div className="text-sm font-medium">Recurring ride?</div>
                    <div className="mt-1 text-xs text-black/46 dark:text-white/48">Repeat this ride on selected days.</div>
                  </div>
                  <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                </div>
                {isRecurring ? (
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() =>
                          setRecurringDays((current) =>
                            current.includes(day) ? current.filter((item) => item !== day) : [...current, day]
                          )
                        }
                        className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                          recurringDays.includes(day)
                            ? "border-[#1C1A17] bg-[#1C1A17] text-[#F7F0E3]"
                            : "border-black/8 bg-white/60 text-black/58 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/62"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-[20px] border border-black/8 bg-white/56 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                <div>
                  <div className="text-sm font-medium">I'm flexible on time</div>
                  <div className="mt-1 text-xs text-black/46 dark:text-white/48">Drivers can suggest a matching pickup time.</div>
                </div>
                <Switch checked={flexibleTiming} onCheckedChange={setFlexibleTiming} />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{tab === "driver" ? "Seats available" : "Passengers"}</label>
                <Input type="number" min={1} max={tab === "driver" ? 7 : 5} value={seats} onChange={(event) => setSeats(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{tab === "driver" ? "Cost per seat" : "Budget per person"}</label>
                <Input type="number" min={0} max={50} value={cost} onChange={(event) => setCost(event.target.value)} placeholder="$15" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value.slice(0, 200))}
                placeholder={tab === "driver" ? "Any notes for passengers?" : "Where are you departing from? Any other details?"}
                maxLength={200}
              />
              <div className="text-right text-xs text-black/42 dark:text-white/46">{description.length}/200</div>
            </div>

            {tab === "driver" ? (
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium">Image</div>
                  <div className="mt-1 text-xs text-black/45 dark:text-white/48">Optional image of your car or pickup point.</div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    setImageFile(event.dataTransfer.files?.[0] ?? null);
                  }}
                  className="flex w-full flex-col items-center justify-center rounded-[22px] border border-dashed border-black/12 bg-white/40 px-5 py-7 text-center transition hover:border-black/18 hover:bg-white/62 dark:border-white/12 dark:bg-white/[0.03]"
                >
                  <div className="text-sm font-medium text-cortex-ink dark:text-white">
                    {imageFile ? imageFile.name : "Drop an image or click to upload"}
                  </div>
                  <div className="mt-2 text-xs text-black/46 dark:text-white/48">JPG or PNG, 5MB max</div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                />
                {previewUrl ? <img src={previewUrl} alt="Ride preview" className="h-40 w-full rounded-[22px] object-cover" /> : null}
              </div>
            ) : null}
          </div>

          {errorMessage ? <p className="mt-6 text-sm text-[#8f2430] dark:text-[#f1a4af]">{errorMessage}</p> : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={async () => {
                setErrorMessage(null);

                if (!destination.trim()) {
                  setErrorMessage("Add a destination.");
                  return;
                }

                if (tab === "driver" && !departureLocation.trim()) {
                  setErrorMessage("Add a departure location.");
                  return;
                }

                if (tab === "driver" && (!date || !time)) {
                  setErrorMessage("Add a departure date and time.");
                  return;
                }

                if (description.length > 200) {
                  setErrorMessage("Ride notes can be at most 200 characters.");
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
                  const imageUrl = imageFile ? await uploadRideImage(imageFile) : null;
                  const ride = await apiFetch<RidePost>("/api/rides", {
                    method: "POST",
                    body: JSON.stringify({
                      post_type: tab,
                      departure_location: tab === "driver" ? departureLocation.trim() : null,
                      destination: destination.trim(),
                      departure_time: combineDateTime(date, time),
                      seats_available: Number(seats || 1),
                      cost_per_seat: cost ? Number(cost) : null,
                      flexible_timing: tab === "passenger" ? flexibleTiming : false,
                      description: description.trim() || null,
                      image_url: imageUrl,
                      is_recurring: tab === "driver" ? isRecurring : false,
                      recurring_days: isRecurring ? recurringDays.join(",") : null
                    })
                  });

                  onCreated(ride);
                  onClose();
                } catch (error) {
                  setErrorMessage(error instanceof Error ? error.message : "Unable to create your ride post.");
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              {isSubmitting ? "Posting..." : submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RideContactModal({
  ride,
  mode,
  onClose,
  onSuccess
}: {
  ride: RidePost | null;
  mode: "request" | "offer";
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [message, setMessage] = useState("");
  const [seats, setSeats] = useState("1");
  const [cost, setCost] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!ride) {
      return;
    }

    setMessage(mode === "request" ? "" : `Hi ${ride.author.name}, I can offer a ride for this request.`);
    setSeats("1");
    setCost("");
    setErrorMessage(null);
  }, [mode, ride]);

  if (!ride) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4 backdrop-blur-[2px]">
      <div className="flex min-h-full items-center justify-center">
        <div className="cortex-panel w-full max-w-lg p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="eyebrow">Rides</div>
              <div className="mt-3 font-display text-3xl">{mode === "request" ? "Request Seat" : "Offer Ride"}</div>
            </div>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-[18px] border border-black/8 bg-white/54 px-4 py-3 text-sm text-black/62 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/64">
              {ride.destination ? `Destination: ${ride.destination}` : "Ride details"}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {mode === "request" ? "Why do you need this ride?" : "Message to passenger"}
              </label>
              <Textarea value={message} onChange={(event) => setMessage(event.target.value.slice(0, 500))} maxLength={500} />
            </div>
            {mode === "request" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Seats requested</label>
                <select
                  value={seats}
                  onChange={(event) => setSeats(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-black/8 bg-[#fffaf3]/88 px-4 text-sm text-cortex-ink outline-none dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                >
                  {[1, 2, 3, 4, 5].map((seat) => (
                    <option key={seat} value={seat}>
                      {seat}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Cost offering</label>
                <Input type="number" min={0} max={50} value={cost} onChange={(event) => setCost(event.target.value)} placeholder="$15 per person" />
              </div>
            )}
          </div>

          {errorMessage ? <p className="mt-5 text-sm text-[#8f2430] dark:text-[#f1a4af]">{errorMessage}</p> : null}

          <div className="mt-7 flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={async () => {
                setErrorMessage(null);
                setIsSubmitting(true);

                try {
                  await apiFetch<{ success: boolean; matchId: string }>(`/api/rides/${ride.id}/request`, {
                    method: "POST",
                    body: JSON.stringify({
                      seats_requested: Number(seats || 1),
                      message:
                        mode === "offer" && cost
                          ? `${message.trim()}\n\nOffer: $${cost} per person`
                          : message.trim()
                    })
                  });

                  onSuccess(mode === "request" ? `Request sent to ${ride.author.name}!` : `Offer sent to ${ride.author.name}!`);
                  onClose();
                } catch (error) {
                  setErrorMessage(error instanceof Error ? error.message : "Unable to send this request.");
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              {isSubmitting ? "Sending..." : mode === "request" ? "Send Request" : "Contact Passenger"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
