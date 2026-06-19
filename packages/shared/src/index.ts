// @vr/shared — single source of truth for the wire contract between api, web,
// and the chain: validation schemas, the contract address registry, and shared
// env parsing. Both the API and the web app import from here.

export const PROJECT_NAME = 'VerifiedReviews';

export * from './schemas/common';
export * from './schemas/review';
export * from './schemas/business';
export * from './schemas/mint';
export * from './addresses';
export * from './env';
export * from './abis/index';
export * from './hash';
