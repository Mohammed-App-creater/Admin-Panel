// controllers/subscription.controller.ts
import { Request, Response } from "express";
import { successResponse, errorResponse } from "../../utils/response";
import * as subscriptionService from "./subscription.service";

export const getSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sub = await subscriptionService.getSubscriptionById(id);
    return res.json(sub);
  } catch (err: any) {
    return res.status(404).json({ message: err.message || "Not found" });
  }
};

export const listSubscriptions = async (req: Request, res: Response) => {
  try {
    const { userId, planId, status, page, limit } = req.query;
    const subs = await subscriptionService.listSubscriptions({
      userId: userId as string,
      planId: planId as string,
      status: status as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    return res.json(successResponse(subs, "Subscriptions retrieved successfully"));
  } catch (err: any) {
    return res.status(500).json(errorResponse(err.message || "Failed to list subscriptions"));
  }
};

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const created = await subscriptionService.createSubscription(payload);
    return res.status(201).json(successResponse(created, "Subscription created successfully"));
  } catch (err: any) {
    return res.status(400).json(errorResponse(err.message || "Failed to create subscription"));
  }
};

export const updateSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const updated = await subscriptionService.updateSubscription(id, payload);
    return res.json(successResponse(updated, "Subscription updated successfully"));
  } catch (err: any) {
    return res.status(400).json(errorResponse(err.message || "Failed to update subscription"));
  }
};

export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cancelled = await subscriptionService.cancelSubscription(id);
    return res.json(successResponse(cancelled, "Subscription canceled successfully"));
  } catch (err: any) {
    return res.status(400).json(errorResponse(err.message || "Failed to cancel subscription"));
  }
};

export const deleteSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await subscriptionService.deleteSubscription(id);
    return res.status(204).send();
  } catch (err: any) {
    return res.status(400).json(errorResponse(err.message || "Failed to delete subscription"));
  }
};

export const mySubscriptions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(errorResponse("Unauthorized"));
    }
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const subscriptions = await subscriptionService.getMySubscriptions(userId, page, limit);
    return res.json(successResponse(subscriptions, "My subscriptions retrieved successfully"));
  } catch (err: any) {
    return res.status(500).json(errorResponse(err.message || "Failed to retrieve subscriptions"));
  }
};

export const getMyActiveSubscription = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(errorResponse("Unauthorized"));
    }
    const subscription = await subscriptionService.getMyActiveSubscription(userId);
    return res.json(successResponse(subscription, "My active subscription retrieved successfully"));
  } catch (err: any) {
    return res.status(500).json(errorResponse(err.message || "Failed to retrieve active subscription"));
  }
};
