import { matchingEngine } from "./matchingEngine";
import { assetMap, Order, OrderBook } from "./orderbook";
import { prisma } from "../lib/prisma";
import { orderBooks } from "./orderbook";
import { balances,candleManager,subscriptionsManager } from "./state";

type side = "buy"|"sell";
type reqBody = {
    assetId:string,
    side:side,
    qty:number,
    price:number
};

const persistanceQueue = new Map<string , Promise<void>>();

export class orderService {
    engine: matchingEngine;
    public constructor() {
        this.engine = new matchingEngine();
    }

    private onPersistFailure(res: any, err: unknown) {
        console.error("PERSIST_FAILED", res.incomingOrder.id, err);
        // TODO: write res to an outbox table / retry queue so a crash
    }

    private enqueuePersist(assetId:string,res:any){
        const prev = persistanceQueue.get(assetId)??Promise.resolve();

        const next = prev
                        .then(()=>this.persist(res))
                        .catch((err)=>this.onPersistFailure(res,err));

        persistanceQueue.set(assetId,next);
        return next;
    }

    public placeOrder(reqBody:reqBody,userId:string) {

        const order:Order = {
                id:crypto.randomUUID(),
                userId: userId,
                assetId: reqBody.assetId,
                side: reqBody.side,
                price: reqBody.price,
                qty: reqBody.qty ,
                filledQty: 0 ,
                type: "taker" ,
                created_at: new Date(),
                status: "placed" 
        }

        const userBalances = balances.getBalance(order.userId);

        if(userBalances === undefined){
            return {
                success: false,
                reason: "USERBALANCES_UNDEFINED"
            };
        }

        const res = this.engine.match(order,userBalances);

        if (!res.success) {
            return res;
        }


        let trades:{
            price:number,
            qty:number
        }[] = [];

        for(let i = 0;i<res.fills.length; i+=2){
            let fill = res.fills[i]!;
            trades.push({
                price:fill.price,
                qty:fill.filledQty
            });
            const trade = {
                assetId: order.assetId,
                price: fill.price,
                qty: fill.filledQty,
                timestamp: fill.filled_at
                };
            candleManager.processTrade(trade);
        }
        const len = res.fills.length;
        const tradePrice = res.fills.at(-1)?.price;
        const {asks,bids} = orderBooks.get(order.assetId)!.getDepth();

        subscriptionsManager.broadcast(assetMap.get(order.assetId)!,{
            type:"depth",
            symbol:assetMap.get(order.assetId)!,
            trades:trades,
            depth:{
                asks:asks,
                bids:bids
            },
            price:tradePrice
        },"depth");

        this.enqueuePersist(order.assetId ,res);
        const userFills = res.fills.filter(fill=>fill.userId === res.incomingOrder.userId);

        return {
            success: true,
            order: res.incomingOrder,
            fills: userFills
        };
    }



    public async cancelOrder(orderId: string, userId: string) {
    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
            userId: userId
        }
    });

    if (!order) {
        return {
            success: false,
            reason: "ORDER_NOT_FOUND"
        };
    }

    if (order.status !== "placed" && order.status !== "partiallyFilled") {
        return {
            success: false,
            reason: "ORDER_NOT_CANCELLABLE"
        };
    }

    const orderBook = orderBooks.get(order.assetId);

    if (!orderBook) {
        return {
            success: false,
            reason: "ORDERBOOK_UNDEFINED"
        };
    }

    const removeResult = orderBook.removeOrder(order);

    if (!removeResult.success) {
        return {
            success: false,
            reason: removeResult.reason
        };
    }

    const remainingQty = order.qty - order.filledQty;
    const userBalances = balances.getBalance(userId);

    if (!userBalances) {
        return {
            success: false,
            reason: "USERBALANCES_UNDEFINED"
        };
    }

    if (order.side === "buy") {
        const usdBalance = userBalances.get("usd");

        if (!usdBalance) {
            return {
                success: false,
                reason: "USD_BALANCE_UNDEFINED"
            };
        }

        const lockedAmount = order.price * remainingQty;
        usdBalance.lockedQty -= lockedAmount;
    } else {
        const assetBalance = userBalances.get(order.assetId);

        if (!assetBalance) {
            return {
                success: false,
                reason: "ASSET_BALANCE_UNDEFINED"
            };
        }

        assetBalance.lockedQty -= remainingQty;
    }

    order.status = "cancelled";

    const { asks, bids } = orderBook.getDepth();
    const symbol = assetMap.get(order.assetId)!;

    subscriptionsManager.broadcast(
        symbol,
        {
            type: "depth",
            symbol,
            trades: [],
            depth: {
                asks,
                bids
            },
            price:undefined
        },
        "depth",
        
    );

    this.enqueueCancelPersist(order);

    return {
        success: true,
        order
    };
}



    private async persist(res:any){

        try {
            await prisma.$transaction(async (tx) => {

                //Task1 create incomingOrder
                await tx.order.create({
                    data:res.incomingOrder
                });

                // Task 2 => update orders
                for (const orderObj of res.ordersToUpdate.values()) {
                    await tx.order.update({
                        where: {
                            id: orderObj.id
                        },
                        data: {
                            filledQty: orderObj.filledQty,
                            status: orderObj.status
                        }
                    });
                }

                // Task 3 => create fillss
                if (res.fills.length > 0) {
                    await tx.fills.createMany({
                        data: res.fills
                    });
                }
                    // this would usually be
                    // for (const fill in res.fills){
                    //          await tx.fills.create({
                    //               data:fill             
                    //          })
                    //several db calls
                    // but we replace this with one createMany()
                    //}

                // Task 4 => update asset bals
                for (const update of res.assetBalanceUpdates.values()) {
                    await tx.balance.updateMany({
                        where: {
                            userId: update.userId,
                            assetId: update.assetId
                        },
                        data: {
                            qty: {
                                increment: update.assetBalance
                            },
                            lockedQty: {
                                increment: update.assetLockedBalance
                            }
                        }
                    });
                }

                // Task 5 => update USD balances
                for (const update of res.usdBalanceUpdates.values()) {
                    await tx.user.update({
                        where: {
                            id: update.userId
                        },
                        data: {
                            usdBal: {
                                increment: update.usdBalance
                            },
                            lockedBal: {
                                increment: update.lockedBalance
                            }
                        }
                    });
                }
            });
        } catch (err) {
             throw err;
        }
    }

    private enqueueCancelPersist(order: Order) {
    const prev = persistanceQueue.get(order.assetId) ?? Promise.resolve();

    const next = prev
        .then(async () => {
            await prisma.$transaction(async (tx) => {
                await tx.order.update({
                    where: {
                        id: order.id
                    },
                    data: {
                        status: "cancelled"
                    }
                });

                if (order.side === "buy") {
                    const remainingQty = order.qty - order.filledQty;
                    const lockedAmount = order.price * remainingQty;

                    await tx.user.update({
                        where: {
                            id: order.userId
                        },
                        data: {
                            lockedBal: {
                                decrement: lockedAmount
                            }
                        }
                    });
                } else {
                    const remainingQty = order.qty - order.filledQty;

                    await tx.balance.updateMany({
                        where: {
                            userId: order.userId,
                            assetId: order.assetId
                        },
                        data: {
                            lockedQty: {
                                decrement: remainingQty
                            }
                        }
                    });
                }
            });
        })
        .catch((err) => {
            console.error("CANCEL_PERSIST_FAILED", order.id, err);
        });

    persistanceQueue.set(order.assetId, next);
}
}