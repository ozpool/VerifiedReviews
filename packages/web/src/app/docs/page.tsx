import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { WhitePaper } from '@/components/docs/WhitePaper';
import { WhitePaperBody } from '@/components/docs/WhitePaperBody';

export const metadata: Metadata = {
  title: 'Docs',
  description:
    'How VerifiedReviews uses a soulbound point-of-sale receipt and an on-chain gate to make every review provably real.',
};

export default function DocsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <WhitePaper>
          <WhitePaperBody />
        </WhitePaper>
      </main>
      <SiteFooter />
    </>
  );
}
