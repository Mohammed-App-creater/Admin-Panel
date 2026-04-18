import { z } from "zod";

/**
 * Normalizes optional email for DB and Prisma lookups.
 * Returns null when missing, non-string, or blank — never pass raw empty strings into unique lookups.
 */
export function normalizeOptionalEmail(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
}

/** Registration: omit, null, or "" → no email; otherwise must be valid. */
export const optionalEmailSchema = z.preprocess(
  (v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    if (typeof v !== "string") return undefined;
    const t = v.trim();
    return t === "" ? undefined : t;
  },
  z.email({ message: "Invalid email address" }).optional()
);

/** PATCH: undefined = leave unchanged; null or "" = clear; string = set if valid. */
export const optionalPatchEmailSchema = z.preprocess(
  (v) => {
    if (v === undefined) return undefined;
    if (v === null) return null;
    if (typeof v === "string") {
      const t = v.trim();
      return t === "" ? null : t;
    }
    return v;
  },
  z.union([z.null(), z.email({ message: "Invalid email" })]).optional()
);
