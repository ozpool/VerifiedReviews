/**
 * Turn a raw contract/wallet error into a friendly, actionable message.
 *
 * viem includes the custom-error name (NoVisitProof, etc.) in the thrown error's
 * message for any error declared in the ABI, so a substring match is a reliable,
 * dependency-light way to map a revert to plain English for the customer.
 */
const GATE_MESSAGES: Record<string, string> = {
  NoVisitProof:
    'You need a visit receipt for this business before you can review it. Ask staff to scan your wallet on your next visit.',
  VisitTooOld: 'Your visit receipt is more than 60 days old. Visit again to leave a fresh review.',
  AlreadyReviewed: "You've already reviewed this visit. Visit again to leave another review.",
  InvalidRating: 'Please choose a rating between 1 and 5.',
};

export function reviewErrorMessage(err: unknown): string {
  const text = err instanceof Error ? err.message : String(err);
  for (const [name, message] of Object.entries(GATE_MESSAGES)) {
    if (text.includes(name)) return message;
  }
  if (/user rejected|user denied|rejected the request/i.test(text)) {
    return 'Transaction cancelled.';
  }
  return "Couldn't submit your review. Please try again in a moment.";
}
