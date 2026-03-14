import { parse } from "path/win32";
import prisma from "../../config/prisma";
import { TransactionType } from "@prisma/client";

// Get all wallets with pagination
export const getAllWallets = async (page = 1, limit = 20) => {
  const take = Math.min(100, Math.max(1, limit ?? 20));
  const skip = (Math.max(1, page ?? 1) - 1) * take;
  const [items, total] = await Promise.all([
    prisma.wallet.findMany({
      take,
      skip,
      orderBy: { id: "desc" },
      include: {
        user: true,
        transactions: true,
      },
    }),
    prisma.wallet.count(),
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

// Get wallet by user ID
export const getWalletByUserId = async (userId: string) => {
  return prisma.wallet.findUnique({
    where: { userId },
    include: {
      user: true,
      transactions: true,
    },
  });
};

// Create wallet for user
export const createWallet = async (userId: string) => {
  return prisma.wallet.create({
    data: {
      userId,
      balance: 0,
    },
  });
};

// Adjust wallet balance manually (admin)
export const adjustWalletBalance = async (
  userId: string,
  amount: number,
  type: TransactionType,
) => {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new Error("Wallet not found");
  const floatAmount = parseFloat(amount.toString());
  const updatedBalance = wallet.balance + floatAmount;

  const transaction = await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      amount: floatAmount,
      type,
    },
  });

  const updatedWallet = await prisma.wallet.update({
    where: { id: wallet.id },
    data: { balance: updatedBalance },
    include: { transactions: true },
  });

  return updatedWallet;
};

// Get transaction history (optionally filter by type, with pagination)
export const getTransactions = async (walletId: string, type?: TransactionType, page = 1, limit = 20) => {
  const take = Math.min(100, Math.max(1, limit ?? 20));
  const skip = (Math.max(1, page ?? 1) - 1) * take;
  const where = {
    walletId,
    type: type || undefined,
  };
  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.count({ where }),
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

// Get transaction by ID
export const getTransactionById = async (id: string) => {
  return prisma.transaction.findUnique({
    where: { id },
  });
};

// Get transaction by UserId with pagination
export const getTransactionByUserId = async (userId: string, page = 1, limit = 20) => {
  const wallet = await prisma.wallet.findFirst({ where: { userId } });
  if (!wallet) throw new Error("User Wallet not found");

  const take = Math.min(100, Math.max(1, limit ?? 20));
  const skip = (Math.max(1, page ?? 1) - 1) * take;
  const where = { walletId: wallet.id };
  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.count({ where }),
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

