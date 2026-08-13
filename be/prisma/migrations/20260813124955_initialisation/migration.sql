-- CreateEnum
CREATE TYPE "Side" AS ENUM ('buy', 'sell');

-- CreateEnum
CREATE TYPE "Type" AS ENUM ('maker', 'taker');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('placed', 'cancelled', 'partiallyFilled', 'executed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "usdBal" INTEGER NOT NULL DEFAULT 0,
    "lockedBal" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "Symbol" TEXT NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "side" "Side" NOT NULL,
    "price" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "type" "Type" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "filledQty" INTEGER NOT NULL DEFAULT 0,
    "status" "Status" NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fills" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "filledQty" INTEGER NOT NULL DEFAULT 0,
    "side" "Side" NOT NULL,
    "type" "Type" NOT NULL,
    "price" INTEGER NOT NULL,
    "filled_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Balance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "lockedQty" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Balance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fills" ADD CONSTRAINT "Fills_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fills" ADD CONSTRAINT "Fills_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
