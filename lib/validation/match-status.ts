export type MatchStatus = "open" | "cancelled" | "finished";

const ALLOWED: Record<MatchStatus, readonly MatchStatus[]> = {
  open: ["cancelled", "finished"],
  cancelled: ["open"],
  finished: [],
};

export function canTransitionMatch(from: MatchStatus, to: MatchStatus): boolean {
  if (from === to) return false;
  return ALLOWED[from]?.includes(to) ?? false;
}
