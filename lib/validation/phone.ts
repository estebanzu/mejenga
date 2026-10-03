/**
 * Costa Rica phone number helpers.
 * Canonical format: 8 digits, no separators (e.g. "88888888").
 */

export function parseCrPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 8) return digits;
  if ((digits.length === 11 || digits.length === 12) && digits.startsWith("506")) {
    const local = digits.slice(3);
    return local.length === 8 ? local : null;
  }
  return null;
}

export function formatCrPhone(input: string): string {
  const parsed = parseCrPhone(input);
  if (!parsed) return input;
  return `${parsed.slice(0, 4)}-${parsed.slice(4)}`;
}
