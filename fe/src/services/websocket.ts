import type { MarketMessage } from "../types/market";

type Stream = "depth" | "candles";

type MessageHandler = (
    message: MarketMessage
) => void;

type SubscriptionMessage = {
    type: "subscribe" | "unsubscribe";
    symbol: string;
    stream: Stream;
};

class WebSocketService {
    private ws: WebSocket | null = null;

    private handlers: Set<MessageHandler> =
        new Set();

    private pendingMessages: SubscriptionMessage[] =
        [];

    connect() {
        if (
            this.ws?.readyState ===
                WebSocket.OPEN ||
            this.ws?.readyState ===
                WebSocket.CONNECTING
        ) {
            return;
        }

        this.ws = new WebSocket(
            "ws://localhost:3000"
        );

        this.ws.onopen = () => {
            console.log("WebSocket connected");

            for (const message of this.pendingMessages) {
                this.ws?.send(
                    JSON.stringify(message)
                );
            }

            this.pendingMessages = [];
        };

        this.ws.onmessage = event => {
            const message =
                JSON.parse(
                    event.data
                ) as MarketMessage;

            for (const handler of this.handlers) {
                handler(message);
            }
        };

        this.ws.onclose = () => {
            console.log(
                "WebSocket disconnected"
            );

            this.ws = null;
        };

        this.ws.onerror = error => {
            console.error(
                "WebSocket error:",
                error
            );
        };
    }

    subscribe(
        symbol: string,
        stream: Stream
    ) {
        this.send({
            type: "subscribe",
            symbol,
            stream
        });
    }

    unsubscribe(
        symbol: string,
        stream: Stream
    ) {
        this.send({
            type: "unsubscribe",
            symbol,
            stream
        });
    }

    addHandler(
        handler: MessageHandler
    ) {
        this.handlers.add(handler);

        return () => {
            this.handlers.delete(handler);
        };
    }

    disconnect() {
        this.pendingMessages = [];

        this.ws?.close();
        this.ws = null;
    }

    private send(
        message: SubscriptionMessage
    ) {
        this.connect();

        if (
            this.ws?.readyState ===
            WebSocket.OPEN
        ) {
            this.ws.send(
                JSON.stringify(message)
            );

            return;
        }

        this.pendingMessages.push(message);
    }
}

export const websocketService =
    new WebSocketService();