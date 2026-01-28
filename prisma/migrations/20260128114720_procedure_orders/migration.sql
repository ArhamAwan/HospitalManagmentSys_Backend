-- CreateEnum
CREATE TYPE "ProcedureStatus" AS ENUM ('REQUESTED', 'COMPLETED');

-- CreateTable
CREATE TABLE "ProcedureOrder" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "notes" TEXT,
    "status" "ProcedureStatus" NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcedureOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProcedureOrder_visitId_idx" ON "ProcedureOrder"("visitId");

-- CreateIndex
CREATE INDEX "ProcedureOrder_procedureId_idx" ON "ProcedureOrder"("procedureId");

-- CreateIndex
CREATE INDEX "ProcedureOrder_status_idx" ON "ProcedureOrder"("status");

-- AddForeignKey
ALTER TABLE "ProcedureOrder" ADD CONSTRAINT "ProcedureOrder_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedureOrder" ADD CONSTRAINT "ProcedureOrder_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "Procedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
