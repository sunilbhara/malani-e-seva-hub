import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { hi } from "@/lib/blogHindi";
import { glassCardClass } from "@/lib/blogBrand";

type Author = {
  full_name: string | null;
  avatar_url: string | null;
} | null;

type AuthorCardProps = {
  author: Author;
};

function initials(name: string | null | undefined) {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AuthorCard({ author }: AuthorCardProps) {
  const name = author?.full_name ?? "—";

  return (
    <motion.aside
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className={glassCardClass("p-5")}
    >
      <p className="mb-3 font-hindi text-xs font-semibold uppercase tracking-wider text-gray-500">{hi.writtenBy}</p>
      <div className="flex gap-4">
        <Avatar className="h-14 w-14 border-2 border-white shadow-md ring-1 ring-amber-100">
          {author?.avatar_url && <AvatarImage src={author.avatar_url} alt="" />}
          <AvatarFallback className="text-lg font-semibold">{initials(name)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-hindi text-lg font-semibold text-gray-900">{name}</p>
          <p className="mt-1 flex items-center gap-1.5 font-hindi text-sm text-gray-600">
            <Mail className="h-3.5 w-3.5 shrink-0 text-amber-600" />
            {hi.contributorLine}
          </p>
        </div>
      </div>
    </motion.aside>
  );
}
