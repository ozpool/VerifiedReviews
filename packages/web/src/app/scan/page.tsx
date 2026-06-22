import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { ScanClient } from '@/components/staff/ScanClient';

export const metadata: Metadata = { title: 'Staff — Mint VisitProofs' };

export default function ScanPage() {
  return (
    <>
      <SiteHeader />
      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-ink mb-1">Mint VisitProofs</h1>
        <p className="text-sm text-muted mb-8">
          Scan a customer&apos;s wallet at checkout to mint their visit receipt.
        </p>
        <ScanClient />
      </main>
      <SiteFooter />
    </>
  );
}
