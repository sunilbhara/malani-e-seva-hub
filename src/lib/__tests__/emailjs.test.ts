import { beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn();
vi.mock("@emailjs/browser", () => ({ default: { send } }));

const { sendEnquiry, EnquiryError } = await import("@/lib/emailjs");

describe("sendEnquiry spam guard (audit S11)", () => {
  beforeEach(() => {
    send.mockReset();
    vi.stubEnv("VITE_EMAILJS_SERVICE_ID", "svc");
    vi.stubEnv("VITE_EMAILJS_PUBLIC_KEY", "pk");
  });

  const human = () => ({ honeypot: "", startedAt: Date.now() - 10_000 });

  it("refuses when EmailJS is not configured", async () => {
    await expect(sendEnquiry(undefined, {}, human())).rejects.toMatchObject({ code: "not_configured" });
  });

  it("drops bots that fill the honeypot or submit instantly", async () => {
    await expect(sendEnquiry("tpl", {}, { honeypot: "x", startedAt: 0 })).rejects.toMatchObject({ code: "spam" });
    await expect(sendEnquiry("tpl", {}, { honeypot: "", startedAt: Date.now() })).rejects.toMatchObject({ code: "spam" });
    expect(send).not.toHaveBeenCalled();
  });

  it("sends once, then throttles for a minute", async () => {
    send.mockResolvedValue({ status: 200 });
    await sendEnquiry("tpl", { name: "राम" }, human());
    expect(send).toHaveBeenCalledTimes(1);
    await expect(sendEnquiry("tpl", {}, human())).rejects.toMatchObject({ code: "throttled" });
  });

  it("wraps provider failures", async () => {
    send.mockRejectedValue(new Error("network"));
    const error = await sendEnquiry("tpl", {}, human()).catch((e) => e);
    expect(error).toBeInstanceOf(EnquiryError);
    expect(error.code).toBe("failed");
  });
});
