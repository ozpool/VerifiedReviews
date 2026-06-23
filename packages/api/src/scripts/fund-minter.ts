import 'dotenv/config';
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  formatEther,
  type Hex,
  type PublicClient,
} from 'viem';
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';
import { loadConfig } from '../config';

/**
 * Top up a business's minter wallet with gas, sending from a platform wallet you
 * already control (no faucet needed). Source defaults to the admin/treasury key;
 * pass `gastank` as the 3rd arg to send from the gas-tank wallet instead.
 *
 * Run: pnpm -F @vr/api exec tsx src/scripts/fund-minter.ts <businessId> [amountEth] [admin|gastank]
 * e.g. pnpm -F @vr/api exec tsx src/scripts/fund-minter.ts 1 0.02
 */
async function main() {
  const businessId = Number(process.argv[2]);
  const amountEth = process.argv[3] ?? '0.02';
  const source = (process.argv[4] ?? 'admin').toLowerCase();
  if (!Number.isInteger(businessId)) {
    throw new Error('Usage: fund-minter.ts <businessId> [amountEth] [admin|gastank]');
  }

  const cfg = loadConfig();
  if (!cfg.RPC_URL || !cfg.MINTER_MNEMONIC) {
    throw new Error('RPC_URL and MINTER_MNEMONIC must be set in packages/api/.env');
  }
  const fromKey = source === 'gastank' ? cfg.GAS_TANK_PRIVATE_KEY : cfg.ADMIN_PRIVATE_KEY;
  if (!fromKey) {
    throw new Error(
      `No key for source "${source}" — set ${source === 'gastank' ? 'GAS_TANK_PRIVATE_KEY' : 'ADMIN_PRIVATE_KEY'}`,
    );
  }

  const transport = http(cfg.RPC_URL);
  const publicClient: PublicClient = createPublicClient({ chain: arbitrumSepolia, transport });
  const account = privateKeyToAccount(fromKey as Hex);
  const wallet = createWalletClient({ account, chain: arbitrumSepolia, transport });
  const minter = mnemonicToAccount(cfg.MINTER_MNEMONIC, { addressIndex: businessId }).address;

  console.log(`\nSending ${amountEth} ETH`);
  console.log(`  from ${source}: ${account.address}`);
  console.log(`  to   minter #${businessId}: ${minter}`);

  const hash = await wallet.sendTransaction({ to: minter, value: parseEther(amountEth) });
  console.log(`\ntx: ${hash}\nwaiting for confirmation…`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== 'success') throw new Error(`transfer reverted: ${hash}`);

  const balance = await publicClient.getBalance({ address: minter as Hex });
  console.log(`\nDone. Minter #${businessId} now holds ${formatEther(balance)} ETH.\n`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
