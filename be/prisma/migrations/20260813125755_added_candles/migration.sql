-- CreateTable
CREATE TABLE "Candle_1m" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "volume" INTEGER NOT NULL,
    "H" INTEGER NOT NULL,
    "L" INTEGER NOT NULL,
    "O" INTEGER NOT NULL,
    "C" INTEGER NOT NULL,

    CONSTRAINT "Candle_1m_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candle_15m" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "volume" INTEGER NOT NULL,
    "H" INTEGER NOT NULL,
    "L" INTEGER NOT NULL,
    "O" INTEGER NOT NULL,
    "C" INTEGER NOT NULL,

    CONSTRAINT "Candle_15m_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candle_1h" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "volume" INTEGER NOT NULL,
    "H" INTEGER NOT NULL,
    "L" INTEGER NOT NULL,
    "O" INTEGER NOT NULL,
    "C" INTEGER NOT NULL,

    CONSTRAINT "Candle_1h_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candle_1d" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "volume" INTEGER NOT NULL,
    "H" INTEGER NOT NULL,
    "L" INTEGER NOT NULL,
    "O" INTEGER NOT NULL,
    "C" INTEGER NOT NULL,

    CONSTRAINT "Candle_1d_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candle_1w" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "volume" INTEGER NOT NULL,
    "H" INTEGER NOT NULL,
    "L" INTEGER NOT NULL,
    "O" INTEGER NOT NULL,
    "C" INTEGER NOT NULL,

    CONSTRAINT "Candle_1w_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candle_1mon" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "volume" INTEGER NOT NULL,
    "H" INTEGER NOT NULL,
    "L" INTEGER NOT NULL,
    "O" INTEGER NOT NULL,
    "C" INTEGER NOT NULL,

    CONSTRAINT "Candle_1mon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candle_1y" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "volume" INTEGER NOT NULL,
    "H" INTEGER NOT NULL,
    "L" INTEGER NOT NULL,
    "O" INTEGER NOT NULL,
    "C" INTEGER NOT NULL,

    CONSTRAINT "Candle_1y_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Candle_1m" ADD CONSTRAINT "Candle_1m_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candle_15m" ADD CONSTRAINT "Candle_15m_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candle_1h" ADD CONSTRAINT "Candle_1h_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candle_1d" ADD CONSTRAINT "Candle_1d_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candle_1w" ADD CONSTRAINT "Candle_1w_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candle_1mon" ADD CONSTRAINT "Candle_1mon_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candle_1y" ADD CONSTRAINT "Candle_1y_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
