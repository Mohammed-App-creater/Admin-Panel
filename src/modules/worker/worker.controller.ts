import { NextFunction, Request, Response } from "express";
import * as workerService from "./worker.service";
import { successResponse, errorResponse } from "../../utils/response";
import { getWorkersQuerySchema } from "./worker.validation";

// GET all workers (with optional filters)
export const getWorkers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = getWorkersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: "Invalid query params", errors: parsed.error.flatten() });
    }

    const raw = parsed.data;

    const filters = {
      q: raw.q,
      status: raw.status as "ACTIVE"| "INACTIVE" | "PENDING" | "REJECTED",
      verification: raw.verification as "PENDING" | "APPROVED" | "REJECTED",
      categoryId: raw.categoryId,
      roleId: raw.roleId,
      specialtyId: raw.specialtyId,
      workTypeId: raw.workTypeId,
      requiredSkills: raw.requiredSkills as string[] | undefined,
      skillsMatch: raw.skillsMatch as "any" | "all",
      hasPhoto: raw.hasPhoto as boolean | undefined,
      page: raw.page as number,
      limit: raw.limit as number,
      sortBy: raw.sortBy as "createdAt" | "experience" | "relevance",
      sortOrder: raw.sortOrder as "asc" | "desc",
    };

    const result = await workerService.filterWorkers(filters);

    return res.json(successResponse(result));
  } catch (err) {
    next(err);
  }
};

// GET verification status for the authenticated worker
export const getVerificationStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req?.user?.id;
    if (!userId) return res.status(401).json(errorResponse("Unauthorized"));
    if (req?.user?.role !== "WORKER") return res.status(403).json(errorResponse("Only workers can access this endpoint"));
    const status = await workerService.getVerificationStatusByUserId(userId);
    if (!status) return res.status(404).json(errorResponse("Worker profile not found"));
    return res.json(successResponse(status, "Verification status retrieved"));
  } catch (err: any) {
    next(err);
  }
};

// GET worker details by ID
export const getWorkerById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const worker = await workerService.getWorkerById(req.params.id);
    res.json(successResponse(worker));
  } catch (err: any) {
    next(err);
  }
};

// POST /register
export const registerWorker = async (req: Request, res: Response, next: NextFunction) => {
  try{
    const newWorker = await workerService.workerRegister(req.body);
    res.status(201).json(successResponse(newWorker));
  } catch (err: any) {
    next(err);
  }
}

// POST /categories
export const createCategoryController = async (req: Request, res: Response, next: NextFunction) => {
  try{
  const { name, description } = req.body
  const category = await workerService.createCategory(name, description)
  res.status(201).json(category)
} catch (err: any) {
  next(err);
}
}

// POST /roles
export const createRoleController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, categoryId } = req.body
    const role = await workerService.createRole(name, description, categoryId)
    res.status(201).json(role)
  } catch (err: any) {
    next(err);
  }
}

// POST /specialities
export const createSpecialityController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, roleId } = req.body
    const speciality = await workerService.createSpeciality(name, description, roleId)
    res.status(201).json(speciality)
  } catch (err: any) {
    next(err);
  }
}

// POST /work-types
export const createWorkTypeController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, specialityId } = req.body
    const workType = await workerService.createWorkType(name, description, specialityId)
    res.status(201).json(workType)
  } catch (err: any) {
    next(err);
  }
}

export const updateWorker = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const worker = await workerService.workerUpdate(req.params.id, req.body);
    res.json(successResponse(worker));
  } catch (err: any) {
    next(err);
  }
};

export const updateWorkerDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const worker = await workerService.upsertWorkerDetails(req.params.id, req.body);
    res.json(successResponse(worker));
  } catch (err: any) {
    next(err);
  }
};

export const getCategoriesController = async (req: Request, res: Response, next: NextFunction) => {
  const categories = await workerService.getCategories()
  res.json(categories)
}

export const getRolesController = async (req: Request, res: Response, next: NextFunction) => {
  const roles = await workerService.getRoles()
  res.json(roles)
}

export const getRolesByCategoryController = async (req: Request, res: Response, next: NextFunction) => {
  const { categoryId } = req.params;
  const roles = await workerService.getRolesByCategory(categoryId);
  res.json(roles);
};

export const getSpecialitiesController = async (req: Request, res: Response, next: NextFunction) => {
  const specialities = await workerService.getSpecialities()
  res.json(specialities)
}

export const getSpecialitiesByRoleIdController = async (req: Request, res: Response, next: NextFunction) => {
  const { roleId } = req.params;
  const specialities = await workerService.getSpecialitiesByRoleId(roleId);
  res.json(specialities);
}

export const getWorkTypesController = async (req: Request, res: Response, next: NextFunction) => {
  const workTypes = await workerService.getWorkTypes()
  res.json(workTypes)
}

export const getWorkTypesBySpecialityIdController = async (req: Request, res: Response, next: NextFunction) => {
  const { specialityId } = req.params;
  const workTypes = await workerService.getWorkTypesBySpecialityId(specialityId);
  res.json(workTypes);
}

export const acceptJobAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const application = await workerService.acceptAssignment(req.params.applicationId, req.params.workerId);
    res.json(successResponse(application));
  } catch (err: any) {
    next(err);
  }
};

export const rejectJobAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const application = await workerService.rejectAssignment(req.params.applicationId, req.params.workerId);
    res.json(successResponse(application));
  } catch (err: any) {
    next(err);
  }
};

export const getWorkerJobApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const applications = await workerService.getWorkerJobApplications(req.params.workerId, page, limit);
    res.json(successResponse(applications));
  } catch (err: any) {
    next(err);
  }
};  

export const toggleWorkerAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isAvailable } = req.body;
    console.log("Request User:", req.user);
    if (req?.user?.id === undefined) {
      return res.status(400).json(errorResponse("User not Authenticated"));
    }
    if (req.user.role !== "WORKER") {
      return res.status(403).json(errorResponse("Only workers can change availability"));
    }
    const worker = await workerService.toggleWorkerAvailability(req?.user?.id, isAvailable);
    res.json(successResponse(worker, "Worker availability updated successfully"));
  } catch (err: any) {
    next(err);
  }
};
