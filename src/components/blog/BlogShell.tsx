import { SiteBlogLayout } from "@/components/blog/SiteBlogLayout";
import { cn } from "@/lib/utils";

type BlogShellProps = {
  children: React.ReactNode;
  className?: string;
};

/** @deprecated Prefer `SiteBlogLayout` — kept for backward compatibility. */
export function BlogShell({ children, className }: BlogShellProps) {
  return <SiteBlogLayout className={cn("pb-16", className)}>{children}</SiteBlogLayout>;
}
