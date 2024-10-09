-- AlterTable
CREATE SEQUENCE routine_routine_id_seq;
ALTER TABLE "Routine" ALTER COLUMN "routine_id" SET DEFAULT nextval('routine_routine_id_seq');
ALTER SEQUENCE routine_routine_id_seq OWNED BY "Routine"."routine_id";

-- AlterTable
CREATE SEQUENCE set_set_id_seq;
ALTER TABLE "Set" ALTER COLUMN "set_id" SET DEFAULT nextval('set_set_id_seq');
ALTER SEQUENCE set_set_id_seq OWNED BY "Set"."set_id";

-- AlterTable
CREATE SEQUENCE user_user_id_seq;
ALTER TABLE "User" ALTER COLUMN "user_id" SET DEFAULT nextval('user_user_id_seq');
ALTER SEQUENCE user_user_id_seq OWNED BY "User"."user_id";

-- AlterTable
CREATE SEQUENCE workout_workout_id_seq;
ALTER TABLE "Workout" ALTER COLUMN "workout_id" SET DEFAULT nextval('workout_workout_id_seq');
ALTER SEQUENCE workout_workout_id_seq OWNED BY "Workout"."workout_id";
