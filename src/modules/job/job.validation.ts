import { z } from "zod";

// JobStatus enum (adjust if you have more statuses)
export const JobStatusSchema = z.enum(["ACTIVE", "IN_PROGRESS", "CLOSED", "CANCELLED"]);

// Create Job schema
export const createJobSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  description: z.string().min(1, "Description is required"),
  requiredSkills: z.array(z.string()).nonempty("At least one skill is required"),
  jobLocation: z.string().optional(),
  payRate: z.number().positive("Pay rate must be positive"),
  jobType: z.string().min(1, "Job type is required"),
  startDate: z.coerce.date(),   // coerce handles string → Date
  duration: z.coerce.date(),
  numbersNeedWorker: z.number().int().positive().optional(),
  additionalInfo: z.string().optional(),
});

// Update Job schema (partial of create + status)
export const updateJobSchema = createJobSchema
  .partial()
  .extend({
    status: JobStatusSchema.optional(),
  });

// Job filters schema
export const jobFiltersSchema = z.object({
  status: JobStatusSchema.optional(),
  companyId: z.string().uuid().optional(),
  jobLocation: z.string().optional(),
  requiredSkill: z.string().optional(),
  jobType: z.string().optional(),
  startDate: z.coerce.date().optional(),
  duration: z.coerce.date().optional(),
  page: z.preprocess((v) => (v !== undefined ? Number(v) : undefined), z.number().int().min(1).optional()),
  limit: z.preprocess((v) => (v !== undefined ? Number(v) : undefined), z.number().int().min(1).max(100).optional()),
});

export const jobIdParamSchema = z.object({
    id: z.uuid()
});

export const JobIdParamSchema = z.object({
    jobId: z.uuid()
});

export const companyIdParamSchema = z.object({
    companyId: z.uuid()
});

export const applicationIdParamSchema = z.object({
  applicationId: z.uuid()
});

export const assignWorkerParamsSchema = z.object({
  jobId: z.uuid(),
  workerId: z.uuid()
});

export const listApplicationsSchema = z.object({
  search: z.string().trim().optional(),

  // allow comma-separated or multiple params, normalize later
  skills: z.union([z.string(), z.array(z.string())]).optional(),

  jobLocation: z.string().trim().optional(),
  jobType: z.string().trim().optional(),
  jobStatus: z.string().trim().optional(),

  applicationStatus: z.string().trim().optional(),
  adminApproved: z.string().trim().optional(),
  acceptedAssignment: z.string().trim().optional(),

  appliedFrom: z.string().datetime().optional(),
  appliedTo: z.string().datetime().optional(),

  payRateMin: z.preprocess((v) => (v !== undefined ? Number(v) : undefined), z.number().nonnegative().optional()),
  payRateMax: z.preprocess((v) => (v !== undefined ? Number(v) : undefined), z.number().nonnegative().optional()),

  sortBy: z.enum(["appliedAt", "payRate", "startDate", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),

  page: z.preprocess((v) => (v !== undefined ? Number(v) : undefined), z.number().int().min(1).optional()),
  limit: z.preprocess((v) => (v !== undefined ? Number(v) : undefined), z.number().int().min(1).max(100).optional()),
});

export const applyToJobSchema = z.object({
  workerId: z.uuid(),
  jobId: z.uuid(),
});

export const workerIdParamSchema = z.object({
  workerId: z.uuid()
});

export const companyIdParamForJobsSchema = z.object({
  companyId: z.uuid()
});

export const jobIdParamForApplicationsSchema = z.object({
  jobId: z.uuid()
});

export const getMyJobAssignmentsQuerySchema = z.object({
  companyStatus: z.enum(["PENDING", "ACCEPTED", "REJECTED"]).optional(),
  workStatus: z.enum(["PENDING", "ACCEPTED", "REJECTED"]).optional(),
  adminStatus: z.enum(["PENDING", "ACCEPTED", "REJECTED"]).optional(),
  page: z.preprocess((v) => (v !== undefined ? Number(v) : undefined), z.number().int().min(1).optional()),
  limit: z.preprocess((v) => (v !== undefined ? Number(v) : undefined), z.number().int().min(1).max(100).optional()),
});

export const paginationQuerySchema = z.object({
  page: z.preprocess((v) => (v !== undefined && v !== "" ? Number(v) : undefined), z.number().int().min(1).optional()),
  limit: z.preprocess((v) => (v !== undefined && v !== "" ? Number(v) : undefined), z.number().int().min(1).max(100).optional()),
});

export const assignmentsFiltersSchema = z.object({
  workerId: z.string().optional(),
  companyId: z.string().optional(),
  status: z.string().optional(),
  adminApproved: z.string().optional(),
  acceptedAssignment: z.string().optional(),
  page: z.preprocess((v) => (v !== undefined ? Number(v) : undefined), z.number().int().min(1).optional()),
  limit: z.preprocess((v) => (v !== undefined ? Number(v) : undefined), z.number().int().min(1).max(100).optional()),
});

export type ListApplicationsQuery = z.infer<typeof listApplicationsSchema>;