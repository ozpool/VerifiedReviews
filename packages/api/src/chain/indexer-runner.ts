import { createPublicClient, http, type PublicClient } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { loadConfig } from '../config';
import { indexOnce, createLogFetcher, type EventFetcher } from './indexer';

export interface IndexerHandle {
  stop: () => void;
}

const INITIAL_LOOKBACK = 1_000n;
// Alchemy free tier caps eth_getLogs at 10 blocks per call. Override via
// INDEXER_CHUNK_SIZE for paid-tier RPCs (e.g. 2000).
const DEFAULT_CHUNK_SIZE = 10n;

/** One indexer pass: read the chain head, ingest up to it. Exposed (and given
 * injectable deps) so it can be driven directly in tests without a timer. */
export async function runIndexerTick(client: PublicClient, fetchEvents: EventFetcher) {
  const head = await client.getBlockNumber();
  const chunkSize = BigInt(process.env.INDEXER_CHUNK_SIZE ?? DEFAULT_CHUNK_SIZE);
  // On first run (checkpoint == 0) start from INITIAL_LOOKBACK blocks behind
  // the head so we don't attempt to scan 270M+ blocks from genesis.
  const startBlock = head > INITIAL_LOOKBACK ? head - INITIAL_LOOKBACK : 0n;
  return indexOnce({ fetchEvents, toBlock: head, startBlock, chunkSize });
}

/**
 * Start the continuous review indexer. Without a runner the indexer never moves,
 * so ingested reviews never get confirmed and search/badge stay empty. Polls on
 * an interval, survives transient RPC errors, and no-ops cleanly when the chain
 * isn't configured (so dev/CI boot without it). Returns null when disabled.
 */
export function startReviewIndexer(): IndexerHandle | null {
  const { REGISTRY_ADDRESS, INDEXER_RPC_URL, RPC_URL, INDEXER_POLL_MS } = loadConfig();
  const rpc = INDEXER_RPC_URL ?? RPC_URL;
  if (!REGISTRY_ADDRESS || !rpc) {
    console.warn('Review indexer disabled: REGISTRY_ADDRESS / RPC not configured');
    return null;
  }

  const client: PublicClient = createPublicClient({ chain: arbitrumSepolia, transport: http(rpc) });
  const fetchEvents = createLogFetcher();
  let running = true;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const loop = async () => {
    try {
      const { confirmed, lastBlock } = await runIndexerTick(client, fetchEvents);
      if (confirmed > 0)
        console.log(`Indexer: confirmed ${confirmed} review(s) up to block ${lastBlock}`);
    } catch (err) {
      console.error('Indexer tick failed:', err instanceof Error ? err.message : err);
    }
    if (running) timer = setTimeout(() => void loop(), INDEXER_POLL_MS);
  };

  void loop();
  return {
    stop: () => {
      running = false;
      if (timer) clearTimeout(timer);
    },
  };
}
