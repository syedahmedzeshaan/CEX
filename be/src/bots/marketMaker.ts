import { Bot } from "./botManager";
import { orderService } from "../orderService";
import { orderBooks } from "../orderbook";

type MarketMakerAssetConfig = {
    assetId: string;
    anchorPrice: number;
    spread: number;
    orderQty: number;
    maxDeviation: number;
    movementSize: number;
};

type MarketMakerConfig = {
    userId: string;
    assets: MarketMakerAssetConfig[];
    checkInterval: number;
};

type OrderState = {
    buyOrderId?: string;
    sellOrderId?: string;
    buyPrice?: number;
    sellPrice?: number;
};

export class MarketMaker implements Bot {
    private readonly userId: string;
    private readonly assets: MarketMakerAssetConfig[];
    private readonly checkInterval: number;

    private readonly orderService: orderService;

    private running = false;

    private readonly orderStates = new Map<string, OrderState>();
    private readonly referencePrices = new Map<string, number>();

    constructor(
        config: MarketMakerConfig,
        orderServiceObject: orderService
    ) {
        this.userId = config.userId;
        this.assets = config.assets;
        this.checkInterval = config.checkInterval;

        this.orderService = orderServiceObject;

        for (const asset of this.assets) {
            this.orderStates.set(asset.assetId, {});
            this.referencePrices.set(
                asset.assetId,
                asset.anchorPrice
            );
        }
    }

    start() {
        if (this.running) return;

        this.running = true;

        console.log(
            `MarketMaker started | user=${this.userId} assets=${this.assets.length}`
        );

        void this.run();
    }

    stop() {
        this.running = false;

        console.log(
            `MarketMaker stopped | user=${this.userId}`
        );
    }

    private async run() {
        while (this.running) {
            try {
                for (const asset of this.assets) {
                    this.tick(asset);
                }
            } catch (error) {
                console.error(
                    `MarketMaker error | user=${this.userId}`,
                    error
                );
            }

            await this.sleep(this.checkInterval);
        }
    }

    private tick(asset: MarketMakerAssetConfig) {
        const orderBook = orderBooks.get(asset.assetId);

        if (!orderBook) {
            console.error(
                `MarketMaker: orderbook not found | asset=${asset.assetId}`
            );
            return;
        }

        const state = this.orderStates.get(asset.assetId)!;

        this.refreshOrderState(
            asset.assetId,
            state
        );

        /*
         * Only move the reference price when
         * we actually need to refresh a quote.
         */
        if (
            state.buyOrderId !== undefined &&
            state.sellOrderId !== undefined
        ) {
            return;
        }

        const referencePrice = this.moveReferencePrice(asset);

        const buyPrice = Math.max(
            1,
            Math.floor(referencePrice - asset.spread)
        );

        const sellPrice = Math.max(
            buyPrice + 1,
            Math.ceil(referencePrice + asset.spread)
        );

        if (state.buyOrderId === undefined) {
            this.placeBuy(
                asset,
                state,
                buyPrice
            );
        }

        if (state.sellOrderId === undefined) {
            this.placeSell(
                asset,
                state,
                sellPrice
            );
        }
    }

    private moveReferencePrice(
        asset: MarketMakerAssetConfig
    ) {
        const current =
            this.referencePrices.get(asset.assetId)
            ?? asset.anchorPrice;

        /*
         * Random movement:
         *
         * -1 = down
         *  0 = no movement
         * +1 = up
         */
        const direction =
            Math.floor(Math.random() * 3) - 1;

        const randomMovement =
            direction * asset.movementSize;

        /*
         * Pull the price slightly back toward
         * the anchor whenever it moves away.
         */
        const distanceFromAnchor =
            asset.anchorPrice - current;

        const pullTowardAnchor =
            distanceFromAnchor * 0.05;

        let next =
            current +
            randomMovement +
            pullTowardAnchor;

        /*
         * Never allow the simulated price to move
         * beyond the configured deviation from anchor.
         */
        const minimum =
            asset.anchorPrice -
            asset.maxDeviation;

        const maximum =
            asset.anchorPrice +
            asset.maxDeviation;

        next = Math.max(
            minimum,
            Math.min(maximum, next)
        );

        next = Math.max(1, Math.round(next));

        this.referencePrices.set(
            asset.assetId,
            next
        );

        return next;
    }

    private refreshOrderState(
        assetId: string,
        state: OrderState
    ) {
        const orderBook = orderBooks.get(assetId);

        if (!orderBook) return;

        if (
            state.buyOrderId !== undefined &&
            state.buyPrice !== undefined
        ) {
            const exists = orderBook.hasOrder(
                state.buyOrderId,
                "buy",
                state.buyPrice
            );

            if (!exists) {
                state.buyOrderId = undefined;
                state.buyPrice = undefined;
            }
        }

        if (
            state.sellOrderId !== undefined &&
            state.sellPrice !== undefined
        ) {
            const exists = orderBook.hasOrder(
                state.sellOrderId,
                "sell",
                state.sellPrice
            );

            if (!exists) {
                state.sellOrderId = undefined;
                state.sellPrice = undefined;
            }
        }
    }

    private placeBuy(
        asset: MarketMakerAssetConfig,
        state: OrderState,
        price: number
    ) {
        const result = this.orderService.placeOrder(
            {
                assetId: asset.assetId,
                side: "buy",
                price,
                qty: asset.orderQty
            },
            this.userId
        );

        if (!result.success) {
            console.error(
                `MarketMaker BUY failed | user=${this.userId} asset=${asset.assetId} reason=${result.reason}`
            );
            return;
        }

        if (!("order" in result)) {
            return;
        }

        const placedOrder = result.order;

        if (!placedOrder) {
            return;
        }

        const orderBook = orderBooks.get(
            asset.assetId
        );

        if (!orderBook) return;

        if (
            orderBook.hasOrder(
                placedOrder.id,
                "buy",
                price
            )
        ) {
            state.buyOrderId = placedOrder.id;
            state.buyPrice = price;
        }
    }

    private placeSell(
        asset: MarketMakerAssetConfig,
        state: OrderState,
        price: number
    ) {
        const result = this.orderService.placeOrder(
            {
                assetId: asset.assetId,
                side: "sell",
                price,
                qty: asset.orderQty
            },
            this.userId
        );

        if (!result.success) {
            console.error(
                `MarketMaker SELL failed | user=${this.userId} asset=${asset.assetId} reason=${result.reason}`
            );
            return;
        }

        if (!("order" in result)) {
            return;
        }

        const placedOrder = result.order;

        if (!placedOrder) {
            return;
        }

        const orderBook = orderBooks.get(
            asset.assetId
        );

        if (!orderBook) return;

        if (
            orderBook.hasOrder(
                placedOrder.id,
                "sell",
                price
            )
        ) {
            state.sellOrderId = placedOrder.id;
            state.sellPrice = price;
        }
    }

    private sleep(ms: number) {
        return new Promise<void>(resolve => {
            setTimeout(resolve, ms);
        });
    }
}