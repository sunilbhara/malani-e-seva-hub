import { useEffect, useState, FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createPost, deletePost, getPosts, updatePost } from "@/services/posts";
import { toast } from "@/hooks/use-toast";

const Admin = () => {
  const { user, role, loading } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    setPosts(await getPosts());
  }

  useEffect(() => {
    if (role === "admin") refresh();
  }, [role]);

  if (loading) return <div className="p-10">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role !== "admin")
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p>You do not have admin access.</p>
        <Link to="/blog" className="text-primary underline">Go to blog</Link>
      </div>
    );

  function reset() {
    setEditingId(null);
    setTitle("");
    setContent("");
    setImageUrl("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await updatePost(editingId, { title, content, image_url: imageUrl || null });
        toast({ title: "Post updated" });
      } else {
        await createPost({ title, content, image_url: imageUrl || null }, user.id);
        toast({ title: "Post created" });
      }
      reset();
      await refresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    await deletePost(id);
    await refresh();
  }

  function onEdit(p: any) {
    setEditingId(p.id);
    setTitle(p.title);
    setContent(p.content);
    setImageUrl(p.image_url ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin · Blog Posts</h1>
          <Link to="/blog" className="text-sm text-primary underline">View blog</Link>
        </div>

        <Card className="mb-10">
          <CardHeader>
            <CardTitle>{editingId ? "Edit post" : "Create new post"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-3">
              <Input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Input
                placeholder="Image URL (optional)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <Textarea
                placeholder="Content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                required
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : editingId ? "Update post" : "Create post"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={reset}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {posts.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => onEdit(p)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => onDelete(p.id)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Admin;
