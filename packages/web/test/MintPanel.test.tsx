import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock only the network call; keep the real isEvmAddress etc.
vi.mock('@/lib/api', async (orig) => {
  const actual = await orig<typeof import('@/lib/api')>();
  return { ...actual, mintVisitProof: vi.fn() };
});

import { MintPanel } from '@/components/staff/MintPanel';
import { mintVisitProof } from '@/lib/api';

const session = { token: 'tok', businessId: 1, slug: 'test-biz' };
const VALID = '0x' + '1'.repeat(40);

describe('MintPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps mint disabled until a valid address is entered', async () => {
    const user = userEvent.setup();
    render(<MintPanel session={session} onMinted={() => {}} />);

    const button = screen.getByRole('button', { name: /mint visitproof/i });
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText(/customer wallet address/i), 'not-an-address');
    expect(button).toBeDisabled();
    expect(screen.getByText(/valid wallet address/i)).toBeInTheDocument();
  });

  it('mints with the scoped session and surfaces the tx on success', async () => {
    vi.mocked(mintVisitProof).mockResolvedValue({ tokenId: '1', txHash: '0xabc123' });
    const onMinted = vi.fn();
    const user = userEvent.setup();
    render(<MintPanel session={session} onMinted={onMinted} />);

    await user.type(screen.getByLabelText(/customer wallet address/i), VALID);
    await user.click(screen.getByRole('button', { name: /mint visitproof/i }));

    expect(mintVisitProof).toHaveBeenCalledWith('tok', 1, VALID);
    expect(await screen.findByText(/minted/i)).toBeInTheDocument();
    expect(onMinted).toHaveBeenCalled();
  });
});
