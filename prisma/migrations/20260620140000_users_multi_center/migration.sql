-- CreateTable: implicit many-to-many between Center and User
CREATE TABLE "_CenterToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CenterToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CenterToUser_B_index" ON "_CenterToUser"("B");

-- AddForeignKey
ALTER TABLE "_CenterToUser" ADD CONSTRAINT "_CenterToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CenterToUser" ADD CONSTRAINT "_CenterToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing single-centre memberships into the join table
INSERT INTO "_CenterToUser" ("A", "B")
SELECT "centerId", "id" FROM "User" WHERE "centerId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_centerId_fkey";

-- DropIndex
DROP INDEX "User_centerId_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "centerId";
