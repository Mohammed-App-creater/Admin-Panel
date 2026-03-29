-- One application/invitation row per worker per job (company invite + worker apply share this table).
CREATE UNIQUE INDEX "WorkerJobApplication_jobId_workerId_key" ON "public"."WorkerJobApplication"("jobId", "workerId");
