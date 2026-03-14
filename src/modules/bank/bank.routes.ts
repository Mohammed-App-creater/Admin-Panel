import { Router } from "express";
import * as controller from "./bank.controller";
import {  createBankSchema, idSchema, updateBankSchema, listBanksQuerySchema } from "./bank.validation";
import { authorize } from "../../middlewares/authorize";
import { authenticate } from "../../middlewares/authMiddleware";
import validate from "../../middlewares/validate";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Bank
 *     description: Bank management (admin only)
 */

/**
 * @openapi
 * /banks:
 *   get:
 *     tags: [Bank]
 *     summary: List banks
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Array of banks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Bank'
 */
router.get("/", validate(listBanksQuerySchema, "query"), controller.listBanks);

// All bank routes are admin-only
// router.use(authorize("ADMIN"));
router.use(authenticate);

/**
 * @openapi
 * /banks:
 *   post:
 *     tags: [Bank]
 *     summary: Create a bank
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BankCreate'
 *     responses:
 *       201:
 *         description: Bank created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bank'
 */
router.post("/", validate(createBankSchema, "body"), controller.createBank);

/**
 * @openapi
 * /banks/{id}:
 *   get:
 *     tags: [Bank]
 *     summary: Get a bank by id
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
 *         description: Bank object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bank'
 *       404:
 *         description: Bank not found
 */
router.get("/:id", validate(idSchema, "params"), controller.getBank);

/**
 * @openapi
 * /banks/{id}:
 *   patch:
 *     tags: [Bank]
 *     summary: Update a bank
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
 *             $ref: '#/components/schemas/BankUpdate'
 *     responses:
 *       200:
 *         description: Updated bank
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bank'
 */
router.patch("/:id", validate(updateBankSchema, "body"), controller.updateBank);

/**
 * @openapi
 * /banks/{id}:
 *   delete:
 *     tags: [Bank]
 *     summary: Delete a bank
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Bank deleted
 */
router.delete("/:id",  validate(idSchema, "params"), controller.deleteBank);

export default router;
