"use client";

/**
 * Minimal WYSIWYG email-body editor — Donna edits formatted text, never raw
 * HTML. Zero-dependency `contentEditable` + `document.execCommand` for the
 * toolbar itself (bold/italic/underline/lists/link/image); paste and preview
 * are NOT trusted the same way — pasted clipboard HTML bypasses `execCommand`
 * entirely and can carry `onerror`/`onclick` handlers or `javascript:` hrefs,
 * so both are run through `sanitizeEmailHtml` (`lib/sanitize-html.ts`). The
 * link toolbar button also validates the URL scheme before creating a link.
 */
import { useCallback, useEffect, useRef } from "react";
import {
  BoldIcon,
  EraserIcon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  UnderlineIcon,
} from "@/components/ui/Icons";
import { sanitizeEmailHtml } from "@/lib/sanitize-html";

const ALLOWED_LINK_SCHEMES = ["http:", "https:", "mailto:"];

function ToolbarBtn({ label, icon: Icon, onPress }: { label: string; icon: React.ComponentType<{ className?: string }>; onPress: () => void }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPress}
      aria-label={label}
      title={label}
      className="w-8 h-8 inline-flex items-center justify-center rounded-sm text-text-tertiary hover:bg-bg-app hover:text-text-primary transition-colors"
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  onUploadImage,
  placeholder = "Write your message…",
}: {
  value: string;
  onChange: (html: string) => void;
  /** Uploads a picked image and returns a persistent, publicly-readable URL to insert. */
  onUploadImage?: (file: File) => Promise<string>;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastValueRef = useRef(value);

  // Only push external `value` changes into the DOM (e.g. "start from template") —
  // never on every render, or the cursor jumps to the start on each keystroke.
  useEffect(() => {
    if (ref.current && value !== lastValueRef.current && ref.current.innerHTML !== value) {
      // Defense-in-depth: `value` can come from a template/draft written before this
      // sanitizer existed, or loaded from anywhere else that isn't this editor's own
      // paste handler — never trust it's already clean just because it's "our" data.
      ref.current.innerHTML = sanitizeEmailHtml(value);
      lastValueRef.current = value;
    }
  }, [value]);

  const emitChange = useCallback(() => {
    const html = ref.current?.innerHTML ?? "";
    lastValueRef.current = html;
    onChange(html);
  }, [onChange]);

  const exec = useCallback(
    (command: string, arg?: string) => {
      ref.current?.focus();
      document.execCommand(command, false, arg);
      emitChange();
    },
    [emitChange],
  );

  const handleLink = useCallback(() => {
    const url = window.prompt("Link URL");
    if (!url) return;
    let parsed: URL;
    try {
      parsed = new URL(url, window.location.origin);
    } catch {
      window.alert("That doesn't look like a valid URL.");
      return;
    }
    if (!ALLOWED_LINK_SCHEMES.includes(parsed.protocol)) {
      window.alert("Only http(s) and mailto links are allowed.");
      return;
    }
    exec("createLink", parsed.toString());
  }, [exec]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const html = e.clipboardData.getData("text/html");
      const text = e.clipboardData.getData("text/plain");
      const safe = html ? sanitizeEmailHtml(html) : text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      ref.current?.focus();
      document.execCommand("insertHTML", false, safe);
      emitChange();
    },
    [emitChange],
  );

  const handleImagePick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !onUploadImage) return;
      try {
        const url = await onUploadImage(file);
        exec("insertImage", url);
      } catch (err) {
        console.error("[RichTextEditor] image upload failed:", err);
        window.alert("Image upload failed — please try again.");
      }
    },
    [exec, onUploadImage],
  );

  const isEmpty = !value || value === "<br>" || value === "<div><br></div>";

  return (
    <div className="border border-border-outline rounded-sm overflow-hidden bg-bg-app">
      <div className="flex items-center gap-xs px-sm py-xs border-b border-border-outline bg-bg-surface-elevated flex-wrap">
        <ToolbarBtn label="Bold" icon={BoldIcon} onPress={() => exec("bold")} />
        <ToolbarBtn label="Italic" icon={ItalicIcon} onPress={() => exec("italic")} />
        <ToolbarBtn label="Underline" icon={UnderlineIcon} onPress={() => exec("underline")} />
        <ToolbarBtn label="Bullet list" icon={ListIcon} onPress={() => exec("insertUnorderedList")} />
        <ToolbarBtn label="Numbered list" icon={ListOrderedIcon} onPress={() => exec("insertOrderedList")} />
        <ToolbarBtn label="Link" icon={LinkIcon} onPress={handleLink} />
        {onUploadImage && <ToolbarBtn label="Image" icon={ImageIcon} onPress={handleImagePick} />}
        <ToolbarBtn label="Clear formatting" icon={EraserIcon} onPress={() => exec("removeFormat")} />
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
      </div>
      <div className="relative">
        {isEmpty && (
          <span className="pointer-events-none absolute top-sm left-md font-body text-[14px] text-text-tertiary">
            {placeholder}
          </span>
        )}
        <div
          ref={ref}
          role="textbox"
          aria-multiline="true"
          aria-label="Email body"
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onBlur={emitChange}
          onPaste={handlePaste}
          className="min-h-[220px] max-h-[480px] overflow-y-auto px-md py-sm font-body text-[14px] text-text-primary focus-visible:outline-none [&_ul]:list-disc [&_ul]:pl-lg [&_ol]:list-decimal [&_ol]:pl-lg [&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:rounded-sm"
        />
      </div>
    </div>
  );
}

/** Renders stored/live HTML the same way the editor's own contentEditable surface would. */
export function RichTextPreview({ html }: { html: string }) {
  return (
    <div
      className="font-body text-[14px] text-text-primary [&_p]:mb-sm [&_ul]:list-disc [&_ul]:pl-lg [&_ol]:list-decimal [&_ol]:pl-lg [&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:rounded-sm"
      dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(html) }}
    />
  );
}
