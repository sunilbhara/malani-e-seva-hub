import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  posts: (params: unknown) => ["posts", params] as const,
  post: (identifier: string) => ["post", identifier] as const,
  related: (id: string) => ["related", id] as const,
  threads: (postId: string) => ["threads", postId] as const,
  notifications: (userId: string) => ["notifications", userId] as const,
  unread: (userId: string) => ["unread", userId] as const,
  bookmarks: (userId: string) => ["bookmarks", userId] as const,
  liked: (postId: string, userId: string) => ["liked", postId, userId] as const,
  follows: (userId: string) => ["follows", userId] as const,
  reminders: (userId: string) => ["reminders", userId] as const,
  quiz: (date: string) => ["quiz", date] as const,
  adminPosts: (params: unknown) => ["admin", "posts", params] as const,
  analytics: ["admin", "analytics"] as const,
  moderation: ["admin", "moderation"] as const,
  adminIds: ["admin", "ids"] as const,
};
