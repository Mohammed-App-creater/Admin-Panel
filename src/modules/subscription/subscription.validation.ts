// validators/subscription.validator.ts
import { z } from "zod";

export const createSubscriptionSchema = z.object({
  userId: z.string().uuid(),
  planId: z.string().uuid(),
  startDate: z.string().optional(), // ISO date string (optional)
  endDate: z.string().optional().nullable(),
  autoRenew: z.boolean().optional(),
  status: z.string().optional(),
});

export const updateSubscriptionSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  autoRenew: z.boolean().optional(),
  status: z.string().optional(),
});

export const subscriptionIdSchema = z.object({
  id: z.string().uuid(),
});

export const listSubscriptionsQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  planId: z.string().uuid().optional(),
  status: z.string().optional(),
  page: z.preprocess((v) => (v !== undefined && v !== "" ? Number(v) : undefined), z.number().int().min(1).optional()),
  limit: z.preprocess((v) => (v !== undefined && v !== "" ? Number(v) : undefined), z.number().int().min(1).max(100).optional()),
});

export const mySubscriptionsQuerySchema = z.object({
  page: z.preprocess((v) => (v !== undefined && v !== "" ? Number(v) : undefined), z.number().int().min(1).optional()),
  limit: z.preprocess((v) => (v !== undefined && v !== "" ? Number(v) : undefined), z.number().int().min(1).max(100).optional()),
});
