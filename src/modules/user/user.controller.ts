  // src/modules/user/user.controller.ts
import { Request, Response, NextFunction } from "express";
import { successResponse, errorResponse } from "../../utils/response";
import { UserService } from "./user.service";
import { UserStatus, UserRole, VerificationStatus } from "@prisma/client";

export class UserController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        email,
        role,
        status,
        verification,
        dateFrom,
        dateTo,
        page,
        limit,
      } = req.query;
      const data = await UserService.listUsers({
        email: email as string | undefined,
        role: role as UserRole | undefined,
        status: status as UserStatus | undefined,
        verification: verification as VerificationStatus | undefined,
        dateFrom: dateFrom as string | undefined,
        dateTo: dateTo as string | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.json(successResponse(data, "Users fetched"));
    } catch (err) {
      res.json(next(err));
    }
  }

  static async activate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await UserService.setStatus(id, "ACTIVE");
      res.json(successResponse(updated, "User activated"));
    } catch (err) {
      res.json(next(err));
    }
  }

  static async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await UserService.setStatus(id, "INACTIVE");
      res.json(successResponse(updated, "User deactivated"));
    } catch (err) {
      res.json(next(err));
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body as { newPassword: string };
      if (!newPassword || newPassword.length < 8) {
        res.json(errorResponse("Password must be at least 8 characters", 400));
      }
      await UserService.resetPassword(id, newPassword);
      res.json(successResponse({ id }, "Password reset and sessions invalidated"));
    } catch (err) {
      res.json(next(err));
    }
  }
  
  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);
      if (!user) {
        return res.json(errorResponse("User not found", 404));
      }
      res.json(successResponse(user, "User fetched"));
    } catch (err) {
      res.json(next(err));
    }
  }

  static async forceLogout(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await UserService.forceLogout(id);
      res.json(successResponse({ id }, "All sessions invalidated"));
    } catch (err) {
      res.json(next(err));
    }
  }

  static async ensureReferralCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const code = await UserService.ensureReferralCode(id);
      res.json(successResponse(code, "Referral code ready"));
    } catch (err) {
      res.json(next(err));
    }
  }

  static async getReferrals(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const data = await UserService.getReferralsByUser(id, page, limit);
      res.json(successResponse(data, "Referred users fetched"));
    } catch (err) {
      res.json(next(err));
    }
  }

  static async referralStats(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await UserService.getReferralStats();
      res.json(successResponse(data, "Referral stats fetched"));
    } catch (err) {
      res.json(next(err));
    }
  }

  static async getAverageRating(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await UserService.getAverageRating(req.params.id);
      res.json(successResponse(data, "Average rating fetched"));
    } catch (err) {
      res.json(next(err));
    }
  }

  static async getReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const data = await UserService.getReviews(req.params.id, page, limit);
      res.json(successResponse(data, "User reviews fetched"));
    } catch (err) {
      res.json(next(err));
    }
  }

  static async getTotalReviews(req: Request, res: Response, next: NextFunction) {
    try{
      const data = await UserService.getTotalReviews(req.params.id);
      res.json(successResponse(data, "Total reviews fetched"));
    } catch (err) {
      res.json(next(err));
    }
  }

  static async postReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { companyId, rating, comment } = req.body as {
        companyId: string;
        rating: number;
        comment?: string;
      };
      
      const data = await UserService.postReview(
        req.params.id,
        companyId,
        rating,
        comment
      );
      res.json(successResponse(data, "Review posted"));
    } catch (err) {
      res.json(next(err));
    }
  }

}