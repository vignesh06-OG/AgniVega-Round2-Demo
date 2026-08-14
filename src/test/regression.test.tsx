import { cleanup, render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { closeDemo, isDemoMode, setDemoMode } from "@/lib/demo/demo-mode";
import {
  assignAllJobs,
  applyAssignPreset,
  assignmentAlerts,
  conflictLog,
  importPresets,
  setAlertThresholds,
  setAssignRules,
  shiftLog,
  startSimulation,
  stepSimulation,
  stopSimulation,
} from "@/lib/demo/simulation";
import { conflictCsv, shiftLogCsv } from "@/lib/demo/shift-export";
import { parsePresetFile, presetTemplateCsv } from "@/lib/demo/assign-rules";
import { chooseDriver, DEFAULT_ASSIGN_RULES, evaluateCandidates } from "@/lib/demo/assign-rules";
import { clearTranscripts, getTranscripts, saveTranscript } from "@/lib/voice/transcripts";
import { encodeWav, transcribe } from "@/lib/voice/recorder";
import { LiveMap } from "@/components/agnivega/LiveMap";
import { clusterPoints, decimate, simplifyPath } from "@/lib/map/optimize";
import { TranscriptLog } from "@/components/agnivega/TranscriptLog";

const roles = vi.hoisted(() => ({ isAdmin: false }));
vi.mock("@/lib/krishi/useRole", () => ({
  useMyRoles: () => ({
    roles: roles.isAdmin ? ["admin"] : [],
    isAdmin: roles.isAdmin,
    ready: true,
  }),
}));

import { AdminOnly } from "@/components/agnivega/AdminOnly";

beforeEach(() => {
  localStorage.clear();
  stopSimulation();
  clearTranscripts();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("demo mode", () => {
  it("runs a driver shift simulation and auto-assigns jobs", () => {
    startSimulation({ jobs: 4 });
    stepSimulation();
    assignAllJobs();
    const raw = JSON.parse(localStorage.getItem("agnivega:sim") ?? "{}");
    expect(raw.jobs).toHaveLength(4);
    expect(raw.jobs.every((j: any) => j.driverId)).toBe(true);
  });

  it("close demo stops the simulation, clears demo data and exits demo mode", async () => {
    setDemoMode(true);
    startSimulation({ jobs: 3 });
    saveTranscript({ text: "onion 500 kg", reply: null, lang: "mr", seconds: 2 });
    localStorage.setItem("agnivega:demo:pool", "x");

    await closeDemo();

    expect(localStorage.getItem("agnivega:sim")).toBeNull();
    expect(localStorage.getItem("agnivega:demo:pool")).toBeNull();
    expect(getTranscripts()).toHaveLength(0);
    expect(isDemoMode()).toBe(false);
  });
});

describe("live map", () => {
  it("renders a placeholder on first paint and mounts the client canvas", async () => {
    const { container } = render(
      <LiveMap points={[{ lat: 19.88, lng: 74.47, label: "Kopargaon", kind: "pickup" } as any]} />,
    );
    expect(container.firstChild).toBeTruthy();
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.querySelector("div")).toBeTruthy();
  });
});

describe("voice transcription", () => {
  it("encodes a valid WAV container", () => {
    const blob = encodeWav([new Float32Array(16000).fill(0.2)], 48000);
    expect(blob.type).toBe("audio/wav");
    expect(blob.size).toBeGreaterThan(44);
  });

  it("posts audio and returns the transcript text", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: "kanda pachshe kilo" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const text = await transcribe(
      { blob: new Blob(["x"], { type: "audio/wav" }), mimeType: "audio/wav", seconds: 2 },
      "mr",
    );
    expect(text).toBe("kanda pachshe kilo");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/public/transcribe");
  });

  it("surfaces saved captions after a session", () => {
    saveTranscript({ text: "tomato 200 kg Rahata", reply: "Understood", lang: "mr", seconds: 3 });
    render(<TranscriptLog lang="mr" />);
    expect(screen.getByText("tomato 200 kg Rahata")).toBeInTheDocument();
  });
});

describe("admin-only profiling gating", () => {
  it("hides gated content from non-admins and shows it to admins", () => {
    roles.isAdmin = false;
    const { queryByText, unmount } = render(<AdminOnly>Profiling</AdminOnly>);
    expect(queryByText("Profiling")).toBeNull();
    unmount();

    roles.isAdmin = true;
    render(<AdminOnly>Profiling</AdminOnly>);
    expect(screen.getByText("Profiling")).toBeInTheDocument();
  });
});

describe("map performance", () => {
  it("simplifies a dense polyline while keeping its endpoints", () => {
    const dense = Array.from({ length: 500 }, (_, i) => ({
      lat: 19.88 + i * 0.0001,
      lng: 74.47 + i * 0.0001,
    }));
    const simple = simplifyPath(dense, 0.0005);
    expect(simple.length).toBeLessThan(20);
    expect(simple[0]).toEqual(dense[0]);
    expect(simple.at(-1)).toEqual(dense.at(-1));
  });

  it("caps rendered vertices with decimate", () => {
    const pts = Array.from({ length: 5000 }, (_, i) => i);
    expect(decimate(pts, 400)).toHaveLength(400);
  });

  it("clusters nearby markers at low zoom and splits them at high zoom", () => {
    const pts = Array.from({ length: 40 }, (_, i) => ({
      lat: 19.88 + i * 0.0008,
      lng: 74.47 + i * 0.0008,
    }));
    expect(clusterPoints(pts, 8).length).toBeLessThan(pts.length);
    expect(clusterPoints(pts, 16).length).toBeGreaterThan(clusterPoints(pts, 8).length);
  });
});

describe("auto-assign rules", () => {
  const rules = { ...DEFAULT_ASSIGN_RULES };
  const near = {
    id: "near",
    lat: 19.8833,
    lng: 74.4778,
    speedKmph: 35,
    hoursWorked: 1,
    skills: ["reefer", "priority"],
  };
  const far = { ...near, id: "far", lat: 21.5, lng: 76.5 };
  const job = { lat: 19.89, lng: 74.48, emergency: false, tags: ["reefer"] };

  it("rejects drivers beyond the distance and ETA caps", () => {
    const pick = chooseDriver(job, [far], {}, rules);
    expect(pick).toBeNull();
    const reasons = evaluateCandidates(job, [far], {}, rules)[0]!.reasons.join(" ");
    expect(reasons).toMatch(/radius/);
  });

  it("respects hours-of-service and per-driver job caps", () => {
    expect(chooseDriver(job, [{ ...near, hoursWorked: 9.5 }], {}, rules)).toBeNull();
    expect(chooseDriver(job, [near], { near: 3 }, rules)).toBeNull();
  });

  it("enforces skill tags only when required", () => {
    const unskilled = { ...near, skills: [] };
    expect(chooseDriver(job, [unskilled], {}, rules)).toBeNull();
    expect(
      chooseDriver(job, [unskilled], {}, { ...rules, requireSkillMatch: false }),
    ).not.toBeNull();
  });

  it("lets emergency loads override the distance cap when configured", () => {
    const urgent = { ...job, emergency: true, tags: ["priority"] };
    expect(chooseDriver(urgent, [far], {}, rules)?.driverId).toBe("far");
    expect(
      chooseDriver(urgent, [far], {}, { ...rules, emergencyOverridesLimits: false }),
    ).toBeNull();
  });

  it("picks the nearest driver under the nearest strategy", () => {
    const mid = { ...near, id: "mid", lat: 19.95, lng: 74.52 };
    const pick = chooseDriver(job, [mid, near], {}, { ...rules, strategy: "nearest" });
    expect(pick?.driverId).toBe("near");
  });

  it("applies configured rules through the simulation store", () => {
    startSimulation({ jobs: 6 });
    setAssignRules({ maxDistanceKm: 1, emergencyOverridesLimits: false });
    assignAllJobs();
    const state = JSON.parse(localStorage.getItem("agnivega:sim") ?? "{}");
    expect(state.jobs.every((j: any) => j.driverId === null)).toBe(true);
    setAssignRules({
      maxDistanceKm: 80,
      maxJobsPerDriver: 9,
      maxHoursOfService: 40,
      requireSkillMatch: false,
    });
    assignAllJobs();
    const after = JSON.parse(localStorage.getItem("agnivega:sim") ?? "{}");
    expect(after.jobs.every((j: any) => j.driverId)).toBe(true);
  });
});

describe("demo shift alerts, presets, look-ahead and export", () => {
  it("raises blocking alerts before assignments are applied", () => {
    startSimulation({ jobs: 4 });
    setAssignRules({ maxDistanceKm: 1, emergencyOverridesLimits: false });
    const alerts = assignmentAlerts();
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts.every((a) => a.severity === "blocked")).toBe(true);
  });

  it("flags hours-of-service conflicts distinctly", () => {
    startSimulation({ jobs: 3 });
    setAssignRules({ maxHoursOfService: 0.5, requireSkillMatch: false, lookAheadHours: 0 });
    expect(assignmentAlerts().some((a) => a.kind === "hours-of-service")).toBe(true);
  });

  it("schedules capacity-blocked drivers inside the look-ahead horizon", () => {
    startSimulation({ jobs: 6 });
    setAssignRules({
      maxJobsPerDriver: 1,
      requireSkillMatch: false,
      maxDistanceKm: 90,
      maxEtaMinutes: 240,
    });
    assignAllJobs();
    const blocked = JSON.parse(localStorage.getItem("agnivega:sim") ?? "{}").jobs.filter(
      (j: any) => !j.driverId,
    ).length;
    setAssignRules({ lookAheadHours: 12 });
    assignAllJobs();
    const after = JSON.parse(localStorage.getItem("agnivega:sim") ?? "{}").jobs.filter(
      (j: any) => !j.driverId,
    ).length;
    expect(after).toBeLessThan(blocked);
  });

  it("switches auto-assign presets instantly", () => {
    startSimulation({ jobs: 3 });
    applyAssignPreset("emergency");
    let state = JSON.parse(localStorage.getItem("agnivega:sim") ?? "{}");
    expect(state.preset).toBe("emergency");
    expect(state.rules.strategy).toBe("fastest");
    applyAssignPreset("cost-optimized");
    state = JSON.parse(localStorage.getItem("agnivega:sim") ?? "{}");
    expect(state.rules.strategy).toBe("nearest");
    expect(state.rules.maxDistanceKm).toBe(20);
  });

  it("exports a CSV log with driver, ETA, distance and rejection reasons", () => {
    startSimulation({ jobs: 3 });
    assignAllJobs();
    const rows = shiftLog();
    expect(rows).toHaveLength(3);
    const csv = shiftLogCsv(rows);
    expect(csv.split("\n")).toHaveLength(4);
    expect(csv).toMatch(/Driver,Vehicle,Distance \(km\),ETA \(min\)/);
  });
});

describe("conflict reporting, preset import and alert thresholds", () => {
  it("exports a conflicts-only CSV naming the blocking rule", () => {
    startSimulation({ jobs: 4 });
    setAssignRules({ maxDistanceKm: 1, emergencyOverridesLimits: false, lookAheadHours: 0 });
    const rows = conflictLog();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.blockingRule.length > 0)).toBe(true);
    const csv = conflictCsv(rows);
    expect(csv).toMatch(/Blocking rule/);
    expect(csv.split("\n")).toHaveLength(rows.length + 1);
  });

  it("parses shared presets from JSON and CSV", () => {
    const json = parsePresetFile(
      JSON.stringify([{ key: "night", label: "Night", maxDistanceKm: 12, strategy: "nearest" }]),
    );
    expect(json.errors).toHaveLength(0);
    expect(json.presets["night"]?.rules.maxDistanceKm).toBe(12);

    const csv = parsePresetFile(presetTemplateCsv());
    expect(Object.keys(csv.presets)).toContain("emergency");
    expect(csv.presets["emergency"]?.rules.strategy).toBe("fastest");
  });

  it("imports presets into the store and lets them be applied", () => {
    startSimulation({ jobs: 2 });
    const { added, errors } = importPresets(
      "key,label,maxDistanceKm,maxEtaMinutes,strategy\nmonsoon,Monsoon,15,25,nearest\n",
    );
    expect(errors).toHaveLength(0);
    expect(added).toContain("monsoon");
    applyAssignPreset("monsoon");
    const state = JSON.parse(localStorage.getItem("agnivega:sim") ?? "{}");
    expect(state.preset).toBe("monsoon");
    expect(state.rules.maxDistanceKm).toBe(15);
  });

  it("rejects an invalid preset file without changing rules", () => {
    startSimulation({ jobs: 2 });
    const { added, errors } = importPresets("{ not json");
    expect(added).toHaveLength(0);
    expect(errors[0]).toMatch(/Invalid JSON/);
  });

  it("honours configurable alert thresholds", () => {
    startSimulation({ jobs: 6 });
    setAssignRules({
      maxDistanceKm: 90,
      maxEtaMinutes: 240,
      requireSkillMatch: false,
      maxHoursOfService: 40,
    });
    setAlertThresholds({ hosBufferHours: 0, minSkillMatchScore: 0, etaBufferMinutes: 0 });
    const quiet = assignmentAlerts().length;
    setAlertThresholds({ minSkillMatchScore: 1 });
    expect(assignmentAlerts().length).toBeGreaterThan(quiet);
    setAlertThresholds({ minSkillMatchScore: 0, hosBufferHours: 100 });
    expect(assignmentAlerts().some((a) => a.kind === "hours-of-service")).toBe(true);
  });
});
