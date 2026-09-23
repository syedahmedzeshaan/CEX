export type USDBalance = {
    balance: number;
};

export type AssetBalance = {
    id: string;
    userId: string;
    assetId: string;
    qty: number;
    lockedQty: number;
};