'use client';

import { useState } from 'react';

/** Embed-snippet generator + live preview of the business's verified badge. */
export function BadgeEmbed({ businessId }: { businessId: number }) {
  const base = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';
  const src = `${base}/badge/${businessId}`;
  const snippet = `<iframe src="${src}" width="260" height="120" style="border:0" title="VerifiedReviews badge"></iframe>`;
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-semibold text-ink">Embed your badge</h2>
      <p className="text-sm text-muted">
        Paste this on your own site to show your verified-review count. The numbers come straight
        from the chain via VerifiedReviews.
      </p>
      <pre className="bg-subtle border border-border rounded p-3 text-xs text-ink overflow-x-auto">
        {snippet}
      </pre>
      <button
        onClick={copy}
        className="self-start text-sm text-accent hover:text-accent-light transition-colors"
      >
        {copied ? 'Copied ✓' : 'Copy snippet'}
      </button>
      <div className="pt-2">
        <span className="text-xs text-muted">Preview</span>
        <iframe src={src} width={260} height={120} style={{ border: 0 }} title="Badge preview" />
      </div>
    </section>
  );
}
