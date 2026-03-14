// src/modules/paymentReceipt/paymentReceipt.controller.ts
import { Request, Response, NextFunction } from "express";
import { successResponse, errorResponse } from "../../utils/response";
import * as service from "./paymentReceipt.service";
import { Param } from "@prisma/client/runtime/library";

export const createReceipt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json(errorResponse("User ID is required"));
    }
    const dto = req.body;
    const created = await service.createReceipt(userId, dto);
    return res.status(201).json(successResponse(created));
  } catch (err) {
    next(err);
  }
};

export const listUserReceipts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id as string;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const results = await service.getReceiptsByUser(userId, page, limit);
    return res.json(successResponse(results));
  } catch (err) {
    next(err);
  }
};

export const getUserReceipt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const receipt = await service.getReceiptById(req.params.id);
    if (!receipt) return res.status(404).json(errorResponse("Receipt not found"));

    // if normal user, ensure they own the receipt (or admin)
    const user = (req as any).user;
    if (user.role !== "ADMIN" && receipt.userId !== user.id) {
      return res.status(403).json(errorResponse("Forbidden"));
    }

    return res.json(successResponse(receipt));
  } catch (err) {
    next(err);
  }
};

/* Admin controllers */

export const adminListReceipts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page, limit } = req.query;
    const results = await service.adminListReceipts({
      status: status as string | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    return res.json(successResponse(results));
  } catch (err) {
    next(err);
  }
};

export const adminGetReceipt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const receipt = await service.adminGetReceipt(req.params.id);
    if (!receipt) return res.status(404).json(errorResponse("Receipt not found"));
    return res.json(successResponse(receipt));
  } catch (err) {
    next(err);
  }
};

export const adminApproveReceipt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminUserId = (req as any).user.id as string;
    const receiptId = req.params.id;
    const result = await service.adminApproveReceipt(receiptId, adminUserId);
    return res.json(successResponse(result));
  } catch (err) {
    next(err);
  }
};

export const adminRejectReceipt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminUserId = (req as any).user.id as string;
    const receiptId = req.params.id;
    const { reason } = req.body;
    const updated = await service.adminRejectReceipt(receiptId, adminUserId, reason);
    return res.json(successResponse(updated));
  } catch (err) {
    next(err);
  }
};
