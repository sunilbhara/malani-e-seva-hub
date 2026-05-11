import DOMPurify from "dompurify";
import { isRichHtml } from "@/lib/blogUtils";
import { HindiTypography } from "@/components/blog/HindiTypography";
import { cn } from "@/lib/utils";
import "@/components/blog/rich-text.css";

type PostBodyProps = {
  content: string;
  className?: string;
};

export function PostBody({ content, className }: PostBodyProps) {
  if (isRichHtml(content)) {
    const safe = DOMPurify.sanitize(content, { USE_PROFILES: { html: true } });
    return (
      <div
        className={cn(
          "tiptap-render prose prose-lg prose-neutral max-w-none dark:prose-invert",
          className,
        )}
        lang="hi"
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    );
  }

  return (
    <HindiTypography as="div" className={cn("whitespace-pre-wrap text-lg text-gray-900 sm:text-[1.05rem]", className)}>
      {content}
    </HindiTypography>
  );
}
