import { useState } from "react";
import { Copy, ImageDown, MessageCircle, Send, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { postUrl, shareText, whatsappShareUrl, type ShareablePost } from "@/lib/share";
import { renderStatusCard } from "@/lib/statusCard";
import { recordShare } from "@/services/posts";
import { track } from "@/lib/analytics";
import { postTypeLabel, qualificationLabel } from "@/lib/jobs";

export function ShareSheet({
  open,
  onOpenChange,
  postId,
  post,
  organisation,
  qualifications,
  postType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  post: ShareablePost;
  organisation?: string | null;
  qualifications?: string[];
  postType?: string | null;
}) {
  const [making, setMaking] = useState(false);
  const text = shareText(post);

  function done(channel: "whatsapp" | "telegram" | "native" | "copy" | "status_card") {
    void recordShare(postId, channel);
    track(channel === "status_card" ? "share_status_card" : channel === "copy" ? "share_copy" : channel === "native" ? "share_native" : "share_whatsapp", {
      post_type: postType ?? "article",
    });
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: post.title, text, url: postUrl(post.slug, "native") });
      done("native");
      onOpenChange(false);
    } catch {
      // cancelled
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(postUrl(post.slug, "copy"));
      done("copy");
      toast.success("लिंक कॉपी हो गया");
    } catch {
      toast.error("लिंक कॉपी नहीं हो सका");
    }
  }

  async function statusCard() {
    setMaking(true);
    try {
      const blob = await renderStatusCard({
        title: post.title,
        organisation,
        totalPosts: post.totalPosts,
        lastDate: post.lastDate,
        qualification: qualifications?.filter((q) => q !== "any").map(qualificationLabel).slice(0, 2).join(", ") || null,
        slug: post.slug,
        label: postTypeLabel(postType),
      });
      const file = new File([blob], `${post.slug}-status.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text }).catch(() => undefined);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        toast.success("फोटो डाउनलोड हो गई — WhatsApp स्टेटस पर लगाएँ");
      }
      done("status_card");
    } catch {
      toast.error("स्टेटस फोटो नहीं बन सकी");
    } finally {
      setMaking(false);
    }
  }

  const options = [
    {
      label: "WhatsApp पर भेजें",
      icon: MessageCircle,
      className: "bg-whatsapp text-whatsapp-foreground",
      href: whatsappShareUrl(text),
      onClick: () => done("whatsapp"),
    },
    {
      label: "Telegram",
      icon: Send,
      className: "bg-secondary text-secondary-foreground",
      href: `https://t.me/share/url?url=${encodeURIComponent(postUrl(post.slug, "telegram"))}&text=${encodeURIComponent(post.title)}`,
      onClick: () => done("telegram"),
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg">
        <SheetHeader className="text-left">
          <SheetTitle className="font-hindi text-xl">शेयर करें</SheetTitle>
          <SheetDescription className="font-hindi">दोस्तों तक यह भर्ती पहुँचाएँ।</SheetDescription>
        </SheetHeader>
        <div className="mt-5 grid grid-cols-2 gap-2">
          {options.map(({ label, icon: Icon, className, href, onClick }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={`flex h-14 items-center justify-center gap-2 rounded-xl font-hindi font-semibold ${className}`}>
              <Icon className="h-5 w-5" /> {label}
            </a>
          ))}
          <button type="button" onClick={() => void statusCard()} disabled={making} className="flex h-14 items-center justify-center gap-2 rounded-xl border bg-card font-hindi font-semibold disabled:opacity-60">
            <ImageDown className="h-5 w-5" /> {making ? "बन रही है…" : "स्टेटस फोटो"}
          </button>
          <button type="button" onClick={() => void copyLink()} className="flex h-14 items-center justify-center gap-2 rounded-xl border bg-card font-hindi font-semibold">
            <Copy className="h-5 w-5" /> लिंक कॉपी
          </button>
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button type="button" onClick={() => void nativeShare()} className="col-span-2 flex h-12 items-center justify-center gap-2 rounded-xl border bg-card font-hindi font-semibold">
              <Share2 className="h-5 w-5" /> और ऐप्स
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
