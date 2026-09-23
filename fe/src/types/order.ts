export type Side = "buy" | "sell";

export type OrderStatus =
    | "placed"
    | "cancelled"
    | "partiallyFilled"
    | "executed";

export type Order = {
    id: string;
    userId: string;
    assetId: string;
    side: Side;
    price: number;
    qty: number;
    filledQty: number;
    type: "maker" | "taker";
    created_at: string;
    status: OrderStatus;
};

export type PlaceOrderRequest = {
    assetId: string;
    side: Side;
    price: number;
    qty: number;
};

export type Fill = {
    id: string;
    orderId: string;
    userId: string;
    assetId: string;
    price: number;
    filledQty: number;
    side: Side;
    type: "maker" | "taker";
    filled_at: string;
};