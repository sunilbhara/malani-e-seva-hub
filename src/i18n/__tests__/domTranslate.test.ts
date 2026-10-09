import { afterEach, describe, expect, it } from "vitest";
import { startEnglish, translateText } from "@/i18n/domTranslate";
import { EN_UI } from "@/i18n/en-ui";

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("translateText", () => {
  it("translates exact interface strings and keeps surrounding spaces", () => {
    expect(translateText("होम")).toBe("Home");
    expect(translateText("  सेव करें ")).toBe("  Save ");
  });

  it("fills patterns, translating the inner parts too", () => {
    expect(translateText("12 दिन बचे")).toBe("12 days left");
    expect(translateText("अंतिम तिथि 6 नवं 2026")).toBe("Last date 6 Nov 2026");
    expect(translateText("मेरी नौकरियाँ | मालाणी बाड़मेर")).toBe("My jobs | Malani Barmer");
  });

  it("handles dates and relative times through known tokens only", () => {
    expect(translateText("8 अक्टू 2026")).toBe("8 Oct 2026");
    expect(translateText("8 अक्टूबर 2026, 11:16 PM")).toBe("8 October 2026, 11:16 PM");
    expect(translateText("राजस्थान पुलिस कांस्टेबल भर्ती 2026")).toBeNull();
  });

  it("leaves non-Hindi text alone", () => {
    expect(translateText("RRB NTPC 2026")).toBeNull();
    expect(translateText("")).toBeNull();
  });

  it("every dictionary entry has an English value without Hindi left in it", () => {
    for (const [hi, en] of Object.entries(EN_UI)) {
      expect(en.trim().length, hi).toBeGreaterThan(0);
      if (hi !== "पुष्टि के लिए हटाएँ लिखें") expect(/[ऀ-ॿ]/.test(en), hi).toBe(false);
      expect(hi.split("{}").length, hi).toBe(en.split("{}").length);
    }
  });
});

describe("startEnglish", () => {
  let stop: (() => void) | null = null;
  afterEach(() => {
    stop?.();
    stop = null;
    document.body.innerHTML = "";
  });

  it("translates the interface, skips post content and inputs, follows updates and restores Hindi", async () => {
    document.body.innerHTML = `
      <nav><a href="/" aria-label="मुख्य सामग्री पर जाएँ">होम</a></nav>
      <input placeholder="आपका ईमेल" value="राम">
      <div class="post-body"><p>होम</p></div>
      <p id="live">सेव करें</p>
      <section data-no-translate><span>होम</span></section>`;
    document.title = "मेरी नौकरियाँ | मालाणी बाड़मेर";
    stop = startEnglish();

    expect(document.querySelector("nav a")!.textContent).toBe("Home");
    expect(document.querySelector("nav a")!.getAttribute("aria-label")).toBe("Skip to main content");
    expect(document.querySelector("input")!.getAttribute("placeholder")).toBe("Your email");
    expect((document.querySelector("input") as HTMLInputElement).value).toBe("राम");
    expect(document.querySelector(".post-body p")!.textContent).toBe("होम");
    expect(document.querySelector("[data-no-translate] span")!.textContent).toBe("होम");
    expect(document.title).toBe("My jobs | Malani Barmer");

    // React re-rendering a node with new Hindi text is translated again.
    document.getElementById("live")!.firstChild!.nodeValue = "सेव है";
    await tick();
    expect(document.getElementById("live")!.textContent).toBe("Saved");
    // New nodes added later are translated too.
    document.body.insertAdjacentHTML("beforeend", "<button>रद्द करें</button>");
    await tick();
    expect(document.querySelector("button")!.textContent).toBe("Cancel");

    stop();
    stop = null;
    expect(document.querySelector("nav a")!.textContent).toBe("होम");
    expect(document.getElementById("live")!.textContent).toBe("सेव है");
    expect(document.querySelector("input")!.getAttribute("placeholder")).toBe("आपका ईमेल");
  });
});
