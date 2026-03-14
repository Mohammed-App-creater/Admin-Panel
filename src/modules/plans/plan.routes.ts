import { Router } from "express";
import * as controller from "./plan.controller";
import { createPlanSchema, updatePlanSchema, idSchema, listPlansQuerySchema } from "./plan.validation";
import { authorize } from "../../middlewares/authorize";
import { authenticate } from "../../middlewares/authMiddleware";
import validate from "../../middlewares/validate";

const router = Router();


/**
 * @openapi
 * tags:
 *   - name: Plan
 *     description: Plan management (admin only)
 */


/**
 * @openapi
 * /plans:
 *   get:
 *     tags: [Plan]
 *     summary: List plans
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
 *         description: Array of plans
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Plan'
 */
router.get("/", validate(listPlansQuerySchema, "query"), controller.listPlans);

// Admin-only CRUD for plans
// router.use(authorize("ADMIN"));
router.use(authenticate);

/**
 * @openapi
 * /plans:
 *   post:
 *     tags: [Plan]
 *     summary: Create a plan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlanCreate'
 *     responses:
 *       201:
 *         description: Plan created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Plan'
 */
router.post("/", validate(createPlanSchema, "body"), controller.createPlan);

/**
 * @openapi
 * /plans/{id}:
 *   get:
 *     tags: [Plan]
 *     summary: Get a plan by id
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
 *         description: Plan object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Plan'
 *       404:
 *         description: Plan not found
 */
router.get("/:id", validate(idSchema, "params"), controller.getPlan);

/**
 * @openapi
 * /plans/{id}:
 *   put:
 *     tags: [Plan]
 *     summary: Update a plan
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
 *             $ref: '#/components/schemas/PlanUpdate'
 *     responses:
 *       200:
 *         description: Updated plan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Plan'
 */
router.put("/:id", validate(updatePlanSchema, "body"), controller.updatePlan);

/**
 * @openapi
 * /plans/{id}:
 *   delete:
 *     tags: [Plan]
 *     summary: Delete a plan
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
 *         description: Plan deleted
 */
router.delete("/:id", validate(idSchema, "params"), controller.removePlan);

export default router;
