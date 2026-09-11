/*
  Warnings:

  - Added the required column `userId` to the `Fills` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Fills" ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Fills" ADD CONSTRAINT "Fills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
