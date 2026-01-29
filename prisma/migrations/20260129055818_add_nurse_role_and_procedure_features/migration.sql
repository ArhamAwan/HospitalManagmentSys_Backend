-- AlterEnum
ALTER TYPE "ProcedureStatus" ADD VALUE 'IN_PROGRESS';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'NURSE';

-- AlterTable
ALTER TABLE "Procedure" ADD COLUMN     "hourlyRate" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ProcedureOrder" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3);
