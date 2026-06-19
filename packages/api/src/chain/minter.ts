import { mnemonicToAccount } from 'viem/accounts';
import { loadConfig } from '../config';

/**
 * Derive a business's minter wallet address from the master mnemonic, using the
 * businessId as the HD address index. No per-business private key is ever stored
 * — the signer is re-derived on demand at mint time (PR #8) from the one secret.
 */
export function deriveMinterAddress(businessId: number): string {
  const { MINTER_MNEMONIC } = loadConfig();
  if (!MINTER_MNEMONIC) {
    throw new Error('MINTER_MNEMONIC is not configured');
  }
  return mnemonicToAccount(MINTER_MNEMONIC, { addressIndex: businessId }).address;
}
