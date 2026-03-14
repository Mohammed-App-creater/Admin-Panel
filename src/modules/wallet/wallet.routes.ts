import { Router } from "express";
import validate from "../../middlewares/validate"
import { authenticate } from "../../middlewares/authMiddleware";
import * as walletController from "./wallet.controller";
import * as schema from "./wallet.validation"

const router = Router();

/**
 * @openapi
 * /wallets:
 *   get:
 *     tags:
 *       - Wallet
 *     summary: Get all wallets (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of wallets with users and transactions
 *       401:
 *         description: Unauthorized
 */
router.get("/", authenticate, validate(schema.paginationQuerySchema, "query"), walletController.getAllWallets);

/**
 * @openapi
 * /wallets/{userId}:
 *   get:
 *     tags:
 *       - Wallet
 *     summary: Get wallet details by user ID (admin)
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID whose wallet to retrieve
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet object for the user
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Wallet not found
 */
router.get("/:userId", validate(schema.userIdSchema, "params"), authenticate, walletController.getWalletByUserId);

/**
 * @openapi
 * /wallets/{userId}/create:
 *   post:
 *     tags:
 *       - Wallet
 *     summary: Create a wallet for a user (admin)
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID for whom to create the wallet
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Wallet created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/:userId/create", validate(schema.userIdSchema, "params"), authenticate, walletController.createWallet);

/**
 * @openapi
 * /wallets/{userId}/adjust:
 *   patch:
 *     tags:
 *       - Wallet
 *     summary: Adjust a user's wallet balance (admin)
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID whose wallet balance will be adjusted
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - type
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 description: Transaction type (e.g. CREDIT, DEBIT)
 *     responses:
 *       200:
 *         description: Updated wallet with transactions
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.patch("/:userId/adjust", validate(schema.userIdSchema, "params"), authenticate, walletController.adjustWalletBalance);

/**
 * @openapi
 * /wallets/{walletId}/transactions:
 *   get:
 *     tags:
 *       - Wallet
 *     summary: Get transactions for a wallet (admin)
 *     parameters:
 *       - in: path
 *         name: walletId
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Optional transaction type filter (e.g. CREDIT, DEBIT)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of transactions for the wallet
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Wallet not found
 */
router.get("/:walletId/transactions", validate(schema.walletIdSchema, "params"), validate(schema.getTransactionsQuerySchema, "query"), authenticate, walletController.getTransactions);

/**
 * @openapi
 * /wallets/{transactionId}/transaction:
 *   get:
 *     tags:
 *       - Wallet
 *     summary: Get a single transaction by its ID (admin)
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transaction object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Transaction not found
 */
router.get("/:transactionId/transaction", validate(schema.transactionIdSchema, "params"), authenticate, walletController.getTransactionById);

/**
 * @openapi
 * /wallets/{userId}/user-transaction:
 *   get:
 *     tags:
 *       - Wallet
 *     summary: Get transactions for a user by user ID (admin)
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to fetch transactions for
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of transactions for the user
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User or transactions not found
 */
router.get("/:userId/user-transaction", validate(schema.userIdSchema, "params"), validate(schema.paginationQuerySchema, "query"), authenticate, walletController.getTransactionByUserId)

export default router;
