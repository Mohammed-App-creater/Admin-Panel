import { NextFunction, Request, Response } from "express";
import * as jobService from "./job.service";

// Create job
export const createJob = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const job = await jobService.createJob(req.body, req.params.companyId);
    res.json(job);
  } catch (err: any) {
    next(err);
  }
};

// Update job
export const updateJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await jobService.updateJob(req.params.id, req.body);
    res.json(job);
  } catch (err: any) {
    next(err);
  }
};

// Delete job
export const deleteJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await jobService.deleteJob(req.params.id);
    res.json({ message: "Job deleted", job });
  } catch (err: any) {
    next(err);
  }
};

// Close job (company: own jobs only; admin: any) — sets status to CLOSED without deleting
export const closeJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req?.user?.id as string | undefined;
    const role = req?.user?.role as string | undefined;
    if (!userId || !role) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const job = await jobService.closeJobForCompany(req.params.id, userId, role);
    res.json({ message: "Job closed", job });
  } catch (err: any) {
    next(err);
  }
};

// Get all jobs
export const getJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobs = await jobService.getJobs(req.query as any);
    res.json(jobs);
  } catch (err: any) {
    next(err);
  }
};

// Get jobs for the authenticated company account only
export const getMyCompanyJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req?.user?.id as string | undefined;
    const role = req?.user?.role as string | undefined;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (role !== "COMPANY") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const jobs = await jobService.getMyCompanyJobs(userId, req.query as any);
    res.json(jobs);
  } catch (err: any) {
    next(err);
  }
};

// Get job by ID
export const getJobById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await jobService.getJobById(req.params.id);
    res.json(job);
  } catch (err: any) {
    next(err);
  }
};

// Worker apply to job
export const applyToJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const application = await jobService.applyToJob(req.params.jobId, req.params.workerId);
    return res.json(application);
  } catch (err: any) {
    next(err);
  }
}

// Accept worker application
export const acceptApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const application = await jobService.acceptApplication(req.params.applicationId);
    res.json(application);
  } catch (err: any) {
    next(err);
  }
};

// Reject worker application
export const rejectApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const application = await jobService.rejectApplication(req.params.applicationId);
    res.json(application);
  } catch (err: any) {
    next(err);
  }
};

// Assign Worker to job (company invite)
export const assignWorkerToJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req?.user?.id as string | undefined;
    const role = req?.user?.role as string | undefined;
    if (!userId || !role) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const application = await jobService.assignWorkerToJob(req.params.jobId, req.params.workerId, {
      inviterUserId: userId,
      inviterRole: role,
    });
    res.json(application);
  } catch (err: any) {
    next(err);
  }
};

// Admin Approve the work contract
export const approveWorkContract = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const application = await jobService.adminContractApproval(req.params.applicationId);
    res.json(application);
  } catch (err: any) {
    next(err);
  }
};

// Admin Reject the work contract
export const rejectWorkContract = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const application = await jobService.adminContractRejection(req.params.applicationId);
    res.json(application);
  } catch (err: any) {
    next(err);
  }
};

export const getApplicationsByJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const applications = await jobService.getApplicationsByJob(req.params.jobId, page, limit);
    return res.json(applications);
  } catch (err) {
    next(err)
  }
}

export const listApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // parse query params
    const {
      search,
      skills,
      jobLocation,
      jobType,
      jobStatus,
      applicationStatus,
      adminApproved,
      acceptedAssignment,
      appliedFrom,
      appliedTo,
      payRateMin,
      payRateMax,
      sortBy,
      sortOrder,
      page,
      limit,
    } = req.query;

    // normalize skills: allow comma-separated or multiple `skills` params
    let skillsArr: string[] | undefined;
    if (typeof skills === "string") {
      skillsArr = skills.split(",").map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(skills)) {
      skillsArr = skills.map(s => String(s).trim()).flatMap(s => s.split(",")).map(s => s.trim()).filter(Boolean);
    }

    const opts = {
      q: typeof search === "string" ? search : undefined,
      skills: skillsArr,
      jobLocation: typeof jobLocation === "string" ? jobLocation : undefined,
      jobType: typeof jobType === "string" ? jobType : undefined,
      jobStatus: typeof jobStatus === "string" ? jobStatus : undefined,
      applicationStatus: typeof applicationStatus === "string" ? applicationStatus : undefined,
      adminApproved: typeof adminApproved === "string" ? adminApproved : undefined,
      acceptedAssignment: typeof acceptedAssignment === "string" ? acceptedAssignment : undefined,
      appliedFrom: typeof appliedFrom === "string" ? appliedFrom : undefined,
      appliedTo: typeof appliedTo === "string" ? appliedTo : undefined,
      payRateMin: payRateMin ? Number(payRateMin) : undefined,
      payRateMax: payRateMax ? Number(payRateMax) : undefined,
      sortBy: typeof sortBy === "string" ? (sortBy as any) : undefined,
      sortOrder: sortOrder === "asc" || sortOrder === "desc" ? sortOrder as "asc" | "desc" : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    };

    const result = await jobService.getAllApplications(opts);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getAllAssignedJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workerId, companyId, status, adminApproved, acceptedAssignment, page, limit } = req.query;
    const filters = {
      workerId: typeof workerId === "string" ? workerId : Array.isArray(workerId) ? String(workerId[0]) : undefined,
      companyId: typeof companyId === "string" ? companyId : undefined,
      status: typeof status === "string" ? status : undefined,
      adminApproved: typeof adminApproved === "string" ? (adminApproved === "true") : undefined,
      acceptedAssignment: typeof acceptedAssignment === "string" ? (acceptedAssignment === "true") : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    };
    const result = await jobService.getAllAssignedJobs(filters);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getAllCompanyAssignedJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const result = await jobService.getAllCompanyAssignedJobs(req.params.companyId, page, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getAllWorkerAssignedJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const result = await jobService.getAllAssignedJobsForWorker(req.params.workerId, page, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getAllJobAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const result = await jobService.getAllAssignedForJobs(req.params.jobId, page, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getMyJobAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerId = req?.user?.id;
    const { page, limit } = req.query;
    if (!workerId) throw new Error("Unauthorized");
    if (req?.user?.role !== "WORKER") throw new Error("Forbidden");
    const result = await jobService.getMyJobInvitations(workerId, page ? Number(page) : 1, limit ? Number(limit) : 20);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getMyJobInvitations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerId = req?.user?.id;
    const { page, limit } = req.query;
    if (!workerId) throw new Error("Unauthorized");
    if (req?.user?.role !== "WORKER") throw new Error("Forbidden");
    const result = await jobService.getMyJobInvitations(workerId, page ? Number(page) : 1, limit ? Number(limit) : 20);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getMyApprovedJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerId = req?.user?.id;
    const { page, limit } = req.query;
    if (!workerId) throw new Error("Unauthorized");
    if (req?.user?.role !== "WORKER") throw new Error("Forbidden");
    const result = await jobService.getMyApprovedJobs(workerId, page ? Number(page) : 1, limit ? Number(limit) : 20);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getMyJobHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerId = req?.user?.id;
    const { page, limit } = req.query;
    if (!workerId) throw new Error("Unauthorized");
    if (req?.user?.role !== "WORKER") throw new Error("Forbidden");
    const result = await jobService.getMyJobHistory(
      workerId,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};