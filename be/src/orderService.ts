import { matchingEngine } from "./matchingEngine";
import { Order, orderBooks, OrderBook } from "./orderbook";
import { prisma } from "../lib/prisma";

class orderService {

    engine: matchingEngine;
    public constructor() {
        this.engine = new matchingEngine();
    }

    public async placeOrder(order: Order) {
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
                // Task 1 => update orders
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

                // Task 2 => create fillss
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

                // Task 3 => update asset bals
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

                // Task 4 => update USD balances
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

        // DB transaction succeeded => commit new order book
        orderBooks.set(order.assetId, res.newOrderBook);

        return res;
    }
}