export function reminderText(r: { stage: "3d" | "1d"; title: string }) {
  return {
    title: r.stage === "1d" ? "⏰ कल अंतिम दिन!" : "⏰ 3 दिन बचे",
    body: `${r.title} — आवेदन की अंतिम तिथि ${r.stage === "1d" ? "कल" : "3 दिन बाद"} है। अभी फॉर्म भरें।`,
  };
}
