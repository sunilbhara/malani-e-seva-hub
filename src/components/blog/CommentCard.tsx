import { motion } from "framer-motion";
import dayjs from "dayjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type CommentWithUser = {
  id: string;
  content: string;
  created_at: string;
  user: { full_name: string | null; avatar_url: string | null } | null;
};

type CommentCardProps = {
  comment: CommentWithUser;
  index?: number;
  className?: string;
};

function initials(name: string | null | undefined) {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CommentCard({ comment, index = 0, className }: CommentCardProps) {
  const name = comment.user?.full_name ?? "सदस्य";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className={cn(
        "rounded-2xl border border-amber-100/90 bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:p-5",
        className,
      )}
    >
      <div className="flex gap-3 sm:gap-4">
        <Avatar className="h-10 w-10 shrink-0 border border-amber-100 shadow-sm sm:h-11 sm:w-11">
          {comment.user?.avatar_url && <AvatarImage src={comment.user.avatar_url} alt="" />}
          <AvatarFallback className="text-xs font-semibold">{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-hindi font-semibold text-gray-900">{name}</span>
            <time className="font-hindi text-xs text-gray-500" dateTime={comment.created_at}>
              {dayjs(comment.created_at).format("D MMM, YYYY · h:mm A")}
            </time>
          </div>
          <p className="mt-2 whitespace-pre-wrap font-hindi text-sm leading-relaxed text-gray-800">{comment.content}</p>
        </div>
      </div>
    </motion.div>
  );
}
