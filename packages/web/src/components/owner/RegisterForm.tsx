'use client';

import { useState } from 'react';
import { registerBusiness, ApiError, type RegisterBusinessPayload } from '@/lib/api';
import { Button } from '@/components/ui/Button';

const input =
  'w-full bg-paper border border-border rounded px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper';

interface Props {
  onRegistered: (slug: string) => void;
  onSwitchToLogin: () => void;
}

/** Slugify a business name for the user as they type. */
function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function RegisterForm({ onRegistered, onSwitchToLogin }: Props) {
  const [form, setForm] = useState<RegisterBusinessPayload>({
    name: '',
    slug: '',
    category: '',
    city: '',
    description: '',
    websiteUrl: '',
    ownerEmail: '',
    ownerPassword: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  function set(field: keyof RegisterBusinessPayload, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-fill slug from name unless user has manually edited it.
      if (field === 'name' && prev.slug === toSlug(prev.name)) {
        next.slug = toSlug(value);
      }
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const payload: RegisterBusinessPayload = {
        ...form,
        description: form.description || undefined,
        websiteUrl: form.websiteUrl || undefined,
      };
      const res = await registerBusiness(payload);
      setDone(true);
      onRegistered(res.slug);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('That slug or email is already registered.');
      } else if (err instanceof ApiError && err.status === 400) {
        const body = err.body as { message?: string };
        setError(body?.message ?? 'Check all fields and try again.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="border-2 border-dashed border-accent rounded p-6 flex flex-col gap-2 max-w-sm">
        <p className="font-display font-semibold text-ink">Application submitted</p>
        <p className="text-sm text-muted leading-relaxed">
          Your business is pending admin review. You&apos;ll be able to sign in once it&apos;s
          approved.
        </p>
        <button
          onClick={onSwitchToLogin}
          className="text-sm text-accent hover:text-accent-light transition-colors w-fit mt-1"
        >
          Back to sign in →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 max-w-sm">
      <h2 className="font-display text-lg font-semibold text-ink">Register your business</h2>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-ink">Business name</span>
        <input
          type="text"
          required
          minLength={2}
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. The Corner Cafe"
          className={input}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-ink">
          URL slug <span className="text-muted text-xs">(auto-filled, must be unique)</span>
        </span>
        <input
          type="text"
          required
          pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
          title="Lowercase letters, numbers, and hyphens only"
          value={form.slug}
          onChange={(e) => set('slug', e.target.value)}
          placeholder="the-corner-cafe"
          className={input}
        />
      </label>

      <div className="flex gap-3">
        <label className="flex flex-col gap-1.5 flex-1">
          <span className="text-sm text-ink">Category</span>
          <input
            type="text"
            required
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            placeholder="Cafe"
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1.5 flex-1">
          <span className="text-sm text-ink">City</span>
          <input
            type="text"
            required
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="Austin"
            className={input}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-ink">
          Description <span className="text-muted text-xs">(optional)</span>
        </span>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="A short description of your business"
          className={input}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-ink">
          Website <span className="text-muted text-xs">(optional)</span>
        </span>
        <input
          type="url"
          value={form.websiteUrl}
          onChange={(e) => set('websiteUrl', e.target.value)}
          placeholder="https://yourcafe.com"
          className={input}
        />
      </label>

      <hr className="border-border" />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-ink">Owner email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={form.ownerEmail}
          onChange={(e) => set('ownerEmail', e.target.value)}
          className={input}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-ink">Password</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={form.ownerPassword}
          onChange={(e) => set('ownerPassword', e.target.value)}
          placeholder="At least 8 characters"
          className={input}
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-accent">
          {error}
        </p>
      )}

      <Button type="submit" loading={busy} disabled={busy}>
        Submit application
      </Button>

      <button
        type="button"
        onClick={onSwitchToLogin}
        className="text-sm text-muted hover:text-ink transition-colors text-left"
      >
        Already registered? Sign in →
      </button>
    </form>
  );
}
