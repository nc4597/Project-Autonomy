-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "teamSectionSubtitle" TEXT NOT NULL DEFAULT 'There are {count} professionals on the Regiment Securities team.',
ADD COLUMN     "teamSectionTitle" TEXT NOT NULL DEFAULT 'Meet the Investment Relations Team';
