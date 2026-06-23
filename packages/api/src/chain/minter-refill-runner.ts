import { BusinessModel } from '../models/business.model';
import { loadConfig } from '../config';
import { getMinterFunder, type MinterFunder } from './minter-funder';
import { deriveMinterAddress } from './minter';

export interface RefillHandle {
  stop: () => void;
}

/**
 * One refill sweep: top up every approved business's minter that's dipped below
 * the threshold. The funder skips already-funded minters, so this is cheap to run
 * and a no-op most of the time. Exposed with an injectable funder so tests drive
 * it directly without a timer.
 */
export async function runMinterRefillTick(
  funder: MinterFunder = getMinterFunder(),
): Promise<number> {
  const businesses = await BusinessModel.find({ status: 'approved' })
    .select('businessId minterAddress')
    .lean();

  let funded = 0;
  for (const b of businesses) {
    if (b.businessId === undefined) continue;
    const addr = b.minterAddress ?? deriveMinterAddress(b.businessId);
    try {
      const result = await funder.fund(addr);
      if (!result.skipped) {
        funded += 1;
        console.log(`Minter refill: topped up #${b.businessId} (${addr}) — tx ${result.txHash}`);
      }
    } catch (err) {
      console.error(
        `Minter refill failed for #${b.businessId}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }
  return funded;
}

/**
 * Start the continuous minter refiller. Polls on an interval, survives transient
 * RPC errors, and no-ops cleanly when the treasury isn't configured (so dev/CI
 * boot without it). Returns null when disabled.
 */
export function startMinterRefiller(): RefillHandle | null {
  const { RPC_URL, ADMIN_PRIVATE_KEY, MINTER_REFILL_POLL_MS } = loadConfig();
  if (!RPC_URL || !ADMIN_PRIVATE_KEY) {
    console.warn('Minter refiller disabled: RPC_URL / ADMIN_PRIVATE_KEY not configured');
    return null;
  }

  let running = true;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const loop = async () => {
    try {
      await runMinterRefillTick();
    } catch (err) {
      console.error('Minter refill tick failed:', err instanceof Error ? err.message : err);
    }
    if (running) timer = setTimeout(() => void loop(), MINTER_REFILL_POLL_MS);
  };

  void loop();
  return {
    stop: () => {
      running = false;
      if (timer) clearTimeout(timer);
    },
  };
}
