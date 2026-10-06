import { describe, expect, it } from "vitest";
import { countdownLabel, jobStatus, parseExtraDates, parseFees, qualificationLabel, statusClasses } from "@/lib/jobs";

describe("jobStatus (mirrors list_posts SQL)", () => {
  const today = "2026-10-06";
  it("returns null without a last date", () => expect(jobStatus(null, null, today)).toBeNull());
  it("closed after the last date", () => expect(jobStatus("2026-10-05", null, today)).toBe("closed"));
  it("closing within 7 days, including today", () => {
    expect(jobStatus("2026-10-06", null, today)).toBe("closing");
    expect(jobStatus("2026-10-13", null, today)).toBe("closing");
  });
  it("open beyond 7 days", () => expect(jobStatus("2026-10-14", null, today)).toBe("open"));
  it("upcoming when applications have not started", () => expect(jobStatus("2026-11-30", "2026-10-20", today)).toBe("upcoming"));
  it("started applications are open", () => expect(jobStatus("2026-11-30", "2026-10-06", today)).toBe("open"));
});

describe("countdownLabel", () => {
  const today = "2026-10-06";
  it.each([
    ["2026-10-05", "आवेदन बंद"],
    ["2026-10-06", "आज अंतिम दिन"],
    ["2026-10-07", "कल अंतिम दिन"],
    ["2026-10-26", "20 दिन बचे"],
  ])("%s gives %s", (date, label) => expect(countdownLabel(date, today)).toBe(label));
  it("empty without a date", () => expect(countdownLabel(null, today)).toBe(""));
});

describe("statusClasses", () => {
  it("urgent colour on the last day", () => expect(statusClasses("closing", 1)).toContain("status-urgent"));
  it("soon colour within the week", () => expect(statusClasses("closing", 5)).toContain("status-soon"));
  it("closed is muted", () => expect(statusClasses("closed")).toContain("status-closed"));
});

describe("parsers and labels", () => {
  it("parseFees keeps only well-formed rows", () => {
    expect(parseFees([{ category: "सामान्य", amount: 600 }, { category: "x" }, null, "a"])).toEqual([{ category: "सामान्य", amount: 600 }]);
    expect(parseFees("nope")).toEqual([]);
  });
  it("parseExtraDates keeps only well-formed rows", () => {
    expect(parseExtraDates([{ label: "सुधार", date: "2026-10-20" }, { label: 1, date: "x" }])).toEqual([{ label: "सुधार", date: "2026-10-20" }]);
  });
  it("labels fall back to the raw value", () => {
    expect(qualificationLabel("unknown-x")).toBe("unknown-x");
    expect(qualificationLabel(null)).toBe("");
  });
});
