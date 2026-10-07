import { describe, expect, it } from "vitest";
import { loginUrl, safeHttpUrl, safeRedirectPath } from "@/lib/url";
import { formHelpMessage, postUrl, shareText, whatsappShareUrl } from "@/lib/share";
import { escapeHtml, excerptOf, plainTextToHtml, preparePostHtml, stripHtml } from "@/lib/html";

describe("url safety (audit S14, open redirects)", () => {
  it("safeHttpUrl rejects non-http schemes", () => {
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("data:text/html,x")).toBeNull();
    expect(safeHttpUrl("not a url")).toBeNull();
    expect(safeHttpUrl(" https://rpsc.rajasthan.gov.in/a ")).toBe("https://rpsc.rajasthan.gov.in/a");
  });
  it("safeRedirectPath only allows same-origin paths", () => {
    expect(safeRedirectPath("/my")).toBe("/my");
    expect(safeRedirectPath("//evil.com")).toBe("/");
    expect(safeRedirectPath("/\\evil.com")).toBe("/");
    expect(safeRedirectPath("https://evil.com")).toBe("/");
    expect(safeRedirectPath(null, "/jobs")).toBe("/jobs");
  });
  it("loginUrl encodes the return path", () => {
    expect(loginUrl("/blog/a?b=1", "signup")).toBe("/login?redirect=%2Fblog%2Fa%3Fb%3D1&action=signup");
  });
});

describe("share", () => {
  it("postUrl adds UTM tags", () => {
    expect(postUrl("rpsc-2026", "whatsapp")).toMatch(/\/blog\/rpsc-2026\?utm_source=whatsapp&utm_medium=share$/);
  });
  it("shareText includes facts and link", () => {
    const text = shareText({ title: "RPSC भर्ती", slug: "rpsc", totalPosts: 2500, lastDate: "2026-10-25" });
    expect(text).toContain("RPSC भर्ती");
    expect(text).toContain("2,500 पद");
    expect(text).toContain("अंतिम तिथि 25 अक्टू 2026");
    expect(text).toContain("/blog/rpsc?utm_source=whatsapp");
  });
  it("whatsappShareUrl encodes text", () => {
    expect(whatsappShareUrl("a b&c")).toBe("https://wa.me/?text=a%20b%26c");
  });
  it("formHelpMessage mentions the post", () => {
    expect(formHelpMessage("पटवारी")).toContain('"पटवारी"');
    expect(formHelpMessage()).toContain("सरकारी फॉर्म");
  });
});

describe("html", () => {
  it("preparePostHtml strips scripts, handlers and javascript: links", () => {
    const { html } = preparePostHtml('<p onclick="x()">hi</p><script>alert(1)</script><a href="javascript:alert(1)">a</a><iframe src="x"></iframe>');
    expect(html).not.toMatch(/script|onclick|javascript:|iframe/i);
    expect(html).toContain("<p>hi</p>");
  });
  it("links open safely in a new tab", () => {
    const { html } = preparePostHtml('<p><a href="https://rpsc.rajasthan.gov.in">RPSC</a></p>');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer nofollow"');
  });
  it("headings get stable ids for the table of contents", () => {
    const { html, headings } = preparePostHtml('<h2 id="evil">योग्यता</h2><p>x</p><h3>आयु</h3>');
    expect(headings).toEqual([
      { id: "section-1", text: "योग्यता", level: 2 },
      { id: "section-2", text: "आयु", level: 3 },
    ]);
    expect(html).not.toContain("evil");
  });
  it("plain text becomes escaped paragraphs", () => {
    expect(plainTextToHtml("a <b>\nc\n\nd")).toBe("<p>a &lt;b&gt;<br>c</p><p>d</p>");
    expect(escapeHtml("<&>")).toBe("&lt;&amp;&gt;");
  });
  it("stripHtml and excerptOf", () => {
    expect(stripHtml("<p>a&nbsp;b</p><p>c</p>")).toBe("a b c");
    expect(excerptOf("<p>" + "क".repeat(200) + "</p>", 10)).toBe("क".repeat(9) + "…");
  });
});
