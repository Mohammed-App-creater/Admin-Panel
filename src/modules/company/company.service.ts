import prisma from "../../config/prisma";
import { VerificationStatus, UserStatus } from "@prisma/client";
import { Company } from "@prisma/client";
import bcrypt from "bcrypt";

type CompanyFilters = {
  q?: string;
  verification?: string;
  status?: string;
  location?: string;
  hasLogo?: boolean;
  hasVerificationDocs?: boolean;
  minJobs?: number;
  maxJobs?: number;
  jobStatus?: string;
  jobCategory?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "jobsCount" | "name" | string; // 👈 allow any string too
  sortOrder?: "asc" | "desc" | string;
};


// Get all companies (optional filters)
export const getAllCompanies = async (filters: CompanyFilters = {}) => {
  const page = Number(filters.page) ?? 1;
  const limit = Number(filters.limit) ?? 20;
  const skip = (page - 1) * limit;

  // Build Prisma where for fields prisma can evaluate directly
  const where: any = {};

  // Filter by related user fields (status / verification / search across user.fullName & email)
  const userWhere: any = {};
  if (filters.verification) userWhere.verification = filters.verification;
  if (filters.status) userWhere.status = filters.status;
  if (filters.q) {
    userWhere.OR = [
      { fullName: { contains: filters.q, mode: "insensitive" } },
      { email: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (Object.keys(userWhere).length) where.user = userWhere;

  // businessLocation search
  if (filters.location) {
    where.businessLocation = { contains: filters.location, mode: "insensitive" };
  }

  // If we want companies having jobs with specific status or category, use `jobs: { some: { ... } }`
  if (filters.jobStatus || filters.jobCategory) {
    where.jobs = { some: {} };
    if (filters.jobStatus) (where.jobs.some as any).status = filters.jobStatus;
    if (filters.jobCategory) (where.jobs.some as any).categories = { has: filters.jobCategory };
  }

  // Base findMany: include user, jobs and counts
  const companies = await prisma.company.findMany({
    where,
    include: {
      user: true,
      jobs: true, // optional: you might select fewer fields to reduce payload
      _count: {
        select: { jobs: true },
      },
    },
    // allow ordering by user.createdAt or name via relation
    orderBy:
      filters.sortBy === "name"
        ? { user: { fullName: (filters.sortOrder === "asc" || filters.sortOrder === "desc") ? filters.sortOrder : "asc" } }
        : // default createdAt from user
        { user: { createdAt: (filters.sortOrder === "asc" || filters.sortOrder === "desc") ? filters.sortOrder : "asc" } },
    skip,
    take: limit,
  });

  // Post-filter for things Prisma can't easily express:
  let filtered = companies.filter((c) => {
    // hasLogo: true => companyLogo !== null && companyLogo !== ''
    if (typeof filters.hasLogo === "boolean") {
      const hasLogo = !!(c.companyLogo && c.companyLogo.trim().length > 0);
      if (filters.hasLogo !== hasLogo) return false;
    }

    // hasVerificationDocs: (check the stored array length)
    if (typeof filters.hasVerificationDocs === "boolean") {
      const hasDocs = Array.isArray(c.verificationDocuments) && c.verificationDocuments.length > 0;
      if (filters.hasVerificationDocs !== hasDocs) return false;
    }

    // minJobs / maxJobs using _count.jobs (we included _count)
    const jobsCount = (c as any)._count?.jobs ?? c.jobs?.length ?? 0;
    if (typeof filters.minJobs === "number" && jobsCount < filters.minJobs) return false;
    if (typeof filters.maxJobs === "number" && jobsCount > filters.maxJobs) return false;

    return true;
  });

  // Sort by jobsCount in JS if requested
  if (filters.sortBy === "jobsCount") {
    filtered = filtered.sort((a, b) => {
      const aCount = (a as any)._count?.jobs ?? a.jobs?.length ?? 0;
      const bCount = (b as any)._count?.jobs ?? b.jobs?.length ?? 0;
      if (filters.sortOrder === "desc") return bCount - aCount;
      return aCount - bCount;
    });
  }

  // NOTE: total count for pagination should ideally be done with a separate count() query that uses the same base filters (but not JS post-filter)
  const totalWhereForCount = where; // this is approximate; if you rely on post-filtering (e.g. hasVerificationDocs/minJobs) you might adjust
  const total = await prisma.company.count({ where: totalWhereForCount });

  return {
    items: filtered,
    meta: {
      total,
      page,
      limit,
      returned: filtered.length,
    },
  };
}

// Get company details by ID
export const getCompanyById = async (companyId: string) => {
  return prisma.company.findUnique({
    where: { id: companyId },
    include: {
      user: true,
    },
  });
};

// Register a company
export const registerCompany = async (data: any) => {
  const { fullName, phone, email, password, location, companyLogo, businessLocation, verificationDocuments } = data;

  const existingUser = await prisma.user.findUnique({ where: { email } }) || await prisma.user.findUnique({ where: { phone } });
  if (existingUser) {
    throw new Error("User already exists with this email or phone number");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const company = await prisma.user.create({
    data: {
      fullName,
      phone,
      email,
      passwordHash,
      role: "COMPANY",
      location,
      status: UserStatus.PENDING,
      verification: VerificationStatus.PENDING,
      referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),

      companyProfile: {
        create: {
          companyLogo,
          businessLocation,
          verificationDocuments
        },
      },
    },
    include: {
      companyProfile: true,
    },
  });
  return company;
};

// Approve a company
export const approveCompany = async (companyId: string) => {
  const company = await prisma.user.findUnique({ where: { id: companyId } });
  if (!company) throw new Error("Company not found");

  return prisma.user.update({
    where: { id: companyId },
    data: {
      verification: VerificationStatus.APPROVED,
      status: UserStatus.ACTIVE,
    },
  });
};

// Reject a company
export const rejectCompany = async (companyId: string) => {
  const company = await prisma.user.findUnique({ where: { id: companyId } });
  if (!company) throw new Error("Company not found");

  return prisma.user.update({
    where: { id: companyId },
    data: {
      verification: VerificationStatus.REJECTED,
      status: UserStatus.REJECTED,
    },
  });
};

// Update company detail
export const updateDetail = async (companyId: string, data: Partial<Company>) => {
  const company = await prisma.company.findUnique({ where: { id: companyId }, include: { user: true } });
  if (!company) throw new Error("Company not found");
  if (company.user.role !== "COMPANY") throw new Error("User is not a company");
  return prisma.company.update({
    where: { id: companyId },
    data: {
      ...data,
    },
    include: { user: true },
  });
};

