-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "licenses" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "role" TEXT;
