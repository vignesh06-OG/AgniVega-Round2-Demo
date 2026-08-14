import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface QualityData {
  moisture: string;
  grade: string;
  damage: string;
}

interface QualityFormProps {
  value: QualityData;
  onChange: (val: QualityData) => void;
  lang: "en" | "mr";
}

const DICT = {
  en: {
    moistureTitle: "Moisture Level",
    moistureDesc: "How dry is the produce?",
    gradeTitle: "Overall Quality Grade",
    damageTitle: "Visible Damage / Dirt",
    low: "Low",
    medium: "Medium",
    high: "High",
    premium: "Premium",
    good: "Good",
    average: "Average",
    poor: "Poor",
    none: "None",
  },
  mr: {
    moistureTitle: "ओलावा पातळी (Moisture)",
    moistureDesc: "माल किती कोरडा आहे?",
    gradeTitle: "एकूण गुणवत्ता (Quality)",
    damageTitle: "दृश्यमान नुकसान / घाण (Damage/Dirt)",
    low: "कमी",
    medium: "मध्यम",
    high: "जास्त",
    premium: "उत्कृष्ट",
    good: "चांगली",
    average: "सामान्य",
    poor: "खराब",
    none: "नाही",
  }
};

export function QualityForm({ value, onChange, lang }: QualityFormProps) {
  const t = DICT[lang] || DICT.en;

  const update = (key: keyof QualityData, val: string) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-base font-semibold">{t.moistureTitle}</Label>
        <p className="text-xs text-muted-foreground -mt-2">{t.moistureDesc}</p>
        <RadioGroup
          value={value.moisture}
          onValueChange={(v) => update("moisture", v)}
          className="flex gap-4"
        >
          {["low", "medium", "high"].map((level) => (
            <div key={level} className="flex items-center space-x-2">
              <RadioGroupItem value={level} id={`moisture-${level}`} />
              <Label htmlFor={`moisture-${level}`} className="capitalize">
                {t[level as keyof typeof t]}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-3 pt-4 border-t">
        <Label className="text-base font-semibold">{t.gradeTitle}</Label>
        <RadioGroup
          value={value.grade}
          onValueChange={(v) => update("grade", v)}
          className="grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {["premium", "good", "average", "poor"].map((level) => (
            <div key={level} className="flex items-center space-x-2">
              <RadioGroupItem value={level} id={`grade-${level}`} />
              <Label htmlFor={`grade-${level}`} className="capitalize">
                {t[level as keyof typeof t]}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-3 pt-4 border-t">
        <Label className="text-base font-semibold">{t.damageTitle}</Label>
        <RadioGroup
          value={value.damage}
          onValueChange={(v) => update("damage", v)}
          className="flex gap-4"
        >
          {["none", "low", "medium", "high"].map((level) => (
            <div key={level} className="flex items-center space-x-2">
              <RadioGroupItem value={level} id={`damage-${level}`} />
              <Label htmlFor={`damage-${level}`} className="capitalize">
                {t[level as keyof typeof t]}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
