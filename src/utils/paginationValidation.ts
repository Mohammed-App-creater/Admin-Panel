import { z } from "zod";

/** Shared pagination query schema: page & limit, both numbers. Limit max 100. */
export const paginationQuerySchema = z.object({
  page: z.preprocess(
    (v) => (v !== undefined && v !== "" ? Number(v) : undefined),
    z.number().int().min(1, "page must be a positive integer").optional()
  ),
  limit: z.preprocess(
    (v) => (v !== undefined && v !== "" ? Number(v) : undefined),
    z.number().int().min(1, "limit must be at least 1").max(100, "limit must not exceed 100").optional()
  ),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
