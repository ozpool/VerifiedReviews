import type { HydratedDocument } from 'mongoose';
import { BusinessModel, type BusinessDoc, type BusinessStatus } from '../models/business.model';
import { StaffModel, type StaffDoc } from '../models/staff.model';
import { nextSequence } from '../models/counter.model';
import { hashPassword } from '../auth/password';
import { deriveMinterAddress } from '../chain/minter';
import { getMinterRegistrar, type MinterRegistrar } from '../chain/registrar';
import { getMinterFunder, type MinterFunder } from '../chain/minter-funder';
import { badGateway, conflict, notFound } from '../errors';

const PUBLIC_FIELDS = 'slug name category city description websiteUrl businessId' as const;
const PUBLIC_BROWSE_LIMIT = 100;

export interface PublicBusinessFilters {
  q?: string;
  city?: string;
  category?: string;
}

interface SignupInput {
  slug: string;
  name: string;
  category: string;
  city: string;
  description?: string;
  websiteUrl?: string;
  ownerEmail: string;
  ownerPassword: string;
}

function isDuplicateKey(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}

/** Create a business in `pending` status with a hashed owner password. */
export async function createBusiness(input: SignupInput): Promise<HydratedDocument<BusinessDoc>> {
  const { ownerPassword, ...rest } = input;
  try {
    return await BusinessModel.create({
      ...rest,
      ownerPasswordHash: await hashPassword(ownerPassword),
      status: 'pending',
    });
  } catch (err) {
    if (isDuplicateKey(err)) throw conflict('slug or owner email already in use');
    throw err;
  }
}

/** Public: list approved businesses with optional filters. Never returns private fields. */
export function listPublicBusinesses(filters: PublicBusinessFilters = {}) {
  const query: Record<string, unknown> = { status: 'approved' };

  if (filters.q) {
    query.name = { $regex: filters.q, $options: 'i' };
  }
  if (filters.city) {
    query.city = { $regex: `^${filters.city}$`, $options: 'i' };
  }
  if (filters.category) {
    query.category = { $regex: `^${filters.category}$`, $options: 'i' };
  }

  return BusinessModel.find(query)
    .select(PUBLIC_FIELDS)
    .sort({ name: 1 })
    .limit(PUBLIC_BROWSE_LIMIT)
    .lean();
}

/** Public: get one approved business by slug. Never returns private fields. */
export async function getPublicBusinessBySlug(slug: string) {
  const business = await BusinessModel.findOne({ slug: slug.toLowerCase(), status: 'approved' })
    .select(PUBLIC_FIELDS)
    .lean();
  if (!business) throw notFound('Business not found');
  return business;
}

/** List businesses, optionally filtered by status. */
export function listBusinesses(status?: BusinessStatus) {
  return BusinessModel.find(status ? { status } : {})
    .select('slug name city status businessId minterAddress')
    .lean();
}

/**
 * Approve a pending business: assign a sequential id, then authorize its derived
 * minter on-chain BEFORE marking it approved. If the on-chain registration fails
 * the approval fails too — otherwise we'd hand out an "approved" business whose
 * staff can never mint (the contract would revert with NotBusinessMinter).
 *
 * Once approved we also seed the minter with starting gas (B) so staff can mint
 * immediately. That's best-effort: a treasury hiccup must not block approval —
 * the background refiller (C) is the backstop, and the minter can be funded by
 * hand. Unlike registration (a correctness prerequisite), funding is just a
 * convenience and the contract works the moment it has gas.
 */
export async function approveBusiness(
  id: string,
  registrar: MinterRegistrar = getMinterRegistrar(),
  funder: MinterFunder = getMinterFunder(),
): Promise<HydratedDocument<BusinessDoc>> {
  const business = await BusinessModel.findById(id);
  if (!business) throw notFound('Business not found');
  if (business.status !== 'pending') throw conflict('Business is not pending approval');

  const businessId = await nextSequence('businessId');
  const minterAddress = deriveMinterAddress(businessId);
  try {
    await registrar.register(businessId, minterAddress);
  } catch (err) {
    throw badGateway(err instanceof Error ? err.message : 'on-chain minter registration failed');
  }

  business.set({ status: 'approved', businessId, minterAddress });
  const saved = await business.save();

  try {
    await funder.fund(minterAddress);
  } catch (err) {
    console.error('minter funding failed at approval:', err instanceof Error ? err.message : err);
  }

  return saved;
}

/** Active staff for a business, for the owner's staff-management view. */
export function listStaff(businessId: number) {
  return StaffModel.find({ businessId, active: true })
    .select('email')
    .sort({ createdAt: 1 })
    .lean();
}

/** Add a staff member to an approved business. */
export async function addStaff(
  businessId: number,
  input: { email: string; password: string },
): Promise<HydratedDocument<StaffDoc>> {
  const business = await BusinessModel.findOne({ businessId });
  if (!business || business.status !== 'approved') throw notFound('Approved business not found');
  try {
    return await StaffModel.create({
      business: business._id,
      businessId,
      email: input.email,
      passwordHash: await hashPassword(input.password),
    });
  } catch (err) {
    if (isDuplicateKey(err)) throw conflict('staff email already in use');
    throw err;
  }
}

/** Deactivate a staff member belonging to the given business. */
export async function removeStaff(businessId: number, staffId: string): Promise<void> {
  const result = await StaffModel.findOneAndUpdate({ _id: staffId, businessId }, { active: false });
  if (!result) throw notFound('Staff not found for this business');
}
