import { Router } from "express";
import { subscribeToNotifications, getUserNotifications, isRead } from "./notification.controller";
import { authenticate } from "../../middlewares/authMiddleware";
import validate from "../../middlewares/validate";
import { sseManager } from "../../infrastructure/notifications/sseManager";
import { NotificationIdSchema, getUserNotificationsQuerySchema } from "./notification.validation"



const router = Router();

/**
 * @openapi 
 * /notifications:
 *   get:
 *     summary: Get user notifications
 *     description: Fetches all notifications for the authenticated user.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: User notifications fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "notificationId"
 *                       message:
 *                         type: string
 *                         example: "You have a new message."
 *                       read:
 *                         type: boolean
 *                         example: false
 *                 error:
 *                   type: null
 *       '401':
 *         description: Unauthorized - missing or invalid authentication token
 */
router.get("/", authenticate, validate(getUserNotificationsQuerySchema, "query"), getUserNotifications);

/**
 * @openapi
 * /notifications/{notificationId}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     description: Marks a specific notification as read for the authenticated user.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         description: The ID of the notification to mark as read.
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Notification marked as read successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "notificationId"
 *                     read:
 *                       type: boolean
 *                       example: true
 *                 error:
 *                   type: null
 *       '401':
 *         description: Unauthorized - missing or invalid authentication token
 *       '404':
 *         description: Not Found - notification does not exist
 */

router.patch("/:notificationId/read", validate(NotificationIdSchema, "params"), authenticate, isRead);

/**
 * @openapi
 * /notifications/stream:
 *   get:
 *     summary: Subscribe to server-sent events stream for notifications
 *     description: Opens a Server-Sent Events (SSE) stream that sends notification events to the authenticated user.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Stream opened successfully. The response is an event stream (text/event-stream).
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               example: "data: { \"type\": \"notification\", \"payload\": {...} }\n\n"
 *       '401':
 *         description: Unauthorized - missing or invalid authentication token
 */
router.get("/stream", authenticate, subscribeToNotifications);


// Debug endpoint to test SSE
router.get("/debug/ping", (req, res) => {
  sseManager.broadcast("notification", { message: "Hello from server!" });
  res.json({ ok: true });
});

export default router;
