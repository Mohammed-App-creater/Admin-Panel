import { z } from "zod";

export const userIdSchema = z.object({
  userId: z.uuid("Invalid user ID"),
});

export const walletIdSchema = z.object({
    walletId: z.uuid("Invalid wallet ID")
})

export const transactionIdSchema = z.object({
    transactionId: z.uuid("Invalid transaction ID")
})

export const paginationQuerySchema = z.object({
  page: z.preprocess((v) => (v !== undefined && v !== "" ? Number(v) : undefined), z.number().int().min(1).optional()),
  limit: z.preprocess((v) => (v !== undefined && v !== "" ? Number(v) : undefined), z.number().int().min(1).max(100).optional()),
});

export const getTransactionsQuerySchema = z.object({
  type: z.string().optional(),
  page: z.preprocess((v) => (v !== undefined && v !== "" ? Number(v) : undefined), z.number().int().min(1).optional()),
  limit: z.preprocess((v) => (v !== undefined && v !== "" ? Number(v) : undefined), z.number().int().min(1).max(100).optional()),
});