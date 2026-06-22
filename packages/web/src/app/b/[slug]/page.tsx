import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { BusinessDetailClient } from '@/components/business/BusinessDetailClient';

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  // Title from the slug — the page itself fetches the live profile client-side.
  const name = params.slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return { title: name };
}

export default function BusinessPage({ params }: { params: { slug: string } }) {
  return (
    <>
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <BusinessDetailClient slug={params.slug} />
      </main>
      <SiteFooter />
    </>
  );
}
