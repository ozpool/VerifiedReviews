/** True if the string is a 0x-prefixed 20-byte EVM address (case-insensitive). */
export function isEvmAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value.trim());
}
