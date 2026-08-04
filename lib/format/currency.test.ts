import { describe, expect, it } from "vitest";
import { formatRinggitFromSen } from "@/lib/format/currency";

describe("formatRinggitFromSen", () => {
  it("formats without a space after RM", () => {
    expect(formatRinggitFromSen(500)).toBe("RM5.00");
    expect(formatRinggitFromSen(100000)).toBe("RM1,000.00");
  });

  it("rejects fractional sen", () => {
    expect(() => formatRinggitFromSen(10.5)).toThrow(TypeError);
  });
});
