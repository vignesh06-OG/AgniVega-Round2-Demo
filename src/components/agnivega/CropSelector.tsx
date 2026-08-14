/**
 * CropSelector — Big icon tile crop picker for the simplified farmer flow.
 *
 * Replaces the dropdown for digital-literacy-challenged users.
 * Large touch targets (min 80px), icon + local-language name, color coding.
 * Falls back gracefully to a scrollable grid for 10+ crops.
 */
import type { Crop } from "@/lib/krishi/types";
import type { Lang } from "@/lib/krishi/i18n";
import { cropName } from "@/lib/krishi/i18n";
import { cn } from "@/lib/utils";

const CROP_ICONS: Record<string, string> = {
  onion: "🧅",
  grapes: "🍇",
  tomato: "🍅",
  pomegranate: "🍎",
  soybean: "🌱",
  maize: "🌽",
  wheat: "🌾",
  cotton: "☁️",
  sugarcane: "🎋",
  banana: "🍌",
};

function cropIcon(slug: string): string {
  return CROP_ICONS[slug] ?? "🌿";
}

/** Color pair for each crop tile — agri-themed palette */
const CROP_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  onion: { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-900" },
  grapes: { bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-900" },
  tomato: { bg: "bg-red-50", border: "border-red-300", text: "text-red-900" },
  pomegranate: { bg: "bg-rose-50", border: "border-rose-300", text: "text-rose-900" },
  soybean: { bg: "bg-lime-50", border: "border-lime-300", text: "text-lime-900" },
  maize: { bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-900" },
};

const DEFAULT_COLOR = { bg: "bg-green-50", border: "border-green-300", text: "text-green-900" };

interface Props {
  crops: Crop[];
  selectedId: string;
  onChange: (cropId: string) => void;
  lang: Lang;
}

export function CropSelector({ crops, selectedId, onChange, lang }: Props) {
  // For ≤8 crops: icon tiles. For more: compact list.
  if (crops.length <= 8) {
    return (
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${Math.min(crops.length, 4)}, 1fr)` }}
        role="radiogroup"
        aria-label="Select crop"
      >
        {crops.map((crop) => {
          const isSelected = crop.id === selectedId;
          const colors = CROP_COLORS[crop.slug] ?? DEFAULT_COLOR;
          return (
            <button
              key={crop.id}
              id={`crop-tile-${crop.id}`}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(crop.id)}
              className={cn(
                "flex min-h-[80px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                colors.bg,
                isSelected
                  ? `${colors.border} ring-2 ring-primary shadow-md scale-105`
                  : `border-transparent hover:${colors.border} hover:shadow-sm`,
              )}
            >
              <span className="text-3xl leading-none" aria-hidden="true">
                {cropIcon(crop.slug)}
              </span>
              <span className={cn("text-xs font-semibold leading-tight", colors.text)}>
                {cropName(crop, lang)}
              </span>
              {crop.perishable && (
                <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700 leading-tight">
                  ⏱ {crop.spoilage_hours}h
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Compact list for many crops
  return (
    <div
      className="grid gap-1.5 max-h-64 overflow-y-auto pr-1"
      role="listbox"
      aria-label="Select crop"
    >
      {crops.map((crop) => {
        const isSelected = crop.id === selectedId;
        return (
          <button
            key={crop.id}
            id={`crop-list-${crop.id}`}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => onChange(crop.id)}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isSelected
                ? "border-primary bg-primary/10 font-semibold"
                : "border-border hover:bg-secondary/50",
            )}
          >
            <span className="text-2xl shrink-0">{cropIcon(crop.slug)}</span>
            <span className="text-sm">{cropName(crop, lang)}</span>
            {crop.perishable && (
              <span className="ml-auto text-[10px] text-muted-foreground">
                {crop.spoilage_hours}h shelf life
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
