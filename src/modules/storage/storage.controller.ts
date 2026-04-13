import { Request, Response } from "express";
import { uploadFile, profilePicture, paymentReceipt, updateProfilePictureForUser } from "./storage.service";
import { AuthRequest } from "../../middlewares/authMiddleware";

export const uploadWorkerFileController = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded " });

    const fileKey = `worker/documents/${Date.now()}-${req.file.originalname}`;
    const url = await uploadFile(fileKey, req.file.buffer, req.file.mimetype);

    res.status(201).json({ url });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const uploadCompanyFileController = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded " });

    const fileKey = `company/documents/${Date.now()}-${req.file.originalname}`;
    const url = await uploadFile(fileKey, req.file.buffer, req.file.mimetype);

    res.status(201).json({ url });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const uploadProfilePicture = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const fileKey = `profile-pictures/${Date.now()}-${req.file.originalname}`;
    const url = await profilePicture(fileKey, req.file.buffer, req.file.mimetype);

    res.status(201).json({ url });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadNationalId = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const fileKey = `worker/national-ids/${Date.now()}-${req.file.originalname}`;
    const url = await profilePicture(fileKey, req.file.buffer, req.file.mimetype);

    res.status(201).json({ url });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadPaymentReceipt = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const fileKey = `payment-receipts/${Date.now()}-${req.file.originalname}`;
    const url = await paymentReceipt(fileKey, req.file.buffer, req.file.mimetype);

    res.status(201).json({ url });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadAndUpdateMyProfilePicture = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req?.user?.id as string | undefined;
    const userRole = req?.user?.role as string | undefined;

    if (!userId || !userRole) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileKey = `profile-pictures/${Date.now()}-${req.file.originalname}`;
    const url = await profilePicture(fileKey, req.file.buffer, req.file.mimetype);

    const updated = await updateProfilePictureForUser(userId, userRole, url);

    res.status(200).json({
      message: "Profile picture updated successfully",
      url,
      data: updated,
    });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return res.status(status).json({ message: error?.message ?? "Failed to update profile picture" });
  }
};


