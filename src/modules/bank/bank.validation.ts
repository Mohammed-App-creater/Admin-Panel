import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export const createBankSchema = z.object({
  name: z.string().min(2),
  accountName: z.string().min(1),
  accountNo: z.string().min(1),
  type: z.enum(["BANK", "WALLET"]),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const updateBankSchema = createBankSchema.partial();


export const idSchema = z.object({
  id: z.uuid(),
});

export const listBanksQuerySchema = z.object({
  page: z.preprocess((v) => (v !== undefined && v !== "" ? Number(v) : undefined), z.number().int().min(1).optional()),
  limit: z.preprocess((v) => (v !== undefined && v !== "" ? Number(v) : undefined), z.number().int().min(1).max(100).optional()),
});
