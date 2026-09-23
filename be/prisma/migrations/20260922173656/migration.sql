/*
  Warnings:

  - You are about to alter the column `qty` on the `Balance` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Integer`.
  - You are about to alter the column `lockedQty` on the `Balance` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Integer`.
  - You are about to alter the column `volume` on the `Candle_15m` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Integer`.
  - You are about to alter the column `H` on the `Candle_15m` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Integer`.
  - You are about to alter the column `L` on the `Candle_15m` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Integer`.
  - You are about to alter the column `O` on the `Candle_15m` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Integer`.
  - You are about to alter the column `C` on the `Candle_15m` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Integer`.
  - You are about to alter the column `volume` on the `Candle_1h` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Integer`.
  - You are about to alter the column `H` on the `Candle_1h` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Integer`.
  - You are about to alter the column `L` on the `Candle_1h` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Integer`.
  - You are about to alter the column `O` on the `Candle_1h` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Integer`.
  - You are about to alter the column `C` on the `Candle_1h` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Integer`.
  - You are about to alter the column `volume` on the `Candle_1m` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Integer`.
  - You are about to alter the column `H` on the `Candle_1m` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Integer`.
  - You are about to alter the column `L` on the `Candle_1m` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Integer`.
  - You are about to alter the column `O` on the `Candle_1m` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Integer`.
  - You are about to alter the column `C` on the `Candle_1m` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Integer`.
  - You are about to alter the column `filledQty` on the `Fills` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Integer`.
  - You are about to alter the column `price` on the `Fills` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Integer`.
  - You are about to alter the column `price` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Integer`.
  - You are about to alter the column `qty` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Integer`.
  - You are about to alter the column `filledQty` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Integer`.
  - You are about to alter the column `usdBal` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Integer`.
  - You are about to alter the column `lockedBal` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Balance" ALTER COLUMN "qty" SET DATA TYPE INTEGER,
ALTER COLUMN "lockedQty" SET DEFAULT 0,
ALTER COLUMN "lockedQty" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Candle_15m" ALTER COLUMN "volume" SET DATA TYPE INTEGER,
ALTER COLUMN "H" SET DATA TYPE INTEGER,
ALTER COLUMN "L" SET DATA TYPE INTEGER,
ALTER COLUMN "O" SET DATA TYPE INTEGER,
ALTER COLUMN "C" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Candle_1h" ALTER COLUMN "volume" SET DATA TYPE INTEGER,
ALTER COLUMN "H" SET DATA TYPE INTEGER,
ALTER COLUMN "L" SET DATA TYPE INTEGER,
ALTER COLUMN "O" SET DATA TYPE INTEGER,
ALTER COLUMN "C" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Candle_1m" ALTER COLUMN "volume" SET DATA TYPE INTEGER,
ALTER COLUMN "H" SET DATA TYPE INTEGER,
ALTER COLUMN "L" SET DATA TYPE INTEGER,
ALTER COLUMN "O" SET DATA TYPE INTEGER,
ALTER COLUMN "C" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Fills" ALTER COLUMN "filledQty" SET DEFAULT 0,
ALTER COLUMN "filledQty" SET DATA TYPE INTEGER,
ALTER COLUMN "price" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "price" SET DATA TYPE INTEGER,
ALTER COLUMN "qty" SET DATA TYPE INTEGER,
ALTER COLUMN "filledQty" SET DEFAULT 0,
ALTER COLUMN "filledQty" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "usdBal" SET DEFAULT 0,
ALTER COLUMN "usdBal" SET DATA TYPE INTEGER,
ALTER COLUMN "lockedBal" SET DEFAULT 0,
ALTER COLUMN "lockedBal" SET DATA TYPE INTEGER;
