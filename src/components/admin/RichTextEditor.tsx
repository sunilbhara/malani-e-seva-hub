import { useCallback, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import {
  AlignCenter,
  AlignLeft,
  Bold,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Table2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { safeHttpUrl } from "@/lib/url";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function ToolbarButton({ onClick, active, label, children }: { onClick: () => void; active?: boolean; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        active && "bg-secondary text-secondary-foreground",
      )}
    >
      {children}
    </button>
  );
}

const TABLE_TEMPLATE =
  "<p><strong>महत्वपूर्ण तिथियाँ</strong></p><ul><li>आवेदन शुरू: </li><li>अंतिम तिथि: </li><li>परीक्षा तिथि: </li></ul>";

function Toolbar({ editor, onPickImage }: { editor: Editor; onPickImage?: () => void }) {
  const setLink = useCallback(() => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const input = window.prompt("लिंक (https://…)", previous ?? "https://");
    if (input === null) return;
    if (input.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const url = safeHttpUrl(input);
    if (!url) {
      toast.error("केवल http:// या https:// वाले लिंक डालें");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const Sep = () => <span aria-hidden className="mx-0.5 h-6 w-px bg-border" />;

  return (
    <div role="toolbar" aria-label="फॉर्मेटिंग" className="flex flex-wrap items-center gap-0.5">
      <ToolbarButton label="बोल्ड" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></ToolbarButton>
      <ToolbarButton label="इटैलिक" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></ToolbarButton>
      <Sep />
      <ToolbarButton label="शीर्षक H2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></ToolbarButton>
      <ToolbarButton label="उप-शीर्षक H3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></ToolbarButton>
      <Sep />
      <ToolbarButton label="बुलेट सूची" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></ToolbarButton>
      <ToolbarButton label="क्रमांक सूची" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></ToolbarButton>
      <ToolbarButton label="उद्धरण" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></ToolbarButton>
      <Sep />
      <ToolbarButton label="बाएँ" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="h-4 w-4" /></ToolbarButton>
      <ToolbarButton label="बीच में" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="h-4 w-4" /></ToolbarButton>
      <Sep />
      <ToolbarButton label="लिंक" active={editor.isActive("link")} onClick={setLink}><Link2 className="h-4 w-4" /></ToolbarButton>
      {onPickImage && <ToolbarButton label="फोटो" onClick={onPickImage}><ImageIcon className="h-4 w-4" /></ToolbarButton>}
      <ToolbarButton label="तिथियाँ ढाँचा" onClick={() => editor.chain().focus().insertContent(TABLE_TEMPLATE).run()}><Table2 className="h-4 w-4" /></ToolbarButton>
      <ToolbarButton label="रेखा" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="h-4 w-4" /></ToolbarButton>
      <Sep />
      <ToolbarButton label="पूर्ववत" onClick={() => editor.chain().focus().undo().run()}><Undo2 className="h-4 w-4" /></ToolbarButton>
      <ToolbarButton label="फिर से" onClick={() => editor.chain().focus().redo().run()}><Redo2 className="h-4 w-4" /></ToolbarButton>
    </div>
  );
}

export function RichTextEditor({ value, onChange, onUploadImage, placeholder, className, disabled }: RichTextEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: false }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https"],
        isAllowedUri: (url) => Boolean(safeHttpUrl(url)),
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image,
      Placeholder.configure({ placeholder: placeholder ?? "यहाँ लिखें…" }),
    ],
    content: value || "",
    editorProps: { attributes: { class: "post-body font-hindi min-h-[320px] px-4 py-3 outline-none sm:px-5", lang: "hi" } },
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed) editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (editor.getHTML() !== (value || "")) editor.commands.setContent(value || "", { emitUpdate: false });
  }, [value, editor]);

  async function onFile(file: File | undefined) {
    if (!file || !onUploadImage || !editor) return;
    const id = toast.loading("फोटो अपलोड हो रही है…");
    try {
      const url = await onUploadImage(file);
      editor.chain().focus().setImage({ src: url, alt: "" }).run();
      toast.success("फोटो जुड़ गई", { id });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "फोटो अपलोड नहीं हो सकी", { id });
    }
  }

  if (!editor) return <div className={cn("min-h-[360px] animate-pulse rounded-2xl border bg-muted", className)} />;

  return (
    <div className={cn("overflow-hidden rounded-2xl border bg-card focus-within:ring-2 focus-within:ring-ring", className)}>
      <div className="sticky top-0 z-10 border-b bg-card/95 p-1.5 backdrop-blur">
        <Toolbar editor={editor} onPickImage={onUploadImage ? () => fileRef.current?.click() : undefined} />
      </div>
      <EditorContent editor={editor} />
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
    </div>
  );
}
