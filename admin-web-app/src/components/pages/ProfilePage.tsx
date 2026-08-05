'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeOffIcon } from '@/components/ui/Icons';
import { createClient } from '@/lib/supabase/client';

/**
 * Account page for Donna — profile / password edits are still preview-local;
 * Sign out clears the Supabase session and returns to `/login`.
 */
const DEFAULT_PROFILE = {
  name: 'Donna Adam',
  title: 'Executive Director',
  role: 'Administrator',
  organization: 'Clean Up – Give Back .Org',
  email: 'donnaadam@cleanupgiveback.org',
};

const FIELD =
  'w-full h-10 px-md rounded-sm border border-border-outline bg-bg-app font-body text-[14px] text-text-primary focus:outline-none focus:border-primary';
const PASSWORD_FIELD = `${FIELD} pr-11`;
const LABEL = 'font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-xs block';
const SUBMIT =
  'h-11 px-lg rounded-sm bg-primary text-white font-data text-[13px] font-semibold tracking-wide disabled:opacity-60 w-fit';

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  visible,
  onToggleVisible,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  required?: boolean;
  minLength?: number;
  visible: boolean;
  onToggleVisible: () => void;
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={PASSWORD_FIELD}
        />
        <button
          type="button"
          onClick={onToggleVisible}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-sm text-text-tertiary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          {visible ? (
            <EyeIcon className="w-5 h-5" aria-hidden />
          ) : (
            <EyeOffIcon className="w-5 h-5" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'DA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

function Status({ error, success }: { error?: string; success?: string }) {
  if (error) {
    return (
      <p
        className="font-body text-[14px] text-[#ba1a1a] bg-[#ffd9de] border border-[#ba1a1a]/40 rounded-sm px-md py-sm"
        role="alert"
      >
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p
        className="font-body text-[14px] text-primary bg-[#f7fff1] border border-primary/40 rounded-sm px-md py-sm"
        role="status"
      >
        {success}
      </p>
    );
  }
  return null;
}

export function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState(DEFAULT_PROFILE.name);
  const [email, setEmail] = useState(DEFAULT_PROFILE.email);
  const [profileMsg, setProfileMsg] = useState<{ error?: string; success?: string }>({});
  const [passwordMsg, setPasswordMsg] = useState<{ error?: string; success?: string }>({});
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setPasswordMsg({});
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        setPasswordMsg({ error: 'Could not sign out. Try again.' });
        setSigningOut(false);
        return;
      }
      router.push('/login');
      router.refresh();
    } catch {
      setPasswordMsg({ error: 'Could not sign out. Try again.' });
      setSigningOut(false);
    }
  }

  function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    const nextName = name.trim();
    const nextEmail = email.trim().toLowerCase();
    if (nextName.length < 2) {
      setProfileMsg({ error: 'Name must be at least 2 characters.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setProfileMsg({ error: 'Enter a valid email address.' });
      return;
    }
    setName(nextName);
    setEmail(nextEmail);
    setProfileMsg({ success: 'Profile saved (preview only — wire Supabase on admin to persist).' });
  }

  function handlePasswordSave(e: FormEvent) {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordMsg({ error: 'Enter your current password.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ error: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ error: 'New password and confirmation do not match.' });
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordMsg({ error: 'New password must be different from your current password.' });
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMsg({ success: 'Password updated (preview only — wire Supabase on admin to persist).' });
  }

  const readOnlyFields = [
    { label: 'Title', value: DEFAULT_PROFILE.title },
    { label: 'Role', value: DEFAULT_PROFILE.role },
    { label: 'Organization', value: DEFAULT_PROFILE.organization },
  ];

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-lg">
      <header>
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Account</h1>
        <p className="mt-xs font-body text-[14px] text-text-tertiary">
          Your admin profile for the CleanUpGiveBack portal. Change your name, email, and password
          below.
        </p>
      </header>

      <section className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
        <div className="px-lg py-lg flex items-center gap-md border-b border-border-outline">
          <span
            className="w-14 h-14 rounded-full bg-primary text-white font-data text-[18px] font-semibold inline-flex items-center justify-center shrink-0"
            aria-hidden
          >
            {initialsFromName(name)}
          </span>
          <div className="min-w-0">
            <h2 className="font-heading text-[22px] leading-[28px] text-text-primary truncate">{name}</h2>
            <p className="font-data text-[12px] text-text-tertiary">
              {DEFAULT_PROFILE.title} · {DEFAULT_PROFILE.role}
            </p>
          </div>
        </div>

        <dl className="divide-y divide-border-outline">
          {readOnlyFields.map((field) => (
            <div
              key={field.label}
              className="px-lg py-md grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-xs sm:gap-md"
            >
              <dt className="font-data text-[11px] uppercase tracking-[0.88px] text-text-tertiary">
                {field.label}
              </dt>
              <dd className="font-body text-[14px] text-text-primary break-words">{field.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <form
        onSubmit={handleProfileSave}
        className="bg-bg-surface border border-border-outline rounded-md overflow-hidden"
      >
        <div className="px-lg py-md border-b border-border-outline">
          <h2 className="font-heading text-[18px] leading-[24px] text-text-primary">Profile</h2>
          <p className="mt-xs font-body text-[13px] text-text-tertiary">
            Update the name and email you use to sign in to this portal.
          </p>
        </div>
        <div className="p-lg flex flex-col gap-md">
          <Status {...profileMsg} />
          <div>
            <label htmlFor="profile-name" className={LABEL}>
              Name
            </label>
            <input
              id="profile-name"
              type="text"
              required
              minLength={2}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor="profile-email" className={LABEL}>
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={FIELD}
            />
          </div>
          <button type="submit" className={SUBMIT}>
            Save profile
          </button>
        </div>
      </form>

      <form
        onSubmit={handlePasswordSave}
        className="bg-bg-surface border border-border-outline rounded-md overflow-hidden"
      >
        <div className="px-lg py-md border-b border-border-outline">
          <h2 className="font-heading text-[18px] leading-[24px] text-text-primary">Password</h2>
          <p className="mt-xs font-body text-[13px] text-text-tertiary">
            Choose a new password (at least 8 characters).
          </p>
        </div>
        <div className="p-lg flex flex-col gap-md">
          <Status {...passwordMsg} />
          <PasswordField
            id="profile-current-password"
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
            required
            visible={showCurrentPassword}
            onToggleVisible={() => setShowCurrentPassword((v) => !v)}
          />
          <PasswordField
            id="profile-new-password"
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
            required
            minLength={8}
            visible={showNewPassword}
            onToggleVisible={() => setShowNewPassword((v) => !v)}
          />
          <PasswordField
            id="profile-confirm-password"
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            required
            minLength={8}
            visible={showConfirmPassword}
            onToggleVisible={() => setShowConfirmPassword((v) => !v)}
          />
          <button type="submit" className={SUBMIT}>
            Update password
          </button>
        </div>
      </form>

      <div className="mt-0 flex flex-col gap-md">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="h-11 px-lg rounded-sm border border-border-outline bg-bg-surface font-data text-[13px] font-semibold text-text-primary hover:bg-bg-surface-elevated transition-colors w-fit disabled:cursor-not-allowed disabled:opacity-60"
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  );
}
