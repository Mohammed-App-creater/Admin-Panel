// src/modules/user/user.routes.ts
import { Router, Request, Response, NextFunction } from "express";
import { UserController } from "./user.controller";
import { authenticate } from "../../middlewares/authMiddleware";
import { authorize } from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import * as userValidation from "./user.validation";
import { paginationQuerySchema, postReviewSchema, resetPasswordSchema, userIdSchema } from "./user.validation";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Admin user management endpoints
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Simple role gate. Assumes authMiddleware sets req.user = { id, role, tokenVersion? }


router.use(authenticate);
// router.use(authorize("ADMIN"));

// GET /users?email=&role=&status=&verification=&dateFrom=&dateTo=&page=&limit=
/**
 * @swagger
 * /users:
 *   get:
 *     tags:
 *       - Users
 *     summary: List users with optional filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Filter by email (contains)
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by user role (e.g. ADMIN, WORKER, COMPANY, OWNER, BROKER)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by user status (e.g. ACTIVE, INACTIVE)
 *       - in: query
 *         name: verification
 *         schema:
 *           type: string
 *         description: Filter by verification status (e.g. PENDING, APPROVED, REJECTED)
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: ISO date start for createdAt
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: ISO date end for createdAt
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Users fetched
 */
router.get("/", UserController.list);

// GET /users/{id}
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User fetched
 *       404:
 *         description: User not found
 */
router.get("/:id", validate(userIdSchema, "params"), UserController.getUserById);

// PATCH /users/:id/activate
/**
 * @swagger
 * /users/{id}/activate:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Activate a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User activated
 */
router.patch("/:id/activate", validate(userIdSchema, "params"), UserController.activate);

// PATCH /users/:id/deactivate
/**
 * @swagger
 * /users/{id}/deactivate:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Deactivate a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deactivated
 */
router.patch("/:id/deactivate", validate(userIdSchema, "params"), UserController.deactivate);

// POST /users/:id/reset-password   { newPassword: string }
/**
 * @swagger
 * /users/{id}/reset-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Reset a user's password (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset and sessions invalidated
 *       400:
 *         description: Validation error (e.g. password too short)
 */
router.post("/:id/reset-password", validate(userIdSchema, "params"), validate(resetPasswordSchema, "body"), UserController.resetPassword);

// POST /users/:id/force-logout
/**
 * @swagger
 * /users/{id}/force-logout:
 *   post:
 *     tags:
 *       - Users
 *     summary: Invalidate all sessions for a user (force logout)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All sessions invalidated
 */
router.post("/:id/force-logout", validate(userIdSchema, "params"), UserController.forceLogout);

// POST /users/:id/referral-code/ensure
/**
 * @swagger
 * /users/{id}/referral-code/ensure:
 *   post:
 *     tags:
 *       - Users
 *     summary: Ensure a user has a referral code (create if missing)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Referral code returned
 */
router.post("/:id/referral-code/ensure", validate(userIdSchema, "params"), UserController.ensureReferralCode);

// GET /users/:id/referrals
/**
 * @swagger
 * /users/{id}/referrals:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get users referred by a given user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Referred users fetched
 */
router.get("/:id/referrals", validate(userIdSchema, "params"), validate(paginationQuerySchema, "query"), UserController.getReferrals);

// GET //users/referral/stats
/**
 * @swagger
 * /users/referral/stats/all:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get overall referral statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Referral stats fetched
 */
router.get("/referral/stats/all", UserController.referralStats);

/**
 * @swagger
 * /users/{id}/reviews:
 *   post:
 *     tags:
 *       - Users
 *     summary: Post a review for a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyId:
 *                 type: string
 *                 format: uuid
 *               rating:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 5
 *               comment:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Review posted
 */
router.post("/:id/reviews", validate(userIdSchema, "params"), validate(postReviewSchema, "body"), UserController.postReview);

/** 
 * @openapi
 * /users/{id}/reviews:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get reviews for a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User reviews fetched
 */
router.get("/:id/reviews", validate(userIdSchema, "params"), validate(paginationQuerySchema, "query"), UserController.getReviews);

/**
 * @openapi
 * /users/{id}/reviews/total:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get total reviews for a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User total reviews fetched
 */
router.get("/:id/reviews/total", validate(userIdSchema, "params"), UserController.getTotalReviews);

/**
 * @openapi
 * /users/{id}/reviews/average:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get average rating for a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User average rating fetched
 */
router.get("/:id/reviews/average", validate(userIdSchema, "params"), UserController.getAverageRating);

export default router;
