import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { WriteReviewClient } from '@/components/review/WriteReviewClient';

export const metadata: Metadata = { title: 'Write a review' };

export default function WriteReviewPage({ params }: { params: { slug: string } }) {
  return (
    <>
      <SiteHeader />
      <main className="max-w-2xl mx-auto px-6 py-12">
        <WriteReviewClient slug={params.slug} />
      </main>
      <SiteFooter />
    </>
  );
}
