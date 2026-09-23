import { useEffect, useState } from "react";

import { getCandles } from "../services/api";
import { websocketService } from "../services/websocket";

import type {
    Candle,
    MarketMessage
} from "../types/market";

export function useCandles(
    symbol: string,
    timeframe: number
) {
    const [candles, setCandles] =
        useState<Candle[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        // Clear candles from the previous
        // symbol/timeframe.
        setCandles([]);

        function handleMessage(
            message: MarketMessage
        ) {
            if (
                message.type !== "candles" ||
                message.symbol !== symbol ||
                message.candle.timeframe !==
                    timeframe
            ) {
                return;
            }

            const candle: Candle = {
                timestamp:
                    message.candle.timestamp,
                open: message.candle.open,
                high: message.candle.high,
                low: message.candle.low,
                close: message.candle.close,
                volume: message.candle.volume
            };

            setCandles(current => {
                const updated = [...current];

                const index =
                    updated.findIndex(
                        item =>
                            item.timestamp ===
                            candle.timestamp
                    );

                if (index === -1) {
                    updated.push(candle);
                } else {
                    updated[index] = candle;
                }

                updated.sort(
                    (a, b) =>
                        a.timestamp -
                        b.timestamp
                );

                return updated;
            });
        }

        const removeHandler =
            websocketService.addHandler(
                handleMessage
            );

        websocketService.subscribe(
            symbol,
            "candles"
        );

        async function loadCandles() {
            try {
                setLoading(true);
                setError(null);

                const historical =
                    await getCandles(
                        symbol,
                        timeframe
                    );

                if (cancelled) {
                    return;
                }

                setCandles(historical);
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load candles"
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadCandles();

        return () => {
            cancelled = true;

            removeHandler();

            websocketService.unsubscribe(
                symbol,
                "candles"
            );
        };
    }, [symbol, timeframe]);

    return {
        candles,
        loading,
        error
    };
}