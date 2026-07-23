'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('Invalid email or password.');
      setLoading(false);
      return;
    }

    const role = data.user?.user_metadata?.role;
    if (role !== 'admin') {
      await supabase.auth.signOut();
      setError('Access denied. This portal is for administrators only.');
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-bg-app flex items-center justify-center p-lg">
      <div className="w-full max-w-sm">
        {/* Logo mark */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-primary mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L4 7v10l8 5 8-5V7L12 2z" stroke="#fff" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">
            CleanUpGiveBack
          </h1>
          <p className="font-data text-[12px] leading-[18px] tracking-[0.96px] text-text-tertiary uppercase mt-1">
            Admin Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-md">
          {error && (
            <div className="px-md py-sm rounded-sm bg-[#ffd9de] border border-[#ba1a1a] text-[#ba1a1a] text-sm font-body">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-sm">
            <label htmlFor="email" className="font-data text-[12px] leading-[18px] tracking-[0.96px] text-text-tertiary uppercase">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 px-md rounded-sm border border-border-outline bg-bg-surface text-text-primary font-body text-base placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              placeholder="donna@cleanupgiveback.org"
            />
          </div>

          <div className="flex flex-col gap-sm">
            <label htmlFor="password" className="font-data text-[12px] leading-[18px] tracking-[0.96px] text-text-tertiary uppercase">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 px-md rounded-sm border border-border-outline bg-bg-surface text-text-primary font-body text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="interactive mt-sm h-11 rounded-sm bg-primary text-white font-data text-base font-semibold tracking-wide transition-transform active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
