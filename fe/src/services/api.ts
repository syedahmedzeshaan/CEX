import type {
    Candle,
    Depth
} from "../types/market";

import type {
    Order,
    Fill,
    PlaceOrderRequest
} from "../types/order";

import type {
    USDBalance,
    AssetBalance
} from "../types/account";

import type { Asset } from "../types/asset";

const API_URL = "http://localhost:3000";

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = localStorage.getItem("token");

    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",

                ...(token
                    ? {
                          Authorization: `Bearer ${token}`
                      }
                    : {}),

                ...options.headers
            }
        }
    );

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({
                reason: "Request failed"
            }));

        throw new Error(
            error.reason ||
            error.msg ||
            "Request failed"
        );
    }

    return response.json();
}

export async function login(
    username: string,
    password: string
): Promise<{ token: string }> {
    return request<{ token: string }>(
        "/login",
        {
            method: "POST",
            body: JSON.stringify({
                username,
                password
            })
        }
    );
}

export async function signup(
    username: string,
    password: string
) {
    return request(
        "/signup",
        {
            method: "POST",
            body: JSON.stringify({
                username,
                password
            })
        }
    );
}

export async function getAssets(): Promise<Asset[]> {
    return request<Asset[]>("/asset");
}

export async function getCandles(
    symbol: string,
    timeframe: number,
    limit = 500
): Promise<Candle[]> {
    const data = await request<
        {
            timestamp: string;
            O: number;
            H: number;
            L: number;
            C: number;
            volume: number;
        }[]
    >(
        `/candles/${symbol}?timeframe=${timeframe}&limit=${limit}`
    );

    return data.map((candle) => ({
        timestamp: new Date(
            candle.timestamp
        ).getTime(),

        open: candle.O,
        high: candle.H,
        low: candle.L,
        close: candle.C,
        volume: candle.volume
    }));
}

export async function getDepth(symbol: string): Promise<Depth & { price: number | undefined }> {
    const data = await request<Depth & {
        symbol: string;
        price: number | undefined;
    }>(`/depth/${symbol}`);

    return {
        asks: data.asks,
        bids: data.bids,
        price: data.price
    };
}

export async function getOrders(): Promise<Order[]> {
    return request<Order[]>("/orders");
}

export async function getOrder(
    orderId: string
): Promise<Order> {
    return request<Order>(
        `/order/${orderId}`
    );
}

export type PlaceOrderResponse = {
    success: true;
    order: Order;
    fills: Fill[];
};

export async function placeOrder(
    order: PlaceOrderRequest
): Promise<PlaceOrderResponse> {
    return request<PlaceOrderResponse>(
        "/order",
        {
            method: "POST",
            body: JSON.stringify(order)
        }
    );
}

export async function cancelOrder(
    orderId: string
) {
    return request(
        `/order/${orderId}`,
        {
            method: "DELETE"
        }
    );
}

export async function getFills(): Promise<Fill[]> {
    return request<Fill[]>("/fills");
}

export async function getUSDBalance(): Promise<USDBalance> {
    return request<USDBalance>(
        "/balance/usd"
    );
}

export async function getBalances(): Promise<AssetBalance[]> {
    return request<AssetBalance[]>(
        "/balance"
    );
}
export async function claimMockFunds(): Promise<{
    status: string;
    usd: number;
    assets: {
        symbol: string;
        qty: number;
    }[];
}> {
    return request(
        "/faucet",
        {
            method: "POST"
        }
    );
}