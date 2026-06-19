import { createPublicClient, http, type Hex, type PublicClient } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { reviewRegistryAbi } from '@vr/shared';
import { loadConfig } from '../config';
import { getCheckpoint, setCheckpoint } from '../models/checkpoint.model';
import { confirmEvent, type OnChainReview } from '../services/review.service';

const CHECKPOINT = 'reviewRegistry';

/** Pulls ReviewSubmitted events for a block range. Injectable so the indexer
 * loop can be driven with synthetic events in tests (no live RPC). */
export type EventFetcher = (fromBlock: bigint, toBlock: bigint) => Promise<OnChainReview[]>;

/** Real fetcher backed by viem getContractEvents over the dedicated indexer RPC. */
export function createLogFetcher(): EventFetcher {
  const { INDEXER_RPC_URL, RPC_URL, REGISTRY_ADDRESS } = loadConfig();
  const rpc = INDEXER_RPC_URL ?? RPC_URL;
  if (!rpc || !REGISTRY_ADDRESS) throw new Error('INDEXER_RPC_URL/RPC_URL and REGISTRY_ADDRESS required');
  const client: PublicClient = createPublicClient({ chain: arbitrumSepolia, transport: http(rpc) });
  const address = REGISTRY_ADDRESS as Hex;

  return async (fromBlock, toBlock) => {
    const logs = await client.getContractEvents({
      address,
      abi: reviewRegistryAbi,
      eventName: 'ReviewSubmitted',
      fromBlock,
      toBlock,
    });
    return logs.map((log) => ({
      businessId: Number(log.args.businessId),
      reviewer: log.args.reviewer as string,
      contentHash: log.args.contentHash as string,
      rating: Number(log.args.starRating),
      txHash: log.transactionHash,
      logIndex: log.logIndex,
      blockNumber: Number(log.blockNumber),
    }));
  };
}

/**
 * Process one indexer pass: from the last checkpoint+1 up to `toBlock`, confirm
 * every matching review, then advance the checkpoint so the next pass resumes
 * where this one stopped. confirmEvent is idempotent, so an overlapping or
 * replayed range never double-counts.
 */
export async function indexOnce(opts: {
  fetchEvents: EventFetcher;
  toBlock: bigint;
  checkpointName?: string;
}): Promise<{ confirmed: number; lastBlock: number }> {
  const name = opts.checkpointName ?? CHECKPOINT;
  const last = await getCheckpoint(name);
  const fromBlock = BigInt(last + 1);
  if (opts.toBlock < fromBlock) return { confirmed: 0, lastBlock: last };

  const events = await opts.fetchEvents(fromBlock, opts.toBlock);
  let confirmed = 0;
  for (const event of events) {
    if (await confirmEvent(event)) confirmed += 1;
  }
  await setCheckpoint(name, Number(opts.toBlock));
  return { confirmed, lastBlock: Number(opts.toBlock) };
}
