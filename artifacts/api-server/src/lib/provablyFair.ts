import { createHmac, randomBytes } from "crypto";

export function generateServerSeed(): string {
  return randomBytes(32).toString("hex");
}

export function hashServerSeed(seed: string): string {
  return createHmac("sha256", seed).update("riftflip").digest("hex");
}

export function generateClientSeed(): string {
  return randomBytes(8).toString("hex");
}

/**
 * Derive a float [0, 1) from serverSeed + clientSeed + nonce using HMAC-SHA256.
 * Result is the first 8 hex chars of the HMAC, interpreted as uint32, divided by 0xFFFFFFFF.
 */
export function deriveFloat(serverSeed: string, clientSeed: string, nonce: number): number {
  const hmac = createHmac("sha256", serverSeed);
  hmac.update(`${clientSeed}:${nonce}`);
  const hex = hmac.digest("hex").slice(0, 8);
  const num = parseInt(hex, 16);
  return num / 0xffffffff;
}

/** Coinflip: 0 = heads, 1 = tails */
export function deriveFlip(serverSeed: string, clientSeed: string, nonce: number): "heads" | "tails" {
  return deriveFloat(serverSeed, clientSeed, nonce) < 0.5 ? "heads" : "tails";
}

/** Minefield: return indices of mine positions for a given grid size */
export function deriveMines(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  gridSize: number,
  mineCount: number,
): number[] {
  const cells = Array.from({ length: gridSize }, (_, i) => i);
  // Fisher-Yates shuffle seeded by successive HMAC outputs
  for (let i = cells.length - 1; i > 0; i--) {
    const f = deriveFloat(serverSeed, clientSeed, nonce + i);
    const j = Math.floor(f * (i + 1));
    [cells[i], cells[j]] = [cells[j]!, cells[i]!];
  }
  return cells.slice(0, mineCount);
}
