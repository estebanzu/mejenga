/**
 * Minimal CSPRNG-based random string generator (nanoid-style),
 * avoiding an extra dependency.
 */
export function customAlphabet(alphabet: string, size: number): () => string {
  return () => {
    let out = "";
    const bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < size; i++) {
      out += alphabet[bytes[i] % alphabet.length];
    }
    return out;
  };
}
