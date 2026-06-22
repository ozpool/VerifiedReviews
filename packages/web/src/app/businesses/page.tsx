import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { BrowseClient } from '@/components/business/BrowseClient';

export const metadata: Metadata = {
  title: 'Browse businesses',
  description: 'Find local businesses and read reviews backed by real, on-chain visit receipts.',
};

export default function BrowsePage() {
  return (
    <>
      <SiteHeader />
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col gap-2 mb-8 max-w-xl">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink">
            Browse businesses
          </h1>
          <p className="text-sm text-muted leading-relaxed">
            Every rating here is computed from on-chain-verified reviews — each one backed by a
            soulbound receipt that can&apos;t be faked or bought.
          </p>
        </div>
        <BrowseClient />
      </main>
      <SiteFooter />
    </>
  );
}
