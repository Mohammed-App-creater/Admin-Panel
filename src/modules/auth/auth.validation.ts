import { z } from 'zod';
import { UserRole } from '@prisma/client';
import e from 'express';
import { optionalEmailSchema } from '../../utils/emailInput';

export const authValidationRegisterSchema = z.object({
    fullName: z.string().min(2).max(100),
    phone: z
        .string()
        .regex(/^(?:\+251(?:9|7)\d{8}|0(?:9|7)\d{8})$/, {
            message: 'Invalid Ethiopian phone number',
        }),
    location: z.string().min(2).max(100),
    email: optionalEmailSchema,
    password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
    role: z.enum([UserRole.ADMIN, UserRole.WORKER, UserRole.COMPANY, UserRole.OWNER, UserRole.BROKER], {
        error: 'Invalid role'
    }),
});

export const authValidationLoginSchema = z.object({
    phone: z
        .string()
        .regex(/^(?:\+251(?:9|7)\d{8}|0(?:9|7)\d{8})$/, {
            message: 'Invalid Ethiopian phone number',
        }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
});

export const authValidationApproveUserSchema = z.object({
    userId: z.uuid({ message: 'Invalid user ID or not found' }),
});

export const authValidationRequestPasswordResetSchema = z.object({
    email: z.email({ message: 'Invalid email address' }),
});

export const authValidationVerifyResetCodeSchema = z.object({
    email: z.email({ message: 'Invalid email address' }),
    code: z.string().length(6, { message: 'Code must be 6 characters long' }),
});

export const authValidationChangePasswordSchema = z.object({
    oldPassword: z.string().min(6, { message: 'Old password must be at least 6 characters long' }),
    newPassword: z.string().min(6, { message: 'New password must be at least 6 characters long' }),
});


export type AuthValidationInput = z.infer<typeof authValidationRegisterSchema>;
export type AuthValidationLoginInput = z.infer<typeof authValidationLoginSchema>;
export type AuthValidationApproveUserInput = z.infer<typeof authValidationApproveUserSchema>;