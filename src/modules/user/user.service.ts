// src/modules/user/user.service.ts
import prisma from "../../config/prisma";
import bcrypt from "bcrypt";
import { UserRole, UserStatus, VerificationStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";

export type ListUsersFilters = {
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  verification?: VerificationStatus;
  dateFrom?: string; // ISO
  dateTo?: string;   // ISO
  page?: number;
  limit?: number;
};

export class UserService {
  static async listUsers(filters: ListUsersFilters) {
    const {
      email,
      role,
      status,
      verification,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = filters;

    const where: Prisma.UserWhereInput = {
      AND: [
        email ? { email: { contains: email, mode: "insensitive" } } : undefined,
        role ? { role } : undefined,
        status ? { status } : undefined,
        verification ? { verification } : undefined,
        dateFrom || dateTo
          ? {
            createdAt: {
              gte: dateFrom ? new Date(dateFrom) : undefined,
              lte: dateTo ? new Date(dateTo) : undefined,
            },
          }
          : undefined,
      ].filter(Boolean) as Prisma.UserWhereInput[],
    };

    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          verification: true,
          referralCode: true,
          referredBy: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async setStatus(userId: string, nextStatus: UserStatus) {
    // Guard valid transitions can be added here if needed.
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status: nextStatus },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        verification: true,
        updatedAt: true,
      },
    });
    return updated;
  }

  static async resetPassword(userId: string, newPassword: string) {
    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hash, tokenVersion: { increment: 1 } }, // also logs out everywhere
    });
    return { success: true };
  }

  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        verification: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  static async forceLogout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
    return { success: true };
  }

  static async getReferralsByUser(userId: string, page = 1, limit = 20) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, referralCode: true },
    });
    if (!user) throw new Error("User not found");

    const where = { referredBy: user.referralCode ?? "" };
    const take = Math.min(100, Math.max(1, limit ?? 20));
    const skip = (Math.max(1, page ?? 1) - 1) * take;

    const [referred, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          verification: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      referrer: { id: user.id, email: user.email, referralCode: user.referralCode },
      referred,
      count: total,
      meta: {
        total,
        page: Math.max(1, page ?? 1),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  static async ensureReferralCode(userId: string) {
    // If user already has a code, return it. Otherwise generate and save one.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });
    if (user?.referralCode) return { referralCode: user.referralCode };

    // simple, unique-ish code: 6-8 chars from email hash/time. Rely on DB uniqueness.
    const code = `REF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { referralCode: code },
      select: { referralCode: true },
    });
    return { referralCode: updated.referralCode! };
  }

  static async getReferralStats() {
    // Overall referral stats for analytics
    const withCodes = await prisma.user.findMany({
      where: { referralCode: { not: null } },
      select: { id: true, referralCode: true },
    });

    const counts = await prisma.user.groupBy({
      by: ["referredBy"],
      _count: true,
      where: { referredBy: { not: null } },
    });

    const map = new Map<string, number>();
    counts.forEach((c) => {
      if (c.referredBy) map.set(c.referredBy, c._count);
    });

    const summary = withCodes.map((u) => ({
      referralCode: u.referralCode!,
      referredCount: map.get(u.referralCode!) ?? 0,
    }));

    return {
      totalReferrers: withCodes.length,
      totalReferrals: counts.reduce((a, b) => a + b._count, 0),
      byCode: summary,
    };
  }

  static async getAverageRating(userId: string) {
    const avgRating = await prisma.review.aggregate({
      where: { userId: userId },
      _avg: { rating: true },
    });
    return avgRating;
  }

  static async getTotalReviews(userId: string) {
    const totalReviews = await prisma.review.count({
      where: { userId: userId },
    });
    return totalReviews;
  }

  static async getReviews(userId: string, page = 1, limit = 20) {
    const where = { userId };
    const take = Math.min(100, Math.max(1, limit ?? 20));
    const skip = (Math.max(1, page ?? 1) - 1) * take;

    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page: Math.max(1, page ?? 1),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  static async postReview(userId: string, companyId: string, rating: number, comment?: string) {
    const review = await prisma.review.create({
      data: {
        userId,
        companyId,
        rating,
        comment,
      },
    });
    return review;
  }
}