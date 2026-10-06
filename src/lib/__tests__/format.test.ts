import { describe, expect, it } from "vitest";
import { daysUntil, formatDate, formatDateTime, formatRupees, istDateOf, istToday, timeAgo } from "@/lib/format";

describe("format", () => {
  it("istToday shifts UTC by +5:30", () => {
    expect(istToday(new Date("2026-10-05T18:29:00Z"))).toBe("2026-10-05");
    expect(istToday(new Date("2026-10-05T18:31:00Z"))).toBe("2026-10-06");
  });

  it("formatDate renders Hindi months without timezone drift", () => {
    expect(formatDate("2026-10-25")).toBe("25 अक्टू 2026");
    expect(formatDate("2026-01-01", { long: true })).toBe("1 जनवरी 2026");
    expect(formatDate("2026-03-09", { withYear: false })).toBe("9 मार्च");
    expect(formatDate(null)).toBe("");
    expect(formatDate("nonsense")).toBe("");
  });

  it("formatDateTime uses IST and 12-hour clock", () => {
    expect(formatDateTime("2026-10-05T10:10:00Z")).toBe("5 अक्टू 2026, 3:40 PM");
    expect(formatDateTime("2026-10-05T18:30:00Z")).toBe("6 अक्टू 2026, 12:00 AM");
    expect(formatDateTime("bad")).toBe("");
  });

  it("istDateOf returns the Indian calendar date", () => {
    expect(istDateOf("2026-10-05T20:00:00Z")).toBe("2026-10-06");
    expect(istDateOf(null)).toBeNull();
  });

  it("timeAgo buckets", () => {
    const now = new Date("2026-10-06T12:00:00Z");
    expect(timeAgo("2026-10-06T11:59:40Z", now)).toBe("अभी");
    expect(timeAgo("2026-10-06T11:55:00Z", now)).toBe("5 मिनट पहले");
    expect(timeAgo("2026-10-06T09:00:00Z", now)).toBe("3 घंटे पहले");
    expect(timeAgo("2026-10-05T11:00:00Z", now)).toBe("कल");
    expect(timeAgo("2026-10-02T12:00:00Z", now)).toBe("4 दिन पहले");
    expect(timeAgo("2026-09-01T12:00:00Z", now)).toBe("1 सितं 2026");
  });

  it("daysUntil counts calendar days", () => {
    expect(daysUntil("2026-10-10", "2026-10-06")).toBe(4);
    expect(daysUntil("2026-10-06", "2026-10-06")).toBe(0);
    expect(daysUntil("2026-10-01", "2026-10-06")).toBe(-5);
    expect(daysUntil("2027-03-01", "2027-02-28")).toBe(1);
    expect(daysUntil(null, "2026-10-06")).toBeNull();
  });

  it("formatRupees", () => {
    expect(formatRupees(0)).toBe("निःशुल्क");
    expect(formatRupees(150000)).toBe("₹1,50,000");
    expect(formatRupees(null)).toBe("");
  });
});
