import { randomUUID } from "crypto";

/** Generates a short, sortable, unique reference like "NXZ-DA-M3F8K2A9B1C4" */
export function generateReference(prefix: string): string {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `NXZ-${prefix}-${timePart}${randomPart}`;
}
