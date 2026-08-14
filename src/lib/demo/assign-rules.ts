import { minutesFor, roadKm } from "@/lib/krishi/geo";

/**
 * Configurable auto-assign rules for the demo shift. Pure functions so the
 * admin panel, the simulation loop and the tests all share one decision path.
 */
export type AssignStrategy = "nearest" | "balanced" | "fastest";

export interface AssignRules {
  /** Reject a driver whose road distance to the pickup exceeds this. */
  maxDistanceKm: number;
  /** Reject a driver who cannot reach the pickup within this many minutes. */
  maxEtaMinutes: number;
  /** Hours-of-service cap: a driver at or above this is off duty. */
  maxHoursOfService: number;
  /** Hours each accepted job is assumed to add to a driver's duty clock. */
  hoursPerJob: number;
  /** Max concurrent (undelivered) jobs a single driver may hold. */
  maxJobsPerDriver: number;
  /** Require the driver to carry every skill tag the job asks for. */
  requireSkillMatch: boolean;
  /** Emergency jobs ignore the distance and ETA caps. */
  emergencyOverridesLimits: boolean;
  /**
   * Look-ahead horizon in hours. A driver blocked only by capacity limits
   * (hours-of-service or concurrent jobs) is still chosen when they would
   * free up within this many hours; the job is scheduled, not rejected.
   */
  lookAheadHours: number;
  strategy: AssignStrategy;
}

export const DEFAULT_ASSIGN_RULES: AssignRules = {
  maxDistanceKm: 35,
  maxEtaMinutes: 60,
  maxHoursOfService: 10,
  hoursPerJob: 1.5,
  maxJobsPerDriver: 3,
  requireSkillMatch: true,
  emergencyOverridesLimits: true,
  lookAheadHours: 0,
  strategy: "balanced",
};

export type PresetKey = "emergency" | "balanced" | "cost-optimized";

/** Tunable thresholds that decide when a conflict is surfaced as an alert. */
export interface AlertThresholds {
  /** Warn when a driver comes within this many hours of the duty cap. */
  hosBufferHours: number;
  /** Warn when the share of matched skill tags falls below this (0–1). */
  minSkillMatchScore: number;
  /** Warn when the chosen driver's ETA is within this many minutes of the cap. */
  etaBufferMinutes: number;
}

export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  hosBufferHours: 1,
  minSkillMatchScore: 1,
  etaBufferMinutes: 10,
};

export interface PresetProfile {
  label: string;
  description: string;
  rules: AssignRules;
}

/** One-tap rule profiles for the admin demo tab. */
export const ASSIGN_PRESETS: Record<
  PresetKey,
  { label: string; description: string; rules: AssignRules }
> = {
  emergency: {
    label: "Emergency",
    description: "Widest net, fastest driver, caps relaxed for urgent loads.",
    rules: {
      maxDistanceKm: 80,
      maxEtaMinutes: 120,
      maxHoursOfService: 12,
      hoursPerJob: 1.5,
      maxJobsPerDriver: 5,
      requireSkillMatch: false,
      emergencyOverridesLimits: true,
      lookAheadHours: 4,
      strategy: "fastest",
    },
  },
  balanced: {
    label: "Balanced",
    description: "Default shift profile — spreads work across the roster.",
    rules: { ...DEFAULT_ASSIGN_RULES, lookAheadHours: 2 },
  },
  "cost-optimized": {
    label: "Cost-optimized",
    description: "Short hauls only, strict skills, minimal empty kilometres.",
    rules: {
      maxDistanceKm: 20,
      maxEtaMinutes: 40,
      maxHoursOfService: 9,
      hoursPerJob: 1.5,
      maxJobsPerDriver: 4,
      requireSkillMatch: true,
      emergencyOverridesLimits: false,
      lookAheadHours: 6,
      strategy: "nearest",
    },
  },
};

export interface RuleDriver {
  id: string;
  lat: number;
  lng: number;
  /** Average road speed used for ETA, km/h. */
  speedKmph: number;
  /** Duty hours already worked this shift. */
  hoursWorked: number;
  skills: string[];
}

export interface RuleJob {
  lat: number;
  lng: number;
  emergency: boolean;
  /** Skill tags the job requires, e.g. `reefer`, `heavy`, `unpaved`. */
  tags: string[];
}

export interface Candidate {
  driverId: string;
  distanceKm: number;
  etaMinutes: number;
  activeJobs: number;
  projectedHours: number;
  eligible: boolean;
  /** Why the driver was rejected, empty when eligible. */
  reasons: string[];
  /** Eligible only because of the look-ahead horizon. */
  deferred: boolean;
  /** Hours until this driver frees up, 0 when available now. */
  availableInHours: number;
  /** Share of required skill tags this driver carries (1 when no tags). */
  skillMatchScore: number;
  /** Skill tags the driver is missing. */
  missingSkills: string[];
  score: number;
}

/** Evaluate every driver against the rules for one job. */
export function evaluateCandidates(
  job: RuleJob,
  drivers: RuleDriver[],
  activeJobsByDriver: Record<string, number>,
  rules: AssignRules,
): Candidate[] {
  const relaxed = rules.emergencyOverridesLimits && job.emergency;

  return drivers
    .map((driver) => {
      const distanceKm = roadKm(driver, job);
      const etaMinutes = minutesFor(distanceKm, driver.speedKmph || 32);
      const activeJobs = activeJobsByDriver[driver.id] ?? 0;
      const projectedHours = driver.hoursWorked + rules.hoursPerJob;
      const reasons: string[] = [];
      const capacityReasons: string[] = [];
      let availableInHours = 0;

      if (!relaxed && distanceKm > rules.maxDistanceKm) {
        reasons.push(`${distanceKm.toFixed(1)} km beyond ${rules.maxDistanceKm} km radius`);
      }
      if (!relaxed && etaMinutes > rules.maxEtaMinutes) {
        reasons.push(`ETA ${Math.round(etaMinutes)} min over ${rules.maxEtaMinutes} min`);
      }
      if (projectedHours > rules.maxHoursOfService) {
        capacityReasons.push(
          `hours-of-service ${projectedHours.toFixed(1)}h over ${rules.maxHoursOfService}h`,
        );
        availableInHours = Math.max(availableInHours, projectedHours - rules.maxHoursOfService);
      }
      if (activeJobs >= rules.maxJobsPerDriver) {
        capacityReasons.push(`already holds ${activeJobs} jobs`);
        availableInHours = Math.max(
          availableInHours,
          (activeJobs - rules.maxJobsPerDriver + 1) * rules.hoursPerJob,
        );
      }
      const missingSkills = job.tags.filter((tag) => !driver.skills.includes(tag));
      const skillMatchScore =
        job.tags.length === 0 ? 1 : (job.tags.length - missingSkills.length) / job.tags.length;
      if (rules.requireSkillMatch) {
        if (missingSkills.length > 0) reasons.push(`missing skill: ${missingSkills.join(", ")}`);
      }

      // Capacity blocks clear themselves over time: honour the look-ahead horizon.
      const withinHorizon = capacityReasons.length > 0 && availableInHours <= rules.lookAheadHours;
      const deferred = withinHorizon && reasons.length === 0;
      if (!withinHorizon) reasons.push(...capacityReasons);

      // Lower score wins.
      const score =
        rules.strategy === "nearest"
          ? distanceKm
          : rules.strategy === "fastest"
            ? etaMinutes
            : etaMinutes + activeJobs * 25 + driver.hoursWorked * 6;

      return {
        driverId: driver.id,
        distanceKm,
        etaMinutes,
        activeJobs,
        projectedHours,
        eligible: reasons.length === 0,
        reasons,
        deferred,
        availableInHours: deferred ? availableInHours : 0,
        skillMatchScore,
        missingSkills,
        score: score + (deferred ? 1000 : 0),
      };
    })
    .sort((a, b) => Number(b.eligible) - Number(a.eligible) || a.score - b.score);
}

/** Best driver for a job, or null when no driver satisfies the rules. */
export function chooseDriver(
  job: RuleJob,
  drivers: RuleDriver[],
  activeJobsByDriver: Record<string, number>,
  rules: AssignRules,
): Candidate | null {
  const best = evaluateCandidates(job, drivers, activeJobsByDriver, rules)[0];
  return best && best.eligible ? best : null;
}

/** Skill tags implied by a demo load. */
export function tagsForLoad(load: {
  cropSlug: string;
  weightKg: number;
  emergency: boolean;
}): string[] {
  const tags: string[] = [];
  if (["tomato", "grapes", "pomegranate"].includes(load.cropSlug)) tags.push("reefer");
  if (load.weightKg >= 800) tags.push("heavy");
  if (load.emergency) tags.push("priority");
  return tags;
}

const NUMERIC_RULE_KEYS = [
  "maxDistanceKm",
  "maxEtaMinutes",
  "maxHoursOfService",
  "hoursPerJob",
  "maxJobsPerDriver",
  "lookAheadHours",
] as const;

const BOOLEAN_RULE_KEYS = ["requireSkillMatch", "emergencyOverridesLimits"] as const;

function toBool(value: unknown): boolean {
  return typeof value === "boolean" ? value : /^(true|yes|1|on)$/i.test(String(value ?? "").trim());
}

function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Coerce an arbitrary record into a complete, valid rule set. */
export function coerceRules(input: Record<string, unknown>): AssignRules {
  const rules: AssignRules = { ...DEFAULT_ASSIGN_RULES };
  for (const key of NUMERIC_RULE_KEYS) {
    const raw = Number(input[key]);
    if (Number.isFinite(raw) && raw >= 0) rules[key] = raw;
  }
  for (const key of BOOLEAN_RULE_KEYS) {
    if (input[key] !== undefined && input[key] !== "") rules[key] = toBool(input[key]);
  }
  const strategy = String(input["strategy"] ?? "")
    .trim()
    .toLowerCase();
  if (strategy === "nearest" || strategy === "fastest" || strategy === "balanced") {
    rules.strategy = strategy;
  }
  return rules;
}

/** Split one CSV line, honouring quoted cells. */
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      cells.push(cell);
      cell = "";
    } else cell += ch;
  }
  cells.push(cell);
  return cells.map((c) => c.trim());
}

export interface PresetImportResult {
  presets: Record<string, PresetProfile>;
  errors: string[];
}

/**
 * Parse a shared preset file. Accepts JSON (array or keyed object) and CSV
 * with a header row; unknown columns are ignored and missing rules fall back
 * to the defaults so a partial file still imports cleanly.
 */
export function parsePresetFile(text: string): PresetImportResult {
  const trimmed = text.trim();
  const presets: Record<string, PresetProfile> = {};
  const errors: string[] = [];
  if (!trimmed) return { presets, errors: ["File is empty"] };

  const addRow = (row: Record<string, unknown>, index: number) => {
    const label = String(row["label"] ?? row["name"] ?? row["key"] ?? "").trim();
    const key = slug(String(row["key"] ?? label));
    if (!key) {
      errors.push(`Row ${index + 1}: missing a preset key or label`);
      return;
    }
    presets[key] = {
      label: label || key,
      description: String(row["description"] ?? "Imported preset"),
      rules: coerceRules(row),
    };
  };

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      const rows: Array<Record<string, unknown>> = Array.isArray(parsed)
        ? parsed
        : Object.entries(parsed as Record<string, unknown>).map(([key, value]) => {
            const entry = (value ?? {}) as Record<string, unknown>;
            const nested = (entry["rules"] ?? entry) as Record<string, unknown>;
            return { key, label: entry["label"], description: entry["description"], ...nested };
          });
      rows.forEach((row, i) => {
        const entry = row as Record<string, unknown>;
        const nested = (entry["rules"] ?? {}) as Record<string, unknown>;
        addRow({ ...entry, ...nested }, i);
      });
    } catch {
      errors.push("Invalid JSON — could not parse the file");
    }
    return { presets, errors };
  }

  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = splitCsvLine(lines[0] ?? "");
  if (lines.length < 2) errors.push("CSV needs a header row and at least one preset row");
  lines.slice(1).forEach((line, i) => {
    const cells = splitCsvLine(line);
    const row: Record<string, unknown> = {};
    header.forEach((col, ci) => {
      row[col] = cells[ci];
    });
    addRow(row, i);
  });
  return { presets, errors };
}

/** Example file an admin can download, edit and re-import. */
export function presetTemplateCsv(): string {
  const cols = [
    "key",
    "label",
    "description",
    ...NUMERIC_RULE_KEYS,
    ...BOOLEAN_RULE_KEYS,
    "strategy",
  ];
  const rows = (Object.keys(ASSIGN_PRESETS) as PresetKey[]).map((key) => {
    const p = ASSIGN_PRESETS[key];
    const record: Record<string, unknown> = {
      key,
      label: p.label,
      description: p.description,
      ...p.rules,
    };
    return cols
      .map((c) => {
        const v = String(record[c] ?? "");
        return /[",]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
      })
      .join(",");
  });
  return [cols.join(","), ...rows].join("\n");
}
