export type HealthState = "ok" | "degraded" | "down" | "skipped";

export interface HealthCheck {
  name: string;
  state: HealthState;
  latencyMs: number;
  detail: string;
}

export interface HealthReport {
  status: HealthState;
  version: string;
  uptimeHintMs: number;
  checkedAt: string;
  checks: HealthCheck[];
}
