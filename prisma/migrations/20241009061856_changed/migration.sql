/*
  Warnings:

  - The primary key for the `Routine` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Set` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Workout` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Set" DROP CONSTRAINT "Set_workout_id_fkey";

-- DropForeignKey
ALTER TABLE "Workout" DROP CONSTRAINT "Workout_routine_id_fkey";

-- AlterTable
ALTER TABLE "Routine" DROP CONSTRAINT "Routine_pkey",
ALTER COLUMN "routine_id" DROP DEFAULT,
ALTER COLUMN "routine_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Routine_pkey" PRIMARY KEY ("routine_id");
DROP SEQUENCE "routine_routine_id_seq";

-- AlterTable
ALTER TABLE "Set" DROP CONSTRAINT "Set_pkey",
ALTER COLUMN "set_id" DROP DEFAULT,
ALTER COLUMN "set_id" SET DATA TYPE TEXT,
ALTER COLUMN "workout_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Set_pkey" PRIMARY KEY ("set_id");
DROP SEQUENCE "set_set_id_seq";

-- AlterTable
ALTER TABLE "Workout" DROP CONSTRAINT "Workout_pkey",
ALTER COLUMN "workout_id" DROP DEFAULT,
ALTER COLUMN "workout_id" SET DATA TYPE TEXT,
ALTER COLUMN "routine_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Workout_pkey" PRIMARY KEY ("workout_id");
DROP SEQUENCE "workout_workout_id_seq";

-- AddForeignKey
ALTER TABLE "Set" ADD CONSTRAINT "Set_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "Workout"("workout_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "Routine"("routine_id") ON DELETE RESTRICT ON UPDATE CASCADE;
