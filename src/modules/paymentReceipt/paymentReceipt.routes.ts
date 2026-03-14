// src/modules/paymentReceipt/paymentReceipt.routes.ts
import { Router } from "express";
import * as controller from "./paymentReceipt.controller";
import { createReceiptSchema, adminRejectSchema, idSchema, userIdSchema, paginationQuerySchema, adminListReceiptsQuerySchema } from "./paymentReceipt.validation";
import { authorize } from "../../middlewares/authorize";
import { authenticate } from "../../middlewares/authMiddleware";
import validate from "../../middlewares/validate";


const router = Router();
/**
 * @openapi
 * tags:
 *   - name: PaymentReceipt
 *     description: Payment receipt management (users and admin)
 */

/**
 * @openapi
 * /receipts/{userId}:
 *   post:
 *     tags: [PaymentReceipt]
 *     summary: Create a payment receipt (user)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentReceiptCreate'
 *     responses:
 *       201:
 *         description: Created receipt
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentReceipt'
 */
router.post("/:userId", validate(userIdSchema, "params"), validate(createReceiptSchema,"body"), controller.createReceipt);

// User routes
router.use(authenticate); // all routes below require authentication

/**
 * @openapi
 * /receipts:
 *   get:
 *     tags: [PaymentReceipt]
 *     summary: List receipts for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of receipts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PaymentReceipt'
 */
router.get("/", validate(paginationQuerySchema, "query"), controller.listUserReceipts);

/**
 * @openapi
 * /receipts/{id}:
 *   get:
 *     tags: [PaymentReceipt]
 *     summary: Get a single receipt (user or admin)
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
 *         description: Receipt object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentReceipt'
 *       404:
 *         description: Receipt not found
 */
router.get("/:id", validate(idSchema, "params"), controller.getUserReceipt);

// Admin routes
// router.use(authorize("ADMIN"))// all routes below require admin

/**
 * @openapi
 * /receipts/admin/all:
 *   get:
 *     tags: [PaymentReceipt]
 *     summary: Admin - list all receipts (filter by status)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Array of receipts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PaymentReceipt'
 */
router.get("/admin/all", validate(adminListReceiptsQuerySchema, "query"), controller.adminListReceipts);

/**
 * @openapi
 * /receipts/admin/{id}:
 *   get:
 *     tags: [PaymentReceipt]
 *     summary: Admin - get a receipt by id
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
 *         description: Receipt object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentReceipt'
 *       404:
 *         description: Receipt not found
 */
router.get("/admin/:id", validate(idSchema, "params"), controller.adminGetReceipt);

/**
 * @openapi
 * /receipts/admin/{id}/approve:
 *   post:
 *     tags: [PaymentReceipt]
 *     summary: Admin - approve a receipt (creates transaction and links it)
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
 *         description: Updated receipt
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentReceipt'
 */
router.post("/admin/:id/approve",  validate(idSchema, "params"), controller.adminApproveReceipt);

/**
 * @openapi
 * /receipts/admin/{id}/reject:
 *   post:
 *     tags: [PaymentReceipt]
 *     summary: Admin - reject a receipt with optional reason
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentReceiptAdminReject'
 *     responses:
 *       200:
 *         description: Updated receipt
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentReceipt'
 */
router.post("/admin/:id/reject", validate(idSchema, "params"), validate(adminRejectSchema,"body"), controller.adminRejectReceipt);

export default router;
