-- DropForeignKey
ALTER TABLE "RiddorFlag" DROP CONSTRAINT "RiddorFlag_incidentId_fkey";

-- DropIndex
DROP INDEX "Incident_riddorRequired_idx";

-- AlterTable
ALTER TABLE "Incident" DROP COLUMN "riddorRequired",
ADD COLUMN     "areaId" TEXT,
ADD COLUMN     "subAreaId" TEXT;

-- DropTable
DROP TABLE "RiddorFlag";

-- DropEnum
DROP TYPE "ReportingAuthority";

-- DropEnum
DROP TYPE "RiddorStatus";

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubArea" (
    "id" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubArea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Area_centerId_idx" ON "Area"("centerId");

-- CreateIndex
CREATE UNIQUE INDEX "Area_centerId_name_key" ON "Area"("centerId", "name");

-- CreateIndex
CREATE INDEX "SubArea_areaId_idx" ON "SubArea"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "SubArea_areaId_name_key" ON "SubArea"("areaId", "name");

-- CreateIndex
CREATE INDEX "Incident_areaId_idx" ON "Incident"("areaId");

-- CreateIndex
CREATE INDEX "Incident_subAreaId_idx" ON "Incident"("subAreaId");

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_subAreaId_fkey" FOREIGN KEY ("subAreaId") REFERENCES "SubArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubArea" ADD CONSTRAINT "SubArea_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE CASCADE ON UPDATE CASCADE;
