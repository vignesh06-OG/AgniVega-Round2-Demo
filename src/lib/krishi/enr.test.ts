import { describe, it, expect } from "vitest";
import { itemiseEarnings, spoilageRisk } from "./fuel-engine";
import { DEMO_ENR_RESULTS } from "./canonical-demo";

describe("Expected Net Realization (ENR) Calculations", () => {
  it("should perfectly balance gross, freight, fee, spoilage, and net payout", () => {
    // 1000 kg, 20 Rs/kg = 20,000 Rs
    const earnings = itemiseEarnings(20, 1000, 1500, 3, 500);

    expect(earnings.grossPayout).toBe(20000); // 20 * 1000
    expect(earnings.freightShare).toBe(1500);
    expect(earnings.platformFee).toBe(600); // 3% of 20,000
    expect(earnings.spoilageLoss).toBe(500);

    // Net = 20000 - 1500 - 600 - 500 = 17400
    expect(earnings.netPayout).toBe(17400);
  });

  it("should balance correctly for all DEMO_ENR_RESULTS", () => {
    DEMO_ENR_RESULTS.forEach((mandi) => {
      const { grossPayout, freightCost, platformFee, spoilageLoss, netPayout } = mandi;

      // Exactly matches rounded components due to dynamic generation logic
      expect(netPayout).toBe(grossPayout - freightCost - platformFee - spoilageLoss);
    });
  });

  it("should calculate correct spoilage risks", () => {
    // 24hr crop over 1500km = 37.5 hours = > 100% risk -> critical
    const longDistanceRisk = spoilageRisk(24, 1500, 10000, 0);
    expect(longDistanceRisk.level).toBe("critical");
    expect(longDistanceRisk.valueAtRisk).toBeGreaterThan(0);

    // 120hr crop over 10km with no queue -> safe
    const shortDistanceRisk = spoilageRisk(120, 10, 10000, 0);
    expect(shortDistanceRisk.level).toBe("safe");
    expect(shortDistanceRisk.valueAtRisk).toBeLessThan(10);
  });
});
