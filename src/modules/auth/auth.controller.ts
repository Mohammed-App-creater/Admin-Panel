import { NextFunction, Request, Response } from "express";
import * as authService from "./auth.service";
import { successResponse, errorResponse } from "../../utils/response";

export const register = async (req: Request, res: Response) => {
  try {
    const user = await authService.register(req.body);
    res.json(successResponse(user, "User registered successfully"));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const userAndToken = await authService.login(req.body);
    res.json(successResponse(userAndToken, "Login successful"));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
};

export const activateUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await authService.activateUser(userId);
    res.json(successResponse(user, "User activated successfully"));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
};

export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await authService.deactivateUser(userId);
    res.json(successResponse(user, "User deactivated successfully"));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
};

export const approveUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await authService.approveUser(userId);
    res.json(successResponse(user, "User approved successfully"));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
};

export const rejectUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await authService.rejectUser(userId);
    res.json(successResponse(user, "User rejected successfully"));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
};

export const requestPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
  try {
    res.status(200).json(successResponse(await authService.requestPasswordReset(email), `Reset code sent to npm run dev${email}`));
  } catch (error: any) {
    next(error);
  }
}

export const verifyResetCode = async (req: Request, res: Response, next: NextFunction) => {
  const { email, code } = req.body;
  try {
    res.status(200).json(successResponse(await authService.verifyResetCode(email, code), "Code verified successfully"));
  } catch (error: any) {
    next(error);
  }
}

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  const { oldPassword, newPassword } = req.body;
  if (!req?.user?.id) return res.status(401).json(errorResponse("Unauthorized"));
  try {
    res.status(200).json(successResponse(await authService.changePassword(oldPassword, newPassword, req?.user?.id), "Password changed successfully"));
  } catch (error: any) {
    next(error);
  }
};