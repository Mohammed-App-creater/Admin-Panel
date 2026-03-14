import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export const createPlanSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().int().nonnegative(), // in cents
  interval: z.enum(["MONTHLY", "YEARLY"]),
  features: z.array(z.string()).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const updatePlanSchema = createPlanSchema.partial();

export const idSchema = z.object({
  id: z.uuid(),
});

export const listPlansQuerySchema = z.object({
  page: z.preprocess((v) => (v !== undefined && v !== "" ? Number(v) : undefined), z.number().int().min(1).optional()),
  limit: z.preprocess((v) => (v !== undefined && v !== "" ? Number(v) : undefined), z.number().int().min(1).max(100).optional()),
});
