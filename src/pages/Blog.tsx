import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPosts } from "@/services/posts";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { logout } from "@/services/auth";

const Blog = () => {
  const { user, role } = useAuth();
  const [posts, setPosts] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPosts()
      .then(setPosts)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl">Malani Barmer</Link>
          <nav className="flex items-center gap-3">
            <Link to="/blog" className="text-sm font-medium hover:text-primary">Blog</Link>
            {role === "admin" && (
              <Link to="/admin" className="text-sm font-medium hover:text-primary">Admin</Link>
            )}
            {user ? (
              <Button size="sm" variant="outline" onClick={() => logout()}>Logout</Button>
            ) : (
              <Link to="/login"><Button size="sm">Login</Button></Link>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold mb-8">Blog</h1>

        {error && <p className="text-destructive">{error}</p>}

        {!posts && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        )}

        {posts && posts.length === 0 && (
          <p className="text-muted-foreground">No posts yet. Check back soon!</p>
        )}

        {posts && posts.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p) => (
              <Link key={p.id} to={`/blog/${p.id}`}>
                <Card className="overflow-hidden h-full hover:shadow-lg transition">
                  {p.image_url && (
                    <img
                      src={p.image_url}
                      alt={p.title}
                      className="w-full h-44 object-cover"
                      loading="lazy"
                    />
                  )}
                  <CardContent className="p-4 space-y-2">
                    <h2 className="font-semibold text-lg line-clamp-2">{p.title}</h2>
                    <p className="text-sm text-muted-foreground line-clamp-2">{p.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.author?.full_name ?? "Unknown"} ·{" "}
                      {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Blog;
