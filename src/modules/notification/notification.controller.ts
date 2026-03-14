// controllers/notificationController.ts
import { Request, Response, NextFunction } from "express";
import { sseManager } from "../../infrastructure/notifications/sseManager";
import { NotificationService } from "./notification.service";
import { errorResponse, successResponse } from "../../utils/response";



export const subscribeToNotifications = (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).send("Unauthorized");
  }
  const userId = req.user.id;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  sseManager.addClient(userId, res);

  req.on("close", () => {
    sseManager.removeClient(userId);
  });
};


export const getUserNotifications = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.json(errorResponse("Unauthorized", 401));
    return;
  }
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const notifications = await NotificationService.getUserNotifications(req.user.id, page, limit);
    res.status(200).json(successResponse(notifications, "User notifications fetched successfully"));
  } catch (error: any) {
    next(error);
  }
};

export const isRead = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.json(errorResponse("Unauthorized", 401));
    return;
  }
  const { notificationId } = req.params;
  try {
    const notification = await NotificationService.isRead(notificationId, req.user.id);
    res.status(200).json(successResponse(notification, "Notification marked as read"));
  } catch (error: any) {
    next(error);
  }
}
