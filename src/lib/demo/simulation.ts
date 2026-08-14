import { useSyncExternalStore } from "react";

import { DEMO_LOADS } from "@/lib/krishi/demo-data";
import {
  chooseDriver,
  evaluateCandidates,
  DEFAULT_ASSIGN_RULES,
  tagsForLoad,
  ASSIGN_PRESETS,
  DEFAULT_ALERT_THRESHOLDS,
  parsePresetFile,
  type AlertThresholds,
  type AssignRules,
  type PresetKey,
  type PresetProfile,
  type RuleDriver,
  type Candidate,
} from "./assign-rules";

/**
 * Client-side driver-shift simulator used by the admin demo control panel.
 * It never touches the database: jobs, drivers and progress live in browser
 * state so a jury walkthrough can be started, paused and wiped instantly.
 */
export type SimStatus = "QUEUED" | "ASSIGNED" | "EN_ROUTE" | "AT_PICKUP" | "TO_MANDI" | "DELIVERED";

export const SIM_FLOW: SimStatus[] = [
  "QUEUED",
  "ASSIGNED",
  "EN_ROUTE",
  "AT_PICKUP",
  "TO_MANDI",
  "DELIVERED",
];

export interface SimDriver {
  id: string;
  name: string;
  vehicle: string;
  phone: string;
  lat: number;
  lng: number;
  /** Average road speed used for ETA checks, km/h. */
  speedKmph: number;
  /** Duty hours already logged this shift. */
  hoursWorked: number;
  /** Capability tags matched against job requirements. */
  skills: string[];
}

export interface SimJob {
  id: string;
  village: string;
  cropSlug: string;
  weightKg: number;
  lat: number;
  lng: number;
  emergency: boolean;
  /** Skill tags this job requires. */
  tags: string[];
  driverId: string | null;
  /** Why the last auto-assign decision went the way it did. */
  assignNote: string | null;
  status: SimStatus;
  updatedAt: number;
}

export interface SimState {
  running: boolean;
  startedAt: number | null;
  tick: number;
  /** Seconds of simulated progress per real second. */
  speed: number;
  autoAssign: boolean;
  rules: AssignRules;
  /** Active preset, or null once rules are edited by hand. */
  preset: string | null;
  /** Presets imported from a shared CSV/JSON file. */
  customPresets: Record<string, PresetProfile>;
  /** Thresholds that decide when a conflict is flagged. */
  thresholds: AlertThresholds;
  drivers: SimDriver[];
  jobs: SimJob[];
}

const KEY = "agnivega:sim";

export const SIM_DRIVERS: SimDriver[] = [
  {
    id: "sim-d1",
    name: "Ramesh Pawar",
    vehicle: "Tata 407 · MH17 AB 1234",
    phone: "+91 90000 11111",
    lat: 19.8833,
    lng: 74.4778,
    speedKmph: 34,
    hoursWorked: 2,
    skills: ["reefer", "heavy", "priority", "unpaved"],
  },
  {
    id: "sim-d2",
    name: "Sunil Jadhav",
    vehicle: "Mahindra Bolero · MH15 CD 5678",
    phone: "+91 90000 22222",
    lat: 19.7645,
    lng: 74.4762,
    speedKmph: 38,
    hoursWorked: 4,
    skills: ["priority", "unpaved"],
  },
  {
    id: "sim-d3",
    name: "Kavita Shinde",
    vehicle: "Ashok Leyland Dost · MH17 EF 9012",
    phone: "+91 90000 33333",
    lat: 20.042,
    lng: 74.489,
    speedKmph: 30,
    hoursWorked: 1,
    skills: ["reefer", "priority"],
  },
];

function emptyState(): SimState {
  return {
    running: false,
    startedAt: null,
    tick: 0,
    speed: 1,
    autoAssign: true,
    rules: DEFAULT_ASSIGN_RULES,
    preset: null,
    customPresets: {},
    thresholds: DEFAULT_ALERT_THRESHOLDS,
    drivers: SIM_DRIVERS,
    jobs: [],
  };
}

let state: SimState = emptyState();
let hydrated = false;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<SimState>;
      state = {
        ...emptyState(),
        ...saved,
        rules: { ...DEFAULT_ASSIGN_RULES, ...(saved.rules ?? {}) },
        thresholds: { ...DEFAULT_ALERT_THRESHOLDS, ...(saved.thresholds ?? {}) },
        customPresets: saved.customPresets ?? {},
        drivers: SIM_DRIVERS,
      };
    }
  } catch {
    /* corrupt payload — start clean */
  }
  // A simulation never survives a reload as "running": restart it explicitly.
  state = { ...state, running: false };
}

function commit(next: SimState): void {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage blocked */
  }
  for (const listener of listeners) listener();
}

function persistedSnapshot(): SimState {
  hydrate();
  return state;
}

const SERVER_SNAPSHOT = emptyState();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function buildJobs(count: number): SimJob[] {
  return DEMO_LOADS.slice(0, count).map((load) => ({
    id: `sim-${load.id}`,
    village: load.village,
    cropSlug: load.cropSlug,
    weightKg: load.weightKg,
    lat: load.lat,
    lng: load.lng,
    emergency: load.emergency,
    tags: tagsForLoad(load),
    driverId: null,
    assignNote: null,
    status: "QUEUED" as SimStatus,
    updatedAt: Date.now(),
  }));
}

/** Undelivered job counts per driver. */
function activeJobCounts(jobs: SimJob[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const job of jobs) {
    if (job.driverId && job.status !== "DELIVERED") {
      counts[job.driverId] = (counts[job.driverId] ?? 0) + 1;
    }
  }
  return counts;
}

function ruleDrivers(drivers: SimDriver[], jobs: SimJob[], rules: AssignRules): RuleDriver[] {
  const counts = activeJobCounts(jobs);
  return drivers.map((d) => ({
    id: d.id,
    lat: d.lat,
    lng: d.lng,
    speedKmph: d.speedKmph,
    // Duty clock grows with the work already on the driver's plate.
    hoursWorked: d.hoursWorked + (counts[d.id] ?? 0) * rules.hoursPerJob,
    skills: d.skills,
  }));
}

/** Advance every in-flight job by one step; auto-assign queued work by rules. */
export function stepSimulation(): void {
  hydrate();
  const jobs = [...state.jobs];
  for (let i = 0; i < jobs.length; i += 1) {
    const job = jobs[i]!;
    if (job.status === "DELIVERED") continue;
    if (job.status === "QUEUED") {
      if (!state.autoAssign) continue;
      const pick = chooseDriver(
        job,
        ruleDrivers(state.drivers, jobs, state.rules),
        activeJobCounts(jobs),
        state.rules,
      );
      if (!pick) {
        const note = "No driver matches the current rules — waiting";
        if (job.assignNote !== note) jobs[i] = { ...job, assignNote: note };
        continue;
      }
      jobs[i] = {
        ...job,
        driverId: pick.driverId,
        status: "ASSIGNED",
        assignNote: assignNoteFor(pick, state.rules),
        updatedAt: Date.now(),
      };
      continue;
    }
    const next = SIM_FLOW[Math.min(SIM_FLOW.indexOf(job.status) + 1, SIM_FLOW.length - 1)]!;
    jobs[i] = { ...job, status: next, updatedAt: Date.now() };
  }
  commit({ ...state, jobs, tick: state.tick + 1 });
}

function ensureTimer(): void {
  if (typeof window === "undefined") return;
  if (timer) clearInterval(timer);
  if (!state.running) {
    timer = null;
    return;
  }
  timer = setInterval(stepSimulation, Math.max(400, 2500 / state.speed));
}

export function startSimulation(options?: { jobs?: number; speed?: number }): void {
  hydrate();
  commit({
    ...state,
    running: true,
    startedAt: Date.now(),
    tick: 0,
    speed: options?.speed ?? state.speed,
    jobs: buildJobs(options?.jobs ?? 6),
  });
  ensureTimer();
}

export function pauseSimulation(): void {
  hydrate();
  commit({ ...state, running: false });
  ensureTimer();
}

export function resumeSimulation(): void {
  hydrate();
  if (state.jobs.length === 0) {
    startSimulation();
    return;
  }
  commit({ ...state, running: true });
  ensureTimer();
}

export function setSimSpeed(speed: number): void {
  hydrate();
  commit({ ...state, speed: Math.min(8, Math.max(0.5, speed)) });
  ensureTimer();
}

export function setAutoAssign(on: boolean): void {
  hydrate();
  commit({ ...state, autoAssign: on });
}

/** Assign every queued job immediately using the configured rules. */
export function assignAllJobs(): void {
  hydrate();
  const jobs = [...state.jobs];
  for (let i = 0; i < jobs.length; i += 1) {
    const job = jobs[i]!;
    if (job.driverId || job.status === "DELIVERED") continue;
    const pick = chooseDriver(
      job,
      ruleDrivers(state.drivers, jobs, state.rules),
      activeJobCounts(jobs),
      state.rules,
    );
    jobs[i] = pick
      ? {
          ...job,
          driverId: pick.driverId,
          status: "ASSIGNED" as SimStatus,
          assignNote: assignNoteFor(pick, state.rules),
          updatedAt: Date.now(),
        }
      : { ...job, assignNote: "No driver matches the current rules" };
  }
  commit({ ...state, jobs });
}

/** Update one or more auto-assign rules. */
export function setAssignRules(patch: Partial<AssignRules>): void {
  hydrate();
  commit({ ...state, rules: { ...state.rules, ...patch }, preset: null });
}

export function resetAssignRules(): void {
  hydrate();
  commit({ ...state, rules: DEFAULT_ASSIGN_RULES, preset: null });
}

/** Built-in plus imported presets, keyed by slug. */
export function allPresets(): Record<string, PresetProfile> {
  hydrate();
  return { ...ASSIGN_PRESETS, ...state.customPresets };
}

/** Switch to a named rule profile (built-in or imported). */
export function applyAssignPreset(key: PresetKey | string): void {
  hydrate();
  const profile = allPresets()[key];
  if (!profile) return;
  commit({ ...state, rules: { ...profile.rules }, preset: key });
}

/** Import shared presets from a CSV or JSON file body. */
export function importPresets(text: string): { added: string[]; errors: string[] } {
  hydrate();
  const { presets, errors } = parsePresetFile(text);
  const added = Object.keys(presets);
  if (added.length > 0) {
    commit({ ...state, customPresets: { ...state.customPresets, ...presets } });
  }
  return { added, errors };
}

export function clearImportedPresets(): void {
  hydrate();
  const preset = state.preset && state.preset in ASSIGN_PRESETS ? state.preset : null;
  commit({ ...state, customPresets: {}, preset });
}

/** Tune when conflicts are flagged (HOS buffer, skill-match floor, ETA buffer). */
export function setAlertThresholds(patch: Partial<AlertThresholds>): void {
  hydrate();
  commit({ ...state, thresholds: { ...state.thresholds, ...patch } });
}

export function resetAlertThresholds(): void {
  hydrate();
  commit({ ...state, thresholds: DEFAULT_ALERT_THRESHOLDS });
}

function assignNoteFor(pick: Candidate, rules: AssignRules): string {
  const base = `${pick.distanceKm.toFixed(1)} km · ETA ${Math.round(pick.etaMinutes)} min · ${rules.strategy}`;
  return pick.deferred
    ? `${base} · scheduled in ~${pick.availableInHours.toFixed(1)}h (look-ahead)`
    : base;
}

export interface AssignAlert {
  jobId: string;
  village: string;
  severity: "blocked" | "warning";
  kind: "hours-of-service" | "skill-mismatch" | "no-driver" | "deferred" | "eta-buffer";
  message: string;
  /** The exact rule that blocked or flagged this job. */
  rule: string;
}

/**
 * Real-time conflicts for every job that would be assigned next, computed
 * before anything is applied so an admin can adjust the rules first.
 */
export function assignmentAlerts(): AssignAlert[] {
  hydrate();
  const alerts: AssignAlert[] = [];
  const counts = activeJobCounts(state.jobs);
  const drivers = ruleDrivers(state.drivers, state.jobs, state.rules);
  const t = state.thresholds;

  for (const job of state.jobs) {
    if (job.driverId || job.status === "DELIVERED") continue;
    const candidates = evaluateCandidates(job, drivers, counts, state.rules);
    const best = candidates[0];

    if (!best || !best.eligible) {
      const all = candidates.flatMap((c) => c.reasons).join(" ");
      const kind = /hours-of-service/.test(all)
        ? "hours-of-service"
        : /missing skill/.test(all)
          ? "skill-mismatch"
          : "no-driver";
      alerts.push({
        jobId: job.id,
        village: job.village,
        severity: "blocked",
        kind,
        rule:
          kind === "hours-of-service"
            ? `maxHoursOfService = ${state.rules.maxHoursOfService}h`
            : kind === "skill-mismatch"
              ? `requireSkillMatch (needs ${job.tags.join(", ") || "—"})`
              : `maxDistanceKm ${state.rules.maxDistanceKm} / maxEtaMinutes ${state.rules.maxEtaMinutes}`,
        message:
          kind === "hours-of-service"
            ? `${job.village}: every candidate would break the ${state.rules.maxHoursOfService}h duty cap`
            : kind === "skill-mismatch"
              ? `${job.village}: no driver carries ${job.tags.join(", ") || "the required skills"}`
              : `${job.village}: no driver satisfies the current rules`,
      });
      continue;
    }

    if (best.deferred) {
      alerts.push({
        jobId: job.id,
        village: job.village,
        severity: "warning",
        kind: "deferred",
        rule: `lookAheadHours = ${state.rules.lookAheadHours}h`,
        message: `${job.village}: ${driverName(best.driverId)} frees up in ~${best.availableInHours.toFixed(1)}h — inside the ${state.rules.lookAheadHours}h horizon`,
      });
      continue;
    }

    // Threshold-driven advisories on an otherwise valid assignment.
    if (best.projectedHours > state.rules.maxHoursOfService - t.hosBufferHours) {
      alerts.push({
        jobId: job.id,
        village: job.village,
        severity: "warning",
        kind: "hours-of-service",
        rule: `hosBufferHours = ${t.hosBufferHours}h`,
        message: `${job.village}: ${driverName(best.driverId)} would reach ${best.projectedHours.toFixed(1)}h — within ${t.hosBufferHours}h of the ${state.rules.maxHoursOfService}h cap`,
      });
    }
    if (best.skillMatchScore < t.minSkillMatchScore) {
      alerts.push({
        jobId: job.id,
        village: job.village,
        severity: "warning",
        kind: "skill-mismatch",
        rule: `minSkillMatchScore = ${(t.minSkillMatchScore * 100).toFixed(0)}%`,
        message: `${job.village}: ${driverName(best.driverId)} matches ${(best.skillMatchScore * 100).toFixed(0)}% of ${job.tags.join(", ")}${best.missingSkills.length ? ` (missing ${best.missingSkills.join(", ")})` : ""}`,
      });
    }
    if (best.etaMinutes > state.rules.maxEtaMinutes - t.etaBufferMinutes) {
      alerts.push({
        jobId: job.id,
        village: job.village,
        severity: "warning",
        kind: "eta-buffer",
        rule: `etaBufferMinutes = ${t.etaBufferMinutes} min`,
        message: `${job.village}: ETA ${Math.round(best.etaMinutes)} min is within ${t.etaBufferMinutes} min of the ${state.rules.maxEtaMinutes} min cap`,
      });
    }
  }
  return alerts;
}

function driverName(id: string): string {
  return state.drivers.find((d) => d.id === id)?.name ?? id;
}

export interface ShiftLogRow {
  jobId: string;
  village: string;
  crop: string;
  weightKg: number;
  status: SimStatus;
  emergency: boolean;
  requiredSkills: string;
  driver: string;
  vehicle: string;
  distanceKm: string;
  etaMinutes: string;
  deferredHours: string;
  decision: string;
  rejections: string;
}

/** Full shift assignment log: chosen driver, ETA, distance and rejection reasons. */
export function shiftLog(): ShiftLogRow[] {
  hydrate();
  const counts = activeJobCounts(state.jobs);
  const drivers = ruleDrivers(state.drivers, state.jobs, state.rules);

  return state.jobs.map((job) => {
    const candidates = evaluateCandidates(job, drivers, counts, state.rules);
    const chosen = job.driverId
      ? candidates.find((c) => c.driverId === job.driverId)
      : candidates.find((c) => c.eligible);
    const driver = state.drivers.find((d) => d.id === (job.driverId ?? chosen?.driverId));
    return {
      jobId: job.id,
      village: job.village,
      crop: job.cropSlug,
      weightKg: job.weightKg,
      status: job.status,
      emergency: job.emergency,
      requiredSkills: job.tags.join(" | "),
      driver: driver?.name ?? "Unassigned",
      vehicle: driver?.vehicle ?? "—",
      distanceKm: chosen ? chosen.distanceKm.toFixed(1) : "—",
      etaMinutes: chosen ? String(Math.round(chosen.etaMinutes)) : "—",
      deferredHours: chosen?.deferred ? chosen.availableInHours.toFixed(1) : "0",
      decision: job.assignNote ?? (job.driverId ? "Assigned" : "Queued"),
      rejections: candidates
        .filter((c) => !c.eligible)
        .map((c) => `${driverNameOf(c.driverId)}: ${c.reasons.join("; ")}`)
        .join(" || "),
    };
  });
}

function driverNameOf(id: string): string {
  return state.drivers.find((d) => d.id === id)?.name ?? id;
}

/** Preview how each driver scores for a job under the current rules. */
export function previewAssignment(job: SimJob) {
  hydrate();
  return {
    rules: state.rules,
    candidates: evaluateCandidates(
      job,
      ruleDrivers(state.drivers, state.jobs, state.rules),
      activeJobCounts(state.jobs),
      state.rules,
    ),
  };
}

/** Stop the shift and wipe every simulated job. Safe to call repeatedly. */
export function stopSimulation(): void {
  hydrate();
  if (timer) clearInterval(timer);
  timer = null;
  commit(emptyState());
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage blocked */
  }
}

export function useSimulation(): SimState {
  return useSyncExternalStore(subscribe, persistedSnapshot, () => SERVER_SNAPSHOT);
}

export interface ConflictRow {
  jobId: string;
  village: string;
  crop: string;
  emergency: boolean;
  requiredSkills: string;
  driver: string;
  severity: "blocked" | "warning";
  kind: string;
  blockingRule: string;
  distanceKm: string;
  etaMinutes: string;
  skillMatch: string;
  projectedHours: string;
  detail: string;
}

/** Rejected / flagged jobs only, with the exact rule that blocked eligibility. */
export function conflictLog(): ConflictRow[] {
  hydrate();
  const counts = activeJobCounts(state.jobs);
  const drivers = ruleDrivers(state.drivers, state.jobs, state.rules);
  const rows: ConflictRow[] = [];

  for (const alert of assignmentAlerts()) {
    const job = state.jobs.find((j) => j.id === alert.jobId);
    if (!job) continue;
    const candidates = evaluateCandidates(job, drivers, counts, state.rules);
    const worst = candidates.find((c) => !c.eligible) ?? candidates[0];
    const focus = alert.severity === "blocked" ? worst : candidates[0];
    rows.push({
      jobId: job.id,
      village: job.village,
      crop: job.cropSlug,
      emergency: job.emergency,
      requiredSkills: job.tags.join(" | "),
      driver: focus ? driverName(focus.driverId) : "—",
      severity: alert.severity,
      kind: alert.kind,
      blockingRule: alert.rule,
      distanceKm: focus ? focus.distanceKm.toFixed(1) : "—",
      etaMinutes: focus ? String(Math.round(focus.etaMinutes)) : "—",
      skillMatch: focus ? `${(focus.skillMatchScore * 100).toFixed(0)}%` : "—",
      projectedHours: focus ? focus.projectedHours.toFixed(1) : "—",
      detail:
        alert.severity === "blocked"
          ? candidates
              .filter((c) => !c.eligible)
              .map((c) => `${driverName(c.driverId)}: ${c.reasons.join("; ")}`)
              .join(" || ")
          : alert.message,
    });
  }
  return rows;
}
