-- AlterTable
ALTER TABLE "SiteSettings" ALTER COLUMN "teamSectionSubtitle" SET DEFAULT 'Meet the rest of the Regiment Securities team at [regimentsecurities.com/who-we-are](https://www.regimentsecurities.com/who-we-are).';

-- Swap the stored subtitle only if it is still the previous default —
-- a custom admin edit is never overwritten.
UPDATE "SiteSettings"
SET "teamSectionSubtitle" = 'Meet the rest of the Regiment Securities team at [regimentsecurities.com/who-we-are](https://www.regimentsecurities.com/who-we-are).'
WHERE "teamSectionSubtitle" = 'There are {count} professionals on the Regiment Securities team.';
