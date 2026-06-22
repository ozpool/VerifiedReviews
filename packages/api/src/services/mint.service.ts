import type { HydratedDocument } from 'mongoose';
import { loadConfig } from '../config';
import { MintModel, type MintDoc } from '../models/mint.model';
import { BusinessModel } from '../models/business.model';
import { getMintOrchestrator, type MintOrchestrator } from '../chain/orchestrator';
import { badGateway, notFound, tooManyRequests } from '../errors';

interface MintInput {
  businessId: number;
  customerAddr: string;
  staffId: string;
}

/** Reject if the business has minted more than the configured limit within the
 * rolling window. Counts audit rows, so it survives restarts and is per-business
 * rather than per-IP (a staff device could roam). */
async function assertUnderRateLimit(businessId: number): Promise<void> {
  const { MINT_RATE_MAX, MINT_RATE_WINDOW_SEC } = loadConfig();
  const since = new Date(Date.now() - MINT_RATE_WINDOW_SEC * 1000);
  const recent = await MintModel.countDocuments({ businessId, createdAt: { $gte: since } });
  if (recent >= MINT_RATE_MAX) {
    throw tooManyRequests('Mint rate limit exceeded for this business');
  }
}

/** Recent mints for a business (newest first) — backs the staff "today" log. */
export function listRecentMints(businessId: number, since: Date) {
  return MintModel.find({ businessId, createdAt: { $gte: since } })
    .select('customerAddr tokenId txHash createdAt')
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
}

/**
 * Orchestrate a VisitProof mint: rate-limit, mint on-chain, then write the audit
 * row. The audit write happens *after* a confirmed tx, so a revert (the
 * orchestrator throws) never leaves a phantom record — the "tx-revert no-write"
 * guarantee. The orchestrator is injectable for tests.
 */
export async function requestMint(
  input: MintInput,
  orchestrator: MintOrchestrator = getMintOrchestrator(),
): Promise<HydratedDocument<MintDoc>> {
  const business = await BusinessModel.findOne({ businessId: input.businessId });
  if (!business || business.status !== 'approved') throw notFound('Approved business not found');

  await assertUnderRateLimit(input.businessId);

  let result;
  try {
    result = await orchestrator.mint(input.customerAddr, input.businessId);
  } catch (err) {
    throw badGateway(err instanceof Error ? err.message : 'mint failed on-chain');
  }

  return MintModel.create({
    businessId: input.businessId,
    customerAddr: input.customerAddr,
    staffId: input.staffId,
    tokenId: result.tokenId,
    txHash: result.txHash,
  });
}
