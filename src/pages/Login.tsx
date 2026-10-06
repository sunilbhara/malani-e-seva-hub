import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/seo/SEO";
import { useAuth } from "@/hooks/useAuth";
import { friendlyAuthError, login, passwordProblem, PASSWORD_MIN, sendPasswordReset, signInWithGoogle, signUp } from "@/services/auth";
import { safeRedirectPath } from "@/lib/url";
import { track } from "@/lib/analytics";

type Mode = "login" | "signup" | "forgot";

function GoogleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirectTo = safeRedirectPath(params.get("redirect"), "/");
  const [mode, setMode] = useState<Mode>(params.get("action") === "signup" ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<{ kind: "confirm" | "reset"; email: string } | null>(null);

  if (!loading && user) return <Navigate to={redirectTo} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "signup") {
      const problem = passwordProblem(password);
      if (problem) {
        setError(problem);
        return;
      }
    }
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
        track("login", { method: "email" });
        toast.success("स्वागत है!");
        navigate(redirectTo, { replace: true });
      } else if (mode === "signup") {
        await signUp(email, password, name, redirectTo);
        track("sign_up", { method: "email" });
        setSentTo({ kind: "confirm", email });
      } else {
        await sendPasswordReset(email);
        setSentTo({ kind: "reset", email });
      }
    } catch (err) {
      setError(err instanceof Error && !("status" in err) ? err.message : friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setBusy(true);
    setError(null);
    try {
      track("login", { method: "google" });
      await signInWithGoogle(redirectTo);
    } catch (err) {
      setError(friendlyAuthError(err));
      setBusy(false);
    }
  }

  const titles: Record<Mode, string> = { login: "साइन इन करें", signup: "मुफ़्त खाता बनाएँ", forgot: "पासवर्ड भूल गए?" };

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-10">
      <SEO title={`${titles[mode]} | मालाणी बाड़मेर`} description="नौकरियाँ सेव करने, रिमाइंडर और सवाल पूछने के लिए साइन इन करें।" path="/login" noindex />
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-1 sm:p-8">
        {sentTo ? (
          <div className="text-center">
            <MailCheck aria-hidden className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 font-hindi text-xl font-bold">अपना ईमेल देखें</h1>
            <p className="mt-2 font-hindi text-small text-body">
              {sentTo.kind === "confirm" ? "खाता पक्का करने का लिंक" : "नया पासवर्ड बनाने का लिंक"} <strong>{sentTo.email}</strong> पर भेजा गया है। स्पैम फ़ोल्डर भी देखें।
            </p>
            <Button type="button" variant="outline" className="mt-6 font-hindi" onClick={() => { setSentTo(null); setMode("login"); }}>
              साइन इन पर वापस जाएँ
            </Button>
          </div>
        ) : (
          <>
            <h1 className="font-hindi text-2xl font-bold">{titles[mode]}</h1>
            <p className="mt-1 font-hindi text-small text-muted-foreground">
              {mode === "forgot" ? "अपना ईमेल डालें, हम नया पासवर्ड बनाने का लिंक भेजेंगे।" : "पढ़ना मुफ़्त है। सेव, रिमाइंडर, ट्रैकर और सवाल पूछने के लिए साइन इन करें।"}
            </p>

            {mode !== "forgot" && (
              <>
                <Button type="button" variant="outline" size="lg" className="mt-6 w-full font-hindi" disabled={busy} onClick={() => void onGoogle()}>
                  <GoogleIcon /> Google से जारी रखें
                </Button>
                <div className="my-6 flex items-center gap-3 text-caption font-normal text-muted-foreground">
                  <span className="h-px flex-1 bg-border" /> या ईमेल से <span className="h-px flex-1 bg-border" />
                </div>
              </>
            )}

            <form onSubmit={(e) => void onSubmit(e)} className="space-y-4" noValidate={false}>
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="font-hindi">आपका नाम</Label>
                  <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="h-12 font-hindi" maxLength={80} />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-hindi">ईमेल</Label>
                <Input id="email" type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" />
              </div>
              {mode !== "forgot" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="font-hindi">पासवर्ड</Label>
                    {mode === "login" && (
                      <button type="button" onClick={() => { setMode("forgot"); setError(null); }} className="font-hindi text-small font-semibold text-primary">
                        पासवर्ड भूल गए?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={mode === "signup" ? PASSWORD_MIN : undefined}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={Boolean(error)}
                      aria-describedby={mode === "signup" ? "password-hint" : undefined}
                      className="h-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "पासवर्ड छिपाएँ" : "पासवर्ड दिखाएँ"}
                      className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {mode === "signup" && <p id="password-hint" className="font-hindi text-caption font-normal text-muted-foreground">कम से कम {PASSWORD_MIN} अक्षर, जिसमें अक्षर और अंक दोनों हों।</p>}
                </div>
              )}
              {error && <p role="alert" className="font-hindi text-small text-destructive">{error}</p>}
              <Button type="submit" size="lg" className="w-full font-hindi" disabled={busy}>
                {busy ? "कृपया प्रतीक्षा करें…" : mode === "login" ? "साइन इन" : mode === "signup" ? "खाता बनाएँ" : "लिंक भेजें"}
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap justify-between gap-3 font-hindi text-small">
              {mode === "login" ? (
                <button type="button" onClick={() => { setMode("signup"); setError(null); }} className="font-semibold text-primary">नया खाता बनाएँ</button>
              ) : (
                <button type="button" onClick={() => { setMode("login"); setError(null); }} className="font-semibold text-primary">पहले से खाता है? साइन इन</button>
              )}
              <Link to="/" className="text-muted-foreground hover:text-foreground">होम पर जाएँ</Link>
            </div>
            <p className="mt-6 font-hindi text-caption font-normal text-muted-foreground">
              साइन इन करके आप हमारी <Link to="/privacy-policy" className="underline">प्राइवेसी पॉलिसी</Link> और <Link to="/terms" className="underline">शर्तों</Link> से सहमत होते हैं।
            </p>
          </>
        )}
      </div>
    </div>
  );
}
