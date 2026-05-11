import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type AuthCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-100/80 bg-white/90 p-8 shadow-2xl shadow-amber-900/10 backdrop-blur-xl",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-12 h-40 w-40 rounded-full bg-orange-300/25 blur-3xl" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
