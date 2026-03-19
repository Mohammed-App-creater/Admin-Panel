// services/subscription.service.ts
import prisma from "../../config/prisma";
import { Prisma } from "@prisma/client";

export type CreateSubscriptionDto = {
    userId: string;
    planId: string;
    startDate?: Date;
    endDate?: Date | null;
    autoRenew?: boolean;
    status?: "ACTIVE" | "INACTIVE" | "CANCELLED" | string;
    skipPlanFetch?: boolean;
    paymentReceiptId?: string;
};

export const calculateDaysLeft = (subscription: any): number => {
    const now = new Date();
    const start = subscription.startDate ? new Date(subscription.startDate) : null;
    const endFromRow = subscription.endDate ? new Date(subscription.endDate) : null;
    const planInterval = subscription.plan?.interval;

    // Pending subscriptions shouldn't count down until activated.
    if (subscription.status === "PENDING") return 0;

    // choose end date hierarchy: row endDate -> infer from startDate & plan interval -> 0 days left
    let end: Date | null = endFromRow;

    if (!end && start && planInterval) {
        end = new Date(start);
        if (planInterval === "MONTHLY") end.setMonth(end.getMonth() + 1);
        else if (planInterval === "YEARLY") end.setFullYear(end.getFullYear() + 1);
        else if (planInterval === "WEEKLY") end.setDate(end.getDate() + 7);
        else end.setMonth(end.getMonth() + 1);
    }

    if (!end) return 0;

    const diffMs = end.getTime() - now.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
};

/**
 * Create subscription. Accepts an optional transactional client (tx) so callers
 * (like payment service) can pass the transaction client.
 */

export const createSubscription = async (
    dto: CreateSubscriptionDto,
    client?: Prisma.TransactionClient | typeof prisma
) => {
    const tx = (client as any) ?? prisma;
    const start = dto.startDate ?? new Date();

    let end = dto.endDate ?? null;

    if (!end && !dto.skipPlanFetch) {
        const plan = await tx.plan.findUnique({ where: { id: dto.planId } });
        if (!plan) throw new Error("Plan not found");
        end = new Date(start);
        if (plan.interval === "MONTHLY") end.setMonth(end.getMonth() + 1);
        else if (plan.interval === "YEARLY") end.setFullYear(end.getFullYear() + 1);
        else if (plan.interval === "WEEKLY") end.setDate(end.getDate() + 7);
        else end.setMonth(end.getMonth() + 1);
    }

    const created = await tx.subscription.create({
        data: {
            userId: dto.userId,
            planId: dto.planId,
            status: dto.status ?? "ACTIVE",
            startDate: start,
            endDate: end,
            autoRenew: dto.autoRenew ?? false,
            paymentReceiptId: dto.paymentReceiptId,
        },
        include: { plan: true, user: true },
    });

    // compute daysLeft
    const now = new Date();
    const daysLeft = created.endDate ? Math.max(0, Math.ceil((new Date(created.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

    return { ...created, daysLeft };
};

export const getSubscriptionById = async (id: string) => {
    const subscription = await prisma.subscription.findUnique({
        where: { id },
        include: { plan: true, user: true },
    });
    if (!subscription) throw new Error("Subscription not found");
    const daysLeft = calculateDaysLeft(subscription);
    return { ...subscription, daysLeft };
};

export const listSubscriptions = async (filters: {
    userId?: string;
    planId?: string;
    status?: string;
    page?: number;
    limit?: number;
} = {}) => {
    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.planId) where.planId = filters.planId;
    if (filters.status) where.status = filters.status;

    const take = Math.min(100, Math.max(1, filters.limit ?? 20));
    const skip = (Math.max(1, filters.page ?? 1) - 1) * take;

    const [subscriptions, total] = await Promise.all([
        prisma.subscription.findMany({
            where,
            take,
            skip,
            orderBy: { createdAt: "desc" },
            include: { plan: true, user: true },
        }),
        prisma.subscription.count({ where }),
    ]);

    return {
        items: subscriptions.map((s) => ({ ...s, daysLeft: calculateDaysLeft(s) })),
        meta: {
            total,
            page: Math.max(1, filters.page ?? 1),
            limit: take,
            totalPages: Math.ceil(total / take),
        },
    };
};

export const updateSubscription = async (id: string, data: Partial<CreateSubscriptionDto>) => {
    const updateData: any = {};
    if (data.planId !== undefined) updateData.planId = data.planId;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.autoRenew !== undefined) updateData.autoRenew = data.autoRenew;
    if (data.status !== undefined) updateData.status = data.status;

    const sub = await prisma.subscription.update({
        where: { id },
        data: updateData,
        include: { plan: true, user: true },
    });
    return { ...sub, daysLeft: calculateDaysLeft(sub) };
};

export const cancelSubscription = async (id: string) => {
    // mark cancelled and set endDate to now (or keep endDate and set status)
    const now = new Date();
    const sub = await prisma.subscription.update({
        where: { id },
        data: {
            status: "CANCELED",
            endDate: now,
            autoRenew: false,
        },
        include: { plan: true, user: true },
    });
    return { ...sub, daysLeft: calculateDaysLeft(sub) };
};

export const deleteSubscription = async (id: string) => {
    // physically delete; if you prefer soft-delete, modify here
    return prisma.subscription.delete({ where: { id } });
};

export const getMySubscriptions = async (userId: string, page = 1, limit = 20) => {
    const take = Math.min(100, Math.max(1, limit ?? 20));
    const skip = (Math.max(1, page ?? 1) - 1) * take;
    const where = { userId };
    const [subs, total] = await Promise.all([
        prisma.subscription.findMany({
            where,
            take,
            skip,
            orderBy: { createdAt: "desc" },
            include: { plan: true, user: true },
        }),
        prisma.subscription.count({ where }),
    ]);
    return {
        items: subs.map((s) => ({ ...s, daysLeft: calculateDaysLeft(s) })),
        meta: {
            total,
            page: Math.max(1, page ?? 1),
            limit: take,
            totalPages: Math.ceil(total / take),
        },
    };
};

export const getMyActiveSubscription = async (userId: string) => {
    const subs = await prisma.subscription.findMany({
        where: {
            userId,
            status: "ACTIVE",
        },
        include: { plan: true, user: true },
    });
    return subs.map((s) => ({ ...s, daysLeft: calculateDaysLeft(s) }));
};
