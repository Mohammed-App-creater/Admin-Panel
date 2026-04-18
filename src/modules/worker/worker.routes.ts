import { Router } from "express";
import { authenticate } from "../../middlewares/authMiddleware";
import * as workerController from "./worker.controller";
import validate from "../../middlewares/validate";
import { categoryIdSchema, roleIdSchema, specialityIdSchema, userIdSchema, workerDetailsSchema, createCategory, createRole, createSpeciality, createWorkType, workerRegistrationSchema, workerSchema, applicationsSchema, workerApplicationsQuerySchema, workerIdSchema, toggleAvailabilitySchema } from "./worker.validation";

const router = Router();

/**
 * @openapi
 * /workers/categories:
 *   get:
 *     tags:
 *       - Worker-Category
 *     summary: Get all worker categories
 *     description: Public endpoint that returns available worker categories
 *     responses:
 *       200:
 *         description: List of worker categories
 */
router.get("/categories", workerController.getCategoriesController);

/**
 * @openapi
 * /workers/roles:
 *   get:
 *     tags:
 *       - Worker-Category
 *     summary: Get all worker roles
 *     description: Public endpoint that returns all roles (includes category relation)
 *     responses:
 *       200:
 *         description: List of worker roles
 */
router.get("/roles", workerController.getRolesController);

/**
 * @openapi
 * /workers/specialities:
 *   get:
 *     tags:
 *       - Worker-Category
 *     summary: Get all worker specialities
 *     description: Public endpoint that returns all specialities (includes role relation)
 *     responses:
 *       200:
 *         description: List of worker specialities
 */
router.get("/specialities", workerController.getSpecialitiesController);

/**
 * @openapi
 * /workers/work-types:
 *   get:
 *     tags:
 *       - Worker-Category
 *     summary: Get all worker work types
 *     description: Public endpoint that returns all work types (includes speciality relation)
 *     responses:
 *       200:
 *         description: List of worker work types
 */
router.get("/work-types", workerController.getWorkTypesController);

/**
 * @openapi
 * /workers/roles/{categoryId}:
 *   get:
 *     tags:
 *       - Worker-Category
 *     summary: Get all worker roles by category
 *     description: Public endpoint, returns roles that belong to the given categoryId
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID (uuid)
 *     responses:
 *       200:
 *         description: List of worker roles by category
 */
router.get("/roles/:categoryId", validate(categoryIdSchema, "params"), workerController.getRolesByCategoryController);

/**
 * @openapi
 * /workers/specialities/{roleId}:
 *   get:
 *     tags:
 *       - Worker-Category
 *     summary: Get all worker specialities by role
 *     description: Public endpoint, returns specialities for the provided roleId
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID (uuid)
 *     responses:
 *       200:
 *         description: List of worker specialities by role
 */
router.get("/specialities/:roleId", validate(roleIdSchema, "params"), workerController.getSpecialitiesByRoleIdController);

/**
 * @openapi
 * /workers/work-types/{specialityId}:
 *   get:
 *     tags:
 *       - Worker-Category
 *     summary: Get all worker work types by speciality
 *     description: Public endpoint, returns work types for the provided specialityId
 *     parameters:
 *       - in: path
 *         name: specialityId
 *         required: true
 *         schema:
 *           type: string
 *         description: Speciality ID (uuid)
 *     responses:
 *       200:
 *         description: List of worker work types by speciality
 */
router.get("/work-types/:specialityId", validate(specialityIdSchema, "params"), workerController.getWorkTypesBySpecialityIdController);




/**
 * @openapi
 * /workers/categories:
 *   post:
 *     tags:
 *       - Worker-Category
 *     summary: Create a new category
 *     description: Create a worker category. This endpoint validates using `createCategory` schema.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name (required)
 *               description:
 *                 type: string
 *                 description: Category description (optional)
 *     responses:
 *       201:
 *         description: Category created successfully
 */
router.post("/categories", validate(createCategory, "body"), workerController.createCategoryController);

/**
 * @openapi
 * /workers/roles:
 *   post:
 *     tags:
 *       - Worker-Category
 *     summary: Create a new role
 *     description: Create a role and link it to a categoryId (uuid)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Role name (required)
 *               description:
 *                 type: string
 *                 description: Role description (optional)
 *               categoryId:
 *                 type: string
 *                 description: Category ID (uuid, required)
 *     responses:
 *       201:
 *         description: Role created successfully
 */
router.post("/roles", validate(createRole, "body"), workerController.createRoleController);

/**
 * @openapi
 * /workers/specialities:
 *   post:
 *     tags:
 *       - Worker-Category
 *     summary: Create a new speciality
 *     description: Create a speciality and link it to a roleId (uuid)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - roleId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Speciality name (required)
 *               description:
 *                 type: string
 *                 description: Speciality description (optional)
 *               roleId:
 *                 type: string
 *                 description: Role ID (uuid, required)
 *     responses:
 *       201:
 *         description: Speciality created successfully
 */
router.post("/specialities", validate(createSpeciality, "body"), workerController.createSpecialityController);

/**
 * @openapi
 * /workers/work-types:
 *   post:
 *     tags:
 *       - Worker-Category
 *     summary: Create a new work type
 *     description: Create a work type and link it to a specialityId (uuid)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - specialityId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Work type name (required)
 *               description:
 *                 type: string
 *                 description: Work type description (optional)
 *               specialityId:
 *                 type: string
 *                 description: Speciality ID (uuid, required)
 *     responses:
 *       201:
 *         description: Work type created successfully
 */
router.post("/work-types", validate(createWorkType, "body"), workerController.createWorkTypeController);



/**
 * @openapi
 * /workers:
 *   get:
 *     summary: Get list of workers with filters
 *     description: >
 *       Returns a list of workers with optional filters such as category, role,
 *       speciality, work type, required skills, photo availability, status, verification, pagination, and sorting.
 *     tags:
 *       - Worker
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Free-text search (matches user name, category, role, or skills).
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category UUID.
 *       - in: query
 *         name: roleId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by role UUID.
 *       - in: query
 *         name: specialtyId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by speciality UUID.
 *       - in: query
 *         name: workTypeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by work type UUID.
 *       - in: query
 *         name: requiredSkills
 *         schema:
 *           type: string
 *           example: react,node
 *         description: Comma-separated list of required skills. Use with `skillsMatch`.
 *       - in: query
 *         name: skillsMatch
 *         schema:
 *           type: string
 *           enum: [any, all]
 *           default: any
 *         description: >
 *           - `any`: match workers with at least one of the required skills  
 *           - `all`: match workers with all the required skills
 *       - in: query
 *         name: hasPhoto
 *         schema:
 *           type: boolean
 *         description: Filter by whether worker has a profile photo.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, PENDING]
 *         description: Filter by worker status.
 *       - in: query
 *         name: verification
 *         schema:
 *           type: string
 *           enum: [APPROVED, PENDING, REJECTED]
 *         description: Filter by worker verification status.
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
 *         description: Number of records per page.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, experience, relevance]
 *           default: createdAt
 *         description: Sort workers by a specific field.
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order.
 *     responses:
 *       200:
 *         description: List of workers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Worker'
 *                     meta:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         returned:
 *                           type: integer
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Internal server error
 */
router.get("/", authenticate, workerController.getWorkers);

/**
 * @openapi
 * /workers/me/verification-status:
 *   get:
 *     tags:
 *       - Worker
 *     summary: Get verification status of the authenticated worker account
 *     description: Returns the verification and account status for the logged-in worker.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     workerId:
 *                       type: string
 *                       format: uuid
 *                     verification:
 *                       type: string
 *                       enum: [PENDING, APPROVED, REJECTED]
 *                     status:
 *                       type: string
 *                       enum: [ACTIVE, INACTIVE, PENDING, REJECTED]
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only workers can access
 *       404:
 *         description: Worker profile not found
 */
router.get("/me/verification-status", authenticate, workerController.getVerificationStatus);

/**
 * @openapi
 * /workers/{id}:
 *   get:
 *     tags:
 *       - Worker
 *     summary: Get worker details by ID (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Worker ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Worker details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Worker not found
 */
router.get("/:id", validate(userIdSchema, "params"), authenticate, workerController.getWorkerById);

/**
 * @openapi
 * /workers/{id}/details:
 *   patch:
 *     tags:
 *       - Worker
 *     summary: Create or update worker profile details (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID for the worker profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               portfolio:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *               availability:
 *                 type: object
 *                 properties:
 *                   days:
 *                     type: object
 *                     properties:
 *                       monday:
 *                         type: boolean
 *                       tuesday:
 *                         type: boolean
 *                       wednesday:
 *                         type: boolean
 *                       thursday:
 *                         type: boolean
 *                       friday:
 *                         type: boolean
 *                       saturday:
 *                         type: boolean
 *                       sunday:
 *                         type: boolean
 *                   time:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [morning, afternoon, evening, night]
 *               category:
 *                 type: string
 *               professionalRole:
 *                 type: string
 *               experience:
 *                 type: string
 *     responses:
 *       200:
 *         description: Worker details upserted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.patch("/:id/details", validate(userIdSchema, "params"), validate(workerDetailsSchema, "body"), authenticate, workerController.updateWorkerDetails);

/**
 * @openapi
 * /workers/toggle-availability:
 *   patch:
 *     tags:
 *       - Worker
 *     summary: Toggle worker availability
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isAvailable:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Worker availability updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.patch("/toggle-availability", validate(toggleAvailabilitySchema, "body"), authenticate, workerController.toggleWorkerAvailability);

/**
 * @openapi
 * /workers/workerRegister:
 *   post:
 *     tags:
 *       - Worker
 *     summary: Register a new worker
 *     description: Creates a new user with a worker profile. Validated by `workerRegistrationSchema`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - password
 *               - role
 *               - categoryId
 *               - professionalRole
 *               - skills
 *               - specialityIds
 *               - workTypeIds
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Full name of the worker
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               professionalRole:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               specialityIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               workTypeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               portfolio:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *               availability:
 *                 $ref: "#/components/schemas/Availability"
 *               experience:
 *                 type: string
 *     responses:
 *       201:
 *         description: Worker registered successfully
 *       400:
 *         description: Validation error
 */
router.post("/workerRegister", validate(workerRegistrationSchema, "body"), workerController.registerWorker)

/**
 * @openapi
 * /workers/{id}/update:
 *   patch:
 *     tags:
 *       - Worker
 *     summary: Update a worker (admin)
 *     description: Update user/worker profile fields. At least one field must be provided in the body.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Worker user ID (uuid)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Fields to update (provide one or more)
 *             properties:
    *               fullName:
    *                 type: string
    *               email:
    *                 type: string
    *                 format: email
    *               phone:
    *                 type: string
    *                 nullable: true
    *               password:
    *                 type: string
    *               role:
    *                 type: string
    *               location:
    *                 type: string
    *                 nullable: true
    *               categoryId:
    *                 type: string
    *                 format: uuid
    *                 nullable: true
    *               roleId:
    *                 type: string
    *                 format: uuid
    *                 nullable: true
    *               professionalRole:
    *                 type: string
    *               skills:
    *                 type: array
    *                 items:
    *                   type: string
    *               workType:
    *                 type: array
    *                 items:
    *                   type: string
    *               portfolio:
    *                 type: array
    *                 items:
    *                   type: string
    *                   format: uri
    *               availability:
    *                 $ref: "#/components/schemas/Availability"
    *               experience:
    *                 type: string
    *               specialityIds:
    *                 type: array
    *                 items:
    *                   type: string
    *                   format: uuid
    *               workTypeIds:
    *                 type: array
    *                 items:
    *                   type: string
    *                   format: uuid
 *     responses:
 *       200:
 *         description: Worker updated successfully
 *       400:
 *         description: Validation error (invalid input or no fields provided)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Worker not found
 */
router.patch("/:id/update", validate(userIdSchema, "params"), validate(workerDetailsSchema, "body"), authenticate, workerController.updateWorkerDetails);

/**
 * @openapi
 * /workers/{workerId}/applications:
 *   get:
 *     tags:
 *       - Worker
 *     summary: Get job applications for a specific worker
 *     description: Requires authentication. Returns job applications for the given workerId.
 *     parameters:
 *       - in: path
 *         name: workerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Worker ID (uuid)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of job applications
 *       404:
 *         description: Worker not found
 */
router.get("/:workerId/applications", validate(applicationsSchema, "params"), validate(workerApplicationsQuerySchema, "query"), authenticate, workerController.getWorkerJobApplications);

/**
 * @openapi
 * /workers/{workerId}/assignment/{applicationId}/accept:
 *   patch:
 *     tags:
 *       - Worker
 *     summary: Accept a job assignment for a specific application
 *     description: Worker accepts an assignment. Requires authentication.
 *     parameters:
 *       - in: path
 *         name: workerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Worker ID (uuid)
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job application ID (uuid)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job assignment accepted successfully
 *       404:
 *         description: Worker or application not found
 */
router.patch("/:workerId/assignment/:applicationId/accept", validate(workerIdSchema, "params"), validate(applicationsSchema, "params"), authenticate, workerController.acceptJobAssignment);

/**
 * @openapi
 * /workers/{workerId}/assignment/{applicationId}/reject:
 *   patch:
 *     tags:
 *       - Worker
 *     summary: Reject a job assignment for a specific application
 *     description: Worker rejects an assignment. Requires authentication.
 *     parameters:
 *       - in: path
 *         name: workerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Worker ID (uuid)
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job application ID (uuid)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job assignment rejected successfully
 *       404:
 *         description: Worker or application not found
 */
router.patch("/:workerId/assignment/:applicationId/reject", validate(workerIdSchema, "params"), validate(applicationsSchema, "params"), authenticate, workerController.rejectJobAssignment);

export default router;

