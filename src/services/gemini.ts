import { supabase } from "@/integrations/supabase/client";

export interface GeneratedBlog {
  title: string;
  metaDescription: string;
  content: string;
}

/**
 * Generates a Hindi SEO blog draft by calling the secure `generate-blog`
 * Supabase Edge Function. The Gemini API key never leaves the backend.
 */
export async function generateHindiBlogWithGemini(rawDetails: string): Promise<GeneratedBlog> {
  const trimmed = rawDetails.trim();
  if (!trimmed) throw new Error("Please provide details to generate the blog.");

  const { data, error } = await supabase.functions.invoke<GeneratedBlog | { error: string }>(
    "generate-blog",
    { body: { rawDetails: trimmed } },
  );

  if (error) throw new Error(error.message || "Failed to generate blog.");
  if (!data || "error" in data) {
    throw new Error((data && "error" in data && data.error) || "Failed to generate blog.");
  }
  return data;
}
