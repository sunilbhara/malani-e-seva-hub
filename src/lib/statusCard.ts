// 1080x1920 "WhatsApp Status" image for a job post (Blueprint Loop 5). Drawn on a canvas in the browser.
import { BUSINESS } from "@/lib/business";
import { countdownLabel } from "@/lib/jobs";
import { formatDate, formatNumber } from "@/lib/format";

export interface StatusCardInput {
  title: string;
  organisation?: string | null;
  totalPosts?: number | null;
  lastDate?: string | null;
  qualification?: string | null;
  slug: string;
  label?: string;
}

const W = 1080;
const H = 1920;
const FONT = '"Noto Sans Devanagari Variable", "Inter Variable", "Nirmala UI", sans-serif';

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.join(" ") !== lines.join(" ")) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\s+\S*$/, "")}…`;
  }
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function renderStatusCard(input: StatusCardInput): Promise<Blob> {
  if (document.fonts?.load) {
    await Promise.all([document.fonts.load(`700 64px ${FONT}`), document.fonts.load(`500 40px ${FONT}`)]).catch(() => undefined);
  }
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#1E3A8A");
  bg.addColorStop(1, "#1D4ED8");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Brand
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 52px ${FONT}`;
  ctx.fillText("मालाणी बाड़मेर", 90, 170);
  ctx.fillStyle = "#BFDBFE";
  ctx.font = `500 34px ${FONT}`;
  ctx.fillText("सरकारी नौकरी अपडेट", 90, 225);

  // Label
  const label = input.label ?? "नई भर्ती";
  ctx.font = `700 38px ${FONT}`;
  const labelWidth = ctx.measureText(label).width + 64;
  ctx.fillStyle = "#F59E0B";
  roundRect(ctx, 90, 320, labelWidth, 76, 38);
  ctx.fill();
  ctx.fillStyle = "#0F172A";
  ctx.fillText(label, 122, 372);

  // Title
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 78px ${FONT}`;
  const titleLines = wrap(ctx, input.title, W - 180, 5);
  titleLines.forEach((line, i) => ctx.fillText(line, 90, 520 + i * 108));
  let y = 520 + titleLines.length * 108 + 40;

  if (input.organisation) {
    ctx.fillStyle = "#BFDBFE";
    ctx.font = `500 42px ${FONT}`;
    ctx.fillText(input.organisation.slice(0, 40), 90, y);
    y += 60;
  }

  // Facts panel
  const facts = [
    input.totalPosts ? ["कुल पद", formatNumber(input.totalPosts)] : null,
    input.qualification ? ["योग्यता", input.qualification] : null,
    input.lastDate ? ["अंतिम तिथि", formatDate(input.lastDate)] : null,
  ].filter(Boolean) as Array<[string, string]>;
  if (facts.length) {
    y += 40;
    const panelH = 70 + facts.length * 110;
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    roundRect(ctx, 90, y, W - 180, panelH, 40);
    ctx.fill();
    facts.forEach(([label, value], i) => {
      const rowY = y + 100 + i * 110;
      ctx.fillStyle = "#BFDBFE";
      ctx.font = `500 38px ${FONT}`;
      ctx.fillText(label, 140, rowY);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 50px ${FONT}`;
      const w = ctx.measureText(value).width;
      ctx.fillText(value, W - 140 - w, rowY);
    });
    y += panelH;
  }

  if (input.lastDate) {
    const countdown = countdownLabel(input.lastDate);
    if (countdown && countdown !== "आवेदन बंद") {
      y += 70;
      ctx.fillStyle = "#FEF3C7";
      roundRect(ctx, 90, y, W - 180, 110, 30);
      ctx.fill();
      ctx.fillStyle = "#92400E";
      ctx.font = `700 50px ${FONT}`;
      ctx.fillText(`⏰ ${countdown}`, 140, y + 72);
    }
  }

  // Footer CTA
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 46px ${FONT}`;
  ctx.fillText("पूरी जानकारी और फॉर्म:", 90, H - 300);
  ctx.fillStyle = "#FBBF24";
  ctx.font = `700 50px ${FONT}`;
  ctx.fillText("malanibarmer.com", 90, H - 230);
  ctx.fillStyle = "#BFDBFE";
  ctx.font = `500 36px ${FONT}`;
  ctx.fillText(`फॉर्म भरवाएँ: ${BUSINESS.phone}`, 90, H - 160);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/png"));
}
