import { useEffect, useState, FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Heart } from "lucide-react";
import { getPostById } from "@/services/posts";
import { getComments, addComment } from "@/services/comments";
import { getLikesCount, hasUserLiked, likePost, unlikePost } from "@/services/likes";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getPostById(id),
      getComments(id),
      getLikesCount(id),
      user ? hasUserLiked(id, user.id) : Promise.resolve(false),
    ])
      .then(([p, c, l, hl]) => {
        setPost(p);
        setComments(c);
        setLikes(l);
        setLiked(hl);
      })
      .finally(() => setLoading(false));
  }, [id, user]);

  async function toggleLike() {
    if (!user || !id) {
      toast({ title: "Please sign in to like posts" });
      return;
    }
    if (liked) {
      await unlikePost(id, user.id);
      setLiked(false);
      setLikes((n) => Math.max(0, n - 1));
    } else {
      await likePost(id, user.id);
      setLiked(true);
      setLikes((n) => n + 1);
    }
  }

  async function onAddComment(e: FormEvent) {
    e.preventDefault();
    if (!user || !id || !comment.trim()) return;
    setSubmitting(true);
    try {
      await addComment(id, user.id, comment.trim());
      setComment("");
      const fresh = await getComments(id);
      setComments(fresh);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-3xl space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p>Post not found.</p>
        <Link to="/blog" className="text-primary underline">Back to blog</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <Link to="/blog" className="text-sm text-muted-foreground hover:text-primary">
          ← Back to blog
        </Link>

        <article className="mt-6 space-y-4">
          <h1 className="text-4xl font-bold">{post.title}</h1>
          <p className="text-sm text-muted-foreground">
            {post.author?.full_name ?? "Unknown"} ·{" "}
            {new Date(post.created_at).toLocaleDateString()}
          </p>
          {post.image_url && (
            <img src={post.image_url} alt={post.title} className="w-full rounded-lg" />
          )}
          <div className="prose max-w-none whitespace-pre-wrap">{post.content}</div>
        </article>

        <div className="mt-6 flex items-center gap-3">
          <Button variant={liked ? "default" : "outline"} onClick={toggleLike}>
            <Heart className={liked ? "fill-current" : ""} />
            {likes} {likes === 1 ? "Like" : "Likes"}
          </Button>
        </div>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-4">Comments ({comments.length})</h2>

          {user ? (
            <form onSubmit={onAddComment} className="space-y-2 mb-6">
              <Textarea
                placeholder="Write a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
              <Button type="submit" disabled={submitting || !comment.trim()}>
                {submitting ? "Posting..." : "Post comment"}
              </Button>
            </form>
          ) : (
            <p className="mb-6 text-sm text-muted-foreground">
              <Link to="/login" className="text-primary underline">Sign in</Link> to comment.
            </p>
          )}

          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="border rounded-lg p-4">
                <p className="text-sm font-medium">{c.user?.full_name ?? "User"}</p>
                <p className="text-xs text-muted-foreground mb-2">
                  {new Date(c.created_at).toLocaleString()}
                </p>
                <p className="whitespace-pre-wrap">{c.content}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-sm text-muted-foreground">Be the first to comment.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default BlogPost;
