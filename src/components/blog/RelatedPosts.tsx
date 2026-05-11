import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import { ArrowUpRight } from "lucide-react";
import type { PostWithAuthor } from "@/services/posts";
import { SectionHeader } from "./SectionHeader";
import { hi } from "@/lib/blogHindi";
import { glassCardClass } from "@/lib/blogBrand";
import { HindiTypography } from "@/components/blog/HindiTypography";

type RelatedPostsProps = {
  posts: PostWithAuthor[];
};

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-16 border-t border-amber-100/90 pt-12">
      <SectionHeader title={hi.relatedTitle} description={hi.relatedDesc} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
          >
            <Link
              to={`/blog/${p.id}`}
              className={glassCardClass(
                "group flex gap-4 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-900/10",
              )}
            >
              <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-orange-50">
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-amber-700/50">—</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <HindiTypography as="h3" className="line-clamp-2 font-semibold leading-snug text-gray-900 group-hover:text-amber-800">
                  {p.title}
                </HindiTypography>
                <p className="mt-1 font-hindi text-xs text-gray-500">{dayjs(p.created_at).format("D MMM, YYYY")}</p>
                <span className="mt-2 inline-flex items-center gap-1 font-hindi text-xs font-semibold text-amber-700">
                  {hi.read}
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
