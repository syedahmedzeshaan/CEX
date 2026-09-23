/*
  Warnings:

  - You are about to drop the `Candle_1d` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Candle_1mon` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Candle_1w` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Candle_1y` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Candle_1d" DROP CONSTRAINT "Candle_1d_assetId_fkey";

-- DropForeignKey
ALTER TABLE "Candle_1mon" DROP CONSTRAINT "Candle_1mon_assetId_fkey";

-- DropForeignKey
ALTER TABLE "Candle_1w" DROP CONSTRAINT "Candle_1w_assetId_fkey";

-- DropForeignKey
ALTER TABLE "Candle_1y" DROP CONSTRAINT "Candle_1y_assetId_fkey";

-- DropTable
DROP TABLE "Candle_1d";

-- DropTable
DROP TABLE "Candle_1mon";

-- DropTable
DROP TABLE "Candle_1w";

-- DropTable
DROP TABLE "Candle_1y";
