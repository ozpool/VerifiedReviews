import type { HydratedDocument } from 'mongoose';
import { BusinessModel, type BusinessDoc, type BusinessStatus } from '../models/business.model';
import { StaffModel, type StaffDoc } from '../models/staff.model';
import { nextSequence } from '../models/counter.model';
import { hashPassword } from '../auth/password';
import { deriveMinterAddress } from '../chain/minter';
import { getMinterRegistrar, type MinterRegistrar } from '../chain/registrar';
import { badGateway, conflict, notFound } from '../errors';

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
 */
export async function approveBusiness(
  id: string,
  registrar: MinterRegistrar = getMinterRegistrar(),
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
  return business.save();
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
  const result = await StaffModel.findOneAndUpdate(
    { _id: staffId, businessId },
    { active: false },
  );
  if (!result) throw notFound('Staff not found for this business');
}
