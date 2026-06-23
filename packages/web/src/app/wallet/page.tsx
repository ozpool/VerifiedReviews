import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { WalletQr } from '@/components/customer/WalletQr';

export const metadata: Metadata = {
  title: 'Your visit code',
  description: 'Show this QR at checkout so staff can mint your visit receipt.',
};

export default function WalletPage() {
  return (
    <>
      <SiteHeader />
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex flex-col gap-2 mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-ink">Your visit code</h1>
          <p className="text-sm text-muted">
            Show this at checkout. Staff scan it to mint your soulbound visit receipt — the receipt
            that lets you leave a verified review.
          </p>
        </div>
        <WalletQr />
      </main>
      <SiteFooter />
    </>
  );
}
