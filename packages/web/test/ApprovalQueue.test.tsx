import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/api', async (orig) => {
  const actual = await orig<typeof import('@/lib/api')>();
  return { ...actual, adminListBusinesses: vi.fn(), adminApprove: vi.fn() };
});

import { ApprovalQueue } from '@/components/admin/ApprovalQueue';
import { adminListBusinesses, adminApprove } from '@/lib/api';

function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('ApprovalQueue', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists pending businesses and approves one', async () => {
    vi.mocked(adminListBusinesses).mockResolvedValue([
      { _id: 'a1', slug: 'cafe-a', name: 'Cafe A', city: 'Austin', status: 'pending' },
    ]);
    vi.mocked(adminApprove).mockResolvedValue({ status: 'approved', businessId: 1 });
    const user = userEvent.setup();

    wrap(<ApprovalQueue token="tok" />);

    expect(await screen.findByText('Cafe A')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /approve/i }));
    expect(adminApprove).toHaveBeenCalledWith('tok', 'a1');
  });

  it('shows the empty state when nothing is pending', async () => {
    vi.mocked(adminListBusinesses).mockResolvedValue([]);
    wrap(<ApprovalQueue token="tok" />);
    expect(await screen.findByText(/nothing pending/i)).toBeInTheDocument();
  });
});
