import { conflictLog, shiftLog, type ConflictRow, type ShiftLogRow } from "./simulation";

const HEADERS: Array<[keyof ShiftLogRow, string]> = [
  ["jobId", "Job ID"],
  ["village", "Village"],
  ["crop", "Crop"],
  ["weightKg", "Weight (kg)"],
  ["status", "Status"],
  ["emergency", "Emergency"],
  ["requiredSkills", "Required skills"],
  ["driver", "Driver"],
  ["vehicle", "Vehicle"],
  ["distanceKm", "Distance (km)"],
  ["etaMinutes", "ETA (min)"],
  ["deferredHours", "Look-ahead wait (h)"],
  ["decision", "Decision"],
  ["rejections", "Rule rejections"],
];

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function shiftLogCsv(rows: ShiftLogRow[] = shiftLog()): string {
  const head = HEADERS.map(([, label]) => csvCell(label)).join(",");
  const body = rows.map((row) => HEADERS.map(([key]) => csvCell(row[key])).join(","));
  return [head, ...body].join("\n");
}

function stamp(): string {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
}

/** Download the shift assignment log as a CSV file. */
export function downloadShiftCsv(rows: ShiftLogRow[] = shiftLog()): void {
  const blob = new Blob([shiftLogCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `agnivega-shift-log-${stamp()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(
    /[&<>]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!,
  );
}

export function shiftLogHtml(rows: ShiftLogRow[] = shiftLog()): string {
  const head = HEADERS.map(([, label]) => `<th>${escapeHtml(label)}</th>`).join("");
  const body = rows
    .map((row) => `<tr>${HEADERS.map(([key]) => `<td>${escapeHtml(row[key])}</td>`).join("")}</tr>`)
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8" />
<title>Agnivega shift assignment log</title>
<style>
  body { font-family: ui-sans-serif, system-ui, sans-serif; color: #1b2b22; padding: 24px; }
  h1 { color: #1B4332; font-size: 20px; margin: 0 0 4px; }
  p.meta { color: #5b6b62; font-size: 12px; margin: 0 0 16px; }
  table { border-collapse: collapse; width: 100%; font-size: 10px; }
  th { background: #1B4332; color: #fff; text-align: left; }
  th, td { border: 1px solid #cfdad3; padding: 4px 6px; vertical-align: top; }
  tr:nth-child(even) td { background: #f4f8f5; }
  @page { size: A4 landscape; margin: 12mm; }
</style></head><body>
<h1>Smart Krishi-Yatra AI — shift assignment log</h1>
<p class="meta">Generated ${escapeHtml(new Date().toLocaleString())} · ${rows.length} jobs</p>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
<script>window.onload = () => { window.print(); };</script>
</body></html>`;
}

/** Open a print-ready view so the admin can save the log as PDF. */
export function downloadShiftPdf(rows: ShiftLogRow[] = shiftLog()): boolean {
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(shiftLogHtml(rows));
  win.document.close();
  return true;
}

const CONFLICT_HEADERS: Array<[keyof ConflictRow, string]> = [
  ["jobId", "Job ID"],
  ["village", "Village"],
  ["crop", "Crop"],
  ["emergency", "Emergency"],
  ["requiredSkills", "Required skills"],
  ["driver", "Closest driver"],
  ["severity", "Severity"],
  ["kind", "Conflict"],
  ["blockingRule", "Blocking rule"],
  ["distanceKm", "Distance (km)"],
  ["etaMinutes", "ETA (min)"],
  ["skillMatch", "Skill match"],
  ["projectedHours", "Projected duty (h)"],
  ["detail", "Rejection detail"],
];

export function conflictCsv(rows: ConflictRow[] = conflictLog()): string {
  const head = CONFLICT_HEADERS.map(([, label]) => csvCell(label)).join(",");
  const body = rows.map((row) => CONFLICT_HEADERS.map(([key]) => csvCell(row[key])).join(","));
  return [head, ...body].join("\n");
}

/** Download a conflicts-only CSV: rejected jobs and the rule that blocked them. */
export function downloadConflictsCsv(rows: ConflictRow[] = conflictLog()): void {
  const blob = new Blob([conflictCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `agnivega-conflicts-${stamp()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function conflictHtml(rows: ConflictRow[] = conflictLog()): string {
  const head = CONFLICT_HEADERS.map(([, label]) => `<th>${escapeHtml(label)}</th>`).join("");
  const body = rows
    .map(
      (row) =>
        `<tr class="${row.severity}">${CONFLICT_HEADERS.map(([key]) => `<td>${escapeHtml(row[key])}</td>`).join("")}</tr>`,
    )
    .join("");
  const blocked = rows.filter((r) => r.severity === "blocked").length;
  return `<!doctype html><html><head><meta charset="utf-8" />
<title>Agnivega assignment conflicts</title>
<style>
  body { font-family: ui-sans-serif, system-ui, sans-serif; color: #1b2b22; padding: 24px; }
  h1 { color: #1B4332; font-size: 20px; margin: 0 0 4px; }
  p.meta { color: #5b6b62; font-size: 12px; margin: 0 0 16px; }
  table { border-collapse: collapse; width: 100%; font-size: 10px; }
  th { background: #1B4332; color: #fff; text-align: left; }
  th, td { border: 1px solid #cfdad3; padding: 4px 6px; vertical-align: top; }
  tr.blocked td { background: #fdecec; }
  tr.warning td { background: #fdf6e3; }
  @page { size: A4 landscape; margin: 12mm; }
</style></head><body>
<h1>Smart Krishi-Yatra AI — assignment conflicts</h1>
<p class="meta">Generated ${escapeHtml(new Date().toLocaleString())} · ${blocked} blocked · ${rows.length - blocked} advisory</p>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
<script>window.onload = () => { window.print(); };</script>
</body></html>`;
}

/** Open a print-ready conflicts report so the admin can save it as PDF. */
export function downloadConflictsPdf(rows: ConflictRow[] = conflictLog()): boolean {
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(conflictHtml(rows));
  win.document.close();
  return true;
}
