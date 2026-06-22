'use client';

import { useState } from 'react';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';

const input =
  'w-full bg-paper border border-border rounded px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper';

/**
 * Generic email/password sign-in. The parent supplies `onLogin`, which performs
 * the actual API call + session persistence and throws on failure; this form just
 * collects credentials and surfaces errors. Reused for owner and admin sign-in.
 */
export function LoginForm({
  title,
  onLogin,
}: {
  title: string;
  onLogin: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? 'Wrong email or password.'
          : 'Login failed. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 max-w-sm">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-ink">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className={input}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-ink">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className={input}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-accent">
          {error}
        </p>
      )}
      <Button type="submit" loading={busy} disabled={busy}>
        Sign in
      </Button>
    </form>
  );
}
