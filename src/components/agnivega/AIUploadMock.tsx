import { useState } from "react";
import { Camera, Image as ImageIcon, Loader2, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Crop } from "@/lib/krishi/types";

export interface QualityData {
  visualGrade: string;
  moistureEstimate: string;
  [key: string]: string; // For dynamic fields
}

interface AIUploadMockProps {
  onComplete: (result: QualityData) => void;
  lang: "en" | "mr";
  crop: Crop;
}

const DICT = {
  en: {
    uploadTitle: "Upload Crop Sample",
    uploadDesc: "Visual proof of quality",
    takePhoto: "Take Photo",
    uploadFile: "Upload File",
    analyzing: "Processing Image...",
    success: "Image Uploaded",
    aiUnavailable: "AI Analysis requires OPENAI_VISION_API_KEY. Fallback to manual entry.",
    manualEntry: "Please declare the quality manually:",
    save: "Save Quality Data",
  },
  mr: {
    uploadTitle: "पिकाचा फोटो अपलोड करा",
    uploadDesc: "गुणवत्तेचा दृश्य पुरावा",
    takePhoto: "फोटो काढा",
    uploadFile: "फाईल अपलोड करा",
    analyzing: "फोटो प्रोसेस होत आहे...",
    success: "फोटो अपलोड झाला",
    aiUnavailable: "AI विश्लेषणासाठी OPENAI_VISION_API_KEY आवश्यक आहे. कृपया स्वतः माहिती भरा.",
    manualEntry: "कृपया गुणवत्ता स्वतः घोषित करा:",
    save: "माहिती जतन करा",
  }
};

export function AIUploadMock({ onComplete, lang, crop }: AIUploadMockProps) {
  const t = DICT[lang] || DICT.en;
  
  const [state, setState] = useState<"idle" | "processing" | "uploaded">("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [qualityData, setQualityData] = useState<QualityData>({ visualGrade: "Good", moistureEstimate: "Medium" });

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setState("processing");
      const url = URL.createObjectURL(file);
      
      // Simulate slight delay for processing
      setTimeout(() => {
        setPreviewUrl(url);
        setState("uploaded");
      }, 1000);
    }
  };

  const handleSave = () => {
    onComplete(qualityData);
  };

  const handleFieldChange = (field: string, value: string) => {
    setQualityData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="border-2 border-primary/20 shadow-sm">
      <CardContent className="p-6">
        {state === "idle" && (
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{t.uploadTitle}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.uploadDesc}</p>
            </div>
            <div className="flex justify-center gap-3">
              <div className="relative">
                <Input id="camera-upload" type="file" accept="image/*" capture="environment" className="hidden" onChange={handleUpload} />
                <Label htmlFor="camera-upload" className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                  <Camera className="mr-2 h-4 w-4" /> {t.takePhoto}
                </Label>
              </div>
              <div className="relative">
                <Input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                <Label htmlFor="file-upload" className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                  <ImageIcon className="mr-2 h-4 w-4" /> {t.uploadFile}
                </Label>
              </div>
            </div>
          </div>
        )}

        {state === "processing" && (
          <div className="text-center py-6 space-y-4 animate-in fade-in">
            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
            <p className="font-medium text-primary">{t.analyzing}</p>
          </div>
        )}

        {state === "uploaded" && (
          <div className="space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-4">
              {previewUrl && (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 border-primary/20">
                  <img src={previewUrl} alt="Crop sample" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/10" />
                </div>
              )}
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2 text-green-700 font-semibold">
                  <CheckCircle2 className="h-5 w-5" />
                  {t.success}
                </div>
                <button onClick={() => setState("idle")} className="text-sm text-primary hover:underline text-left mt-1">
                  {lang === "en" ? "Retake Photo" : "पुन्हा फोटो काढा"}
                </button>
              </div>
            </div>

            <div className="bg-amber-50 text-amber-800 p-3 rounded-md text-xs flex gap-2 items-start border border-amber-200">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{t.aiUnavailable}</p>
            </div>

            <div className="pt-2">
              <p className="font-semibold text-sm mb-3">{t.manualEntry}</p>
              <div className="space-y-3">
                {crop.qualityParams?.map(param => (
                  <div key={param} className="space-y-1">
                    <Label className="capitalize text-xs text-muted-foreground">{param.replace("_", " ")}</Label>
                    <select 
                      className="w-full text-sm border-b pb-1 focus:outline-none focus:border-primary capitalize bg-transparent"
                      value={qualityData[param] || "medium"}
                      onChange={e => handleFieldChange(param, e.target.value)}
                    >
                      <option value="high">High / उत्तम</option>
                      <option value="medium">Medium / मध्यम</option>
                      <option value="low">Low / कमी</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
            
            <Button onClick={handleSave} className="w-full mt-4">
              {t.save}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
