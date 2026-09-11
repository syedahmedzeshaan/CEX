import { matchingEngine } from "./matchingEngine";
import { Order, orderBooks, OrderBook } from "./orderbook";
import { prisma } from "../lib/prisma";
type side = "buy"|"sell";
type reqBody = {
    assetId:string,
    side:side,
    qty:number,
    price:number
};
export class orderService {

    engine: matchingEngine;
    public constructor() {
        this.engine = new matchingEngine();
    }

    public async placeOrder(reqBody:reqBody,userId:string) {

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
        const res = this.engine.match(order);

        if (!res.success) {
            return res;
        }

        if (res.newOrderBook === undefined) {
            return {
                success: false,
                reason: "NEW_ORDERBOOK_UNDEFINED"
            };
        }

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
            return {
                success: false,
                reason: "TRANSACTION_FAILED"
            };
        }

        orderBooks.set(order.assetId, res.newOrderBook);
        return {
            success: true,
            order: res.incomingOrder,
            fills: res.fills
        };
    }
}