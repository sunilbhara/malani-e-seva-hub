import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FcGoogle } from "react-icons/fc";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, signUp, signInWithGoogle } from "@/services/auth";
import { AuthCard } from "@/components/blog/AuthCard";
import { SiteBlogLayout } from "@/components/blog/SiteBlogLayout";
import { HindiTypography } from "@/components/blog/HindiTypography";
import { brandCtaClass, brandHeadingClass } from "@/lib/blogBrand";
import { cn } from "@/lib/utils";
import { SEO } from "@/components/seo/SEO";

const Login = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("ईमेल और पासवर्ड आवश्यक हैं।");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("स्वागत है!");
        navigate("/blog");
      } else {
        await signUp(email, password, fullName);
        toast.success("खाता बन गया — कृपया ईमेल से पुष्टि करें।");
        setMode("login");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "कुछ गलत हो गया।";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onGoogle() {
    setGoogleBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google साइन-इन असफल।";
      setError(message);
      toast.error(message);
    } finally {
      setGoogleBusy(false);
    }
  }

  return (
    <SiteBlogLayout className="min-h-[calc(100vh-5rem)] pb-8">
      <SEO title="Login — Malani Barmer" description="Sign in to Malani Barmer" path="/login" noindex />
      <div className="relative mx-auto grid min-h-[70vh] max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="hidden select-none lg:block"
        >
          <div className="custom-gradient-bg relative overflow-hidden rounded-3xl border border-white/15 p-10 text-white shadow-2xl">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-yellow-400/25 blur-2xl" />
            <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-orange-500/20 blur-2xl" />
            <Sparkles className="relative mb-6 h-10 w-10 text-yellow-300" />
            <HindiTypography as="h2" className="relative text-balance text-3xl font-bold leading-tight text-white">
              ब्लॉग पढ़ें, प्रतिक्रिया दें और चर्चा में शामिल हों।
            </HindiTypography>
            <HindiTypography as="p" className="relative mt-4 max-w-md text-sm leading-relaxed text-amber-50/95">
              अपनी प्रोफ़ाइल एक्सेस करें, विचारशील टिप्पणियाँ लिखें और पसंदीदा लेखों को सराहें।
            </HindiTypography>
            <ul className="relative mt-8 space-y-3 font-hindi text-sm text-amber-50/95">
              {[
                "हर लेख पर सुरक्षित इंटरैक्शन",
                "Supabase द्वारा सुरक्षित प्रमाणीकरण",
                "Google से एक टैप में साइन इन",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-300" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        <div className="flex justify-center lg:justify-end">
          <AuthCard>
            <div className="mb-6 text-center lg:text-left">
              <h1 className={cn("text-2xl font-bold tracking-tight", brandHeadingClass())}>
                {mode === "login" ? "साइन इन" : "खाता बनाएँ"}
              </h1>
              <p className="mt-1 font-hindi text-sm text-gray-600">
                {mode === "login" ? "मालाणी ब्लॉग पर जारी रखने के लिए साइन इन करें।" : "कुछ ही क्षणों में जुड़ें।"}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="mb-6 h-11 w-full rounded-xl border-amber-200 bg-white/80 font-hindi text-[15px] shadow-sm backdrop-blur-sm hover:bg-amber-50/80"
              disabled={googleBusy || submitting}
              onClick={() => void onGoogle()}
            >
              <FcGoogle className="mr-2 h-5 w-5" />
              {googleBusy ? "रीडायरेक्ट…" : "Google से जारी रखें"}
            </Button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-amber-100" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white/95 px-3 font-hindi text-gray-500">या ईमेल</span>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="font-hindi">
                    पूरा नाम
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="आपका नाम"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11 rounded-xl border-amber-200 font-hindi"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">ईमेल</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl border-amber-200"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="font-hindi">
                  पासवर्ड
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  className={cn("h-11 rounded-xl border-amber-200", error && "border-red-400")}
                  required
                />
                {error && <p className="font-hindi text-sm text-red-600">{error}</p>}
              </div>
              <Button type="submit" disabled={submitting || googleBusy} className={cn("h-11 w-full font-hindi text-base font-semibold", brandCtaClass)}>
                {submitting ? "कृपया प्रतीक्षा करें…" : mode === "login" ? "साइन इन" : "खाता बनाएँ"}
              </Button>
            </form>

            <div className="mt-6 flex flex-col gap-3 text-center text-sm sm:flex-row sm:justify-between sm:text-left">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode(mode === "login" ? "signup" : "login");
                }}
                className="font-hindi text-amber-800 hover:underline"
              >
                {mode === "login" ? "नया खाता? साइन अप" : "पहले से खाता? साइन इन"}
              </button>
              <Link to="/" className="font-hindi text-gray-500 hover:text-gray-900 hover:underline">
                मुख्य पृष्ठ पर वापस
              </Link>
            </div>
          </AuthCard>
        </div>
      </div>
    </SiteBlogLayout>
  );
};

export default Login;
