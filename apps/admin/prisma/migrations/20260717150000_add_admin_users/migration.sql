-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- Seed the initial allowlist.
INSERT INTO "AdminUser" ("id", "email") VALUES
  (gen_random_uuid()::text, 'rohith.kumar@regimentsecurities.com'),
  (gen_random_uuid()::text, 'nabiha.charolia@regimentsecurities.com'),
  (gen_random_uuid()::text, 'vivek.panchal@regimentsecurities.com');
