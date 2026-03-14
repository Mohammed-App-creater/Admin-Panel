import prisma from "../../config/prisma";
import { Prisma } from "@prisma/client";
import * as subscriptionService from "../subscription/subscription.service";
import { NotificationService } from "../notification/notification.service";

export type CreateReceiptDto = {
  bankId: string;
  planId?: string;
  amount: number;
  referenceNo?: string;
  screenshot: string;
};

export const createReceipt = async (userId: string, dto: CreateReceiptDto) => {
  const [bank, plan] = await prisma.$transaction([
    prisma.bank.findUnique({ where: { id: dto.bankId } }),
    prisma.plan.findUnique({ where: { id: dto.planId } }),
  ]);

  if (!bank) throw new Error("Bank not found");
  if (!plan) throw new Error("Plan not found");
  if (bank.status !== "ACTIVE") throw new Error("Bank is not active");
  if (plan?.status !== "ACTIVE") throw new Error("Plan is not active");

  return prisma.paymentReceipt.create({
    data: {
      userId,
      bankId: dto.bankId,
      planId: dto.planId,
      amount: dto.amount,
      referenceNo: dto.referenceNo,
      screenshot: dto.screenshot,
      status: "PENDING",
    },
  });
};


export const getReceiptsByUser = async (userId: string, page = 1, limit = 20) => {
  const take = Math.min(100, Math.max(1, limit ?? 20));
  const skip = (Math.max(1, page ?? 1) - 1) * take;
  const where = { userId };
  const [items, total] = await Promise.all([
    prisma.paymentReceipt.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: "desc" },
      include: { bank: true, plan: true, transaction: true },
    }),
    prisma.paymentReceipt.count({ where }),
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
};

export const getReceiptById = async (id: string) => {
  return prisma.paymentReceipt.findUnique({
    where: { id },
    include: { bank: true, plan: true, user: { include: { wallet: true } }, transaction: true },
  });
};

export const adminListReceipts = async (filters: { status?: string; page?: number; limit?: number } = {}) => {
  const where: Prisma.PaymentReceiptWhereInput = {};
  if (filters.status) where.status = filters.status as any;
  const take = Math.min(100, Math.max(1, filters.limit ?? 20));
  const skip = (Math.max(1, filters.page ?? 1) - 1) * take;
  const [items, total] = await Promise.all([
    prisma.paymentReceipt.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: "desc" },
      include: { user: true, bank: true, plan: true, transaction: true },
    }),
    prisma.paymentReceipt.count({ where }),
  ]);
  return {
    items,
    meta: {
      total,
      page: Math.max(1, filters.page ?? 1),
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
};

export const adminGetReceipt = getReceiptById;

/**
 * Approve receipt:
 * - If receipt.planId exists => treat as SUBSCRIPTION payment (create transaction, create subscription).
 *   -> Do NOT increment wallet balance.
 * - If receipt.planId is null => treat as WALLET TOP-UP (create transaction and increment wallet).
 *
 * All writes happen inside one atomic transaction. We precompute plan/endDate before entering tx so
 * the transaction is light and fast.
 */
export const adminApproveReceipt = async (receiptId: string, adminUserId: string) => {
  // 1) Fetch the receipt with user/wallet & plan BEFORE the transaction (avoid slow tx)
  const receipt = await prisma.paymentReceipt.findUnique({
    where: { id: receiptId },
    include: { user: { include: { wallet: true } }, plan: true },
  });
  if (!receipt) throw new Error("Receipt not found");
  if (receipt.status !== "PENDING") throw new Error("Receipt already processed");

  // Ensure wallet exists for the user (we will attach transactions to a wallet in both flows).
  // Create wallet here if missing (outside tx) to reduce tx time. If you prefer, you can create inside tx.
  let wallet = receipt.user.wallet;
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId: receipt.userId,
        balance: 0,
        currency: "ETB",
      },
    });
  }

  const amount = receipt.amount;

  // If this is a subscription payment, validate amount now
  let precomputedEndDate: Date | null = null;
  if (receipt.planId) {
    const plan = receipt.plan ?? (await prisma.plan.findUnique({ where: { id: receipt.planId } }));
    if (!plan) throw new Error("Plan not found");

    // validate payment amount
    if (typeof plan.price === "number" && amount < plan.price) {
      throw new Error("Paid amount is less than plan price");
    }

    // precompute endDate (so we don't need plan lookup inside tx)
    precomputedEndDate = new Date();
    if (plan.interval === "MONTHLY") precomputedEndDate.setMonth(precomputedEndDate.getMonth() + 1);
    else if (plan.interval === "YEARLY") precomputedEndDate.setFullYear(precomputedEndDate.getFullYear() + 1);
    else if (plan.interval === "WEEKLY") precomputedEndDate.setDate(precomputedEndDate.getDate() + 7);
    else precomputedEndDate.setMonth(precomputedEndDate.getMonth() + 1);
  }

  // Run the lean transaction. We choose types: "SUBSCRIPTION" or "TOPUP"
  return prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      // 1) create transaction record (attached to wallet)
      const txType = receipt.planId ? "SUBSCRIPTION" : "DEPOSIT";
      const createdTx = await tx.transaction.create({
        data: {
          walletId: wallet!.id,
          type: txType,
          amount,
        },
      });

      // 2) If top-up -> increment wallet balance. If subscription -> DO NOT increment wallet.
      if (!receipt.planId) {
        await tx.wallet.update({
          where: { id: wallet!.id },
          data: { balance: { increment: amount } },
        });
      }

      // 3) update receipt to APPROVED and attach transaction + verifiedBy
      const updatedReceipt = await tx.paymentReceipt.update({
        where: { id: receiptId },
        data: {
          status: "APPROVED",
          transaction: { connect: { id: createdTx.id } },
          verifiedBy: { connect: { id: adminUserId } },
        },
        include: { transaction: true, user: true, plan: true },
      });

      // 4) If planId present -> create subscription (using subscription service, passing tx)
      let subscription = null;
      if (receipt.planId) {
        subscription = await subscriptionService.createSubscription(
          {
            userId: receipt.userId,
            planId: receipt.planId,
            startDate: new Date(),
            endDate: precomputedEndDate,
            autoRenew: false,
            status: "ACTIVE",
            skipPlanFetch: true, // avoid extra plan fetch inside service
          },
          tx
        );
      }

      // 5) Optionally create a notification inside transaction (lightweight)
      if (subscription) {
        (async () => {
          try {
            await NotificationService.notifyUser(
              receipt.userId,
              "Subscription Activated",
              `Your subscription to ${receipt.plan?.name ?? "plan"} is now active.`,
              "PAYMENT",
              undefined,
              undefined,
              receipt.id
            );
          } catch (err) {
            console.error("Failed to create notification for subscription activation:", err);
          }
        })();
      } else {
        (async () => {
          try {
            await NotificationService.notifyUser(
              receipt.userId,
              "Wallet Top-Up Successful",
              `Your wallet has been topped up with amount ${amount}.`,
              "PAYMENT",
              undefined,
              undefined,
              receipt.id
            );
          } catch (err) {
            console.error("Failed to create notification for wallet top-up:", err);
          }
        })();
      }

      return { transaction: createdTx, receipt: updatedReceipt, subscription };
    },
    {
      timeout: 15000, // increase only if necessary; keep transaction lean in general
      maxWait: 5000,
    }
  );
};

export const adminRejectReceipt = async (receiptId: string, adminUserId: string, reason?: string) => {
  const receipt = await prisma.paymentReceipt.findUnique({ where: { id: receiptId } });
  if (!receipt) throw new Error("Receipt not found");
  if (receipt.status !== "PENDING") throw new Error("Receipt already processed");
  // Update status to REJECTED and optionally set a reason if you included such a field in the schema
  // If you don't have a rejectionReason column, just update status & verifiedBy
  return prisma.paymentReceipt.update({
    where: { id: receiptId },
    data: {
      status: "REJECTED",
      verifiedById: adminUserId,
      // rejectionReason: reason, // uncomment if model has this field
    },
  });
};
