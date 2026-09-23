export type DepthLevel = {
    price: number;
    qty: number;
};

export type Depth = {
    asks: DepthLevel[];
    bids: DepthLevel[];
};

export type Trade = {
    price: number;
    qty: number;
};

export type Candle = {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

export type DepthMessage = {
    type: "depth";
    symbol: string;
    trades: Trade[];
    depth: Depth;
    price: number | undefined;
};

export type CandleMessage = {
    type: "candles";
    symbol: string;
    candle: {
        timeframe: number;
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    };
};

export type MarketMessage =
    | DepthMessage
    | CandleMessage;