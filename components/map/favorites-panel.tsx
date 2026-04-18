import { Building } from "@/lib/types";

export function FavoritesPanel({
  favorites,
  onSelect
}: {
  favorites: Building[];
  onSelect: (building: Building) => void;
}) {
  return (
    <div className="cortex-panel p-6">
      <div className="eyebrow">Favorites</div>
      <div className="mt-3 text-2xl">Saved locations</div>
      <div className="mt-5 space-y-3">
        {favorites.length ? (
          favorites.map((building) => (
            <button
              key={building.id}
              type="button"
              onClick={() => onSelect(building)}
              className="block w-full rounded-[22px] bg-black/[0.04] px-4 py-3 text-left text-sm dark:bg-white/[0.06]"
            >
              {building.name}
            </button>
          ))
        ) : (
          <p className="text-sm text-black/60 dark:text-white/60">
            Save buildings you use often so they stay one tap away.
          </p>
        )}
      </div>
    </div>
  );
}
