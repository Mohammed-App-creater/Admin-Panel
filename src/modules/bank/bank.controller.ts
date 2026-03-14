import { Request, Response, NextFunction } from "express";
import { successResponse, errorResponse } from "../../utils/response";
import * as service from "./bank.service";

export const createBank = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bank = await service.createBank(req.body);
    res.status(201).json(successResponse(bank, "Bank created successfully"));
  } catch (err) {
    if (err instanceof Error && err.message === 'Bank with this account number already exists') {
      return res.status(400).json(errorResponse(err.message));
    }
    next(err);
  }
};

export const listBanks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const banks = await service.listBanks(page, limit);
    res.json(successResponse(banks, "Banks retrieved successfully"));
  } catch (err) {
    next(err);
  }
};

export const getBank = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bank = await service.getBank(req.params.id);
    if (!bank) return res.status(404).json({ message: "Bank not found" });
    res.json(successResponse(bank, "Bank retrieved successfully"));
  } catch (err) {
    next(err);
  }
};

export const updateBank = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bank = await service.updateBank(req.params.id, req.body);
    res.json(successResponse(bank, "Bank updated successfully"));
  } catch (err) {
    next(err);
  }
};

export const deleteBank = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.deleteBank(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
