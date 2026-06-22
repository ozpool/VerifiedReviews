import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { OwnerClient } from '@/components/owner/OwnerClient';

export const metadata: Metadata = { title: 'Business dashboard' };

export default function BizPage() {
  return (
    <>
      <SiteHeader />
      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-ink mb-8">Business dashboard</h1>
        <OwnerClient />
      </main>
      <SiteFooter />
    </>
  );
}
