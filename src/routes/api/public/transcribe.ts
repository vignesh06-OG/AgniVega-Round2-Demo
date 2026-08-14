import { createFileRoute } from "@tanstack/react-router";

const MAX_BYTES = 8 * 1024 * 1024;

const EXT: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "mp4",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
};

/**
 * Speech-to-text for the voice-first farmer flow. Browsers without the Web
 * Speech API (Brave, Firefox, most Android webviews) record audio and post it
 * here instead, so voice entry works everywhere.
 */
export const Route = createFileRoute("/api/public/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["AI_GATEWAY_KEY"] || process.env["OPENAI_API_KEY"];
        if (!key) return Response.json({ error: "Voice service unavailable" }, { status: 503 });

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return Response.json({ error: "Expected an audio upload" }, { status: 400 });
        }
        const audio = form.get("audio");
        const language = String(form.get("language") ?? "").slice(0, 5);
        if (!(audio instanceof File) || audio.size === 0) {
          return Response.json({ error: "No audio received" }, { status: 400 });
        }
        if (audio.size > MAX_BYTES) {
          return Response.json({ error: "Recording is too long" }, { status: 413 });
        }

        const type = (audio.type || "audio/webm").split(";")[0]!;
        const upstream = new FormData();
        upstream.append("model", "whisper-1");
        upstream.append("file", audio, `recording.${EXT[type] ?? "webm"}`);
        if (/^[a-z]{2}$/.test(language)) upstream.append("language", language);

        const endpoint =
          process.env["AI_TRANSCRIBE_URL"] || "https://api.openai.com/v1/audio/transcriptions";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: upstream,
        });

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          return Response.json(
            { error: "Transcription failed", detail: detail.slice(0, 400) },
            { status: res.status },
          );
        }
        const json = (await res.json()) as { text?: string };
        return Response.json({ text: json.text ?? "" });
      },
    },
  },
});
