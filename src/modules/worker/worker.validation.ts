import z from "zod";


const availabilityDaysSchema = z.object({
  monday: z.boolean().optional(),
  tuesday: z.boolean().optional(),
  wednesday: z.boolean().optional(),
  thursday: z.boolean().optional(),
  friday: z.boolean().optional(),
  saturday: z.boolean().optional(),
  sunday: z.boolean().optional(),
}).partial();

const availabilitySchema = z.object({
  days: availabilityDaysSchema.optional(),
  time: z
    .array(z.enum(["morning", "afternoon", "evening", "night"]))
    .optional(),
}).optional();

export const skillsMatchEnum = z.enum(["any", "all"]);
export const sortByEnum = z.enum(["createdAt", "experience", "relevance"]);
export const sortOrderEnum = z.enum(["asc", "desc"]);

export const getWorkersQuerySchema = z.object({
  q: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING", "REJECTED"]).optional(),
  verification: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  categoryId: z.uuid().optional(),
  roleId: z.uuid().optional(),
  specialtyId: z.uuid().optional(),
  workTypeId: z.uuid().optional(),

  // requiredSkills: comma-separated string -> transformed to string[]
  requiredSkills: z
    .string()
    .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean))
    .optional(),

  skillsMatch: skillsMatchEnum.optional().default("any"),

  hasPhoto: z
    .string()
    .transform((v) => v === "true")
    .optional(),

  page: z
    .string()
    .regex(/^\d+$/)
    .transform((v) => Math.max(1, Number(v)))
    .optional()
    .default(1),

  limit: z
    .string()
    .regex(/^\d+$/)
    .transform((v) => Math.max(1, Math.min(100, Number(v))))
    .optional()
    .default(20),

  sortBy: sortByEnum.optional().default("createdAt"),
  sortOrder: sortOrderEnum.optional().default("desc"),
});

export const userIdSchema = z.object({
  id: z.uuid("Invalid User Id or Not Found")
});

export const categoryIdSchema = z.object({
  categoryId: z.uuid("Invalid Category Id or Not Found")
});

export const applicationsSchema = z.object({
  workerId: z.uuid("Invalid Application Id or Not Found")
});

export const workerIdSchema = z.object({
  workerId: z.uuid("Invalid Worker Id or Not Found")
});

export const toggleAvailabilitySchema = z.object({
  isAvailable: z.boolean()
});

export const roleIdSchema = z.object({
  roleId: z.uuid("Invalid Role Id or Not Found")
});

export const specialityIdSchema = z.object({
  specialityId: z.uuid("Invalid Speciality Id or Not Found")
});

export const workerRegistrationSchema = z.object({
  // User info
  fullName: z.string().min(2, "Full name is required"),
  email: z.email("Invalid email"),
  phone: z.string(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.string().min(1, "Role is required"),
  

  // Worker profile
  categoryId: z.string().min(1, "Category is required"),
  professionalRole: z.string().min(1, "Professional role is required"),
  roleId: z.uuid("Invalid Role Id or Not Found").nonempty("Role is required"),
  skills: z.array(z.string()).nonempty("At least one skill required"),
  portfolio: z.array(z.url("Portfolio must be valid URL")).optional(),
  availability: z.object({
    days: z.object({
      monday: z.boolean().optional(),
      tuesday: z.boolean().optional(),
      wednesday: z.boolean().optional(),
      thursday: z.boolean().optional(),
      friday: z.boolean().optional(),
      saturday: z.boolean().optional(),
      sunday: z.boolean().optional(),
    }).optional(),
    time: z.array(z.enum(["morning", "afternoon", "evening", "night"])).optional(),
  }).optional(),
  experience: z.string().optional(),

  // Relations
  specialityIds: z.array(z.uuid("Invalid speciality id")).nonempty("Select at least one speciality"),
  workTypeIds: z.array(z.uuid("Invalid work type id")).nonempty("Select at least one work type"),
});

export const workerUpdateSchema = z.object({
  // user fields
  fullName: z.string().min(2).optional(),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.string().optional(), // consider enum if you have one
  location: z.string().optional(),

  // worker profile updates (optional)
  categoryId: z.string().uuid().optional().nullable(),
  roleId: z.string().uuid().optional().nullable(),
  professionalRole: z.string().optional(),
  skills: z.array(z.string()).optional(),
  workType: z.array(z.string()).optional(),
  portfolio: z.array(z.string().url("Portfolio must be valid URL")).optional(),
  availability: availabilitySchema,
  experience: z.string().optional(),

  // relations: if provided, they will replace current ones
  specialityIds: z.array(z.string().uuid("Invalid speciality id")).optional(),
  workTypeIds: z.array(z.string().uuid("Invalid work type id")).optional(),
}).refine((obj: any) => Object.keys(obj).length > 0, {
  message: "Provide at least one field to update",
});

export const workerDetailsSchema = z.object({
  skills: z.array(z.string()).optional(),
  // URLs to files
  availability: z.object({
    days: z.object({
      monday: z.boolean().optional(),
      tuesday: z.boolean().optional(),
      wednesday: z.boolean().optional(),
      thursday: z.boolean().optional(),
      friday: z.boolean().optional(),
      saturday: z.boolean().optional(),
      sunday: z.boolean().optional(),
    }).optional(),
    time: z.array(z.enum(["morning", "afternoon", "evening", "night"])).optional(),
  }).optional(),
  categoryId: z.uuid("Invalid Category Id or Not Found").optional(),
  professionalRole: z.uuid("Invalid Professional Role Id or Not Found").optional(),
  specialities: z.array(z.uuid("Invalid Speciality Id or Not Found")).optional(),
  workTypes: z.array(z.uuid("Invalid Work Type Id or Not Found")).optional(),
  experience: z.string().optional(),
}, "No Worker Details Provided");

export const createCategory = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(10).max(500).optional(),
});

export const createRole = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(10).max(500).optional(),
  categoryId: z.uuid("Invalid Category Id or Not Found"),
});

export const createSpeciality = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(10).max(500).optional(),
  roleId: z.uuid("Invalid Role Id or Not Found"),
});

export const createWorkType = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(10).max(500).optional(),
  specialityId: z.uuid("Invalid Speciality Id or Not Found"),
});

export const workerSchema = z.object({
  userId: z.string().uuid(),
  category: z.string().optional(),
  professionalRole: z.string().optional(),
  profilePhoto: z.string().url().optional(),
  skills: z.array(z.string()).default([]),
  workType: z.array(z.string()).default([]),
  experience: z.string().optional(),
  nationalIdUrl: z.string().url().optional(),
  portfolio: z.array(z.string().url()).default([]),
  availability: z.record(z.string(), z.unknown()).optional(), // since Prisma uses Json
  badges: z.array(z.string()).default([]),
});

export type UserId = z.infer<typeof userIdSchema>;
export type WorkerRegistrationInput = z.infer<typeof workerRegistrationSchema>;
export type workerDetailsInput = z.infer<typeof workerDetailsSchema>;
export type WorkerDetailsInput = z.infer<typeof workerDetailsSchema>;
export type WorkerUpdateInput = z.infer<typeof workerUpdateSchema>;
export type GetWorkersQuery = z.infer<typeof getWorkersQuerySchema>;