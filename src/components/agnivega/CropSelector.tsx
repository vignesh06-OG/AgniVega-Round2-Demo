/**
 * CropSelector — Big icon tile crop picker for the simplified farmer flow.
 *
 * Replaces the dropdown for digital-literacy-challenged users.
 * Large touch targets (min 80px), icon + local-language name, color coding.
 * Falls back gracefully to a scrollable grid for 10+ crops.
 */
import React from "react";
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
  tur: "🫘",
  chana: "🫘",
  moong: "🫘",
  jowar: "🌾",
  bajra: "🌾",
  potato: "🥔",
  groundnut: "🥜",
  sunflower: "🌻",
  mustard: "🌼",
  urad: "🫘",
  rice: "🍚",
  turmeric: "🫚",
  ginger: "🫚",
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
  wheat: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-900" },
  cotton: { bg: "bg-slate-50", border: "border-slate-300", text: "text-slate-900" },
  potato: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-900" },
  sunflower: { bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-900" },
  sugarcane: { bg: "bg-green-50", border: "border-green-300", text: "text-green-900" },
};

const DEFAULT_COLOR = { bg: "bg-stone-50", border: "border-stone-300", text: "text-stone-900" };

interface Props {
  crops: Crop[];
  selectedId: string;
  onChange: (cropId: string) => void;
  lang: Lang;
}

export function CropSelector({ crops, selectedId, onChange, lang }: Props) {
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const categories = Array.from(new Set(crops.map((c) => c.category))).filter(Boolean) as string[];

  const filteredCrops = crops.filter((crop) => {
    const name = cropName(crop, lang).toLowerCase();
    const englishName = crop.name_en?.toLowerCase() || "";
    const matchesSearch =
      name.includes(search.toLowerCase()) || englishName.includes(search.toLowerCase());
    const matchesCategory = selectedCategory ? crop.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const isSearching = search.length > 0 || selectedCategory !== null;

  const featuredCrops = crops.filter(c => c.isHighDemand || c.season === "Kharif"); // Assuming some seasonal logic
  const allOtherCrops = crops.filter(c => !featuredCrops.includes(c));

  const renderCropTile = (crop: Crop) => {
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
          "relative flex min-h-[90px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition-all",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
          colors.bg,
          isSelected
            ? `${colors.border} ring-2 ring-primary shadow-md scale-105`
            : `border-transparent hover:${colors.border} hover:shadow-sm`,
        )}
      >
        {crop.isHighDemand && (
          <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
            {lang === "en" ? "HIGH DEMAND" : "जास्त मागणी"}
          </span>
        )}
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
  };

  const renderCropList = (cropList: Crop[]) => (
    <div
      className="grid gap-1.5 max-h-64 overflow-y-auto pr-1"
      role="listbox"
      aria-label="Select crop"
    >
      {cropList.map((crop) => {
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
              "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors relative overflow-hidden",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isSelected
                ? "border-primary bg-primary/10 font-semibold"
                : "border-border hover:bg-secondary/50",
            )}
          >
            {crop.isHighDemand && (
              <div
                className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"
                title={lang === "en" ? "High Demand" : "जास्त मागणी"}
              />
            )}
            <span className="text-2xl shrink-0 ml-1">{cropIcon(crop.slug)}</span>
            <div className="flex flex-col">
              <span className="text-sm">
                {cropName(crop, lang)}
                {crop.isHighDemand && (
                  <span className="ml-2 inline-block bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                    HOT
                  </span>
                )}
              </span>
              <span className="text-[10px] text-muted-foreground capitalize">
                {crop.category.replace("_", " ")} • {crop.season}
              </span>
            </div>
            {crop.perishable && (
              <span className="ml-auto text-[10px] text-muted-foreground">
                {crop.spoilage_hours}h
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      {crops.length > 8 && (
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder={lang === "en" ? "Search crops..." : "पिके शोधा..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          {/* Category Chips */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "px-3 py-1 text-xs rounded-full border transition-colors",
                !selectedCategory
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted",
              )}
            >
              {lang === "en" ? "All" : "सर्व"}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3 py-1 text-xs rounded-full border transition-colors capitalize",
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted",
                )}
              >
                {cat.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      )}

      {isSearching ? (
        filteredCrops.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            {lang === "en" ? "No crops found." : "कोणतेही पीक आढळले नाही."}
          </div>
        ) : (
          renderCropList(filteredCrops)
        )
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {lang === "en" ? "Featured for this Season" : "आजचे / हंगामातील प्रमुख पीक"}
              </h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {lang === "en" ? "Seasonal guidance (Demo)" : "हंगामी मार्गदर्शन (डेमो)"}
              </p>
            </div>
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${Math.min(featuredCrops.length, 4)}, 1fr)` }}
              role="radiogroup"
              aria-label="Featured crops"
            >
              {featuredCrops.map(renderCropTile)}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">
              {lang === "en" ? "All Crops" : "सर्व पिके"}
            </h3>
            {renderCropList(allOtherCrops)}
          </div>
        </div>
      )}
    </div>
  );
}
