import { Router } from "express";
import { authenticate } from "../../middlewares/authMiddleware";
import validate from "../../middlewares/validate";
import * as companyController from "./company.controller";
import { companyParamsSchema, createCompanySchema, getAllCompaniesSchema, updateCompanySchema } from "./company.validation";


const router = Router();

/**
 * @openapi
 * /company:
 *   get:
 *     summary: Get all companies
 *     description: Fetch companies with optional filters, pagination, and sorting.
 *     tags:
 *       - Company
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Free text search across company owner name and email (case-insensitive).
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, PENDING, REJECTED]
 *         description: Filter by user status.
 *       - in: query
 *         name: verification
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: Filter by verification status.
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by businessLocation (partial match).
 *       - in: query
 *         name: hasLogo
 *         schema:
 *           type: boolean
 *         description: Only include companies that have a non-empty companyLogo.
 *       - in: query
 *         name: hasVerificationDocs
 *         schema:
 *           type: boolean
 *         description: Only include companies with verificationDocuments (array length > 0).
 *       - in: query
 *         name: minJobs
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Minimum number of jobs company must have.
 *       - in: query
 *         name: maxJobs
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Maximum number of jobs company can have.
 *       - in: query
 *         name: jobStatus
 *         schema:
 *           type: string
 *         description: Include companies that have at least one job with this status.
 *       - in: query
 *         name: jobCategory
 *         schema:
 *           type: string
 *         description: Include companies that have at least one job in this category.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number (pagination).
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of results per page.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, jobsCount, name]
 *           default: createdAt
 *         description: Field to sort results by.
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort direction.
 *     responses:
 *       "200":
 *         description: List of companies with meta information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       companyLogo:
 *                         type: string
 *                         nullable: true
 *                       businessLocation:
 *                         type: string
 *                         nullable: true
 *                       verificationDocuments:
 *                         type: array
 *                         items:
 *                           type: string
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           fullName:
 *                             type: string
 *                           email:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [ACTIVE, INACTIVE, PENDING, REJECTED]
 *                           verification:
 *                             type: string
 *                             enum: [PENDING, APPROVED, REJECTED]
 *                       jobs:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             title:
 *                               type: string
 *                             status:
 *                               type: string
 *                             categories:
 *                               type: array
 *                               items:
 *                                 type: string
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     returned:
 *                       type: integer
 *       "400":
 *         description: Invalid query params or bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: object
 */
router.get("/", validate(getAllCompaniesSchema, "query"), companyController.getAllCompanies);

/**
 * @openapi
 * /company/{id}:
 *   get:
 *     tags:
 *       - Company
 *     summary: Get company details by ID (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Company not found
 */
router.get("/:id", authenticate, validate(companyParamsSchema, "params"), companyController.getCompanyById);

/**
 * @openapi
 * /company/register:
 *   post:
 *     tags:
 *       - Company
 *     summary: Register a new company
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               location:
 *                 type: string
 *               companyLogo:
 *                 type: string
 *               businessLocation:
 *                 type: string
 *               verificationDocuments:
 *                 type: array
 *                 items:
 *                   type: string
 *             required:
 *               - phone
 *               - password
 *     responses:
 *       201:
 *         description: Company registered successfully
 *       400:
 *         description: Bad request (e.g. validation errors, user already exists)
 */
router.post("/register", validate(createCompanySchema, "body"), companyController.createCompany);

/**
 * @openapi
 * /company/{id}/approve:
 *   patch:
 *     tags:
 *       - Company
 *     summary: Approve a company (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID to approve
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company approved and user verification set to APPROVED
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Company not found
 */
router.patch("/:id/approve", authenticate, validate(companyParamsSchema, "params"), companyController.approveCompany);

/**
 * @openapi
 * /company/{id}/reject:
 *   patch:
 *     tags:
 *       - Company
 *     summary: Reject a company (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID to reject
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company rejected and user verification set to REJECTED
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Company not found
 */
router.patch("/:id/reject", authenticate, validate(companyParamsSchema, "params"), companyController.rejectCompany);

/**
 * @openapi
 * /company/{id}/details:
 *   patch:
 *     tags:
 *       - Company
 *     summary: Update company details (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID to update
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company details updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Company not found
 */
router.patch("/:id/details", authenticate, validate(companyParamsSchema, "params"), validate(updateCompanySchema, "body"), companyController.updateDetail);


export default router;
