-- CreateTable
CREATE TABLE "Set" (
    "set_id" INTEGER NOT NULL,
    "set_weight" INTEGER NOT NULL,
    "set_reps" INTEGER NOT NULL,
    "workout_id" INTEGER NOT NULL,

    CONSTRAINT "Set_pkey" PRIMARY KEY ("set_id")
);

-- CreateTable
CREATE TABLE "Workout" (
    "workout_id" INTEGER NOT NULL,
    "workout_name" TEXT NOT NULL,
    "routine_id" INTEGER NOT NULL,

    CONSTRAINT "Workout_pkey" PRIMARY KEY ("workout_id")
);

-- CreateTable
CREATE TABLE "Routine" (
    "routine_id" INTEGER NOT NULL,
    "routine_name" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "Routine_pkey" PRIMARY KEY ("routine_id")
);

-- CreateTable
CREATE TABLE "User" (
    "user_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Set_set_id_key" ON "Set"("set_id");

-- CreateIndex
CREATE UNIQUE INDEX "Workout_workout_id_key" ON "Workout"("workout_id");

-- CreateIndex
CREATE UNIQUE INDEX "Routine_routine_id_key" ON "Routine"("routine_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_user_id_key" ON "User"("user_id");

-- AddForeignKey
ALTER TABLE "Set" ADD CONSTRAINT "Set_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "Workout"("workout_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "Routine"("routine_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
