import { z } from "zod";

export const NotificationIdSchema = z.object({
  notificationId: z.string().uuid(),
});

export const getUserNotificationsQuerySchema = z.object({
  page: z.preprocess((v) => (v !== undefined && v !== "" ? Number(v) : undefined), z.number().int().min(1).optional()),
  limit: z.preprocess((v) => (v !== undefined && v !== "" ? Number(v) : undefined), z.number().int().min(1).max(100).optional()),
});