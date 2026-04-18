import { DirectionStep } from "@/lib/types";

export function DirectionsPanel({
  directions,
  distance,
  duration
}: {
  directions: DirectionStep[] | null;
  distance: string;
  duration: string;
}) {
  return (
    <div className="cortex-panel p-6">
      <div className="eyebrow">Directions</div>
      <div className="mt-3 text-2xl">Walking route</div>
      {directions?.length ? (
        <>
          <div className="mt-4 text-sm text-black/55 dark:text-white/55">
            {distance} • {duration}
          </div>
          <div className="mt-5 space-y-4">
            {directions.map((step, index) => (
              <div key={step.id} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cortex-ember text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <div>
                  <div className="text-sm leading-7">{step.instruction}</div>
                  <div className="text-xs text-black/45 dark:text-white/45">
                    {Math.round(step.distanceMeters)} meters
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm text-black/60 dark:text-white/60">
          Ask for directions from your current location to populate this route panel.
        </p>
      )}
    </div>
  );
}
