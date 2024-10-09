-- AlterTable
ALTER TABLE "User" ALTER COLUMN "user_id" DROP DEFAULT,
ALTER COLUMN "password" SET DEFAULT '';
DROP SEQUENCE "user_user_id_seq";
