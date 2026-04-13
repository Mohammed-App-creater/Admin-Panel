import { Router } from "express";
import { uploadProfilePicture, uploadNationalId, uploadCompanyFileController, uploadWorkerFileController, uploadPaymentReceipt, uploadAndUpdateMyProfilePicture } from "./storage.controller";
import { upload } from "../../middlewares/upload";
import validate from "../../middlewares/validate";
import { authenticate } from "../../middlewares/authMiddleware";
import {
    uploadFileValidation,
    uploadProfilePictureValidation,
} from "./storage.validation";

const router = Router();


/**
 * @openapi
 * components:
 *   schemas:
 *     FileResponse:
 *       type: object
 *       properties:
 *         url:
 *           type: string
 *           description: URL to the uploaded file
 */

/**
 * @openapi
 * /storage/worker/documents:
 *   post:
 *     tags:
 *       - Storage
 *     summary: Upload a worker document (authenticated)
 *     description: Uploads a file for a worker (resume, verification doc). Request must be multipart/form-data with field name `file`.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileResponse'
 *       400:
 *         description: No file uploaded or validation error
 *       500:
 *         description: Server error
 */

router.post("/worker/documents", upload.single("file"), validate(uploadFileValidation, "file"), uploadWorkerFileController);

/**
 * @openapi
 * /storage/company/documents:
 *   post:
 *     tags:
 *       - Storage
 *     summary: Upload a company document (authenticated)
 *     description: Uploads a file for a company (verification doc). Request must be multipart/form-data with field name `file`.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileResponse'
 *       400:
 *         description: No file uploaded or validation error
 *       500:
 *         description: Server error
 */

router.post("/company/documents", upload.single("file"), validate(uploadFileValidation, "file"), uploadCompanyFileController);

/**
 * @openapi
 * /storage/profile-picture:
 *   post:
 *     tags:
 *       - Storage
 *     summary: Upload a profile picture (authenticated)
 *     description: Uploads a profile picture. Request must be multipart/form-data with field name `file`.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Profile picture uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileResponse'
 *       400:
 *         description: No file uploaded or validation error
 *       500:
 *         description: Server error
 */

router.post("/profile-picture", upload.single("file"), validate(uploadProfilePictureValidation, "file"), uploadProfilePicture);

/**
 * @openapi
 * /storage/profile-picture/update:
 *   post:
 *     tags:
 *       - Storage
 *     summary: Upload and update my profile picture (authenticated)
 *     description: Uploads a profile image to cloud storage and updates the authenticated user's profile field. WORKER updates `profilePhoto`; COMPANY updates `companyLogo`.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture uploaded and profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 url:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: No file uploaded or validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden for non-WORKER/COMPANY roles
 *       404:
 *         description: Worker/Company profile not found
 *       500:
 *         description: Server error
 */
router.post(
  "/profile-picture/update",
  authenticate,
  upload.single("file"),
  validate(uploadProfilePictureValidation, "file"),
  uploadAndUpdateMyProfilePicture
);

/**
 * @openapi
 * /storage/worker/national-id:
 *   post:
 *     tags:
 *       - Storage
 *     summary: Upload worker national ID (authenticated)
 *     description: Uploads a worker national ID image. Request must be multipart/form-data with field name `file`.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: National ID uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileResponse'
 *       400:
 *         description: No file uploaded or validation error
 *       500:
 *         description: Server error
 */

router.post("/worker/national-id", upload.single("file"), validate(uploadProfilePictureValidation, "file"), uploadNationalId);

/**
 * @openapi
 * /storage/payment-receipt:
 *   post:
 *     tags:
 *       - Storage
 *     summary: Upload a payment receipt (authenticated)
 *     description: Uploads a payment receipt. Request must be multipart/form-data with field name `file`.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Profile picture uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileResponse'
 *       400:
 *         description: No file uploaded or validation error
 *       500:
 *         description: Server error
 */

router.post("/payment-receipt", upload.single("file"), validate(uploadProfilePictureValidation, "file"), uploadPaymentReceipt);

export default router;
