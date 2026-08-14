import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Square, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MicRecorder, transcribe } from "@/lib/voice/recorder";
import { speechLocale, type Lang } from "@/lib/krishi/i18n";
import { saveTranscript } from "@/lib/voice/transcripts";
import { TranscriptLog } from "./TranscriptLog";

interface VoiceInputProps {
  lang: Lang;
  onTranscript: (text: string) => void | Promise<void>;
  label: string;
  listeningLabel: string;
  /** Show saved captions from this session under the mic button. */
  showCaptions?: boolean;
}

/**
 * Record-and-understand mic button. Uses MediaRecorder + server-side AI
 * transcription, which works in every browser (the Web Speech API is missing
 * in Brave, Firefox and most Android webviews).
 */
export function VoiceInput({
  lang,
  onTranscript,
  label,
  listeningLabel,
  showCaptions = true,
}: VoiceInputProps) {
  const [supported, setSupported] = useState(true);
  const [state, setState] = useState<"idle" | "recording" | "working">("idle");
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MicRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSupported(MicRecorder.supported());
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.cancel();
    };
  }, []);

  async function start() {
    setError(null);
    const recorder = new MicRecorder();
    try {
      await recorder.start();
    } catch {
      setError("Microphone permission is needed for voice entry.");
      return;
    }
    recorderRef.current = recorder;
    setSeconds(0);
    setState("recording");
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  async function stop() {
    if (timerRef.current) clearInterval(timerRef.current);
    const recorder = recorderRef.current;
    if (!recorder) return;
    setState("working");
    try {
      const recording = await recorder.stop();
      recorderRef.current = null;
      if (recording.blob.size < 1200) {
        setError("That recording was empty — please try again.");
        setState("idle");
        return;
      }
      const text = await transcribe(recording, lang.slice(0, 2));
      if (!text.trim()) {
        setError("Could not hear anything. Please speak again.");
        setState("idle");
        return;
      }
      saveTranscript({ text: text.trim(), reply: null, lang, seconds: recording.seconds });
      await onTranscript(text.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Voice input failed");
    } finally {
      setState("idle");
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={() => (state === "recording" ? void stop() : void start())}
        disabled={!supported || state === "working"}
        variant={state === "recording" ? "destructive" : "outline"}
        className="field-tap w-full gap-2"
      >
        {state === "working" ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : state === "recording" ? (
          <Square className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
        {state === "working"
          ? "Understanding…"
          : state === "recording"
            ? `${listeningLabel} ${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")} — tap to stop`
            : label}
      </Button>
      {!supported && (
        <p className="text-xs text-muted-foreground">
          Voice entry needs a microphone-capable browser. Use the fields below instead.
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {showCaptions && <TranscriptLog lang={lang} />}
    </div>
  );
}

/** Speak a sentence back to the farmer in their language. */
export function speak(text: string, lang: Lang) {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
  const locale = speechLocale(lang);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale;
  const voices = window.speechSynthesis.getVoices();
  const match =
    voices.find((v) => v.lang.replace("_", "-") === locale) ??
    voices.find((v) => v.lang.startsWith(locale.slice(0, 2)));
  if (match) utterance.voice = match;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

/** Small replay button for the last assistant sentence. */
export function TalkBack({ text, lang }: { text: string; lang: Lang }) {
  if (!text) return null;
  return (
    <button
      type="button"
      onClick={() => speak(text, lang)}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-xs text-muted-foreground hover:bg-accent/20"
    >
      <Volume2 className="h-3.5 w-3.5" /> {text}
    </button>
  );
}
