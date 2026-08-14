import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  transcript: z.string().min(1).max(600),
  lang: z.string().min(2).max(5),
  languageName: z.string().min(2).max(40),
  crops: z.array(z.object({ slug: z.string(), label: z.string() })).max(80),
  villages: z.array(z.string()).max(200),
});

export interface VoiceIntent {
  cropSlug: string | null;
  quantity: number | null;
  unit: "kg" | "quintal" | "crate" | "ton" | null;
  village: string | null;
  emergency: boolean;
  reply: string;
}

/**
 * Turns free-form speech in any Indian language into calculator fields and a
 * spoken reply in the same language. Falls back to a deterministic parse when
 * the model is unavailable so the mic never dead-ends.
 */
export const interpretVoice = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }): Promise<VoiceIntent> => {
    const fallback = localParse(data.transcript, data.crops, data.villages);
    const key =
      process.env["AI_GATEWAY_KEY"] ||
      process.env["OPENAI_API_KEY"] ||
      process.env["GEMINI_API_KEY"];
    if (!key) return fallback;

    const system = [
      "You are the voice assistant of Smart Krishi-Yatra AI, an Indian agri-logistics app.",
      "Extract the harvest details a farmer just spoke.",
      `Allowed crop slugs: ${data.crops.map((c) => `${c.slug} (${c.label})`).join(", ")}.`,
      `Known villages: ${data.villages.slice(0, 120).join(", ")}.`,
      `Reply in ${data.languageName}, one short friendly sentence confirming what you understood.`,
      'Answer ONLY as JSON: {"cropSlug":string|null,"quantity":number|null,"unit":"kg"|"quintal"|"crate"|"ton"|null,"village":string|null,"emergency":boolean,"reply":string}',
    ].join(" ");

    try {
      const endpoint =
        process.env["AI_GATEWAY_URL"] || "https://api.openai.com/v1/chat/completions";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: system },
            { role: "user", content: data.transcript },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) return fallback;
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const content = json.choices?.[0]?.message?.content ?? "";
      const parsed = JSON.parse(content) as Partial<VoiceIntent>;
      return {
        cropSlug:
          parsed.cropSlug && data.crops.some((c) => c.slug === parsed.cropSlug)
            ? parsed.cropSlug
            : fallback.cropSlug,
        quantity: typeof parsed.quantity === "number" ? parsed.quantity : fallback.quantity,
        unit: parsed.unit ?? fallback.unit,
        village: parsed.village ?? fallback.village,
        emergency: Boolean(parsed.emergency),
        reply: parsed.reply?.slice(0, 240) || fallback.reply,
      };
    } catch {
      return fallback;
    }
  });

function localParse(
  transcript: string,
  crops: { slug: string; label: string }[],
  villages: string[],
): VoiceIntent {
  const text = transcript.toLowerCase();
  const digits = text.match(/\d+(\.\d+)?/);
  const crop = crops.find((c) => text.includes(c.slug) || text.includes(c.label.toLowerCase()));
  const village = villages.find((v) => text.includes(v.toLowerCase()));
  const unit: VoiceIntent["unit"] = /quintal|क्विंटल|क्विंटल/.test(text)
    ? "quintal"
    : /ton|टन/.test(text)
      ? "ton"
      : /crate|कॅरेट|क्रेट/.test(text)
        ? "crate"
        : /kg|किलो/.test(text)
          ? "kg"
          : null;
  return {
    cropSlug: crop?.slug ?? null,
    quantity: digits ? Number(digits[0]) : null,
    unit,
    village: village ?? null,
    emergency: /urgent|emergency|तातडी|जरूरी/.test(text),
    reply: `Heard: ${transcript}`,
  };
}
