export type RegistrationStatus =
  | "pending"
  | "proof_submitted"
  | "approved"
  | "rejected";

const ALLOWED_TRANSITIONS: Record<RegistrationStatus, readonly RegistrationStatus[]> = {
  pending: ["proof_submitted", "approved"],
  proof_submitted: ["approved", "rejected"],
  rejected: ["proof_submitted", "approved"],
  approved: ["rejected"],
};

export function canTransition(from: RegistrationStatus, to: RegistrationStatus): boolean {
  if (from === to) return false;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
