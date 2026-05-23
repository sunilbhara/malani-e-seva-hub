import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Bookmark, Heart, MessageCircle, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getProfile } from "@/services/profile";
import { getUserProfileSummary } from "@/services/blogExtras";
import { BlogShell } from "@/components/blog/BlogShell";
import { BlogCard } from "@/components/blog/BlogCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/seo/SEO";

type ProfileRecord = {
  full_name: string | null;
  avatar_url: string | null;
};

const Profile = () => {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getUserProfileSummary>> | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([getProfile(user.id), getUserProfileSummary(user.id)]).then(([profileData, summaryData]) => {
      setProfile(profileData);
      setSummary(summaryData);
    });
  }, [user]);

  if (loading) {
    return (
      <BlogShell>
        <Skeleton className="h-16 w-16 rounded-full" />
      </BlogShell>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const name = profile?.full_name || user.email || "User";

  return (
    <BlogShell>
      <SEO title="Profile - Malani Barmer" description="Your blog profile, saved posts, likes, and comments." path="/profile" noindex />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-4">
          <Avatar className="h-16 w-16 border border-amber-100 shadow-sm">
            <AvatarImage src={profile?.avatar_url ?? undefined} alt="" />
            <AvatarFallback><UserRound className="h-6 w-6" /></AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-hindi text-3xl font-bold text-gray-900">{name}</h1>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
        </div>

        {!summary ? (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-10">
            <section>
              <h2 className="mb-4 flex items-center gap-2 font-hindi text-2xl font-bold text-gray-900">
                <Bookmark className="h-5 w-5 text-amber-700" />
                Saved Posts
              </h2>
              {summary.bookmarked.length ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {summary.bookmarked.map((post, i) => <BlogCard key={post.id} post={post} index={i} />)}
                </div>
              ) : (
                <p className="rounded-2xl bg-amber-50 p-6 font-hindi text-sm text-gray-600">No saved posts yet.</p>
              )}
            </section>

            <section>
              <h2 className="mb-4 flex items-center gap-2 font-hindi text-2xl font-bold text-gray-900">
                <Heart className="h-5 w-5 text-rose-600" />
                Liked Posts
              </h2>
              {summary.liked.length ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {summary.liked.map((post, i) => <BlogCard key={post.id} post={post} index={i} />)}
                </div>
              ) : (
                <p className="rounded-2xl bg-amber-50 p-6 font-hindi text-sm text-gray-600">No liked posts yet.</p>
              )}
            </section>

            <Card className="border-amber-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-hindi">
                  <MessageCircle className="h-5 w-5 text-sky-600" />
                  Recent Comments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {summary.comments.length ? summary.comments.slice(0, 8).map((comment) => (
                  <Link key={comment.id} to={`/blog/${comment.post_slug ?? comment.post_id}`} className="block rounded-xl border border-amber-100 p-3 hover:bg-amber-50">
                    <p className="font-hindi text-sm text-gray-900">{comment.content}</p>
                    <p className="mt-1 font-hindi text-xs text-gray-500">{comment.post_title ?? "Blog post"}</p>
                  </Link>
                )) : <p className="font-hindi text-sm text-gray-600">No comments yet.</p>}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </BlogShell>
  );
};

export default Profile;
