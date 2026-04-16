import { Router } from "express";
import { authenticate } from "../../middlewares/authMiddleware";
import * as jobController from "./job.controller";
import validate from "../../middlewares/validate";
import { applicationIdParamSchema, applyToJobSchema, assignWorkerParamsSchema, assignmentsFiltersSchema, companyIdParamForJobsSchema, companyIdParamSchema, createJobSchema, jobFiltersSchema, JobIdParamSchema, jobIdParamSchema, listApplicationsSchema, paginationQuerySchema, updateJobSchema, workerIdParamSchema } from "./job.validation";
import { authorize } from "../../middlewares/authorize";

const router = Router();

/**
 * @openapi
 * /jobs/assignments:
 *   get:
 *     tags:
 *       - Job-Assignments
 *     summary: Get all job assignments
 *     description: Retrieve a list of all job assignments.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: workerId
 *         schema:
 *           type: string
 *         description: Filter by Worker ID (uuid)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by Job Status
 *       - in: query
 *         name: adminApproved
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: Filter by Admin Approval Status
 *       - in: query
 *         name: acceptedAssignment
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: Filter by Accepted Assignment Status
 *     responses:
 *       200:
 *         description: A list of job assignments
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/assignments", authenticate, validate(assignmentsFiltersSchema, "query"), jobController.getAllAssignedJobs);

/**
 * @openapi
 * /api/jobs/applications:
 *   get:
 *     summary: List worker job applications with powerful search & filter
 *     tags:
 *       - Job
 *     description: |
 *       Returns paginated worker job applications with search, filters and pagination.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search across job title, description and company name.
 *       - in: query
 *         name: skills
 *         schema:
 *           type: string
 *         description: Comma-separated list of required skills.
 *       - in: query
 *         name: jobLocation
 *         schema:
 *           type: string
 *       - in: query
 *         name: jobType
 *         schema:
 *           type: string
 *       - in: query
 *         name: jobStatus
 *         schema:
 *           type: string
 *       - in: query
 *         name: applicationStatus
 *         schema:
 *           type: string
 *       - in: query
 *         name: adminApproved
 *         schema:
 *           type: string
 *       - in: query
 *         name: acceptedAssignment
 *         schema:
 *           type: string
 *       - in: query
 *         name: appliedFrom
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: appliedTo
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: payRateMin
 *         schema:
 *           type: number
 *       - in: query
 *         name: payRateMax
 *         schema:
 *           type: number
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [appliedAt, payRate, startDate, createdAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *     responses:
 *       '200':
 *         description: Successful response
 *       '400':
 *         description: Validation error
 *       '500':
 *         description: Internal server error
 */
router.get("/applications", validate(listApplicationsSchema, "query"), authenticate, jobController.listApplications);

/**
 * @openapi
 * /jobs/applications/job/{jobId}:
 *   get:
 *     summary: Get applications for a specific job
 *     tags:
 *       - Job
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID (uuid)
 *     responses:
 *       200:
 *         description: A list of applications for the job
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */
router.get("/applications/job/:jobId", validate(JobIdParamSchema, "params"), validate(paginationQuerySchema, "query"), authenticate, jobController.getApplicationsByJob);


/**
 * @openapi
 * /jobs/{companyId}:
 *   post:
 *     tags:
 *       - Job
 *     summary: Create a new job (authenticated)
 *     description: Creates a job under the given companyId. Validated by `createJobSchema`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID (uuid)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - requiredSkills
 *               - payRate
 *               - jobType
 *               - startDate
 *               - duration
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               requiredSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *               jobLocation:
 *                 type: string
 *               payRate:
 *                 type: number
 *               jobType:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               duration:
 *                 type: string
 *                 format: date-time
 *               numbersNeedWorker:
 *                 type: integer
 *               additionalInfo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Job created
 *       400:
 *         description: Validation error
 */
router.post("/:companyId", authenticate, validate(companyIdParamSchema, "params"), validate(createJobSchema, "body"), jobController.createJob);

/**
 * @openapi
 * /jobs/{id}/close:
 *   patch:
 *     tags:
 *       - Job
 *     summary: Close a job (company owner or admin)
 *     description: Sets the job status to CLOSED without deleting the record. Company users may only close jobs belonging to their company.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID (uuid)
 *     responses:
 *       200:
 *         description: Job closed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — not the job owner
 *       404:
 *         description: Job not found
 */
router.patch("/:id/close", authenticate, validate(jobIdParamSchema, "params"), jobController.closeJob);

/**
 * @openapi
 * /jobs/{id}:
 *   patch:
 *     tags:
 *       - Job
 *     summary: Update a job (authenticated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               requiredSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *               jobLocation:
 *                 type: string
 *               payRate:
 *                 type: number
 *               jobType:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               duration:
 *                 type: string
 *                 format: date-time
 *               numbersNeedWorker:
 *                 type: integer
 *               additionalInfo:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [OPEN, CLOSED, PENDING, ACCEPTED, REJECTED]
 *     responses:
 *       200:
 *         description: Job updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Job not found
 */
router.patch("/:id", authenticate, validate(jobIdParamSchema, "params"), validate(updateJobSchema, "body"), jobController.updateJob);

/**
 * @openapi
 * /jobs/{id}:
 *   delete:
 *     tags:
 *       - Job
 *     summary: Delete a job (authenticated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID to delete
 *     responses:
 *       200:
 *         description: Job deleted
 *       404:
 *         description: Job not found
 */
router.delete("/:id", authenticate, validate(jobIdParamSchema, "params"), jobController.deleteJob);

/**
 * @openapi
 * /jobs:
 *   get:
 *     tags:
 *       - Job
 *     summary: Get all jobs
 *     description: Returns jobs filtered by query params. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, CLOSED, PENDING, ACCEPTED, REJECTED]
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: Company ID (uuid)
 *       - in: query
 *         name: jobLocation
 *         schema:
 *           type: string
 *       - in: query
 *         name: requiredSkill
 *         schema:
 *           type: string
 *       - in: query
 *         name: jobType
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: duration
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *     responses:
 *       200:
 *         description: List of jobs
 */

router.get("/", authenticate, validate(jobFiltersSchema, "query"), jobController.getJobs);

/**
 * @openapi
 * /jobs/company/me:
 *   get:
 *     tags:
 *       - Job
 *     summary: Get my company jobs (authenticated company)
 *     description: Returns jobs that belong to the authenticated company user only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: jobLocation
 *         schema:
 *           type: string
 *       - in: query
 *         name: requiredSkill
 *         schema:
 *           type: string
 *       - in: query
 *         name: jobType
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of authenticated company's jobs
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (company role required)
 */
router.get("/company/me", authenticate, authorize("COMPANY"), validate(jobFiltersSchema, "query"), jobController.getMyCompanyJobs);

/**
 * @openapi
 * /jobs/{id}:
 *   get:
 *     tags:
 *       - Job
 *     summary: Get job details by ID (authenticated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job details
 *       404:
 *         description: Job not found
 */
router.get("/:id", authenticate, validate(jobIdParamSchema, "params"), jobController.getJobById);

/**
 * @openapi
 * /jobs/applications/{applicationId}/accept:
 *   patch:
 *     tags:
 *       - Job
 *     summary: Accept a worker application (authenticated)
 *     description: Accepts a worker application by applicationId. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID (uuid)
 *     responses:
 *       200:
 *         description: Application accepted
 *       404:
 *         description: Application not found
 */
router.patch("/applications/:applicationId/accept", authenticate, jobController.acceptApplication);


/**
 * @openapi
 * /jobs/applications/{applicationId}/reject:
 *   patch:
 *     tags:
 *       - Job
 *     summary: Reject a worker application (authenticated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID to reject
 *     responses:
 *       200:
 *         description: Application rejected
 *       404:
 *         description: Application not found
 */

router.patch("/applications/:applicationId/reject", validate(applicationIdParamSchema, "params"), authenticate, jobController.rejectApplication);

router.post("/job/:job/worker/:workerId/apply", validate(applyToJobSchema, "params"), authenticate, jobController.applyToJob)

/**
 * @openapi
 * /jobs/{jobId}/assign/{workerId}:
 *   post:
 *     tags:
 *       - Job
 *     summary: Invite / assign a worker to a job (company or admin)
 *     description: |
 *       Creates a company invitation (`status` ASSIGNED, `acceptedAssignment` PENDING) visible in `GET /jobs/invitations/me`.
 *       Only the job's owning company or an admin may call this. Duplicate (same job + worker) returns 400.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID (uuid)
 *       - in: path
 *         name: workerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Worker ID (uuid)
 *     responses:
 *       200:
 *         description: Worker assigned to job
 *       400:
 *         description: Worker already invited to this job
 *       403:
 *         description: Only the job owner company or admin may invite
 *       404:
 *         description: Job or worker not found
 */
router.post(
  "/:jobId/assign/:workerId",
  validate(assignWorkerParamsSchema, "params"),
  authenticate,
  authorize("COMPANY", "ADMIN"),
  jobController.assignWorkerToJob
);

/**
 * /jobs/admin/{applicationId}/approve:
 *   patch:
 *     tags:
 *       - Job
 *     summary: Approve a worker application (admin)
 *     description: Admin endpoint to approve a work contract; requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID (uuid)
 *     responses:
 *       200:
 *         description: Application approved
 *       404:
 *         description: Application not found
 */
router.patch("/admin/:applicationId/approve", authenticate, validate(applicationIdParamSchema, "params"), jobController.approveWorkContract);

/**
 * /jobs/admin/{applicationId}/reject:
 *   patch:
 *     tags:
 *       - Job
 *     summary: Reject a worker application (admin)
 *     description: Admin endpoint to reject a work contract; requires authentication and ADMIN authorization.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID (uuid)
 *     responses:
 *       200:
 *         description: Application rejected
 *       404:
 *         description: Application not found
 */
router.patch("/admin/:applicationId/reject", authenticate, authorize("ADMIN"), validate(applicationIdParamSchema, "params"), jobController.rejectWorkContract);

/**
 * @openapi
 * /jobs/assignments/job/{jobId}:
 *   get:
 *     tags:
 *       - Job-Assignments
 *     summary: Get all job assignments for a specific job
 *     description: Retrieve a list of all job assignments for a specific job.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID (uuid)
 *     responses:
 *       200:
 *         description: A list of job assignments for the specified job
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */
router.get("/assignments/job/:jobId", authenticate, validate(jobIdParamSchema, "params"), validate(paginationQuerySchema, "query"), jobController.getAllJobAssignments);

/**
 * @openapi
 * /jobs/assigned/company/{companyId}:
 *   get:
 *     tags:
 *       - Job-Assignments
 *     summary: Get all assigned jobs for a specific company
 *     description: Retrieve a list of all jobs assigned to workers for a specific company.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID (uuid)
 *     responses:
 *       200:
 *         description: A list of jobs assigned to the specified company
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Company not found
 *       500:
 *         description: Internal server error
 */
router.get("/assigned/company/:companyId", authenticate, validate(companyIdParamForJobsSchema, "params"), validate(paginationQuerySchema, "query"), jobController.getAllCompanyAssignedJobs);

/**
 * @openapi
 * /jobs/assigned/worker/{workerId}:
 *   get:
 *     tags:
 *       - Job-Assignments
 *     summary: Get all assigned jobs for a specific worker
 *     description: Retrieve a list of all jobs assigned to a specific worker.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Worker ID (uuid)
 *     responses:
 *       200:
 *         description: A list of jobs assigned to the specified worker
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Worker not found
 *       500:
 *         description: Internal server error
 */
router.get("/assigned/worker/:workerId", authenticate, validate(workerIdParamSchema, "params"), validate(paginationQuerySchema, "query"), jobController.getAllWorkerAssignedJobs);

/**
 * @openapi
 * /jobs/assignments/me:
 *   get:
 *     tags:
 *       - Job-Assignments
 *     summary: Get my job assignments (authenticated worker)
 *     description: Retrieve a list of job assignments for the authenticated worker.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, CLOSED, PENDING, ACCEPTED, REJECTED]
 *         description: Filter by Job Status
 *       - in: query
 *         name: companyStatus
 *         schema:
 *           type: string
 *           enum: [OPEN, CLOSED, PENDING, ACCEPTED, REJECTED]
 *         description: Filter by Company Status
 *       - in: query
 *         name: workStatus
 *         schema:
 *           type: string
 *           enum: [OPEN, CLOSED, PENDING, ACCEPTED, REJECTED]
 *         description: Filter by Work Status
 *       - in: query
 *         name: adminStatus
 *         schema:
 *           type: string
 *           enum: [OPEN, CLOSED, PENDING, ACCEPTED, REJECTED]
 *         description: Filter by Admin Status
 *     responses:
 *       200:
 *         description: A list of job assignments for the authenticated worker.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal server error.
 */
router.get("/assignments/me", authenticate, validate(paginationQuerySchema, "query"), jobController.getMyJobAssignments);

/**
 * @openapi
 * /jobs/invitations/me:
 *   get:
 *     tags:
 *       - Job-Assignments
 *     summary: Get my job invitations (authenticated worker)
 *     description: Returns jobs assigned to the worker that are awaiting accept/reject. After accepting or rejecting, jobs are removed from this list.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *     responses:
 *       200:
 *         description: List of job invitations
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/invitations/me", authenticate, validate(paginationQuerySchema, "query"), jobController.getMyJobInvitations);

/**
 * @openapi
 * /jobs/approved/me:
 *   get:
 *     tags:
 *       - Job-Assignments
 *     summary: Get my approved jobs (authenticated worker)
 *     description: Returns jobs the worker has accepted, admin-approved, and still active (not closed).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *     responses:
 *       200:
 *         description: List of approved/active jobs
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/approved/me", authenticate, validate(paginationQuerySchema, "query"), jobController.getMyApprovedJobs);

/**
 * @openapi
 * /jobs/history/me:
 *   get:
 *     tags:
 *       - Job-Assignments
 *     summary: Get my job history (authenticated worker)
 *     description: Retrieve a list of job history entries for the authenticated worker.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of job history entries for the authenticated worker
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/history/me", authenticate, validate(paginationQuerySchema, "query"), jobController.getMyJobHistory);


export default router;

