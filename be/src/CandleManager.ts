import { prisma } from "../lib/prisma";
import { candleManager, subscriptionsManager } from "./state";
import { assetMap } from "./orderbook";

type Trade = {
    assetId: string;
    price: number;
    qty: number;
    timestamp: Date;

};

type Candle = {
    assetId: string;
    timeframe: number;
    startTime: number;

    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;

};

export class CandleManager{
    candles:Map<string,Map<number,Candle>>
    constructor(){
        this.candles = new Map();
    }

    public processTrade(trade:Trade){
        const timeframes = [60_000, 900_000, 3_600_000];

        let assetCandles = this.candles.get(trade.assetId);

        if(assetCandles === undefined){
            assetCandles = new Map();
            this.candles.set(trade.assetId,assetCandles);
        }

        for (const timeframe of timeframes){
            const timestamp = trade.timestamp.getTime();
            const startTime = Math.floor(timestamp / timeframe) * timeframe;
            const existingCandle = assetCandles.get(timeframe);

            if (existingCandle === undefined) { // no candle exists
                const candle: Candle = {
                    assetId: trade.assetId,
                    timeframe: timeframe,
                    startTime: startTime,
                    open: trade.price,
                    high: trade.price,
                    low: trade.price,
                    close: trade.price,
                    volume: trade.qty

                };
                assetCandles.set(timeframe, candle);
                this.broadcastCandle(candle);
                continue;
            }
            if (startTime > existingCandle.startTime) { //new time slot , new candle
                this.closeCandle(existingCandle);
                const candle: Candle = {
                    assetId: trade.assetId,
                    timeframe: timeframe,
                    startTime: startTime,
                    open: trade.price,
                    high: trade.price,
                    low: trade.price,
                    close: trade.price,
                    volume: trade.qty

                };
                assetCandles.set(timeframe, candle);
                this.broadcastCandle(candle);
                continue;

            }

            existingCandle.high = Math.max(existingCandle.high, trade.price);
            existingCandle.low = Math.min(existingCandle.low,trade.price      );
            existingCandle.close = trade.price;
            existingCandle.volume += trade.qty;
            this.broadcastCandle(existingCandle);
        }

        
    }

    private broadcastCandle(candle: Candle) {
        const symbol = assetMap.get(candle.assetId)!;
        subscriptionsManager.broadcast(candle.assetId,{
                type: "candles",
                symbol:symbol,
                candle: {
                    timeframe: candle.timeframe,
                    timestamp: candle.startTime,
                    open: candle.open,
                    high: candle.high,
                    low: candle.low,
                    close: candle.close,
                    volume: candle.volume
                }
            },
            "candles"
        );
}

    private closeCandle(candle: Candle) {
    console.log("CANDLE CLOSED", candle);

    this.persistCandle(candle)
        .catch(err => {
            console.error(
                "CANDLE_PERSIST_FAILED",
                candle,
                err
            );
        });
}

private async persistCandle(candle: Candle) {
    const data = {
        assetId: candle.assetId,
        timestamp: new Date(candle.startTime),
        O: candle.open,
        H: candle.high,
        L: candle.low,
        C: candle.close,
        volume: candle.volume
    };

    if (candle.timeframe === 60_000) {
        await prisma.candle_1m.create({ data });
    }

    if (candle.timeframe === 900_000) {
        await prisma.candle_15m.create({ data });
    }

    if (candle.timeframe === 3_600_000) {
        await prisma.candle_1h.create({ data });
    }
}
}