import { Fills } from "../generated/prisma/browser";
import {orderBooks,Order,OrderBook} from "./orderbook";


interface usdBalanceUpdate{
    userId:string;
    usdBalance:number;
    lockedBalance:number;
};

interface assetBalanceUpdate{
    userId:string;
    assetId:string;
    assetBalance:number;
    assetLockedBalance:number;
};

//for refernce , if matching goes right return an object of this type
interface MatchingResult {

    success: boolean;
    reason: string;
    ordersToUpdate: Map<string,Order>;
    fills: Fills[];
    usdBalanceUpdates: Map<string, usdBalanceUpdate>;
    assetBalanceUpdates: Map<string, assetBalanceUpdate>;
    newOrderBook:OrderBook|undefined


}


export class matchingEngine{

    public initialiseResult(){
        let matchingResult: MatchingResult = {
                success: true,
                reason:"",
                ordersToUpdate:new Map(),
                fills: [],
                usdBalanceUpdates: new Map(),
                assetBalanceUpdates: new Map(),
                newOrderBook:undefined
            };
        return matchingResult;
    }

    private addUsdBalanceUpdate(updates: Map<string, usdBalanceUpdate>, update: usdBalanceUpdate) {
        const existing = updates.get(update.userId);

        if (existing) {
            existing.usdBalance += update.usdBalance;
            existing.lockedBalance += update.lockedBalance;
        } else {
            updates.set(update.userId, { ...update });
        }
    }

    private addAssetBalanceUpdate(updates: Map<string, assetBalanceUpdate>,update: assetBalanceUpdate) {
        const existing = updates.get(update.userId + ":" + update.assetId);
        if (existing) {
            existing.assetBalance += update.assetBalance;
            existing.assetLockedBalance += update.assetLockedBalance;
        } else {
            updates.set(
                update.userId + ":" + update.assetId,
                { ...update }
            );
        }
    }

    public match(order:Order){

        let matchingResult = this.initialiseResult();
        const incomingOrder = {...order};
        if (incomingOrder.qty < 0 || incomingOrder.filledQty < 0 || incomingOrder.filledQty > incomingOrder.qty) {
            matchingResult.success = false;
            matchingResult.reason = "INVALID_INCOMING_ORDER";
            return matchingResult;
        }
        const assetOrderBook = orderBooks.get(incomingOrder.assetId);

        if(assetOrderBook === undefined){
            matchingResult.success= false;
            matchingResult.reason = "ORDERBOOK_UNDEFINED";
            return matchingResult;
        }
        const orderBook =  assetOrderBook.clone();

        if(orderBook === undefined){
            matchingResult.success= false;
            matchingResult.reason = "ORDERBOOK_UNDEFINED";
            return matchingResult;
        }
        
        matchingResult.newOrderBook = orderBook;

        if(incomingOrder.side === "buy")
        {
            let remainingQty = incomingOrder.qty - incomingOrder.filledQty;

            while(remainingQty > 0){

                const res = orderBook.getBestAsk();
                if(!res.success){
                    if (res.reason === "ORDERBOOK_IS_EMPTY") {
                        break;
                }
                matchingResult.success = false;
                matchingResult.reason = res.reason ?? "FAILED_TO_RETRIEVE_BEST_BID";
                return matchingResult;
                }

                let bestAsk = res.order;
                if(bestAsk === undefined){
                    matchingResult.success= false;
                    matchingResult.reason = "ORDERBOOK_INCONSISTENT";
                    return matchingResult;
                }
                
                let restingOrder = {...bestAsk};
                if (restingOrder.price > incomingOrder.price) {
                        break;
                    }

                if (restingOrder.filledQty < 0 || restingOrder.filledQty >= restingOrder.qty) {
                    matchingResult.success = false;
                    matchingResult.reason = "INVALID_RESTING_ORDER";
                    return matchingResult;
                }

                let availableQty = restingOrder.qty - restingOrder.filledQty;
                let filledQty = Math.min(remainingQty,availableQty);

                //update quantities
                incomingOrder.filledQty += filledQty;
                restingOrder.filledQty += filledQty;
                remainingQty -= filledQty;
                


                //update resting order statuses
                if(restingOrder.filledQty === restingOrder.qty){
                    restingOrder.status = "executed";
                    //matchingResult.ordersToRemove.push(restingOrder);
                    matchingResult.ordersToUpdate.set(restingOrder.id,restingOrder);
                    const removeResult = orderBook.removeOrder(restingOrder);
                    if (!removeResult.success) {
                        matchingResult.success = false;
                        matchingResult.reason = removeResult.reason!;
                        return matchingResult;
                    }

                }
                else{
                    restingOrder.status = "partiallyFilled";
                    matchingResult.ordersToUpdate.set(restingOrder.id,restingOrder);
                    const orders = orderBook.asks.get(restingOrder.price);
                    if (orders === undefined) {
                                matchingResult.success= false;
                                matchingResult.reason = "ORDERBOOK_INCONSISTENT";
                                return matchingResult;
                            }

                    const index = orders.findIndex(order => order.id === restingOrder.id);
                    if (index === -1) {
                        matchingResult.success = false;
                        matchingResult.reason = "ORDERBOOK_INCONSISTENT";
                        return matchingResult;
                    }
                    orders.splice(index, 1, restingOrder);
                                            
                }

                
                
                //create fills for buyer and seller
                let buyersFill: Fills = {
                    id: crypto.randomUUID(),
                    orderId: incomingOrder.id,
                    assetId: incomingOrder.assetId,
                    filledQty: filledQty,
                    side: "buy",
                    type: "taker",
                    price: restingOrder.price,
                    filled_at: new Date()

                };

                let sellersFill: Fills = {
                    id: crypto.randomUUID(),
                    orderId: restingOrder.id,
                    assetId: restingOrder.assetId,
                    filledQty: filledQty,
                    side: "sell",
                    type: "maker",
                    price: restingOrder.price,
                    filled_at: new Date()

                };
                matchingResult.fills.push(buyersFill);
                matchingResult.fills.push(sellersFill);
                
                //update usdc balances
                let sellerBalance = {
                    userId : restingOrder.userId,
                    usdBalance : restingOrder.price * filledQty, 
                    lockedBalance:0

                }

                let buyersBalance = {
                    userId : incomingOrder.userId,
                    usdBalance : -(restingOrder.price * filledQty),// should be usdBalance -= restingOrder.price * filledQty,
                    lockedBalance:-(restingOrder.price * filledQty)
                }

                this.addUsdBalanceUpdate(matchingResult.usdBalanceUpdates,sellerBalance);
                this.addUsdBalanceUpdate(matchingResult.usdBalanceUpdates,buyersBalance);

                let sellerAssetBalance = {
                    userId:restingOrder.userId,
                    assetId:restingOrder.assetId,
                    assetBalance : -filledQty , 
                    assetLockedBalance: -filledQty , //should also be assetQty - filledQty
                }
                let buyerAssetBalance = {
                    userId:incomingOrder.userId,
                    assetId:incomingOrder.assetId,
                    assetBalance : filledQty , //should be assetQty + filledQty
                    assetLockedBalance: 0 , //should also be assetQty - filledQty
                }


                this.addAssetBalanceUpdate(matchingResult.assetBalanceUpdates, sellerAssetBalance);
                this.addAssetBalanceUpdate(matchingResult.assetBalanceUpdates, buyerAssetBalance);
            }

                //update incming order statuses
                if (incomingOrder.filledQty === incomingOrder.qty) {
                    incomingOrder.status = "executed";
                } else if (incomingOrder.filledQty > 0) {
                    incomingOrder.status = "partiallyFilled";
                } else {
                    incomingOrder.status = "placed";
                }
                matchingResult.ordersToUpdate.set(incomingOrder.id,incomingOrder);
                
                if (remainingQty > 0) {
                    orderBook.addOrder(incomingOrder);
                    //matchingResult.ordersToAdd.push(incomingOrder);

                }

                
        }
        if(incomingOrder.side === "sell"){

            let remainingQty = incomingOrder.qty - incomingOrder.filledQty;
            while(remainingQty > 0){

                const res = orderBook.getBestBid();
                if(!res.success){
                    if (res.reason === "ORDERBOOK_IS_EMPTY") {
                        break;
                }
                matchingResult.success = false;
                matchingResult.reason = res.reason ?? "FAILED_TO_RETRIEVE_BEST_BID";
                return matchingResult;
                }

                const bestBid = res.order;
                if(bestBid === undefined){
                    matchingResult.success = false;
                    matchingResult.reason = "ORDERBOOK_INCONSISTENT";
                    return matchingResult;
                }

                const restingOrder = {...bestBid};

                 if (restingOrder.filledQty < 0 || restingOrder.filledQty >= restingOrder.qty) {
                    matchingResult.success = false;
                    matchingResult.reason = "INVALID_RESTING_ORDER";
                    return matchingResult;
                }
                //incomingOrder -> sell and restingOrder -> buy
                if(incomingOrder.price > restingOrder.price ){
                    break;
                }
                let availableQty = restingOrder.qty - restingOrder.filledQty;
                let fillQty = Math.min(availableQty,remainingQty);

                //step 1 update quantities

                incomingOrder.filledQty += fillQty;
                restingOrder.filledQty += fillQty;
                remainingQty -= fillQty;

                //techincally remainingQty will never go less zero as fillQty is min of remainingQty && availQty
               

                if(restingOrder.filledQty === restingOrder.qty){
                    restingOrder.status = "executed";
                    matchingResult.ordersToUpdate.set(restingOrder.id,restingOrder);
                    //matchingResult.ordersToRemove.push(restingOrder);
                    const removeResult = orderBook.removeOrder(restingOrder);
                    if (!removeResult.success) {
                        matchingResult.success = false;
                        matchingResult.reason = removeResult.reason!;
                        return matchingResult;
                    }
                    
                }

                else { //if(restingOrder.filledQty < restingOrder.qty){
                    restingOrder.status = "partiallyFilled";
                    matchingResult.ordersToUpdate.set(restingOrder.id,restingOrder);
                    const orders = orderBook.bids.get(restingOrder.price);
                    if (orders === undefined) {
                                matchingResult.success= false;
                                matchingResult.reason = "ORDERBOOK_INCONSISTENT";
                                return matchingResult;
                            }

                    const index = orders.findIndex(order => order.id === restingOrder.id);
                    if (index === -1) {
                        matchingResult.success = false;
                        matchingResult.reason = "ORDERBOOK_INCONSISTENT";
                        return matchingResult;
                    }

                    orders.splice(index, 1, restingOrder);
                }

                //step 2 update balances

                const tradeVal = fillQty * restingOrder.price;

                let buyerUpdate = {
                    userId:restingOrder.userId,
                    usdBalance:-(tradeVal),
                    lockedBalance:-(tradeVal)
                };

                let sellerUpdate = {
                    userId:incomingOrder.userId,
                    usdBalance:(tradeVal),
                    lockedBalance:0
                };

                this.addUsdBalanceUpdate(matchingResult.usdBalanceUpdates,sellerUpdate);
                this.addUsdBalanceUpdate(matchingResult.usdBalanceUpdates,buyerUpdate);

                let buyerAssetBalance = {
                    userId: restingOrder.userId,
                    assetId:restingOrder.assetId,
                    assetBalance: fillQty,
                    assetLockedBalance : 0
                }

                let sellerAssetBalance = {
                    userId: incomingOrder.userId,
                    assetId:incomingOrder.assetId,
                    assetBalance: -(fillQty),
                    assetLockedBalance : -(fillQty)
                }

               this.addAssetBalanceUpdate(matchingResult.assetBalanceUpdates, sellerAssetBalance);
               this.addAssetBalanceUpdate(matchingResult.assetBalanceUpdates, buyerAssetBalance);

                
                //step 3 create fills

                let buyersFill:Fills = {
                    id:crypto.randomUUID(),
                    orderId:restingOrder.id,
                    assetId:restingOrder.assetId,
                    price:restingOrder.price,
                    side:"buy",
                    type:"maker",
                    filledQty:fillQty,
                    filled_at:new Date()
                }

                let sellersFill:Fills = {
                    id:crypto.randomUUID(),
                    orderId:incomingOrder.id,
                    assetId:incomingOrder.assetId,
                    price:restingOrder.price,
                    filledQty:fillQty,
                    side:"sell",
                    type:"taker",
                    filled_at:new Date(),
                }

                matchingResult.fills.push(sellersFill);
                matchingResult.fills.push(buyersFill);

            }

            if(incomingOrder.filledQty === incomingOrder.qty){
                incomingOrder.status = "executed";
            }
            else if(incomingOrder.filledQty >0){
                incomingOrder.status = "partiallyFilled";
            }
            else{
                incomingOrder.status = "placed";
            }
             matchingResult.ordersToUpdate.set(incomingOrder.id,incomingOrder);

            if (remainingQty > 0) {
                orderBook.addOrder(incomingOrder);
            }

           
        }

        return matchingResult;
    }

    public commit(assetId:string, newOrderBook:OrderBook){
        if(!assetId || !newOrderBook){
            return {
                success: false,
                reason: "INVALID_COMMIT"
            };
        }
        orderBooks.set(assetId,newOrderBook);
        return {
            success: true,
            reason: "YOU_NEED_A_REASON_FOR_SUCCESS?   >_<"
        };
    }
}