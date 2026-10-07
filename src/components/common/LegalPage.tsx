import type { ReactNode } from "react";
import { SEO } from "@/components/seo/SEO";

export function LegalPage({ title, path, description, updated, children }: { title: string; path: string; description: string; updated?: string; children: ReactNode }) {
  return (
    <div className="container-page max-w-3xl py-8">
      <SEO title={`${title} | मालाणी बाड़मेर`} description={description} path={path} lang="hi" />
      <h1 className="font-hindi text-2xl font-bold sm:text-3xl">{title}</h1>
      {updated && <p className="mt-1 font-hindi text-small text-muted-foreground">अंतिम अपडेट: {updated}</p>}
      <div className="post-body mt-6 font-hindi" lang="hi">{children}</div>
    </div>
  );
}
