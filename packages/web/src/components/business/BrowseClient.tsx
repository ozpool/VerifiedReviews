'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBusinesses, fetchBadge, type Badge } from '@/lib/api';
import { BusinessCard } from './BusinessCard';
import { Loading, Empty, ErrorState } from '@/components/ui/StatusStates';

/**
 * Browse + search experience. Businesses come from the API filtered by the
 * query; their verified counts (badges) load in a second pass and power both the
 * "verified only" toggle and the rating shown on each card.
 */
export function BrowseClient() {
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const businessesQuery = useQuery({
    queryKey: ['businesses', q, city, category],
    queryFn: () => fetchBusinesses({ q, city, category }),
  });

  const businesses = useMemo(() => businessesQuery.data ?? [], [businessesQuery.data]);
  const ids = businesses.map((b) => b.businessId);

  const badgesQuery = useQuery({
    queryKey: ['badges', ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const badges = await Promise.all(ids.map((id) => fetchBadge(id)));
      return Object.fromEntries(badges.map((b) => [b.businessId, b])) as Record<number, Badge>;
    },
  });

  const badges = badgesQuery.data ?? {};
  const shown = verifiedOnly
    ? businesses.filter((b) => (badges[b.businessId]?.count ?? 0) > 0)
    : businesses;

  return (
    <div className="flex flex-col gap-8">
      <SearchBar
        q={q}
        city={city}
        category={category}
        verifiedOnly={verifiedOnly}
        onQ={setQ}
        onCity={setCity}
        onCategory={setCategory}
        onVerifiedOnly={setVerifiedOnly}
      />

      {businessesQuery.isPending ? (
        <Loading label="Finding businesses…" />
      ) : businessesQuery.isError ? (
        <ErrorState
          message="Couldn't load businesses. The API may be offline."
          retry={() => businessesQuery.refetch()}
        />
      ) : shown.length === 0 ? (
        <Empty
          title="No businesses found"
          description={
            verifiedOnly
              ? 'Try turning off the verified-only filter, or widen your search.'
              : 'Try a different search or clear the filters.'
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shown.map((b) => (
            <BusinessCard key={b.slug} business={b} badge={badges[b.businessId]} />
          ))}
        </div>
      )}
    </div>
  );
}

interface SearchBarProps {
  q: string;
  city: string;
  category: string;
  verifiedOnly: boolean;
  onQ: (v: string) => void;
  onCity: (v: string) => void;
  onCategory: (v: string) => void;
  onVerifiedOnly: (v: boolean) => void;
}

function SearchBar(props: SearchBarProps) {
  const input =
    'w-full bg-paper border border-border rounded px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper';
  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={props.q}
        onChange={(e) => props.onQ(e.target.value)}
        placeholder="Search businesses by name…"
        aria-label="Search businesses by name"
        className={input}
      />
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={props.city}
          onChange={(e) => props.onCity(e.target.value)}
          placeholder="City"
          aria-label="Filter by city"
          className={`${input} sm:w-40`}
        />
        <input
          type="text"
          value={props.category}
          onChange={(e) => props.onCategory(e.target.value)}
          placeholder="Category"
          aria-label="Filter by category"
          className={`${input} sm:w-40`}
        />
        <label className="ml-auto inline-flex items-center gap-2 text-sm text-ink cursor-pointer select-none">
          <input
            type="checkbox"
            checked={props.verifiedOnly}
            onChange={(e) => props.onVerifiedOnly(e.target.checked)}
            className="accent-accent w-4 h-4"
          />
          Verified only
        </label>
      </div>
    </div>
  );
}
