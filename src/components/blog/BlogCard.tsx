import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { MessageCircle, Heart, Clock, User } from "lucide-react";
import type { PostWithStats } from "@/services/posts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { hi } from "@/lib/blogHindi";
import { glassCardClass } from "@/lib/blogBrand";
import { HindiTypography } from "@/components/blog/HindiTypography";
import { cn } from "@/lib/utils";

dayjs.extend(relativeTime);

type BlogCardProps = {
  post: PostWithStats;
  index?: number;
  className?: string;
};

function initials(name: string | null | undefined) {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function BlogCard({ post, index = 0, className }: BlogCardProps) {
  const authorName = post.author?.full_name ?? "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={cn("h-full", className)}
    >
      <Link to={`/blog/${post.id}`} className="group block h-full outline-none">
        <article
          className={cn(
            glassCardClass(
              "flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-900/10",
            ),
          )}
        >
          <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50">
            {post.image_url ? (
              <img
                src={post.image_url}
                alt=""
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-amber-800/40">
                <span className="font-hindi text-sm font-medium">{hi.noCover}</span>
              </div>
            )}
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              <Badge className="border-0 bg-white/90 text-xs font-semibold text-amber-900 shadow-sm backdrop-blur-md">
                {hi.article}
              </Badge>
            </div>
          </div>

          <div className="flex flex-1 flex-col p-5">
            <HindiTypography as="h3" className="line-clamp-2 text-lg font-semibold text-gray-900 group-hover:text-amber-800">
              {post.title}
            </HindiTypography>
            <p className="mt-2 line-clamp-2 flex-1 font-hindi text-sm leading-relaxed text-gray-600">{post.excerpt}</p>

            <div className="mt-4 flex items-center gap-3 border-t border-amber-100/80 pt-4">
              <Avatar className="h-9 w-9 border border-amber-100 shadow-sm">
                {post.author?.avatar_url && <AvatarImage src={post.author.avatar_url} alt="" />}
                <AvatarFallback className="text-xs font-medium">{initials(authorName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-hindi text-sm font-semibold text-gray-900">{authorName}</p>
                <p className="font-hindi text-xs text-gray-500">{dayjs(post.created_at).fromNow()}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-hindi text-xs text-gray-600">
              <span className="inline-flex items-center gap-1">
                <Heart className="h-3.5 w-3.5 text-rose-500" aria-hidden />
                {post.likes_count}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5 text-sky-600" aria-hidden />
                {post.comments_count}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-600" aria-hidden />
                {post.read_time_min} {hi.minRead}
              </span>
              <span className="inline-flex items-center gap-1 sm:ml-auto">
                <User className="h-3.5 w-3.5 opacity-70" aria-hidden />
                {dayjs(post.created_at).format("D MMM, YYYY")}
              </span>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
