import { z } from 'zod';
import { optionalEmailSchema } from '../../utils/emailInput';

/**
 * Zod schemas for company endpoints.
 *
 * These enums are kept in sync with `prisma/schema.prisma`:
 * - UserStatus: ACTIVE | INACTIVE | PENDING | REJECTED
 * - VerificationStatus: PENDING | APPROVED | REJECTED
 */

export const userStatusEnum = z.enum(["ACTIVE", "INACTIVE", "PENDING", "REJECTED"]);
export const verificationStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export const sortByEnum = z.enum(["createdAt", "jobsCount", "name"]);
export const sortOrderEnum = z.enum(["asc", "desc"]);

// Query params for GET /companies
export const getAllCompaniesSchema = z.object({
  q: z.string().optional(), // search across name/email
  status: userStatusEnum.optional(),
  verification: verificationStatusEnum.optional(),
  location: z.string().optional(),

  hasLogo: z
    .string()
    .transform((val) => val === "true")
    .optional(),

  hasVerificationDocs: z
    .string()
    .transform((val) => val === "true")
    .optional(),

  minJobs: z
    .string()
    .regex(/^\d+$/, "Must be a number")
    .transform((val) => parseInt(val, 10))
    .optional(),

  maxJobs: z
    .string()
    .regex(/^\d+$/, "Must be a number")
    .transform((val) => parseInt(val, 10))
    .optional(),

  jobStatus: z.string().optional(),
  jobCategory: z.string().optional(),

  page: z
    .string()
    .regex(/^\d+$/)
    .transform((val) => Math.max(1, parseInt(val, 10)))
    .optional()
    .default(1),

  limit: z
    .string()
    .regex(/^\d+$/)
    .transform((val) => Math.max(1, Math.min(100, parseInt(val, 10))))
    .optional()
    .default(20),

  sortBy: sortByEnum.optional().default("createdAt"),
  sortOrder: sortOrderEnum.optional().default("desc"),
});

// Route params containing company id (UUID)
export const companyParamsSchema = z.object({
    id: z.uuid(),
});

// Approve/Reject endpoints only need the company id
export const approveRejectCompanySchema = companyParamsSchema;

// Minimal create/update company payload
export const updateCompanySchema = z.object({
    companyLogo: z
        .union([z.url("Invalid company logo URL"), z.literal("")])
        .optional()
        .nullable(),

    businessLocation: z
        .union([z.string(), z.literal("")])
        .optional()
        .nullable(),

    verificationDocuments: z
        .array(
            z.union([z.url("Invalid verification document URL"), z.literal("")])
        )
        .optional()
        .nullable(),
}, "No data is provided"
);

export const createCompanySchema = z.object({
    fullName: z.string().min(2).max(100),
    phone: z.string().min(10).max(15),
    email: optionalEmailSchema,
    password: z.string().min(6).max(100),
    location: z.string().min(2).max(100),
    companyLogo: z
        .union([z.url("Invalid company logo URL"), z.literal("")])
        .optional()
        .nullable(),
    businessLocation: z
        .union([z.string(), z.literal("")])
        .optional()
        .nullable(),
    verificationDocuments: z
        .array(
            z.union([z.url("Invalid verification document URL"), z.literal("")])
        )
        .optional()
        .nullable(),
});

// Exported TS types
export type GetAllCompaniesInput = z.infer<typeof getAllCompaniesSchema>;
export type CompanyParams = z.infer<typeof companyParamsSchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type GetAllCompaniesQuery = z.infer<typeof getAllCompaniesSchema>;