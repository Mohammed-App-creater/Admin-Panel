import prisma from "../../config/prisma";
import bcrypt from "bcrypt";
import { NotificationService } from "../notification/notification.service";

type WorkerFilters = {
  status: ("ACTIVE" | "INACTIVE" | "PENDING" | "REJECTED");
  verification: ("PENDING" | "APPROVED" | "REJECTED");
  q?: string;
  categoryId?: string;
  roleId?: string;
  specialtyId?: string;
  workTypeId?: string;
  requiredSkills?: string[];
  skillsMatch?: "any" | "all";
  hasPhoto?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "experience" | "relevance";
  sortOrder?: "asc" | "desc";
};


type UpdateWorkerData = {
  fullName?: string;
  email?: string;
  phone?: string | null;
  password?: string;
  role?: string;
  location?: string | null;

  // Worker fields
  categoryId?: string | null;
  roleId?: string | null; // Role relation id in Worker
  professionalRole?: string | null;
  skills?: string[] | null;
  workType?: string[] | null;     // scalar string[] on Worker
  portfolio?: string[] | null;    // scalar string[] on Worker
  availability?: any | null;      // JSON
  experience?: string | null;
  profilePhoto?: string | null;
  badges?: string[] | null;

  // relations (many-to-many through join tables)
  specialityIds?: string[] | null; // if provided -> replace
  workTypeIds?: string[] | null;   // if provided -> replace
};

// Get all workers (optionally filter by verification or status)
export const filterWorkers = async (filters: WorkerFilters) => {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  // Build Prisma where
  const where: any = {};

  if (filters.verification || filters.status) {
    where.user = {}; // initialize relation filter object
    if (filters.verification) where.user.verification = filters.verification;
    if (filters.status) where.user.status = filters.status;
  }

  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.roleId) where.roleId = filters.roleId;

  if (filters.specialtyId) {
    where.specialities = { some: { specialityId: filters.specialtyId } };
  }

  if (filters.workTypeId) {
    where.workTypes = { some: { workTypeId: filters.workTypeId } };
  }

  // skills (string[] on Worker)
  if (filters.requiredSkills && filters.requiredSkills.length > 0) {
    if (filters.skillsMatch === "all") {
      where.skills = { hasEvery: filters.requiredSkills };
    } else {
      where.skills = { hasSome: filters.requiredSkills };
    }
  }

  // text search q: across user.fullName, category.name, Role.name, and skills array
  if (filters.q) {
    const q = filters.q;
    where.OR = [
      { user: { fullName: { contains: q, mode: "insensitive" } } },
      { category: { name: { contains: q, mode: "insensitive" } } },
      { Role: { name: { contains: q, mode: "insensitive" } } },
      // skills is an array of strings; `hasSome` with token may match exact token; for partial matches you
      // would need full text or trigram indexes. This is a simple inclusion attempt:
      { skills: { hasSome: [q] } },
    ];
  }

  // additional filters for filtering workers with isAvailable

  where.isAvailable = true;

  // select minimal useful payload (matches your schema)
  const select = {
    id: true,
    userId: true,

    professionalRole: true,
    profilePhoto: true,
    skills: true,
    experience: true,
    nationalIdUrl: true,
    portfolio: true,
    availability: true,
    badges: true,
    _count: { select: { applications: true, reviews: true } },
    category: { select: { id: true, name: true } },
    Role: { select: { id: true, name: true } },
    specialities: { include: { speciality: true } },
    workTypes: { include: { workType: true } },
    user: true,
  };

  // orderBy: your Worker model doesn't have createdAt, so sort by user.createdAt
  let orderBy: any = undefined;
  if (filters.sortBy === "experience") {
    // experience is a string in your schema; if you later convert to a numeric field use numeric ordering
    orderBy = { user: { createdAt: filters.sortOrder } }; // fallback
  } else if (filters.sortBy === "createdAt" || filters.sortBy === "relevance") {
    orderBy = { user: { createdAt: filters.sortOrder } };
  } else {
    orderBy = { user: { createdAt: filters.sortOrder } };
  }

  // run query
  const workers = await prisma.worker.findMany({
    where,
    select,
    orderBy,
    skip,
    take: limit,
  });

  // post-filtering: hasPhoto check (profilePhoto)
  const filtered = workers.filter((w) => {
    if (typeof filters.hasPhoto === "boolean") {
      const hasPhoto = !!(w.profilePhoto && w.profilePhoto.trim().length > 0);
      if (filters.hasPhoto !== hasPhoto) return false;
    }
    return true;
  });

  // total count using same where (note: if you need exact total after post-filtering, you'd compute differently)
  const total = await prisma.worker.count({ where });

  return {
    items: filtered,
    meta: {
      total,
      page,
      limit,
      returned: filtered.length,
    },
  };
};

// Get worker verification status by user ID (for authenticated worker checking own status)
export const getVerificationStatusByUserId = async (userId: string) => {
  const worker = await prisma.worker.findUnique({
    where: { userId },
    select: {
      id: true,
      user: {
        select: {
          verification: true,
          status: true,
        },
      },
    },
  });
  if (!worker) return null;
  return {
    workerId: worker.id,
    verification: worker.user.verification,
    status: worker.user.status,
  };
};

// Get worker details by ID
export const getWorkerById = async (workerId: string) => {
  return prisma.worker.findUnique({
    where: { id: workerId , isAvailable: true },
    include: {
      user: true,
      licenses: true,
    },
  });
};

export const workerRegister = async (data: any) => {
  const workerExist = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (workerExist) throw new Error("Email already taken");

  const phoneExist = await prisma.user.findUnique({
    where: { phone: data.phone },
  });
  if (phoneExist) throw new Error("Phone number already taken");

  const { fullName, email, phone, password, role, location, skills, portfolio, availability, experience, categoryId, roleId, specialityIds, workTypeIds } = data;
  const passwordHash = await bcrypt.hash(password, 10);
  const newWorkerUser = await prisma.user.create({
    data: {
      fullName,
      email,
      phone,
      passwordHash,
      role,
      location,
      status: "PENDING",
      verification: "PENDING",
      referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),

      workerProfile: {
        create: {
          categoryId: categoryId,
          roleId: roleId,
          professionalRole: "Pipe Fitter",
          skills,
          portfolio,
          availability,
          experience,

          // Specialities (many-to-many through WorkerSpeciality)
          specialities: {
            create: (specialityIds || []).map((specialityId: string) => ({
              speciality: { connect: { id: specialityId } },
            })),
          },

          // Work Types (many-to-many through WorkerWorkType)
          workTypes: {
            create: (workTypeIds || []).map((workTypeId: string) => ({
              workType: { connect: { id: workTypeId } },
            })),
          },
        },
      },
    },
    include: {
      workerProfile: {
        include: {
          specialities: { include: { speciality: true } },
          workTypes: { include: { workType: true } },
        },
      },
    },
  });

  return newWorkerUser;

};


export const workerUpdate = async (workerUserId: string, data: UpdateWorkerData) => {
  // 1) ensure user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: workerUserId },
  });
  if (!existingUser) throw new Error("User not found");

  // 2) ensure worker profile exists
  const existingWorker = await prisma.worker.findUnique({
    where: { userId: workerUserId },
    include: { specialities: true, workTypes: true },
  });
  if (!existingWorker) throw new Error("Worker profile not found");

  // 3) uniqueness checks (only when changed)
  if (data.email && data.email !== existingUser.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailTaken) throw new Error("Email already taken");
  }
  // phone is nullable in your model — check only when provided and changed
  if (data.phone !== undefined && data.phone !== existingUser.phone) {
    if (data.phone !== null) {
      const phoneTaken = await prisma.user.findUnique({ where: { phone: data.phone } });
      if (phoneTaken) throw new Error("Phone number already taken");
    }
  }

  // 4) prepare user update payload
  const userUpdateData: any = {};
  if (data.fullName !== undefined) userUpdateData.fullName = data.fullName;
  if (data.email !== undefined) userUpdateData.email = data.email;
  if (data.phone !== undefined) userUpdateData.phone = data.phone;
  if (data.role !== undefined) userUpdateData.role = data.role;
  if (data.location !== undefined) userUpdateData.location = data.location;

  if (data.password) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    userUpdateData.passwordHash = passwordHash;
    // optionally bump tokenVersion so old tokens are invalidated:
    userUpdateData.tokenVersion = { increment: 1 };
  }

  // 5) prepare worker update payload
  const workerUpdateData: any = {};
  if (data.categoryId !== undefined) workerUpdateData.categoryId = data.categoryId;
  if (data.roleId !== undefined) workerUpdateData.roleId = data.roleId;
  if (data.professionalRole !== undefined) workerUpdateData.professionalRole = data.professionalRole;
  if (data.skills !== undefined) workerUpdateData.skills = data.skills;
  if (data.workType !== undefined) workerUpdateData.workType = data.workType;
  if (data.portfolio !== undefined) workerUpdateData.portfolio = data.portfolio;
  if (data.availability !== undefined) workerUpdateData.availability = data.availability;
  if (data.experience !== undefined) workerUpdateData.experience = data.experience;
  if (data.profilePhoto !== undefined) workerUpdateData.profilePhoto = data.profilePhoto;
  if (data.badges !== undefined) workerUpdateData.badges = data.badges;

  // Replace specialities relation if provided
  if (data.specialityIds) {
    workerUpdateData.specialities = {
      deleteMany: {}, // remove existing WorkerSpeciality rows for this worker
      create: (data.specialityIds || []).map((id) => ({
        speciality: { connect: { id } },
      })),
    };
  }

  // Replace workTypes relation if provided (WorkerWorkType join table)
  if (data.workTypeIds) {
    workerUpdateData.workTypes = {
      deleteMany: {},
      create: (data.workTypeIds || []).map((id) => ({
        workType: { connect: { id } },
      })),
    };
  }

  // 6) run updates in transaction (atomic)
  const [_, updatedWorker] = await prisma.$transaction([
    // update user if there is anything to update
    Object.keys(userUpdateData).length
      ? prisma.user.update({ where: { id: workerUserId }, data: userUpdateData })
      : prisma.user.findUnique({ where: { id: workerUserId } }),

    // update worker
    prisma.worker.update({
      where: { userId: workerUserId },
      data: workerUpdateData,
      include: {
        specialities: { include: { speciality: true } },
        workTypes: { include: { workType: true } },
      },
    }),
  ]);

  // 7) return the user with populated workerProfile
  const result = await prisma.user.findUnique({
    where: { id: workerUserId },
    include: {
      workerProfile: {
        include: {
          category: true,
          Role: true,
          specialities: { include: { speciality: true } },
          workTypes: { include: { workType: true } },
        },
      },
    },
  });

  return result;
};

// Approve/reject a specific license
export const approveLicense = async (licenseId: string) => {
  return prisma.license.update({
    where: { id: licenseId },
    data: { /* optional: you could add a verification field if needed */ },
  });
};

export const upsertWorkerDetails = async (userId: string, data: any) => {
  const {
    skills = [""],
    portfolio = [""],
    availability = {},
    categoryId = "",
    professionalRole = "",
    experience = "",
    workType,     // scalar String[] on Worker
    specialities, // array of Speciality ids (strings)
    workTypes,    // array of WorkType ids (strings)
    ...rest
  } = data;

  // 1) Run writes inside a transaction and return the worker id
  const { workerId } = await prisma.$transaction(async (tx) => {
    const worker = await tx.worker.upsert({
      where: { userId },
      update: {
        skills,
        portfolio,
        availability,
        categoryId,
        professionalRole,
        experience,
        ...(Array.isArray(workType) ? { workType } : {}),
        ...rest, // important: don't include relation join arrays here
      },
      create: {
        userId,
        skills,
        portfolio,
        availability,
        categoryId,
        professionalRole,
        experience,
        ...(Array.isArray(workType) ? { workType } : {}),
        ...rest,
      },
    });

    // Replace workerWorkType join rows (adjust FK names below if needed)
    if (Array.isArray(workTypes)) {
      await tx.workerWorkType.deleteMany({ where: { workerId: worker.id } });

      if (workTypes.length) {
        await tx.workerWorkType.createMany({
          data: workTypes.map((wtId: string) => ({
            workerId: worker.id,
            // change this key if your join model uses a different FK name:
            workTypeId: wtId,
          })),
          skipDuplicates: true,
        });
      }
    }

    // Replace workerSpeciality join rows (adjust FK names below if needed)
    if (Array.isArray(specialities)) {
      await tx.workerSpeciality.deleteMany({ where: { workerId: worker.id } });

      if (specialities.length) {
        await tx.workerSpeciality.createMany({
          data: specialities.map((specId: string) => ({
            workerId: worker.id,
            // change this key if your join model uses a different FK name:
            specialityId: specId,
          })),
          skipDuplicates: true,
        });
      }
    }

    // return the worker id (not tx.* queries after tx closes)
    return { workerId: worker.id };
  });

  // 2) Outside the transaction: fetch the worker with relations (safe)
  const updated = await prisma.worker.findUnique({
    where: { id: workerId },
    include: {
      // include the join rows or related objects as you prefer:
      workTypes: {
        include: { workType: true } // if you want the related WorkType rows
      },
      specialities: {
        include: { speciality: true } // if you want the related Speciality rows
      },
      // add other includes you need, e.g. reviews, applications
    },
  });

  return updated;
};

export async function getCategories() {
  return prisma.category.findMany()
}

export async function getRoles() {
  return prisma.role.findMany({
    include: { category: true }
  })
}

export async function getRolesByCategory(categoryId: string) {
  return prisma.role.findMany({
    where: { categoryId },
    include: { category: true }
  })
}

export async function getSpecialities() {
  return prisma.speciality.findMany({
    include: { role: true }
  })
}

export async function getSpecialitiesByRoleId(roleId: string) {
  return prisma.speciality.findMany({
    where: { roleId },
    include: { role: true }
  })
}

export async function getWorkTypes() {
  return prisma.workType.findMany({
    include: { speciality: true }
  })
}

export async function getWorkTypesBySpecialityId(specialityId: string) {
  return prisma.workType.findMany({
    where: { specialityId },
    include: { speciality: true }
  })
}

export const createCategory = async (name: string, description: string) => {
  const exists = await prisma.category.findUnique({ where: { name } });
  if (exists) throw new Error("Category already exists");

  return prisma.category.create({
    data: { name, description }
  })
}

export const createRole = async (name: string, description: string, categoryId: string) => {
  const exists = await prisma.role.findUnique({ where: { name } });
  if (exists) throw new Error("Role already exists");

  return prisma.role.create({
    data: { name, description, categoryId }
  })
}

export const createSpeciality = async (name: string, description: string, roleId: string) => {
  const exists = await prisma.speciality.findUnique({ where: { name } });
  if (exists) throw new Error("Speciality already exists");

  return prisma.speciality.create({
    data: { name, description, roleId }
  })
}

export const createWorkType = async (name: string, description: string, specialityId: string) => {
  return prisma.workType.create({
    data: { name, description, specialityId }
  })
}

export const acceptAssignment = async (applicationId: string, workerId: string) => {

  const application = await prisma.workerJobApplication.findUnique({
    where: { id: applicationId },
    select: { workerId: true }
  });

  if (!application || application.workerId !== workerId) {
    throw new Error("Application not found or worker ID does not match");
  }

  const result = await prisma.workerJobApplication.update({
    where: { id: applicationId },
    data: { acceptedAssignment: "ACCEPTED" },
    include: { worker: { include: { user: true } }, job: true }
  });
  const Admin = await prisma.user.findMany({ where: { role: "ADMIN" } });

  (async () => {
    try {
      await NotificationService.notifyUsers(
        Admin.map(admin => admin.id),
        `Job agreement accepted by ${result.worker.user.fullName} for the job "${result.job.title}"`,
        `Worker ${result.worker.user.fullName} has been assigned to the job "${result.job.title}"`,
        "JOB_RESPONSE",
        result.job.id
      );
    } catch (err) {
      console.error("Notification failed:", err);
    }
  })();

  return result;
}

export const rejectAssignment = async (applicationId: string, workerId: string) => {

  const application = await prisma.workerJobApplication.findUnique({
    where: { id: applicationId },
    include: {
      worker: { include: { user: true } },
      job: { include: { company: true } },
    },
  });

  if (!application || application.workerId !== workerId) {
    throw new Error("Application not found or worker ID does not match");
  }

  const result = await prisma.workerJobApplication.update({
    where: { id: applicationId },
    data: { acceptedAssignment: "REJECTED" },
    include: { worker: { include: { user: true } }, job: true }
  });
  const Admin = await prisma.user.findMany({ where: { role: "ADMIN" } });

  (async () => {
    try {
      await NotificationService.notifyUser(
        application.job.company.userId,
        `Job agreement rejected by ${application.worker.user.fullName} for the job "${application.job.title}"`,
        `Worker ${application.worker.user.fullName} has rejected the assignment for the job "${application.job.title}"`,
        "JOB_RESPONSE",
        application.job.id,
        workerId,
        application.job.companyId
      );
    } catch (err) {
      console.error("Notification failed:", err);
    }
  })();

  return result;
}

export const getWorkerJobApplications = async (workerId: string, page = 1, limit = 20) => {
  const take = Math.min(100, Math.max(1, limit ?? 20));
  const skip = (Math.max(1, page ?? 1) - 1) * take;
  const where = { workerId };
  const [items, total] = await Promise.all([
    prisma.workerJobApplication.findMany({
      where,
      take,
      skip,
      orderBy: { appliedAt: "desc" },
      include: { job: { include: { company: true } }, worker: { include: { user: true } } }
    }),
    prisma.workerJobApplication.count({ where }),
  ]);
  return {
    data: items,
    meta: {
      total,
      page: Math.max(1, page ?? 1),
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
}

export const toggleWorkerAvailability = async (workerId: string, isAvailable: boolean) => {
  const worker = await prisma.user.findUnique({ where: { id: workerId }, include: { workerProfile: true } });
  if (!worker) throw new Error("Worker not found");
  if (!worker.workerProfile) throw new Error("Worker profile not found");

  return prisma.worker.update({
    where: { id: worker.workerProfile?.id },
    data: { isAvailable }
  });
}
