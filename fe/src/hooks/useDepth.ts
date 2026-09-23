import { useEffect, useState } from "react";
import { getDepth } from "../services/api";
import { websocketService } from "../services/websocket";
import type {
    Depth,
    MarketMessage
} from "../types/market";

export function useDepth(symbol: string) {
    const [depth, setDepth] = useState<Depth>({
        asks: [],
        bids: []
    });

    const [tradePrice, setTradePrice] =
        useState<number | undefined>(undefined);

    useEffect(() => {
        let cancelled = false;

        function handleMessage(
            message: MarketMessage
        ) {
            if (
                message.type !== "depth" ||
                message.symbol !== symbol
            ) {
                return;
            }

            setDepth(message.depth);

            if (message.price !== undefined) {
                setTradePrice(message.price);
            }
        }

        const removeHandler =
            websocketService.addHandler(
                handleMessage
            );

        websocketService.subscribe(
            symbol,
            "depth"
        );

        async function loadDepth() {
            try {
                const data =
                    await getDepth(symbol);

                if (!cancelled) {
                setDepth({
                    asks: data.asks,
                    bids: data.bids
                });

                setTradePrice(data.price);
            }
            } catch (error) {
                console.error(
                    "Failed to load depth:",
                    error
                );
            }
        }

        loadDepth();

        return () => {
            cancelled = true;

            removeHandler();

            websocketService.unsubscribe(
                symbol,
                "depth"
            );
        };
    }, [symbol]);

    return {
        depth,
        tradePrice
    };
}