import { useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/core";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import { StarterKit } from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ImageIcon,
  Link2,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import "./rich-text.css";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

function ToolbarBtn({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      data-active={active ? "true" : "false"}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-amber-50 data-[active=true]:bg-gradient-to-r data-[active=true]:from-amber-100 data-[active=true]:to-orange-100 data-[active=true]:text-amber-950"
    >
      {children}
    </button>
  );
}

function MenuBar({ editor }: { editor: Editor }) {
  const setLink = useCallback(() => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("लिंक URL दर्ज करें", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt("छवि URL दर्ज करें");
    if (!url?.trim()) return;
    editor.chain().focus().setImage({ src: url.trim() }).run();
  }, [editor]);

  return (
    <div className="tiptap-toolbar">
      <ToolbarBtn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </ToolbarBtn>
      <span className="mx-1 h-6 w-px bg-amber-100" />
      <ToolbarBtn
        title="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        title="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarBtn>
      <span className="mx-1 h-6 w-px bg-amber-100" />
      <ToolbarBtn
        title="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        title="Ordered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        title="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </ToolbarBtn>
      <span className="mx-1 h-6 w-px bg-amber-100" />
      <ToolbarBtn title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
        <AlignLeft className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
        <AlignCenter className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
        <AlignRight className="h-4 w-4" />
      </ToolbarBtn>
      <span className="mx-1 h-6 w-px bg-amber-100" />
      <ToolbarBtn title="Link" active={editor.isActive("link")} onClick={setLink}>
        <Link2 className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn title="Image" onClick={addImage}>
        <ImageIcon className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus className="h-4 w-4" />
      </ToolbarBtn>
      <span className="mx-1 h-6 w-px bg-amber-100" />
      <ToolbarBtn title="Undo" onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn title="Redo" onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 className="h-4 w-4" />
      </ToolbarBtn>
    </div>
  );
}

export function RichTextEditor({ value, onChange, placeholder, className, disabled }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: false,
      }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { class: "text-amber-700 underline" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ HTMLAttributes: { class: "rounded-xl" } }),
      Placeholder.configure({
        placeholder: placeholder ?? "यहाँ लिखें…",
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "ProseMirror",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const cur = editor.getHTML();
    const next = value || "";
    if (cur !== next) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return <div className={cn("min-h-[280px] animate-pulse rounded-2xl bg-amber-50/50", className)} />;
  }

  const bubble = (
    <BubbleMenu editor={editor} className="tiptap-toolbar shadow-xl">
      <ToolbarBtn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn title="Link" active={editor.isActive("link")} onClick={() => {
        const prev = editor.getAttributes("link").href as string | undefined;
        const url = window.prompt("लिंक URL", prev ?? "https://");
        if (url === null) return;
        if (url === "") editor.chain().focus().extendMarkRange("link").unsetLink().run();
        else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
      }}>
        <Link2 className="h-4 w-4" />
      </ToolbarBtn>
    </BubbleMenu>
  );

  const floating = (
    <FloatingMenu editor={editor} className="tiptap-toolbar shadow-xl">
      <ToolbarBtn title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-4 w-4" />
      </ToolbarBtn>
    </FloatingMenu>
  );

  return (
    <div className={cn("tiptap-editor-shell overflow-hidden rounded-2xl border border-amber-100/90 bg-white shadow-inner ring-1 ring-black/[0.04]", className)}>
      <div className="border-b border-amber-100/80 bg-gradient-to-r from-amber-50/80 to-white p-2 sm:p-2.5">
        <MenuBar editor={editor} />
      </div>
      <div className="relative bg-white">
        {bubble}
        {floating}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
