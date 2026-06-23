import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Force the Privy branch (env-derived flag would otherwise be false in tests).
vi.mock('@/lib/wagmi.privy', () => ({
  isPrivyEnabled: true,
  PRIVY_APP_ID: 'test',
  privyWagmiConfig: {},
}));

// qrcode uses canvas which jsdom doesn't implement — stub it out.
vi.mock('qrcode', () => ({
  default: { toCanvas: vi.fn().mockResolvedValue(undefined) },
}));

const usePrivy = vi.fn();
const useWallets = vi.fn();
const useAccount = vi.fn();
// PrivyWalletQr now reads the EMBEDDED wallet from useWallets (so the QR matches
// the wallet that signs the review), not useAccount.
vi.mock('@privy-io/react-auth', () => ({
  usePrivy: () => usePrivy(),
  useWallets: () => useWallets(),
}));
vi.mock('wagmi', () => ({ useAccount: () => useAccount() }));
vi.mock('@rainbow-me/rainbowkit', () => ({ ConnectButton: () => null }));

import { WalletQr } from '@/components/customer/WalletQr';

const ADDR = '0x' + 'a'.repeat(40);
const embedded = (address?: string) => ({
  wallets: address ? [{ walletClientType: 'privy', address }] : [],
});

describe('WalletQr (Privy path)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAccount.mockReturnValue({ address: undefined });
    useWallets.mockReturnValue(embedded());
  });

  it('prompts sign-in when the customer is not authenticated', () => {
    usePrivy.mockReturnValue({ ready: true, authenticated: false, login: vi.fn() });

    render(<WalletQr />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders the address QR + address text once authenticated', () => {
    usePrivy.mockReturnValue({ ready: true, authenticated: true, login: vi.fn() });
    useWallets.mockReturnValue(embedded(ADDR));

    render(<WalletQr />);
    expect(screen.getByText(/show this at checkout/i)).toBeInTheDocument();
    expect(screen.getByText(ADDR)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy address/i })).toBeInTheDocument();
  });

  it('shows a provisioning message when authenticated but the wallet has no address yet', () => {
    usePrivy.mockReturnValue({ ready: true, authenticated: true, login: vi.fn() });
    useWallets.mockReturnValue(embedded());

    render(<WalletQr />);
    expect(screen.getByText(/setting up your wallet/i)).toBeInTheDocument();
  });
});
