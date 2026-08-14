import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PerfOverlay } from "./PerfOverlay";
import { clearLocalSamples, getLocalSamples, record, setPerfMode } from "@/lib/telemetry/client";

afterEach(() => {
  cleanup();
  clearLocalSamples();
  setPerfMode(false);
});

describe("telemetry snapshot stability", () => {
  it("returns a referentially stable snapshot between store updates", () => {
    const a = getLocalSamples();
    expect(getLocalSamples()).toBe(a);
    record("render", "test", 1);
    const b = getLocalSamples();
    expect(b).not.toBe(a);
    expect(getLocalSamples()).toBe(b);
  });
});

describe("PerfOverlay", () => {
  it("mounts without an infinite re-render loop", () => {
    setPerfMode(true);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(<PerfOverlay />);
    expect(container).toBeTruthy();
    expect(error.mock.calls.some((c) => String(c[0]).includes("Maximum update depth"))).toBe(false);
    error.mockRestore();
  });

  it("stays stable while samples stream in", () => {
    setPerfMode(true);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<PerfOverlay />);
    for (let i = 0; i < 25; i += 1) record("api", `call:${i}`, i);
    expect(error.mock.calls.some((c) => String(c[0]).includes("Maximum update depth"))).toBe(false);
    error.mockRestore();
  });
});
