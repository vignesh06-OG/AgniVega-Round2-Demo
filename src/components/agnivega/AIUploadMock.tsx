import { useState } from "react";
import { Camera, Image as ImageIcon, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface AIResult {
  visualGrade: string;
  moistureEstimate: string;
  foreignMaterial: string;
  confidence: number;
}

interface AIUploadMockProps {
  onComplete: (result: AIResult) => void;
  lang: "en" | "mr";
}

const DICT = {
  en: {
    uploadTitle: "Upload Crop Sample",
    uploadDesc: "AI will analyze the visible quality. (Not a substitute for lab tests)",
    takePhoto: "Take Photo",
    uploadFile: "Upload File",
    analyzing: "AI Analyzing Image...",
    success: "Analysis Complete",
    gradeLabel: "Visual Grade",
    moistureLabel: "Moisture Est.",
    confidence: "Confidence",
  },
  mr: {
    uploadTitle: "पिकाचा फोटो अपलोड करा",
    uploadDesc: "AI दृश्यमान गुणवत्तेचे विश्लेषण करेल.",
    takePhoto: "फोटो काढा",
    uploadFile: "फाईल अपलोड करा",
    analyzing: "AI विश्लेषण करत आहे...",
    success: "विश्लेषण पूर्ण झाले",
    gradeLabel: "दृश्यमान गुणवत्ता",
    moistureLabel: "अंदाजित ओलावा",
    confidence: "खात्री",
  }
};

export function AIUploadMock({ onComplete, lang }: AIUploadMockProps) {
  const t = DICT[lang] || DICT.en;
  
  const [state, setState] = useState<"idle" | "analyzing" | "done">("idle");
  const [result, setResult] = useState<AIResult | null>(null);

  const simulateUpload = () => {
    setState("analyzing");
    
    // Simulate network + AI processing time
    setTimeout(() => {
      const mockResult: AIResult = {
        visualGrade: "Good",
        moistureEstimate: "Medium",
        foreignMaterial: "Low",
        confidence: 87,
      };
      setResult(mockResult);
      setState("done");
      onComplete(mockResult);
    }, 2500);
  };

  return (
    <Card className="border-dashed border-2">
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
                <Input id="camera-upload" type="file" accept="image/*" capture="environment" className="hidden" onChange={simulateUpload} />
                <Label htmlFor="camera-upload" className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                  <Camera className="mr-2 h-4 w-4" /> {t.takePhoto}
                </Label>
              </div>
              <div className="relative">
                <Input id="file-upload" type="file" accept="image/*" className="hidden" onChange={simulateUpload} />
                <Label htmlFor="file-upload" className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                  <ImageIcon className="mr-2 h-4 w-4" /> {t.uploadFile}
                </Label>
              </div>
            </div>
          </div>
        )}

        {state === "analyzing" && (
          <div className="text-center py-6 space-y-4 animate-in fade-in">
            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
            <p className="font-medium text-primary">{t.analyzing}</p>
          </div>
        )}

        {state === "done" && result && (
          <div className="space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-green-700 font-semibold justify-center">
              <CheckCircle2 className="h-5 w-5" />
              {t.success}
            </div>
            
            <div className="bg-muted p-4 rounded-lg text-sm grid grid-cols-2 gap-y-3">
              <div className="text-muted-foreground">{t.gradeLabel}</div>
              <div className="font-medium text-right">{result.visualGrade}</div>
              
              <div className="text-muted-foreground">{t.moistureLabel}</div>
              <div className="font-medium text-right">{result.moistureEstimate}</div>
              
              <div className="text-muted-foreground">{t.confidence}</div>
              <div className="font-medium text-right">{result.confidence}%</div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
              <AlertTriangle className="h-3 w-3" />
              AI Quality Estimate — Demo Model
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
