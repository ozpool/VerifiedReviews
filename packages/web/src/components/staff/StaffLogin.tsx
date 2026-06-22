'use client';

import { useState } from 'react';
import { loginStaff, ApiError, type StaffSession } from '@/lib/api';
import { Button } from '@/components/ui/Button';

const input =
  'w-full bg-paper border border-border rounded px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper';

/** Staff login form. On success it hands the business-scoped session up to the
 * parent, which persists it. */
export function StaffLogin({ onLogin }: { onLogin: (s: StaffSession) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      onLogin(await loginStaff(email, password));
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
    <form onSubmit={submit} className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold text-ink">Staff sign in</h2>
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
