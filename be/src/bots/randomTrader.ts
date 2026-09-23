import { Bot } from "./botManager";
import { orderService } from "../orderService";
import { orderBooks } from "../orderbook";

type RandomTraderConfig = {
    userId: string;
    assetIds: string[];
    checkInterval: number;
    tradeProbability?: number;
    buyProbability?: number;
};

export class RandomTrader implements Bot {
    private readonly userId: string;
    private readonly assetIds: string[];
    private readonly checkInterval: number;
    private readonly tradeProbability: number;
    private readonly buyProbability: number;

    private readonly orderService: orderService;

    private running = false;

    constructor(
        config: RandomTraderConfig,
        orderServiceObject: orderService
    ) {
        this.userId = config.userId;
        this.assetIds = config.assetIds;
        this.checkInterval = config.checkInterval;
        this.tradeProbability = config.tradeProbability ?? 0.35;
        this.buyProbability = config.buyProbability ?? 0.5;

        this.orderService = orderServiceObject;
    }

    start() {
        if (this.running) return;

        this.running = true;

        console.log(
            `RandomTrader started | user=${this.userId} assets=${this.assetIds.length}`
        );

        void this.run();
    }

    stop() {
        this.running = false;

        console.log(
            `RandomTrader stopped | user=${this.userId}`
        );
    }

    private async run() {
        while (this.running) {
            await this.sleep(this.checkInterval);

            if (!this.running) break;

            if (Math.random() > this.tradeProbability) {
                continue;
            }

            try {
                this.tick();
            } catch (error) {
                console.error(
                    `RandomTrader error | user=${this.userId}`,
                    error
                );
            }
        }
    }

    private tick() {
        if (this.assetIds.length === 0) {
            return;
        }

        const assetId =
            this.assetIds[
                Math.floor(
                    Math.random() * this.assetIds.length
                )
            ];

        if (!assetId) return;

        const orderBook = orderBooks.get(assetId);

        if (!orderBook) {
            console.error(
                `RandomTrader: orderbook not found | asset=${assetId}`
            );
            return;
        }

        const { asks, bids } = orderBook.getDepth();

        const bestAsk = asks[0]?.price;
        const bestBid = bids[0]?.price;

        if (
            bestAsk === undefined &&
            bestBid === undefined
        ) {
            return;
        }

        const shouldBuy =
            Math.random() < this.buyProbability;

        if (shouldBuy) {
            if (bestAsk === undefined) return;

            this.placeOrder(
                assetId,
                "buy",
                bestAsk
            );

            return;
        }

        if (bestBid === undefined) return;

        this.placeOrder(
            assetId,
            "sell",
            bestBid
        );
    }

    private placeOrder(
        assetId: string,
        side: "buy" | "sell",
        price: number
    ) {
        const qty = this.randomQuantity();

        const result = this.orderService.placeOrder(
            {
                assetId,
                side,
                price,
                qty
            },
            this.userId
        );

        if (!result.success) {
            console.error(
                `RandomTrader ${side.toUpperCase()} failed | user=${this.userId} asset=${assetId} reason=${result.reason}`
            );
            return;
        }

        console.log(
            `RandomTrader ${side.toUpperCase()} | user=${this.userId} asset=${assetId} price=${price} qty=${qty}`
        );
    }

    private randomQuantity() {
        return Math.floor(Math.random() * 5) + 1;
    }

    private sleep(ms: number) {
        return new Promise<void>(resolve => {
            setTimeout(resolve, ms);
        });
    }
}