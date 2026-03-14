import express from "express";
import * as controller from "./subscription.controller";
import validate from "../../middlewares/validate";
import { authenticate } from "../../middlewares/authMiddleware";
import { updateSubscriptionSchema, subscriptionIdSchema, listSubscriptionsQuerySchema, mySubscriptionsQuerySchema } from "./subscription.validation";


/**
 * @swagger
 * tags:
 *   name: Subscription
 *   description: Subscription management
 */
const router = express.Router();


/**
 * @swagger
 * /subscription:
 *   get:
 *     summary: Get all subscriptions
 *     tags: [Subscription]
 *     responses:
 *       200:
 *         description: List of subscriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Subscription'
 */
router.get("/", validate(listSubscriptionsQuerySchema, "query"), controller.listSubscriptions);

/**
 * @swagger
 * /subscription/me:
 *   get:
 *     summary: Get my subscriptions
 *     tags: [Subscription]
 *     responses:
 *       200:
 *         description: List of my subscriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Subscription'
 */
router.get("/me", authenticate, validate(mySubscriptionsQuerySchema, "query"), controller.mySubscriptions);

/**
 * @swagger
 * /subscription/me/active:
 *   get:
 *     summary: Get my active subscription
 *     tags: [Subscription]
 *     responses:
 *       200:
 *         description: My active subscription
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subscription'
 */
router.get("/me/active", authenticate, controller.getMyActiveSubscription);

/**
 * @swagger
 * /subscription/{id}:
 *   get:
 *     summary: Get a subscription by ID
 *     tags: [Subscription]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Subscription ID
 *     responses:
 *       200:
 *         description: Subscription data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subscription'
 *       404:
 *         description: Subscription not found
 */
router.get("/:id", validate(subscriptionIdSchema), controller.getSubscription);

/**
 * @swagger
 * /subscription/{id}:
 *   patch:
 *     summary: Update a subscription
 *     tags: [Subscription]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Subscription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Subscription'
 *     responses:
 *       200:
 *         description: Subscription updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Subscription not found
 */
router.patch("/:id", validate(subscriptionIdSchema, "params"), validate(updateSubscriptionSchema, "body"), controller.updateSubscription);

/**
 * @swagger
 * /subscription/{id}/cancel:
 *   post:
 *     summary: Cancel a subscription
 *     tags: [Subscription]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Subscription ID
 *     responses:
 *       200:
 *         description: Subscription canceled
 *       404:
 *         description: Subscription not found
 */
router.post("/:id/cancel", validate(subscriptionIdSchema, "params"), controller.cancelSubscription);

/**
 * @swagger
 * /subscription/{id}:
 *   delete:
 *     summary: Delete a subscription
 *     tags: [Subscription]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Subscription ID
 *     responses:
 *       204:
 *         description: Subscription deleted
 *       404:
 *         description: Subscription not found
 */
router.delete("/:id", validate(subscriptionIdSchema, "params"), controller.deleteSubscription);


export default router;
