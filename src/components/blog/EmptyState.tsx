import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon: Icon, title, description, className, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-amber-200/80 bg-white/70 px-6 py-16 text-center shadow-inner backdrop-blur-sm",
        className,
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-800/80 shadow-inner">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="font-hindi text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-2 max-w-md font-hindi text-sm text-gray-600">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
