import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("❌ Error:", err);

  const status = typeof err?.status === "number" ? err.status : 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};
