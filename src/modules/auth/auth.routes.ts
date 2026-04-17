import { Router } from "express";
import * as authController from "./auth.controller";
import validate from "../../middlewares/validate";
import * as validateSchema from "./auth.validation";
import { authenticate } from "../../middlewares/authMiddleware";

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               location:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: User registered successfully
 *       400:
 *         description: Bad request / validation error
 */
router.post("/register", validate(validateSchema.authValidationRegisterSchema, "body"), authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login a user and return a JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - password
 *             properties:
 *               phone:
 *                 type: string
 *                 format: phone
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful — returns token, user, and (worker/company)
 *       400:
 *         description: Invalid credentials or account not approved
 */
router.post("/login", validate(validateSchema.authValidationLoginSchema, "body"), authController.login);

/**
 * @openapi
 * /auth/activate/{userId}:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Activate a user's account (admin only)
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user to approve
 *     responses:
 *       200:
 *         description: User approved successfully
 *       400:
 *         description: Bad request or user not found
 *       403:
 *         description: Forbidden — requires admin privileges
 */
router.post("/activate/:userId", validate(validateSchema.authValidationApproveUserSchema, "params"), authController.activateUser);

/**
 * @openapi
 * /auth/deactivate/{userId}:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Deactivate a user's account (admin only)
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user to reject
 *     responses:
 *       200:
 *         description: User rejected successfully
 *       400:
 *         description: Bad request or user not found
 *       403:
 *         description: Forbidden — requires admin privileges
 */
router.post("/deactivate/:userId", validate(validateSchema.authValidationApproveUserSchema, "params"), authController.deactivateUser);

/**
 * @openapi
 * /auth/approve/{userId}:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Approve a user's verification (admin only)
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user to approve
 *     responses:
 *       200:
 *         description: User approved successfully
 *       400:
 *         description: Bad request or user not found
 *       403:
 *         description: Forbidden — requires admin privileges
 */
router.post("/approve/:userId", validate(validateSchema.authValidationApproveUserSchema, "params"), authController.approveUser);

/**
 * @openapi
 * /auth/reject/{userId}:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Reject a user's verification (admin only)
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user to reject
 *     responses:
 *       200:
 *         description: User rejected successfully
 *       400:
 *         description: Bad request or user not found
 *       403:
 *         description: Forbidden — requires admin privileges
 */
router.post("/reject/:userId", validate(validateSchema.authValidationApproveUserSchema, "params"), authController.rejectUser);

/**
 * @openapi
 * /auth/request-password-reset:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Request a password reset code to be sent via email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset code sent to email
 *       400:
 *         description: Bad request or user not found
 */
router.post("/request-password-reset", validate(validateSchema.authValidationRequestPasswordResetSchema, "body"), authController.requestPasswordReset);

/**
 * @openapi
 * /auth/verify-reset-code:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Verify password reset code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset code verified successfully
 *       400:
 *         description: Invalid code or email
 */
router.post("/verify-reset-code", validate(validateSchema.authValidationVerifyResetCodeSchema, "body"), authController.verifyResetCode);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Change user password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               phone:
 *                 type: string
 *                 format: phone
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Bad request or user not found
 */
router.post("/change-password", authenticate, validate(validateSchema.authValidationChangePasswordSchema, "body"), authController.changePassword);

export default router;
