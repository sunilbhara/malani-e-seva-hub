import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/seo/SEO";
import { supabase } from "@/lib/supabase";
import { friendlyAuthError, PASSWORD_MIN, updatePassword } from "@/services/auth";

/** Landing page for the password-reset email link (audit S12). */
export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) setReady(true);
    });
    const timer = window.setTimeout(() => setInvalid((v) => v || !document.location.hash.includes("access_token")), 4000);
    return () => {
      data.subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("दोनों पासवर्ड एक जैसे नहीं हैं।");
      return;
    }
    setBusy(true);
    try {
      await updatePassword(password);
      toast.success("पासवर्ड बदल गया");
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error && !("status" in err) ? err.message : friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-10">
      <SEO title="नया पासवर्ड बनाएँ | मालाणी बाड़मेर" description="अपने खाते का नया पासवर्ड बनाएँ।" path="/auth/reset" noindex />
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-1 sm:p-8">
        <h1 className="font-hindi text-2xl font-bold">नया पासवर्ड बनाएँ</h1>
        {!ready && invalid ? (
          <div className="mt-4 space-y-4">
            <p className="font-hindi text-small text-body">यह लिंक पुराना हो गया है या गलत है। कृपया दोबारा पासवर्ड रीसेट का ईमेल मँगवाएँ।</p>
            <Button asChild className="font-hindi"><Link to="/login">साइन इन पेज पर जाएँ</Link></Button>
          </div>
        ) : (
          <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="font-hindi">नया पासवर्ड</Label>
              <Input id="new-password" type="password" autoComplete="new-password" required minLength={PASSWORD_MIN} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="font-hindi">पासवर्ड दोबारा लिखें</Label>
              <Input id="confirm-password" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-12" />
            </div>
            <p className="font-hindi text-caption font-normal text-muted-foreground">कम से कम {PASSWORD_MIN} अक्षर, जिसमें अक्षर और अंक दोनों हों।</p>
            {error && <p role="alert" className="font-hindi text-small text-destructive">{error}</p>}
            <Button type="submit" size="lg" className="w-full font-hindi" disabled={busy || !ready}>
              {busy ? "सेव हो रहा है…" : ready ? "पासवर्ड सेव करें" : "लिंक जाँच रहे हैं…"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
