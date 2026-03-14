import { Request, Response, NextFunction } from "express";
import { errorResponse, successResponse } from "../../utils/response";
import * as walletService from "./wallet.service";

// GET all wallets
export const getAllWallets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const wallets = await walletService.getAllWallets(page, limit);
    res.json(successResponse(wallets, "Wallets retrieved successfully"));
  } catch (err: any) {
    next(err)
  }
};

// GET wallet by user ID
export const getWalletByUserId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wallet = await walletService.getWalletByUserId(req.params.userId);
    res.json(successResponse(wallet, "Wallet retrieved successfully"));
  } catch (err: any) {
    next(err)
  }
};

// POST create wallet
export const createWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wallet = await walletService.createWallet(req.params.userId);
    res.status(201).json(successResponse(wallet, "Wallet created successfully"));
  } catch (err: any) {
    next(err);
  }
};

// PATCH adjust wallet balance (admin)
export const adjustWalletBalance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, type } = req.body;
    const wallet = await walletService.adjustWalletBalance(req.params.userId, amount, type);
    res.json(successResponse(wallet, "Wallet balance adjusted successfully"));
  } catch (err: any) {
    next(err)
  }
};

// GET transactions
export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, page, limit } = req.query;
    const transactions = await walletService.getTransactions(
      req.params.walletId,
      type as any,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined
    );
    res.json(successResponse(transactions, "Transactions retrieved successfully"));
  } catch (err: any) {
    next(err);
  }
};

// Get transaction by ID
export const getTransactionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await walletService.getTransactionById(req.params.transactionId);
    res.json(successResponse(transaction, "Transaction retrieved successfully"));
  } catch (err: any) {
    next(err);
  }
};

// Get transaction by userId
export const getTransactionByUserId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query;
    const transactions = await walletService.getTransactionByUserId(
      req.params.userId,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined
    );
    res.json(successResponse(transactions, "Transactions retrieved successfully"));
  } catch (err: any) {
    next(err);
  }
};
