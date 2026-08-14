import { useState } from "react";
import { Camera, Image as ImageIcon, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
              <Button variant="outline" onClick={simulateUpload}>
                <Camera className="mr-2 h-4 w-4" /> {t.takePhoto}
              </Button>
              <Button variant="outline" onClick={simulateUpload}>
                <ImageIcon className="mr-2 h-4 w-4" /> {t.uploadFile}
              </Button>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
