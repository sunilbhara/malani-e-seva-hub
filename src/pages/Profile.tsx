import { lazy, Suspense, useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BellOff, BellRing, Bookmark, LayoutDashboard, LogOut, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SEO } from "@/components/seo/SEO";
import { loginUrl } from "@/lib/url";
import { PageSpinner } from "@/components/common/PageSpinner";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { usePreferences } from "@/hooks/usePreferences";
import { getProfile, updateDisplayName } from "@/services/profile";
import { deleteAccount, logout } from "@/services/auth";
import { departmentLabel, qualificationLabel } from "@/lib/jobs";
import { topicsFor } from "@/lib/preferences";
import { pushPermission, pushSupported, subscribeToPush, unsubscribeFromPush, currentSubscription } from "@/lib/push";

const PreferenceSheet = lazy(() => import("@/components/engagement/PreferenceSheet"));

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="mb-4 font-hindi text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function Profile() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const prefs = usePreferences();
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const profile = useQuery({ queryKey: ["profile", user?.id], queryFn: () => getProfile(user!.id), enabled: Boolean(user) });

  useEffect(() => {
    if (profile.data?.full_name) setName(profile.data.full_name);
  }, [profile.data?.full_name]);

  useEffect(() => {
    void currentSubscription().then((s) => setPushOn(Boolean(s)));
  }, []);

  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to={loginUrl("/profile")} replace />;

  async function onSaveName(e: FormEvent) {
    e.preventDefault();
    setSavingName(true);
    try {
      await updateDisplayName(user!.id, name);
      void queryClient.invalidateQueries({ queryKey: ["profile", user!.id] });
      toast.success("नाम सेव हो गया");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "नाम सेव नहीं हो सका");
    } finally {
      setSavingName(false);
    }
  }

  async function togglePush() {
    setPushBusy(true);
    try {
      if (pushOn) {
        await unsubscribeFromPush();
        setPushOn(false);
        toast.success("नोटिफ़िकेशन बंद कर दिए गए");
      } else {
        await subscribeToPush(topicsFor(prefs));
        setPushOn(true);
        toast.success("नोटिफ़िकेशन चालू हो गए");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "बदलाव नहीं हो सका");
    } finally {
      setPushBusy(false);
    }
  }

  async function onDelete() {
    setDeleting(true);
    try {
      await deleteAccount();
      toast.success("आपका खाता और जानकारी हटा दी गई है।");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "खाता हटाया नहीं जा सका");
      setDeleting(false);
    }
  }

  const prefSummary = [qualificationLabel(prefs.qualification), ...prefs.departments.map(departmentLabel)].filter(Boolean).join(" · ");

  return (
    <div className="container-page max-w-3xl space-y-4 py-6">
      <SEO title="प्रोफ़ाइल | मालाणी बाड़मेर" description="आपकी प्रोफ़ाइल और सेटिंग्स" path="/profile" noindex />
      <div className="flex items-center gap-4">
        <span aria-hidden className="grid h-16 w-16 place-items-center rounded-full bg-secondary font-hindi text-2xl font-bold text-secondary-foreground">
          {(profile.data?.full_name || user.email || "प").charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-hindi text-2xl font-bold">{profile.data?.full_name || "मेरी प्रोफ़ाइल"}</h1>
          <p className="truncate text-small text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button asChild variant="outline" className="justify-start font-hindi"><Link to="/my"><Bookmark /> मेरी नौकरियाँ</Link></Button>
        {role === "admin" && <Button asChild variant="outline" className="justify-start font-hindi"><Link to="/admin"><LayoutDashboard /> एडमिन डैशबोर्ड</Link></Button>}
      </div>

      <Card title="नाम">
        <form onSubmit={(e) => void onSaveName(e)} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="display-name" className="font-hindi">दिखने वाला नाम (सवाल-जवाब में)</Label>
            <Input id="display-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="h-11 font-hindi" />
          </div>
          <Button type="submit" disabled={savingName || !name.trim()} className="font-hindi">सेव करें</Button>
        </form>
      </Card>

      <Card title="मेरी पसंद">
        <p className="font-hindi text-small text-body">{prefSummary || "अभी कोई पसंद नहीं चुनी गई।"}</p>
        <Button type="button" variant="outline" className="mt-3 font-hindi" onClick={() => setPrefsOpen(true)}>
          <Settings2 /> पसंद बदलें
        </Button>
      </Card>

      <Card title="सूचनाएँ">
        {pushSupported() ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-hindi text-small text-body">
              {pushOn ? "इस फ़ोन पर नई भर्ती और रिमाइंडर की सूचना चालू है।" : pushPermission() === "denied" ? "ब्राउज़र सेटिंग में नोटिफ़िकेशन बंद हैं।" : "नई भर्ती और अंतिम तिथि की सूचना पाएँ।"}
            </p>
            <Button type="button" variant={pushOn ? "outline" : "default"} disabled={pushBusy || pushPermission() === "denied"} onClick={() => void togglePush()} className="font-hindi">
              {pushOn ? <BellOff /> : <BellRing />} {pushOn ? "बंद करें" : "चालू करें"}
            </Button>
          </div>
        ) : (
          <p className="font-hindi text-small text-muted-foreground">इस ब्राउज़र में नोटिफ़िकेशन उपलब्ध नहीं हैं। ऐप को होम स्क्रीन पर जोड़ें या Chrome इस्तेमाल करें।</p>
        )}
      </Card>

      <Card title="दिखावट और भाषा">
        <div className="flex flex-wrap items-center gap-4">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </Card>

      <Card title="खाता">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="font-hindi" onClick={() => void logout().then(() => navigate("/"))}>
            <LogOut /> साइन आउट
          </Button>
          <Button type="button" variant="ghost" className="font-hindi text-destructive hover:bg-destructive/10" onClick={() => setDeleteOpen(true)}>
            <Trash2 /> खाता हमेशा के लिए हटाएँ
          </Button>
        </div>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-hindi">खाता हमेशा के लिए हटाएँ?</AlertDialogTitle>
            <AlertDialogDescription className="font-hindi">
              आपकी प्रोफ़ाइल, सेव की गई नौकरियाँ, सवाल, रिमाइंडर और पसंद हमेशा के लिए हट जाएँगी। यह वापस नहीं हो सकता। पुष्टि के लिए नीचे <strong>हटाएँ</strong> लिखें।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} aria-label="पुष्टि के लिए हटाएँ लिखें" className="font-hindi" />
          <AlertDialogFooter>
            <AlertDialogCancel className="font-hindi">रद्द करें</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmText.trim() !== "हटाएँ" || deleting}
              onClick={(e) => {
                e.preventDefault();
                void onDelete();
              }}
              className="bg-destructive font-hindi text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "हटा रहे हैं…" : "हमेशा के लिए हटाएँ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {prefsOpen && (
        <Suspense fallback={null}>
          <PreferenceSheet open={prefsOpen} onOpenChange={setPrefsOpen} />
        </Suspense>
      )}
    </div>
  );
}
