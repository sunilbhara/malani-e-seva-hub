import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import { ArrowRight, Heart, MessageCircle, Clock } from "lucide-react";
import type { PostWithStats } from "@/services/posts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { hi } from "@/lib/blogHindi";
import { brandCtaClass, glassCardClass } from "@/lib/blogBrand";
import { HindiTypography } from "@/components/blog/HindiTypography";

type FeaturedArticleProps = {
  post: PostWithStats;
};

function initials(name: string | null | undefined) {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function FeaturedArticle({ post }: FeaturedArticleProps) {
  const authorName = post.author?.full_name ?? "—";

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={glassCardClass("relative mb-12 overflow-hidden shadow-2xl")}
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-orange-400/20 blur-3xl" />

      <div className="relative grid gap-0 lg:grid-cols-2">
        <div className="relative aspect-[4/3] min-h-[220px] overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 lg:aspect-auto lg:min-h-[360px]">
          {post.image_url ? (
            <img src={post.image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-[220px] items-center justify-center lg:min-h-0">
              <span className="font-hindi text-sm font-medium text-amber-800/50">{hi.noCover}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/20 to-transparent lg:bg-gradient-to-r" />
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-10 lg:pl-4">
          <Badge className="mb-4 w-fit border-0 bg-gradient-to-r from-[#ef4444] via-[#b45309] to-[#f59e0b] px-3 py-1 text-white shadow-md">
            {hi.featured}
          </Badge>
          <HindiTypography as="h1" className="text-balance text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-[2.25rem] xl:text-4xl">
            {post.title}
          </HindiTypography>
          <HindiTypography as="p" className="mt-4 text-pretty text-base text-gray-600 sm:text-lg">
            {post.excerpt}
          </HindiTypography>

          <div className="mt-6 flex flex-wrap items-center gap-4 font-hindi text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10 border border-amber-100 shadow-sm">
                {post.author?.avatar_url && <AvatarImage src={post.author.avatar_url} alt="" />}
                <AvatarFallback>{initials(authorName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-gray-900">{authorName}</p>
                <p>{dayjs(post.created_at).format("D MMMM, YYYY")}</p>
              </div>
            </div>
            <span className="hidden h-4 w-px bg-amber-200 sm:block" />
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4 text-rose-500" />
              {post.likes_count} {hi.likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4 text-sky-600" />
              {post.comments_count} {hi.comments}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-amber-600" />
              {post.read_time_min} {hi.minRead}
            </span>
          </div>

          <Button asChild size="lg" className={`mt-8 w-fit px-8 ${brandCtaClass}`}>
            <Link to={`/blog/${post.id}`} className="gap-2">
              {hi.readArticle}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.section>
  );
}
