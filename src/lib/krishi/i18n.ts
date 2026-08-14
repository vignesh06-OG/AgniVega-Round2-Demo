export type Lang =
  | "en"
  | "hi"
  | "mr"
  | "bn"
  | "te"
  | "ta"
  | "gu"
  | "kn"
  | "ml"
  | "pa"
  | "or"
  | "as"
  | "ur"
  | "sa"
  | "ne"
  | "sd"
  | "ks"
  | "kok"
  | "mai"
  | "mni"
  | "doi"
  | "brx"
  | "sat"
  | "es"
  | "fr"
  | "de"
  | "zh"
  | "ar"
  | "ja"
  | "pt";

export interface LanguageMeta {
  code: Lang;
  label: string;
  english: string;
  speech: string;
}

export const LANGUAGES: LanguageMeta[] = [
  { code: "en", label: "English", english: "English", speech: "en-US" },
  { code: "mr", label: "मराठी", english: "Marathi", speech: "mr-IN" },
  { code: "hi", label: "हिन्दी", english: "Hindi", speech: "hi-IN" },
  { code: "bn", label: "বাংলা", english: "Bengali", speech: "bn-IN" },
  { code: "te", label: "తెలుగు", english: "Telugu", speech: "te-IN" },
  { code: "ta", label: "தமிழ்", english: "Tamil", speech: "ta-IN" },
  { code: "gu", label: "ગુજરાતી", english: "Gujarati", speech: "gu-IN" },
  { code: "kn", label: "ಕನ್ನಡ", english: "Kannada", speech: "kn-IN" },
  { code: "ml", label: "മലയാളം", english: "Malayalam", speech: "ml-IN" },
  { code: "pa", label: "ਪੰਜਾਬੀ", english: "Punjabi", speech: "pa-IN" },
  { code: "or", label: "ଓଡ଼ିଆ", english: "Odia", speech: "or-IN" },
  { code: "as", label: "অসমীয়া", english: "Assamese", speech: "as-IN" },
  { code: "ur", label: "اردو", english: "Urdu", speech: "ur-IN" },
  { code: "ne", label: "नेपाली", english: "Nepali", speech: "ne-NP" },
  { code: "sa", label: "संस्कृतम्", english: "Sanskrit", speech: "sa-IN" },
  { code: "sd", label: "سنڌي", english: "Sindhi", speech: "sd-IN" },
  { code: "ks", label: "کٲشُر", english: "Kashmiri", speech: "ks-IN" },
  { code: "kok", label: "कोंकणी", english: "Konkani", speech: "kok-IN" },
  { code: "mai", label: "मैथिली", english: "Maithili", speech: "mai-IN" },
  { code: "mni", label: "ꯃꯤꯇꯩꯂꯣꯟ", english: "Manipuri", speech: "mni-IN" },
  { code: "doi", label: "डोगरी", english: "Dogri", speech: "doi-IN" },
  { code: "brx", label: "बड़ो", english: "Bodo", speech: "brx-IN" },
  { code: "sat", label: "ᱥᱟᱱᱛᱟᱲᱤ", english: "Santali", speech: "sat-IN" },
  { code: "es", label: "Español", english: "Spanish", speech: "es-ES" },
  { code: "fr", label: "Français", english: "French", speech: "fr-FR" },
  { code: "de", label: "Deutsch", english: "German", speech: "de-DE" },
  { code: "zh", label: "中文", english: "Mandarin", speech: "zh-CN" },
  { code: "ar", label: "العربية", english: "Arabic", speech: "ar-SA" },
  { code: "ja", label: "日本語", english: "Japanese", speech: "ja-JP" },
  { code: "pt", label: "Português", english: "Portuguese", speech: "pt-BR" },
];

export const RTL_LANGS: Lang[] = ["ur", "sd", "ks", "ar"];

export function speechLocale(lang: Lang): string {
  return LANGUAGES.find((l) => l.code === lang)?.speech ?? "en-US";
}

export function languageName(lang: Lang): string {
  return LANGUAGES.find((l) => l.code === lang)?.english ?? "English";
}

type Entry = { en: string } & Partial<Record<Lang, string>>;

export const STRINGS: Record<string, Entry> = {
  brand: { en: "Team Agnivega", hi: "टीम अग्निवेग", mr: "टीम अग्निवेग" },
  tagline: {
    en: "Smart Krishi-Yatra AI — Agri-Logistics Operating System",
  },
  farmerPortal: {
    en: "Farmer Portal",
    hi: "किसान पोर्टल",
    mr: "शेतकरी पोर्टल",
    es: "Portal del Agricultor",
    fr: "Portail Paysan",
    zh: "农民门户",
    ar: "بوابة المزارع",
  },
  crop: {
    en: "Crop",
    hi: "फसल",
    mr: "पीक",
    es: "Cosecha",
    fr: "Culture",
    zh: "作物",
    ar: "محصول",
  },
  weight: {
    en: "Weight",
    hi: "वज़न",
    mr: "वजन",
    es: "Peso",
    fr: "Poids",
    zh: "重量",
    ar: "وزن",
  },
  village: {
    en: "Village",
    hi: "गाँव",
    mr: "गाव",
    es: "Pueblo",
    fr: "Village",
    zh: "村庄",
    ar: "قرية",
  },
  calculate: {
    en: "Calculate mandi net profit",
    hi: "मंडी शुद्ध लाभ की गणना करें",
    mr: "मंडी निव्वळ नफा मोजा",
  },
  pooled: {
    en: "Pooled transport",
    hi: "साझा ट्रक",
    mr: "सामायिक ट्रक",
    es: "Transporte Compartido",
  },
  solo: {
    en: "Individual solo truck",
    hi: "अलग ट्रक",
    mr: "स्वतंत्र ट्रक",
    es: "Camión Individual",
  },
  confirmPooled: {
    en: "Confirm & join pooled truck",
  },
  confirmSolo: {
    en: "Confirm solo truck",
  },
  netCash: {
    en: "Net cash",
    hi: "शुद्ध राशि",
    mr: "निव्वळ रक्कम",
  },
  savings: { en: "Saved", hi: "बचत", mr: "बचत" },
  speak: { en: "Speak", hi: "बोलें", mr: "बोला" },
  listening: { en: "Listening…", hi: "सुन रहे हैं…", mr: "ऐकत आहे…" },
  spoilage: { en: "Spoilage clock", hi: "खराब होने का समय", mr: "खराब होण्याची वेळ" },
  myShipments: { en: "My shipments", hi: "मेरी शिपमेंट", mr: "माझ्या पाठवण्या" },
  offlineQueued: { en: "Queued offline", hi: "ऑफ़लाइन क़तार में", mr: "ऑफलाइन रांगेत ठेवले" },
  searchLanguage: { en: "Search language…", hi: "भाषा खोजें…", mr: "भाषा शोधा…" },
};

export function t(key: keyof typeof STRINGS | string, lang: Lang): string {
  const entry = STRINGS[key];
  if (!entry) return String(key);
  return entry[lang] ?? entry.en;
}

export function cropName(
  crop: { name_en: string; name_mr: string; name_hi: string },
  lang: Lang,
): string {
  if (lang === "mr") return crop.name_mr;
  if (lang === "hi" || lang === "mai" || lang === "doi" || lang === "brx" || lang === "sa")
    return crop.name_hi;
  return crop.name_en;
}

export function spokenConfirmation(
  weightKg: number,
  crop: { name_en: string; name_mr: string; name_hi: string },
  lang: Lang,
): string {
  if (lang === "mr") return `तुमचा ${weightKg} किलो ${crop.name_mr} गणनेत जोडला आहे.`;
  if (lang === "hi") return `आपका ${weightKg} किलो ${crop.name_hi} गणना में जोड़ दिया गया है।`;
  if (lang === "es") return `Se han agregado ${weightKg} kg de ${crop.name_en} al cálculo.`;
  if (lang === "fr") return `Vos ${weightKg} kg de ${crop.name_en} ont été ajoutés au calcul.`;
  if (lang === "zh") return `您的 ${weightKg} 公斤 ${crop.name_en} 已添加到计算中。`;
  return `Your ${weightKg} kg of ${crop.name_en} has been added to the calculation.`;
}

export const LANGUAGE_REGION: Record<Lang, string> = {
  en: "Pan-India",
  hi: "North & Central",
  mr: "West",
  bn: "East",
  te: "South",
  ta: "South",
  gu: "West",
  kn: "South",
  ml: "South",
  pa: "North",
  or: "East",
  as: "North-East",
  ur: "North",
  sa: "Pan-India",
  ne: "Himalayan",
  sd: "West",
  ks: "Himalayan",
  kok: "West",
  mai: "East",
  mni: "North-East",
  doi: "Himalayan",
  brx: "North-East",
  sat: "East",
  es: "Global",
  fr: "Global",
  de: "Global",
  zh: "Global",
  ar: "Global",
  ja: "Global",
  pt: "Global",
};

export const REGIONS = [
  "Pan-India",
  "North",
  "North & Central",
  "West",
  "South",
  "East",
  "North-East",
  "Himalayan",
  "Global",
] as const;
