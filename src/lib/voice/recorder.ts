/**
 * Browser-side microphone capture for the voice-first flow.
 *
 * Audio is captured as raw PCM through the Web Audio API and encoded to a
 * complete 16 kHz mono WAV file. MediaRecorder output is unreliable across
 * browsers (Safari emits fragmented MP4, timesliced chunks lose their
 * container header), and every transcription model accepts WAV.
 */
export interface Recording {
  blob: Blob;
  mimeType: string;
  seconds: number;
}

const TARGET_RATE = 16000;

function downsample(input: Float32Array, from: number, to: number): Float32Array {
  if (to >= from) return input;
  const ratio = from / to;
  const out = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < out.length; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), input.length);
    let sum = 0;
    for (let j = start; j < end; j += 1) sum += input[j] ?? 0;
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
}

export function encodeWav(chunks: Float32Array[], sampleRate: number): Blob {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  const samples = downsample(merged, sampleRate, TARGET_RATE);
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeText = (pos: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(pos + i, text.charCodeAt(i));
  };
  writeText(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, TARGET_RATE, true);
  view.setUint32(28, TARGET_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let pos = 44;
  for (const sample of samples) {
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(pos, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    pos += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

export class MicRecorder {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private node: ScriptProcessorNode | null = null;
  private chunks: Float32Array[] = [];
  private startedAt = 0;

  static supported(): boolean {
    return (
      typeof window !== "undefined" &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof (window.AudioContext ?? (window as any).webkitAudioContext) !== "undefined"
    );
  }

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
    });
    const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
    this.ctx = new Ctor();
    if (this.ctx!.state === "suspended") await this.ctx!.resume();
    this.chunks = [];
    this.source = this.ctx!.createMediaStreamSource(this.stream);
    this.node = this.ctx!.createScriptProcessor(4096, 1, 1);
    this.node.onaudioprocess = (event) => {
      this.chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
    };
    this.source.connect(this.node);
    this.node.connect(this.ctx!.destination);
    this.startedAt = Date.now();
  }

  async stop(): Promise<Recording> {
    const ctx = this.ctx;
    if (!ctx) throw new Error("Recorder was not started");
    const sampleRate = ctx.sampleRate;
    const chunks = this.chunks;
    this.teardown();
    const blob = encodeWav(chunks, sampleRate);
    return { blob, mimeType: "audio/wav", seconds: (Date.now() - this.startedAt) / 1000 };
  }

  cancel(): void {
    this.teardown();
  }

  private teardown(): void {
    try {
      this.node?.disconnect();
      this.source?.disconnect();
    } catch {
      /* already disconnected */
    }
    this.stream?.getTracks().forEach((track) => track.stop());
    void this.ctx?.close().catch(() => undefined);
    this.node = null;
    this.source = null;
    this.stream = null;
    this.ctx = null;
    this.chunks = [];
  }
}

export async function transcribe(recording: Recording, language: string): Promise<string> {
  const form = new FormData();
  form.append("audio", recording.blob, "recording.wav");
  form.append("language", language);
  const res = await fetch("/api/public/transcribe", { method: "POST", body: form });
  const json = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
  if (!res.ok) throw new Error(json.error ?? "Could not understand the recording");
  return json.text ?? "";
}
