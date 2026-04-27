/*
  Warnings:

  - The `types` column on the `Lead` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "types",
ADD COLUMN     "types" TEXT[];

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "tags" JSONB NOT NULL,
    "reviewCount" INTEGER NOT NULL,
    "averageRating" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Analysis_leadId_key" ON "Analysis"("leadId");

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
