import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { ArrowRight, BookOpen } from "lucide-react";
import { getPostsWithStats, type PostWithStats } from "@/services/posts";
import { hi } from "@/lib/blogHindi";
import { brandCtaClass, brandHeadingClass, glassCardClass } from "@/lib/blogBrand";
import { HindiTypography } from "@/components/blog/HindiTypography";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";

export function FeaturedBlogSection() {
  const [posts, setPosts] = useState<PostWithStats[] | null>(null);
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.08 });

  useEffect(() => {
    getPostsWithStats()
      .then((p) => setPosts(p.slice(0, 3)))
      .catch(() => setPosts([]));
  }, []);

  if (posts && posts.length === 0) return null;

  return (
    <section ref={ref} className="relative overflow-hidden py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(251,191,36,0.18),transparent)]" />
      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 flex flex-col gap-4 text-center sm:mb-12 sm:text-left"
        >
          <div className="inline-flex items-center justify-center gap-2 self-center rounded-full border border-amber-200/80 bg-white/70 px-4 py-1.5 text-sm font-semibold text-amber-800 shadow-sm backdrop-blur-sm sm:self-start">
            <BookOpen className="h-4 w-4" />
            {hi.homeFeaturedEyebrow}
          </div>
          <h2 className={brandHeadingClass("text-3xl font-bold sm:text-4xl")}>{hi.homeFeaturedTitle}</h2>
          <HindiTypography className="mx-auto max-w-2xl text-lg text-gray-600 sm:mx-0">{hi.homeFeaturedSubtitle}</HindiTypography>
        </motion.div>

        {!posts && (
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-white/60 shadow-inner" />
            ))}
          </div>
        )}

        {posts && posts.length > 0 && (
          <div className="grid gap-6 md:grid-cols-3">
            {posts.map((p, i) => (
              <motion.article
                key={p.id}
                initial={{ opacity: 0, y: 28 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className={glassCardClass("group flex flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-1")}
              >
                <Link to={`/blog/${p.slug ?? p.id}`} className="flex flex-1 flex-col">
                  <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-amber-800/50">{hi.noCover}</div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <HindiTypography as="h3" className="line-clamp-2 text-lg font-semibold text-gray-900 group-hover:text-amber-800">
                      {p.title}
                    </HindiTypography>
                    <p className="mt-2 line-clamp-2 flex-1 font-hindi text-sm leading-relaxed text-gray-600">{p.excerpt}</p>
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                      <span>{dayjs(p.created_at).format("D MMM, YYYY")}</span>
                      <span>
                        {p.likes_count} {hi.likes} · {p.comments_count} {hi.comments}
                      </span>
                    </div>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
                      {hi.readArticle}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="mt-10 flex justify-center sm:justify-end"
        >
          <Button asChild size="lg" className={brandCtaClass}>
            <Link to="/blog" className="gap-2 px-8">
              {hi.homeReadMore}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
