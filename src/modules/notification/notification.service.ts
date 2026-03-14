// services/notificationService.ts
import { application } from "express";
import prisma from "../../config/prisma";
import { sseManager } from "../../infrastructure/notifications/sseManager";
import { NotificationType } from "@prisma/client"


export class NotificationService {
  static async notifyUser(userId: string, title: string, message: string, type: NotificationType, jobId?: string, applicationId?: string, workerId?: string, companyId?: string) {
    const notification = await prisma.notification.create({
      data: { userId, jobId: jobId || "", title, message, type, applicationId, workerId, companyId },
    });
    sseManager.sendToUser(userId, "notification", notification);
    return notification;
  }

  static async notifyUsers(
    userIds: string[],
    title: string,
    message: string,
    type: NotificationType,
    jobId?: string,
  ) {
    const notifications = await prisma.$transaction(
      userIds.map((id) =>
        prisma.notification.create({
          data: { userId: id, jobId: jobId || "", title, message, type },
        })
      )
    );

    for (const n of notifications) {
      sseManager.sendToUser(n.userId, "notification", n);
    }

    return notifications;
  }

  static async broadcast(message: string, type: string) {
    const notification = { message, type, createdAt: new Date() };
    sseManager.broadcast("notification", notification);
  }

  // Fetch notifications helpers
  static async getNotificationsForUser() {
    return prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  static async getUserNotifications(userId: string, page = 1, limit = 20) {
    const take = Math.min(100, Math.max(1, limit ?? 20));
    const skip = (Math.max(1, page ?? 1) - 1) * take;
    const where = { userId };
    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
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
  }

  static async isRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId,
      },
      data: { isRead: true },
    });
    return notification;
  }
}

