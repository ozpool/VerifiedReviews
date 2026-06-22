'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchBusiness, ApiError } from '@/lib/api';
import { ReviewForm } from './ReviewForm';
import { Loading, Empty, ErrorState } from '@/components/ui/StatusStates';

/** Resolves the business by slug (to get its on-chain id), then renders the form. */
export function WriteReviewClient({ slug }: { slug: string }) {
  const query = useQuery({
    queryKey: ['business', slug],
    queryFn: () => fetchBusiness(slug),
    retry: false,
  });

  if (query.isPending) return <Loading label="Loading…" />;
  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return notFound ? (
      <Empty title="Business not found" description="This business isn't listed yet." />
    ) : (
      <ErrorState message="Couldn't load this business." retry={() => query.refetch()} />
    );
  }

  const business = query.data;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/b/${business.slug}`}
          className="text-sm text-muted hover:text-ink transition-colors"
        >
          ← Back to {business.name}
        </Link>
        <h1 className="font-display text-3xl font-bold text-ink mt-3">Write a verified review</h1>
        <p className="text-sm text-muted mt-1">
          for {business.name} · {business.city}
        </p>
      </div>
      <ReviewForm businessId={business.businessId} />
    </div>
  );
}
