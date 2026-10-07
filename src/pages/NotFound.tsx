import { Link, useLocation } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo/SEO";

export default function NotFound() {
  const location = useLocation();
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-10">
      <SEO title="पेज नहीं मिला | मालाणी बाड़मेर" description="यह पेज मौजूद नहीं है।" path={location.pathname} noindex />
      <div className="max-w-md text-center">
        <Compass aria-hidden className="mx-auto h-14 w-14 text-primary" />
        <p className="mt-4 font-hindi text-small font-semibold text-muted-foreground">404</p>
        <h1 className="font-hindi text-2xl font-bold">यह पेज नहीं मिला</h1>
        <p className="mt-2 font-hindi text-body text-muted-foreground">लिंक गलत हो सकता है या पेज हटा दिया गया है।</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild className="font-hindi"><Link to="/jobs">नौकरियाँ देखें</Link></Button>
          <Button asChild variant="outline" className="font-hindi"><Link to="/">होम</Link></Button>
        </div>
      </div>
    </div>
  );
}
