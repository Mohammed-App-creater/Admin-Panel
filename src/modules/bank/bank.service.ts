import prisma  from "../../config/prisma";
import { Prisma } from "@prisma/client";

export type CreateBankDto = {
  name: string;
  accountName: string;
  accountNo: string;
  type: "BANK" | "WALLET";
  status?: "ACTIVE" | "INACTIVE";
};

export const createBank = async (data: CreateBankDto) =>{
  const exists = await prisma.bank.findFirst({where:{accountNo:data.accountNo}})
  if(exists) throw new Error('Bank with this account number already exists')
  return prisma.bank.create({ data });
}

export const listBanks = async (page = 1, limit = 20) => {
  const take = Math.min(100, Math.max(1, limit ?? 20));
  const skip = (Math.max(1, page ?? 1) - 1) * take;
  const where = { status: "ACTIVE" as const };
  const [items, total] = await Promise.all([
    prisma.bank.findMany({ take, skip, orderBy: { createdAt: "desc" }, where }),
    prisma.bank.count({ where }),
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

export const getBank = async (id: string) =>
  prisma.bank.findUnique({ where: { id } });

export const updateBank = async (id: string, data: Partial<CreateBankDto>) =>
  prisma.bank.update({ where: { id }, data });

export const deleteBank = async (id: string) =>
  prisma.bank.update({ where: { id }, data: { status: "INACTIVE" } });
