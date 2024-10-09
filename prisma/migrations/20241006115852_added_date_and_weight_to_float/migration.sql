/*
  Warnings:

  - Added the required column `date` to the `Set` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `Workout` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Set" ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "set_weight" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Workout" ADD COLUMN     "date" TIMESTAMP(3) NOT NULL;
