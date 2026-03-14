import { z } from 'zod';
import { UserRole, UserStatus, VerificationStatus } from '@prisma/client';

export const listUsersQuerySchema = z.object({
    email: z.email().optional(),
    role: z.enum(UserRole).optional(),
    status: z.enum(UserStatus).optional(),
    verification: z.enum(VerificationStatus).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    page: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().positive().optional()),
    limit: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().positive().max(100).optional()),
});

export const paginationQuerySchema = z.object({
    page: z.preprocess((val) => (val !== undefined && val !== "" ? Number(val) : undefined), z.number().int().min(1).optional()),
    limit: z.preprocess((val) => (val !== undefined && val !== "" ? Number(val) : undefined), z.number().int().min(1).max(100).optional()),
});

export const userIdSchema = z.object({
    id: z.uuid()
});

export const resetPasswordSchema = z.object({
    newPassword: z.string().min(8).max(100),
});

export const postReviewSchema = z.object({
    companyId: z.uuid("Company ID is Required"),
    rating: z.number("Rating must be number or float").min(0, "The Min rating is 0").max(5, "The Max rating is 5"),
    comment: z.string().max(500).optional()
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type UserId = z.infer<typeof userIdSchema>;
