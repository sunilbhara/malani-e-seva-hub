import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

const token = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1200px" },
    },
    extend: {
      fontFamily: {
        sans: ["Noto Sans Devanagari Variable", "Nirmala UI", "system-ui", "sans-serif"],
        hindi: ["Noto Sans Devanagari Variable", "Nirmala UI", "Mangal", "sans-serif"],
      },
      fontSize: {
        // Mobile-first scale, ratio ≈1.2 (Blueprint §5.1)
        caption: ["0.8125rem", { lineHeight: "1.45", fontWeight: "600" }],
        small: ["0.875rem", { lineHeight: "1.5" }],
        body: ["1rem", { lineHeight: "1.6" }],
        "body-lg": ["1.0625rem", { lineHeight: "1.75" }],
      },
      colors: {
        border: token("border"),
        input: token("input"),
        ring: token("ring"),
        background: token("background"),
        foreground: token("foreground"),
        body: token("body"),
        link: token("link"),
        brand: { DEFAULT: token("brand"), foreground: token("brand-foreground") },
        primary: { DEFAULT: token("primary"), foreground: token("primary-foreground") },
        secondary: { DEFAULT: token("secondary"), foreground: token("secondary-foreground") },
        destructive: { DEFAULT: token("destructive"), foreground: token("destructive-foreground") },
        muted: { DEFAULT: token("muted"), foreground: token("muted-foreground") },
        accent: { DEFAULT: token("accent"), foreground: token("accent-foreground"), soft: token("accent-soft") },
        popover: { DEFAULT: token("popover"), foreground: token("popover-foreground") },
        card: { DEFAULT: token("card"), foreground: token("card-foreground") },
        status: {
          open: token("status-open"),
          "open-bg": token("status-open-bg"),
          soon: token("status-soon"),
          "soon-bg": token("status-soon-bg"),
          urgent: token("status-urgent"),
          "urgent-bg": token("status-urgent-bg"),
          closed: token("status-closed"),
          "closed-bg": token("status-closed-bg"),
        },
        type: {
          job: token("type-job"),
          admit: token("type-admit"),
          result: token("type-result"),
          exam: token("type-exam"),
          news: token("type-news"),
        },
        whatsapp: { DEFAULT: token("whatsapp"), foreground: token("whatsapp-foreground") },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        1: "var(--shadow-1)",
        2: "var(--shadow-2)",
      },
      spacing: {
        "bottom-nav": "var(--bottom-nav-height)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "shop-progress": { from: { transform: "scaleX(0)" }, to: { transform: "scaleX(1)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.25s ease-out both",
        // Duration is set inline from the slider's autoplay interval.
        "shop-progress": "shop-progress 4.5s linear forwards",
      },
    },
  },
  plugins: [animate, typography],
} satisfies Config;
