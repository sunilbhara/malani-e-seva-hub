import { cn } from "@/lib/utils";

type HindiTypographyProps = {
  as?: "div" | "article" | "section" | "p" | "h1" | "h2" | "h3";
  className?: string;
  children: React.ReactNode;
};

/**
 * Devanagari-friendly line height and tracking for Hindi blog copy.
 * Uses global `.font-hindi` (Noto Sans Devanagari) from `index.css`.
 */
export function HindiTypography({ as: Tag = "div", className, children }: HindiTypographyProps) {
  return (
    <Tag
      className={cn(
        "font-hindi text-pretty leading-[1.75] tracking-normal antialiased",
        "[word-spacing:0.05em]",
        className,
      )}
      lang="hi"
    >
      {children}
    </Tag>
  );
}
