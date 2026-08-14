import { useState, useCallback, useRef, useEffect } from "react";
import { Mic, MicOff, Volume2, VolumeX, Phone, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LANGUAGES, type Lang } from "@/lib/krishi/i18n";
import { DEMO_IVR_SCRIPT } from "@/lib/krishi/canonical-demo";

interface ParsedIntent {
  crop?: string;
  weightKg?: number;
  village?: string;
}

interface Props {
  lang: Lang;
  onIntentParsed: (intent: ParsedIntent) => void;
  resultNarration?: string | undefined;
}

type Phase = "idle" | "listening" | "processing" | "responding" | "done" | "error";

function langSpeechCode(lang: Lang): string {
  return LANGUAGES.find((l) => l.code === lang)?.speech ?? "en-US";
}

const BASE_PROMPTS = {
  mr: {
    start: "बोलायला सुरुवात करा",
    listening: "ऐकत आहे…",
    error: "माफ करा, ऐकू आले नाही",
    caveat: "प्रोटोटाइप",
  },
  hi: {
    start: "बोलना शुरू करें",
    listening: "सुन रहे हैं…",
    error: "माफ़ करें, सुना नहीं गया",
    caveat: "प्रोटोटाइप",
  },
  en: {
    start: "Start speaking",
    listening: "Listening…",
    error: "Sorry, could not hear you",
    caveat: "Prototype",
  },
  es: {
    start: "Empieza a hablar",
    listening: "Escuchando…",
    error: "No pude escuchar",
    caveat: "Prototipo",
  },
  fr: {
    start: "Commencer à parler",
    listening: "Écoute…",
    error: "Je n'ai pas entendu",
    caveat: "Prototype",
  },
  zh: { start: "开始说话", listening: "正在听…", error: "对不起，没听清", caveat: "原型" },
  ar: { start: "ابدأ التحدث", listening: "استماع…", error: "عذرا، لم أسمعك", caveat: "نموذج" },
} as const;

function getPrompts(lang: Lang) {
  const key = lang as string;
  const map = BASE_PROMPTS as any;
  return map[key] ?? BASE_PROMPTS["en"];
}

/** Local heuristic parser supporting global languages without API keys */
function parseBasicIntent(text: string): ParsedIntent {
  const normalized = text.toLowerCase();
  const intent: ParsedIntent = {};

  // Onion multi-lingual
  if (normalized.match(/(कांद|onion|प्याज|cebolla|oignon|洋葱|بصل)/i)) {
    intent.crop = "onion";
  }
  // Grapes multi-lingual
  else if (normalized.match(/(द्राक्ष|grapes|अंगूर|uvas|raisins|葡萄|عنب)/i)) {
    intent.crop = "grapes";
  }
  // Tomato multi-lingual
  else if (normalized.match(/(टमाटर|tomato|tomate|番茄|西红柿|طماطم)/i)) {
    intent.crop = "tomato";
  }

  // Weight parsing across languages
  // e.g. 10 quintal, 500 kg, 500 kilos, 500公斤
  const quintalMatch = normalized.match(/(\d+)\s*(क्विंटल|quintal|quintales)/i);
  const kgMatch = normalized.match(/(\d+)\s*(kg|किलो|kilos|公斤|كجم)/i);
  if (quintalMatch) intent.weightKg = parseInt(quintalMatch[1]!) * 100;
  else if (kgMatch) intent.weightKg = parseInt(kgMatch[1]!);

  // Village fallback
  const villages = [
    "पोहेगाव",
    "pohegaon",
    "कोपरगाव",
    "kopargaon",
    "लोणी",
    "loni",
    "madrid",
    "paris",
    "beijing",
    "dubai",
  ];
  for (const v of villages) {
    if (normalized.includes(v.toLowerCase())) {
      intent.village = v;
      break;
    }
  }

  return intent;
}

export function VoiceIVRPrototype({ lang, onIntentParsed, resultNarration }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [muted, setMuted] = useState(false);
  const [conversationLog, setConversationLog] = useState<
    Array<{ turn: "system" | "farmer"; text: string }>
  >([]);
  const recognitionRef = useRef<any>(null);
  const prompts = getPrompts(lang);
  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const currentStep = useRef(0);

  // Multi-voice support
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        const available = window.speechSynthesis.getVoices();
        setVoices(available);
        // Try to pick a voice matching the language
        const defaultForLang = available.find((v) => v.lang.startsWith(langSpeechCode(lang)));
        if (defaultForLang) setSelectedVoice(defaultForLang.name);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [lang]);

  const speak = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      const code = langSpeechCode(lang);
      utter.lang = code;

      if (selectedVoice) {
        const voice = voices.find((v) => v.name === selectedVoice);
        if (voice) utter.voice = voice;
      }

      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    },
    [lang, selectedVoice, voices],
  );

  // Run demo script step by step when explicitly requested
  const advanceScript = useCallback(() => {
    const step = DEMO_IVR_SCRIPT.steps[currentStep.current];
    if (!step) return;

    if (step.turn === "system") {
      setConversationLog((prev) => [...prev, { turn: "system", text: step.text }]);
      if (!muted) speak(step.text);
      currentStep.current += 1;

      // End of static script implies AI takes over or we listen
      if (DEMO_IVR_SCRIPT.steps[currentStep.current]?.turn === "farmer") {
        setTimeout(() => setPhase("listening"), 1500);
      }
    }
  }, [lang, muted, speak]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setPhase("error");
      return;
    }
    setPhase("listening");
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setPhase("error");
      return;
    }

    // Check if we need to start conversation from scratch
    if (conversationLog.length === 0) {
      // Initiate greeting
      const greeting =
        lang === "en"
          ? "Hello! What crop are you selling today?"
          : lang === "hi"
            ? "नमस्ते! आज आप कौन सी फसल बेच रहे हैं?"
            : lang === "mr"
              ? "नमस्कार! आज आपण कोणते पीक विकत आहात?"
              : "Hello! Please speak your crop and weight.";

      setConversationLog([{ turn: "system", text: greeting }]);
      if (!muted) speak(greeting);
      // Wait a sec before actually listening
      setTimeout(() => {
        startNativeRecognition(SpeechRecognitionCtor);
      }, 2000);
      return;
    }

    startNativeRecognition(SpeechRecognitionCtor);
  }, [isSupported, lang, conversationLog.length, muted, speak]);

  const startNativeRecognition = (SpeechRecognitionCtor: any) => {
    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition as any;
    recognition.lang = langSpeechCode(lang);
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const text = event.results[0]?.[0]?.transcript ?? "";
      setTranscript(text);
      setConversationLog((prev) => [...prev, { turn: "farmer", text }]);
      setPhase("processing");

      const intent = parseBasicIntent(text);
      onIntentParsed(intent);

      // Simple AI deterministic response generator based on parsed intent
      setTimeout(() => {
        let aiResponse = "";
        if (intent.crop && intent.weightKg) {
          aiResponse = `Got it. ${intent.weightKg}kg of ${intent.crop}. Calculating your net realization now.`;
        } else if (intent.crop) {
          aiResponse = `Okay, ${intent.crop}. How much weight do you have?`;
        } else {
          aiResponse = `I didn't quite catch the crop. Could you repeat?`;
        }

        setConversationLog((prev) => [...prev, { turn: "system", text: aiResponse }]);
        if (!muted) speak(aiResponse);
        setPhase("idle");
      }, 800);
    };

    recognition.onerror = () => setPhase("error");
    recognition.onend = () => {
      if (phase === "listening") setPhase("idle");
    };

    recognition.start();
  };

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setPhase("idle");
  }, []);

  // Narrate result when provided
  useEffect(() => {
    if (resultNarration && !muted) {
      speak(resultNarration);
      setConversationLog((prev) => [...prev, { turn: "system", text: resultNarration }]);
    }
  }, [resultNarration, lang, muted, speak]);

  return (
    <Card className="border-primary/20" id="voice-ivr-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4 text-primary" />
            Voice / IVR Prototype
          </CardTitle>
          <div className="flex gap-2 items-center">
            <select
              className="text-xs p-1 border rounded hidden md:block"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
            >
              <option value="">Default Voice</option>
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            <Badge
              variant="outline"
              className="text-[10px] text-green-700 border-green-300 bg-green-50"
            >
              FREE TIER
            </Badge>
            <Button
              id="ivr-mute-btn"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setMuted((m) => !m)}
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
          <Info className="h-3 w-3" />
          Powered by browser-native Web Speech API. No external API keys required.
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Conversation log */}
        <div
          className="h-40 overflow-y-auto rounded-lg border bg-background/60 p-3 space-y-2"
          aria-live="polite"
        >
          {conversationLog.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              Click the microphone to start talking…
            </p>
          )}
          {conversationLog.map((entry, i) => (
            <div
              key={i}
              className={cn("flex", entry.turn === "farmer" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-1.5 text-sm",
                  entry.turn === "farmer"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {entry.turn === "system" && (
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <span className="text-[10px] font-bold text-primary block mb-0.5">
                        🤖 SYSTEM
                      </span>
                      <p className="text-sm font-medium leading-relaxed">{entry.text}</p>
                    </div>
                  </div>
                )}
                {entry.turn === "farmer" && entry.text}
              </div>
            </div>
          ))}
        </div>

        {/* Mic button */}
        {!isSupported ? (
          <p className="text-sm text-destructive text-center">
            Voice recognition not supported in this browser. Try Chrome.
          </p>
        ) : (
          <div className="flex gap-2">
            <Button
              id="ivr-mic-btn"
              className={cn(
                "field-tap flex-1",
                phase === "listening" && "bg-red-600 hover:bg-red-700",
              )}
              onClick={phase === "listening" ? stopListening : startListening}
              disabled={phase === "processing" || phase === "responding"}
            >
              {phase === "listening" ? (
                <>
                  <MicOff className="h-5 w-5 mr-2" /> {prompts.listening}
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5 mr-2" /> {prompts.start}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Last transcript */}
        {transcript && (
          <p className="text-xs text-muted-foreground">
            Heard: <span className="italic">"{transcript}"</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
