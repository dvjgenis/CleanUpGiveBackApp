"use client";

/**
 * `/emails` — replaces the old raw-HTML-textarea template editor. Two tabs:
 * **Compose** sends a real email straight from the dashboard (to a volunteer
 * on file or a manual address, optionally started from a template, with
 * inline images + file attachments); **Templates** manages the 5 system
 * (automated-send) templates plus any custom templates Donna creates for
 * reuse in Compose. Bodies are edited with `RichTextEditor` — nobody writes
 * HTML by hand.
 */
import { useMemo, useRef, useState, useTransition } from "react";
import { RichTextEditor, RichTextPreview } from "@/components/ui/RichTextEditor";
import { PaperclipIcon, PencilIcon, PlusIcon, SendIcon, TrashIcon, CloseIcon } from "@/components/ui/Icons";
import { sendAdHocEmail } from "@/actions/emails";
import { createTemplate, deleteTemplate, updateEmailTemplate, updateTemplate } from "@/actions/emailTemplates";
import { uploadEmailAttachment, uploadEmailInlineImage, removeEmailAttachment, type UploadedAttachment } from "@/actions/emailAttachments";
import { renderTemplate } from "@/lib/email-template-render";
import type { EmailTemplateRecord } from "@/lib/email-templates";

type Volunteer = { id: string; name: string; email: string };
type Tab = "compose" | "templates";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

async function uploadInlineImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  return uploadEmailInlineImage(formData);
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`h-11 inline-flex items-center px-lg rounded-full border font-data text-[12px] font-semibold whitespace-nowrap transition-colors ${
        active
          ? "bg-primary text-white border-primary"
          : "bg-bg-surface text-text-tertiary border-border-outline hover:border-primary hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

function ComposeTab({ templates, volunteers }: { templates: EmailTemplateRecord[]; volunteers: Volunteer[] }) {
  const [recipientMode, setRecipientMode] = useState<"volunteer" | "custom">("volunteer");
  const [volunteerQuery, setVolunteerQuery] = useState("");
  const [volunteerDropdownOpen, setVolunteerDropdownOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [isSending, startSending] = useTransition();
  const [sendResult, setSendResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const filteredVolunteers = useMemo(() => {
    const needle = volunteerQuery.trim().toLowerCase();
    if (!needle) return volunteers.slice(0, 8);
    return volunteers
      .filter((v) => v.name.toLowerCase().includes(needle) || v.email.toLowerCase().includes(needle))
      .slice(0, 8);
  }, [volunteerQuery, volunteers]);

  function applyTemplate(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    // volunteer_name comes from the volunteer's own account display name — not
    // admin-authored — so it must be escaped before landing in the HTML body,
    // same reasoning as the automated-send templates (see email-template-render.ts).
    const vars = { volunteer_name: selectedVolunteer?.name ?? "" };
    setSubject(renderTemplate(template.subject, vars));
    setBodyHtml(renderTemplate(template.bodyHtml, vars, { escapeHtml: true }));
  }

  async function handleAttachmentPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setUploadingAttachment(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const uploaded = await uploadEmailAttachment(formData);
        setAttachments((prev) => [...prev, uploaded]);
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Attachment upload failed");
    } finally {
      setUploadingAttachment(false);
    }
  }

  function handleRemoveAttachment(path: string) {
    setAttachments((prev) => prev.filter((a) => a.path !== path));
    void removeEmailAttachment(path);
  }

  function handleSend() {
    setSendResult(null);
    startSending(async () => {
      try {
        const result = await sendAdHocEmail({
          recipientUserId: recipientMode === "volunteer" ? (selectedVolunteer?.id ?? undefined) : undefined,
          toEmail: recipientMode === "custom" ? toEmail : undefined,
          subject,
          bodyHtml,
          attachments: attachments.map((a) => ({ path: a.path, filename: a.filename })),
        });
        setSendResult(result);
        if (result.ok) {
          setSubject("");
          setBodyHtml("");
          setAttachments([]);
          setSelectedVolunteer(null);
          setVolunteerQuery("");
          setToEmail("");
        }
      } catch (err) {
        setSendResult({ ok: false, error: err instanceof Error ? err.message : "Failed to send" });
      }
    });
  }

  const canSend =
    subject.trim().length > 0 &&
    bodyHtml.trim().length > 0 &&
    (recipientMode === "volunteer" ? selectedVolunteer != null : toEmail.trim().length > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-lg items-start">
      <div className="bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-md">
        <div>
          <label className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-xs block">To</label>
          <div className="flex items-center gap-xs mb-sm">
            <button
              type="button"
              onClick={() => setRecipientMode("volunteer")}
              className={`h-8 px-md rounded-full border font-data text-[11px] font-semibold transition-colors ${
                recipientMode === "volunteer" ? "bg-primary text-white border-primary" : "bg-bg-app text-text-tertiary border-border-outline"
              }`}
            >
              Volunteer
            </button>
            <button
              type="button"
              onClick={() => setRecipientMode("custom")}
              className={`h-8 px-md rounded-full border font-data text-[11px] font-semibold transition-colors ${
                recipientMode === "custom" ? "bg-primary text-white border-primary" : "bg-bg-app text-text-tertiary border-border-outline"
              }`}
            >
              Custom email
            </button>
          </div>

          {recipientMode === "volunteer" ? (
            selectedVolunteer ? (
              <div className="flex items-center gap-sm h-11 px-md rounded-sm border border-border-outline bg-bg-app w-fit">
                <span className="font-body text-[14px] text-text-primary">
                  {selectedVolunteer.name} <span className="text-text-tertiary">({selectedVolunteer.email})</span>
                </span>
                <button type="button" onClick={() => setSelectedVolunteer(null)} aria-label="Clear recipient">
                  <CloseIcon className="w-3.5 h-3.5 text-text-tertiary" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  value={volunteerQuery}
                  onChange={(e) => {
                    setVolunteerQuery(e.target.value);
                    setVolunteerDropdownOpen(true);
                  }}
                  onFocus={() => setVolunteerDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setVolunteerDropdownOpen(false), 150)}
                  placeholder="Search volunteers by name or email…"
                  className="w-full h-11 px-md rounded-sm border border-border-outline bg-bg-app font-body text-[14px] text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                />
                {volunteerDropdownOpen && filteredVolunteers.length > 0 && (
                  <ul className="absolute z-10 mt-xs w-full max-h-64 overflow-y-auto bg-bg-surface border border-border-outline rounded-sm shadow-bar-top">
                    {filteredVolunteers.map((v) => (
                      <li key={v.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVolunteer(v);
                            setVolunteerQuery("");
                          }}
                          className="w-full text-left px-md py-sm hover:bg-bg-app transition-colors"
                        >
                          <p className="font-body text-[13px] text-text-primary">{v.name}</p>
                          <p className="font-data text-[11px] text-text-tertiary">{v.email}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          ) : (
            <input
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              type="email"
              placeholder="name@example.com"
              className="w-full h-11 px-md rounded-sm border border-border-outline bg-bg-app font-body text-[14px] text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            />
          )}
        </div>

        {templates.length > 0 && (
          <div>
            <label className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-xs block">
              Start from a template (optional)
            </label>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) applyTemplate(e.target.value);
                e.target.value = "";
              }}
              className="h-11 px-md rounded-sm border border-border-outline bg-bg-app font-body text-[13px] text-text-primary"
            >
              <option value="" disabled>
                Choose a template…
              </option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.isSystem ? `System · ${t.name}` : t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-xs block">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full h-11 px-md rounded-sm border border-border-outline bg-bg-app font-body text-[14px] text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          />
        </div>

        <div>
          <label className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-xs block">Message</label>
          <RichTextEditor value={bodyHtml} onChange={setBodyHtml} onUploadImage={uploadInlineImage} />
        </div>

        <div>
          <div className="flex items-center gap-sm mb-xs">
            <label className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary">Attachments</label>
            <button
              type="button"
              onClick={() => attachmentInputRef.current?.click()}
              disabled={uploadingAttachment}
              className="inline-flex items-center gap-xs h-7 px-sm rounded-sm border border-border-outline font-data text-[11px] font-semibold text-text-tertiary hover:bg-bg-app transition-colors disabled:opacity-50"
            >
              <PaperclipIcon className="w-3.5 h-3.5" />
              {uploadingAttachment ? "Uploading…" : "Attach files"}
            </button>
            <input ref={attachmentInputRef} type="file" multiple className="hidden" onChange={handleAttachmentPick} />
          </div>
          {attachments.length > 0 && (
            <ul className="flex flex-col gap-xs">
              {attachments.map((a) => (
                <li key={a.path} className="flex items-center justify-between gap-sm px-sm py-xs rounded-sm bg-bg-app">
                  <span className="font-body text-[12px] text-text-primary truncate">
                    {a.filename} <span className="text-text-tertiary">({formatBytes(a.sizeBytes)})</span>
                  </span>
                  <button type="button" onClick={() => handleRemoveAttachment(a.path)} aria-label={`Remove ${a.filename}`}>
                    <CloseIcon className="w-3.5 h-3.5 text-text-tertiary" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-md">
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend || isSending}
            className="inline-flex items-center gap-sm h-11 px-lg rounded-full bg-primary text-white font-data text-[12px] font-semibold hover:bg-[#007d35] transition-colors disabled:opacity-50"
          >
            <SendIcon className="w-4 h-4" />
            {isSending ? "Sending…" : "Send"}
          </button>
          {sendResult && (
            <span className={`font-body text-[13px] ${sendResult.ok ? "text-primary" : "text-[#ba1a1a]"}`}>
              {sendResult.ok ? "Email sent" : sendResult.error}
            </span>
          )}
        </div>
      </div>

      <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
        <p className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-md">Preview</p>
        <div className="border border-border-outline rounded-sm overflow-hidden">
          <div className="px-md py-sm bg-bg-surface-elevated border-b border-border-outline">
            <p className="font-body text-[13px] font-medium text-text-primary truncate">{subject || "(no subject)"}</p>
          </div>
          <div className="px-md py-md">
            {bodyHtml ? <RichTextPreview html={bodyHtml} /> : <p className="font-body text-[13px] text-text-tertiary">(empty)</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplatesTab({ templates }: { templates: EmailTemplateRecord[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(templates[0]?.id ?? null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [isSaving, startSaving] = useTransition();
  const [status, setStatus] = useState<{ message: string; kind: "success" | "error" } | null>(null);

  const selected = isCreatingNew ? null : templates.find((t) => t.id === selectedId) ?? null;

  function selectTemplate(t: EmailTemplateRecord) {
    setIsCreatingNew(false);
    setSelectedId(t.id);
    setDraftName(t.name);
    setDraftSubject(t.subject);
    setDraftBody(t.bodyHtml);
    setStatus(null);
  }

  function startNewTemplate() {
    setIsCreatingNew(true);
    setSelectedId(null);
    setDraftName("");
    setDraftSubject("");
    setDraftBody("");
    setStatus(null);
  }

  function handleSave() {
    setStatus(null);
    startSaving(async () => {
      try {
        if (isCreatingNew) {
          await createTemplate(draftName, draftSubject, draftBody);
          setStatus({ message: "Template created", kind: "success" });
        } else if (selected?.isSystem && selected.templateType) {
          await updateEmailTemplate(selected.templateType, draftSubject, draftBody);
          setStatus({ message: "Saved", kind: "success" });
        } else if (selected) {
          await updateTemplate(selected.id, draftName, draftSubject, draftBody);
          setStatus({ message: "Saved", kind: "success" });
        }
      } catch (err) {
        setStatus({ message: err instanceof Error ? err.message : "Failed to save", kind: "error" });
      }
    });
  }

  function handleDelete() {
    if (!selected || selected.isSystem) return;
    if (!window.confirm(`Delete "${selected.name}"?`)) return;
    startSaving(async () => {
      try {
        await deleteTemplate(selected.id);
        setSelectedId(null);
        setStatus({ message: "Deleted", kind: "success" });
      } catch (err) {
        setStatus({ message: err instanceof Error ? err.message : "Failed to delete", kind: "error" });
      }
    });
  }

  const previewSubject = renderTemplate(draftSubject, { volunteer_name: "Jordan Rivera" });
  const previewBody = renderTemplate(draftBody, { volunteer_name: "Jordan Rivera" }, { escapeHtml: true });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_280px] gap-lg items-start">
      <div className="bg-bg-surface border border-border-outline rounded-md p-md flex flex-col gap-xs">
        <button
          type="button"
          onClick={startNewTemplate}
          className="inline-flex items-center gap-xs h-9 px-sm rounded-sm border border-dashed border-border-outline font-data text-[11px] font-semibold text-text-tertiary hover:border-primary hover:text-primary transition-colors mb-xs"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          New template
        </button>
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTemplate(t)}
            className={`text-left px-sm py-xs rounded-sm transition-colors ${
              selectedId === t.id && !isCreatingNew ? "bg-primary/10 text-primary" : "hover:bg-bg-app text-text-primary"
            }`}
          >
            <p className="font-body text-[13px] truncate">{t.name}</p>
            {t.isSystem && <p className="font-data text-[10px] text-text-tertiary uppercase">System</p>}
          </button>
        ))}
      </div>

      <div className="bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-md">
        {!selected && !isCreatingNew ? (
          <p className="font-body text-[13px] text-text-tertiary">Select a template, or create a new one.</p>
        ) : (
          <>
            {(isCreatingNew || !selected?.isSystem) && (
              <div>
                <label className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-xs block">Name</label>
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="w-full h-11 px-md rounded-sm border border-border-outline bg-bg-app font-body text-[14px] text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                />
              </div>
            )}
            <div>
              <label className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-xs block">Subject</label>
              <input
                value={draftSubject}
                onChange={(e) => setDraftSubject(e.target.value)}
                className="w-full h-11 px-md rounded-sm border border-border-outline bg-bg-app font-body text-[14px] text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>
            <div>
              <label className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-xs block">Body</label>
              <RichTextEditor value={draftBody} onChange={setDraftBody} onUploadImage={uploadInlineImage} />
            </div>
            <div className="flex items-center gap-md">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !draftSubject.trim() || !draftBody.trim() || (isCreatingNew && !draftName.trim())}
                className="inline-flex items-center gap-sm h-11 px-lg rounded-full bg-primary text-white font-data text-[12px] font-semibold hover:bg-[#007d35] transition-colors disabled:opacity-50"
              >
                <PencilIcon className="w-4 h-4" />
                {isSaving ? "Saving…" : isCreatingNew ? "Create template" : "Save"}
              </button>
              {selected && !selected.isSystem && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="inline-flex items-center gap-sm h-11 px-md rounded-full border border-[#ba1a1a]/40 text-[#ba1a1a] font-data text-[12px] font-semibold hover:bg-[#ffd9de] transition-colors disabled:opacity-50"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete
                </button>
              )}
              {status && (
                <span className={`font-body text-[13px] ${status.kind === "error" ? "text-[#ba1a1a]" : "text-primary"}`}>
                  {status.message}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
        <p className="font-data text-[11px] tracking-[0.6px] uppercase text-text-tertiary mb-md">Preview — sample data</p>
        <div className="border border-border-outline rounded-sm overflow-hidden">
          <div className="px-md py-sm bg-bg-surface-elevated border-b border-border-outline">
            <p className="font-body text-[13px] font-medium text-text-primary truncate">{previewSubject || "(no subject)"}</p>
          </div>
          <div className="px-md py-md">
            {previewBody ? <RichTextPreview html={previewBody} /> : <p className="font-body text-[13px] text-text-tertiary">(empty)</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmailsPage({
  templates,
  volunteers,
  initialTab,
}: {
  templates: EmailTemplateRecord[];
  volunteers: Volunteer[];
  initialTab: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <div className="max-w-6xl mx-auto p-xl">
      <header className="mb-lg">
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Emails</h1>
        <p className="mt-xs font-body text-[14px] text-text-tertiary">
          Send an email straight from the dashboard, or manage reusable templates.
        </p>
      </header>

      <div className="flex items-center gap-xs mb-lg" role="tablist" aria-label="Emails view">
        <TabButton active={tab === "compose"} onClick={() => setTab("compose")}>
          Compose
        </TabButton>
        <TabButton active={tab === "templates"} onClick={() => setTab("templates")}>
          Templates
        </TabButton>
      </div>

      {tab === "compose" ? <ComposeTab templates={templates} volunteers={volunteers} /> : <TemplatesTab templates={templates} />}
    </div>
  );
}
