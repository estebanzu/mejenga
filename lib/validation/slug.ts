import { customAlphabet } from "./nanoid-like";

const alphabet = "abcdefghijkmnpqrstuvwxyz23456789"; // no l/1/o/0

export function generateSlug(): string {
  return customAlphabet(alphabet, 8)();
}
