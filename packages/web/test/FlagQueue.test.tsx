import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/api', async (orig) => {
  const actual = await orig<typeof import('@/lib/api')>();
  return { ...actual, adminListFlags: vi.fn(), adminResolveFlag: vi.fn() };
});

import { FlagQueue } from '@/components/admin/FlagQueue';
import { adminListFlags, adminResolveFlag } from '@/lib/api';

function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const flag = {
  _id: 'f1',
  reason: 'obvious spam',
  status: 'open' as const,
  createdAt: '',
  review: {
    _id: 'r1',
    businessId: 3,
    reviewer: '0x0',
    rating: 1,
    text: 'buy cheap stuff now',
    sentiment: 'negative',
    hidden: false,
  },
};

describe('FlagQueue', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists open flags and hides a review', async () => {
    vi.mocked(adminListFlags).mockResolvedValue([flag]);
    vi.mocked(adminResolveFlag).mockResolvedValue({ id: 'f1', status: 'actioned' });
    const user = userEvent.setup();

    wrap(<FlagQueue token="tok" />);

    expect(await screen.findByText(/buy cheap stuff now/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /hide review/i }));
    expect(adminResolveFlag).toHaveBeenCalledWith('tok', 'f1', 'hide');
  });

  it('shows the empty state when there are no flags', async () => {
    vi.mocked(adminListFlags).mockResolvedValue([]);
    wrap(<FlagQueue token="tok" />);
    expect(await screen.findByText(/no open flags/i)).toBeInTheDocument();
  });
});
