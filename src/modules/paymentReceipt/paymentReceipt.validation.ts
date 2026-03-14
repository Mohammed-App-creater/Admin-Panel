// src/modules/paymentReceipt/paymentReceipt.validation.ts
import { z } from "zod";

export const createReceiptSchema = z.object({
  bankId: z.uuid(),
  planId: z.uuid().optional(),
  amount: z.number().int().nonnegative(), // in cents (recommended)
  referenceNo: z.string().optional(),
  screenshot: z.string().min(1), // a URL/path to uploaded image (we don't implement file upload here)
});

export const userIdSchema = z.object({
  userId: z.uuid(),
});

export const adminRejectSchema = z.object({
  reason: z.string().min(3).optional(),
});

export const  idSchema = z.object({
  id: z.uuid()
});

export const paginationQuerySchema = z.object({
  page: z.preprocess((v) => (v !== undefined && v !== "" ? Number(v) : undefined), z.number().int().min(1).optional()),
  limit: z.preprocess((v) => (v !== undefined && v !== "" ? Number(v) : undefined), z.number().int().min(1).max(100).optional()),
});

export const adminListReceiptsQuerySchema = z.object({
  status: z.string().optional(),
  page: z.preprocess((v) => (v !== undefined && v !== "" ? Number(v) : undefined), z.number().int().min(1).optional()),
  limit: z.preprocess((v) => (v !== undefined && v !== "" ? Number(v) : undefined), z.number().int().min(1).max(100).optional()),
});


