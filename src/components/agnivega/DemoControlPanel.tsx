import {
  AlertTriangle,
  FileDown,
  FlaskConical,
  Pause,
  Play,
  Printer,
  Shuffle,
  SkipForward,
  StopCircle,
  Upload,
} from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { closeDemo, useDemoMode } from "@/lib/demo/demo-mode";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ASSIGN_PRESETS, presetTemplateCsv, type AssignStrategy } from "@/lib/demo/assign-rules";
import {
  downloadConflictsCsv,
  downloadConflictsPdf,
  downloadShiftCsv,
  downloadShiftPdf,
} from "@/lib/demo/shift-export";
import {
  allPresets,
  applyAssignPreset,
  assignAllJobs,
  assignmentAlerts,
  clearImportedPresets,
  importPresets,
  resetAssignRules,
  resetAlertThresholds,
  setAlertThresholds,
  setAssignRules,
  pauseSimulation,
  resumeSimulation,
  setAutoAssign,
  setSimSpeed,
  startSimulation,
  stepSimulation,
  stopSimulation,
  useSimulation,
} from "@/lib/demo/simulation";

const SPEEDS = [1, 2, 4];

/** Admin-only cockpit that drives a full simulated driver shift. */
export function DemoControlPanel() {
  const [demo, setDemo] = useDemoMode();
  const sim = useSimulation();

  useEffect(() => () => pauseSimulation(), []);

  const delivered = sim.jobs.filter((j) => j.status === "DELIVERED").length;
  const assigned = sim.jobs.filter((j) => j.driverId).length;
  // Recomputed on every store change so alerts are live before rules are applied.
  const alerts = assignmentAlerts();
  const blocking = alerts.filter((a) => a.severity === "blocked").length;
  const presets = allPresets();
  const importedKeys = Object.keys(sim.customPresets);

  async function onImportFile(file: File | undefined) {
    if (!file) return;
    const { added, errors } = importPresets(await file.text());
    if (added.length > 0)
      toast.success(`Imported ${added.length} preset${added.length === 1 ? "" : "s"}`);
    if (errors.length > 0) toast.error(errors[0]!);
  }

  function downloadPresetTemplate() {
    const blob = new Blob([presetTemplateCsv()], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "agnivega-preset-template.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <Card data-testid="demo-control-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FlaskConical className="h-4 w-4" /> Demo control panel
        </CardTitle>
        <CardDescription>
          Start a full driver shift simulation, auto-assign jobs to the roster, then close the demo
          to wipe everything.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {!sim.running ? (
            <Button
              onClick={() => {
                if (!demo) setDemo(true);
                if (sim.jobs.length) {
                  resumeSimulation();
                } else {
                  startSimulation({ jobs: 6 });
                }
                toast.success("Shift simulation running");
              }}
            >
              <Play className="mr-1 h-4 w-4" /> Start shift simulation
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => pauseSimulation()}>
              <Pause className="mr-1 h-4 w-4" /> Pause
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => stepSimulation()}
            disabled={sim.jobs.length === 0}
          >
            <SkipForward className="mr-1 h-4 w-4" /> Step
          </Button>
          <Button
            variant="outline"
            onClick={() => assignAllJobs()}
            disabled={sim.jobs.length === 0}
          >
            <Shuffle className="mr-1 h-4 w-4" /> Assign all jobs
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              stopSimulation();
              toast.message("Simulation stopped and jobs cleared");
            }}
            disabled={sim.jobs.length === 0}
          >
            <StopCircle className="mr-1 h-4 w-4" /> Stop simulation
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              await closeDemo();
              toast.success("Demo closed — back to live data");
            }}
          >
            Close demo
          </Button>
          <Button
            variant="outline"
            disabled={sim.jobs.length === 0}
            onClick={() => {
              downloadShiftCsv();
              toast.success("Shift assignment log exported as CSV");
            }}
          >
            <FileDown className="mr-1 h-4 w-4" /> Export CSV
          </Button>
          <Button
            variant="outline"
            disabled={sim.jobs.length === 0}
            onClick={() => {
              if (!downloadShiftPdf()) toast.error("Allow pop-ups to export the PDF");
            }}
          >
            <Printer className="mr-1 h-4 w-4" /> Export PDF
          </Button>
          <Button
            variant="outline"
            disabled={alerts.length === 0}
            onClick={() => {
              downloadConflictsCsv();
              toast.success("Conflicts-only report exported as CSV");
            }}
          >
            <FileDown className="mr-1 h-4 w-4" /> Conflicts CSV
          </Button>
          <Button
            variant="outline"
            disabled={alerts.length === 0}
            onClick={() => {
              if (!downloadConflictsPdf()) toast.error("Allow pop-ups to export the PDF");
            }}
          >
            <Printer className="mr-1 h-4 w-4" /> Conflicts PDF
          </Button>
        </div>

        {alerts.length > 0 && (
          <div
            className="space-y-1 rounded-md border border-amber-500/40 bg-amber-500/10 p-3"
            data-testid="assign-alerts"
          >
            <p className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4" />
              {blocking} blocking · {alerts.length - blocking} advisory conflict
              {alerts.length - blocking === 1 ? "" : "s"} before assignment
            </p>
            {alerts.map((alert) => (
              <p key={`${alert.jobId}-${alert.kind}`} className="text-xs text-muted-foreground">
                <Badge
                  variant={alert.severity === "blocked" ? "destructive" : "outline"}
                  className="mr-2 text-[10px] uppercase"
                >
                  {alert.kind}
                </Badge>
                {alert.message}
                <span className="ml-1 opacity-70">· rule: {alert.rule}</span>
              </p>
            ))}
          </div>
        )}

        <div className="space-y-2 rounded-md border p-3" data-testid="alert-thresholds">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Alert thresholds</p>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => resetAlertThresholds()}
            >
              Reset
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <RuleNumber
              label="HOS buffer (h)"
              value={sim.thresholds.hosBufferHours}
              step={0.25}
              onChange={(hosBufferHours) => setAlertThresholds({ hosBufferHours })}
            />
            <RuleNumber
              label="Min skill match (0–1)"
              value={sim.thresholds.minSkillMatchScore}
              step={0.1}
              onChange={(minSkillMatchScore) =>
                setAlertThresholds({
                  minSkillMatchScore: Math.min(1, Math.max(0, minSkillMatchScore)),
                })
              }
            />
            <RuleNumber
              label="ETA buffer (min)"
              value={sim.thresholds.etaBufferMinutes}
              step={5}
              onChange={(etaBufferMinutes) => setAlertThresholds({ etaBufferMinutes })}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Label className="text-xs uppercase text-muted-foreground">Speed</Label>
            {SPEEDS.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={sim.speed === s ? "default" : "outline"}
                onClick={() => setSimSpeed(s)}
              >
                {s}×
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="auto-assign"
              checked={sim.autoAssign}
              onCheckedChange={(v) => setAutoAssign(Boolean(v))}
            />
            <Label htmlFor="auto-assign" className="text-sm">
              Auto-assign new jobs
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            {assigned}/{sim.jobs.length} assigned · {delivered} delivered · tick {sim.tick}
          </p>
        </div>

        <Separator />

        <div className="space-y-3" data-testid="assign-rules">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Auto-assign rules</p>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => resetAssignRules()}
            >
              Reset defaults
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.keys(presets).map((key) => (
              <Button
                key={key}
                size="sm"
                variant={sim.preset === key ? "default" : "outline"}
                title={presets[key]!.description}
                onClick={() => {
                  applyAssignPreset(key);
                  toast.success(`${presets[key]!.label} profile applied`);
                }}
              >
                {presets[key]!.label}
                {key in sim.customPresets && !(key in ASSIGN_PRESETS) ? " ↑" : ""}
              </Button>
            ))}
            <span className="self-center text-xs text-muted-foreground">
              {sim.preset && presets[sim.preset]
                ? presets[sim.preset]!.description
                : "Custom rules"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Label
              htmlFor="preset-import"
              className="inline-flex h-8 cursor-pointer items-center rounded-md border px-3 text-xs font-medium hover:bg-secondary"
            >
              <Upload className="mr-1 h-3.5 w-3.5" /> Import presets (CSV / JSON)
            </Label>
            <input
              id="preset-import"
              data-testid="preset-import"
              type="file"
              accept=".csv,.json,text/csv,application/json"
              className="hidden"
              onChange={(e) => {
                void onImportFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={downloadPresetTemplate}
            >
              Download template
            </Button>
            {importedKeys.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                onClick={() => {
                  clearImportedPresets();
                  toast.message("Imported presets removed");
                }}
              >
                Clear {importedKeys.length} imported
              </Button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <RuleNumber
              label="Max distance (km)"
              value={sim.rules.maxDistanceKm}
              step={1}
              onChange={(maxDistanceKm) => setAssignRules({ maxDistanceKm })}
            />
            <RuleNumber
              label="Max ETA (min)"
              value={sim.rules.maxEtaMinutes}
              step={5}
              onChange={(maxEtaMinutes) => setAssignRules({ maxEtaMinutes })}
            />
            <RuleNumber
              label="Hours-of-service cap"
              value={sim.rules.maxHoursOfService}
              step={0.5}
              onChange={(maxHoursOfService) => setAssignRules({ maxHoursOfService })}
            />
            <RuleNumber
              label="Hours per job"
              value={sim.rules.hoursPerJob}
              step={0.25}
              onChange={(hoursPerJob) => setAssignRules({ hoursPerJob })}
            />
            <RuleNumber
              label="Max jobs per driver"
              value={sim.rules.maxJobsPerDriver}
              step={1}
              onChange={(maxJobsPerDriver) => setAssignRules({ maxJobsPerDriver })}
            />
            <RuleNumber
              label="Look-ahead horizon (h)"
              value={sim.rules.lookAheadHours}
              step={0.5}
              onChange={(lookAheadHours) => setAssignRules({ lookAheadHours })}
            />
            <div className="space-y-1">
              <Label className="text-xs uppercase text-muted-foreground">Strategy</Label>
              <div className="flex gap-1">
                {(["nearest", "fastest", "balanced"] as AssignStrategy[]).map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={sim.rules.strategy === s ? "default" : "outline"}
                    className="flex-1 capitalize"
                    onClick={() => setAssignRules({ strategy: s })}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="skill-match"
                checked={sim.rules.requireSkillMatch}
                onCheckedChange={(v) => setAssignRules({ requireSkillMatch: Boolean(v) })}
              />
              <Label htmlFor="skill-match" className="text-sm">
                Require skill tags (reefer / heavy / priority)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="emergency-override"
                checked={sim.rules.emergencyOverridesLimits}
                onCheckedChange={(v) => setAssignRules({ emergencyOverridesLimits: Boolean(v) })}
              />
              <Label htmlFor="emergency-override" className="text-sm">
                Emergency loads ignore distance & ETA caps
              </Label>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {sim.drivers.map((driver) => (
              <div key={driver.id} className="rounded-md border bg-secondary/30 p-2 text-xs">
                <p className="font-medium">{driver.name}</p>
                <p className="text-muted-foreground">{driver.vehicle}</p>
                <p className="text-muted-foreground">
                  {driver.hoursWorked}h logged · {driver.speedKmph} km/h
                </p>
                <p className="mt-1 flex flex-wrap gap-1">
                  {driver.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-[10px]">
                      {skill}
                    </Badge>
                  ))}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          {sim.jobs.map((job) => {
            const driver = sim.drivers.find((d) => d.id === job.driverId);
            return (
              <div
                key={job.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card p-2 text-sm"
              >
                <span className="font-medium">
                  {job.village} · {job.cropSlug} · {job.weightKg} kg
                </span>
                <span className="text-xs text-muted-foreground">
                  {driver ? `${driver.name} — ${driver.vehicle}` : "Unassigned"}
                  {job.tags.length > 0 && ` · needs ${job.tags.join(", ")}`}
                  {job.assignNote ? ` · ${job.assignNote}` : ""}
                </span>
                <Badge variant={job.status === "DELIVERED" ? "secondary" : "outline"}>
                  {job.status}
                </Badge>
              </div>
            );
          })}
          {sim.jobs.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No simulated jobs. Start the shift simulation to generate a Kopargaon–Nashik queue.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RuleNumber({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs uppercase text-muted-foreground">{label}</Label>
      <Input
        type="number"
        min={0}
        step={step}
        value={value}
        onChange={(e) =>
          Number.isFinite(e.target.valueAsNumber) && onChange(e.target.valueAsNumber)
        }
      />
    </div>
  );
}
