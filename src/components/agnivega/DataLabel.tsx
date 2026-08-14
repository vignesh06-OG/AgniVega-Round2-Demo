/**
 * DataLabel — inline badge showing the epistemic status of a data point.
 *
 * Every data element in the product must carry one of these labels.
 * Never show SIMULATED data without labelling it.
 */
import type { DataStatus } from "@/lib/krishi/canonical-demo";

const CONFIG: Record<DataStatus, { text: string; className: string; title: string }> = {
  LIVE: {
    text: "🟢 LIVE",
    className:
      "inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-800 ring-1 ring-green-300",
    title: "Data from a live, verified external source.",
  },
  SIMULATED: {
    text: "🟡 SIMULATED",
    className:
      "inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-800 ring-1 ring-yellow-300",
    title: "Simulated demo data. Not from a live feed.",
  },
  COMPUTED: {
    text: "🔵 COMPUTED",
    className:
      "inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-800 ring-1 ring-blue-300",
    title: "Deterministically computed from the ENR formula.",
  },
  USER_INPUT: {
    text: "⚪ USER INPUT",
    className:
      "inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600 ring-1 ring-gray-300",
    title: "Provided by the farmer at runtime.",
  },
  CONSTANT: {
    text: "⚫ CONSTANT",
    className:
      "inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 ring-1 ring-slate-300",
    title: "Stable real-world constant (e.g., vehicle specs, diesel baseline).",
  },
  MODEL_PREDICTION: {
    text: "🔮 MODEL",
    className:
      "inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-800 ring-1 ring-purple-300",
    title: "Output of an AI/ML model or heuristic predictor.",
  },
};

interface Props {
  status: DataStatus;
  /** Override the display text */
  label?: string;
  className?: string;
}

export function DataLabel({ status, label, className = "" }: Props) {
  const cfg = CONFIG[status];
  return (
    <span
      className={`${cfg.className} ${className}`}
      title={cfg.title}
      aria-label={`Data status: ${status}`}
    >
      {label ?? cfg.text}
    </span>
  );
}

/**
 * Convenience: inline sentence that describes a data field's provenance.
 * Used in tooltips and detail panels.
 */
export function DataStatusNote({ status }: { status: DataStatus }) {
  return <p className="mt-0.5 text-[11px] text-muted-foreground">{CONFIG[status].title}</p>;
}
