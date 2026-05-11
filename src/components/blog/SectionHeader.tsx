import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
};

export function SectionHeader({ eyebrow, title, description, className, action }: SectionHeaderProps) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between", className)}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.4 }}
      >
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">{eyebrow}</p>
        )}
        <h2 className="font-hindi text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{title}</h2>
        {description && (
          <p className="mt-2 max-w-xl font-hindi text-sm leading-relaxed text-gray-600 sm:text-base">{description}</p>
        )}
      </motion.div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
