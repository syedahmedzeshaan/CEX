//import {MinHeap , MaxHeap} from "heap-js";
import MinHeap from "heap-js";
import MaxHeap from "heap-js";
import {prisma} from "../lib/prisma";
interface Order {
    id: string;
    userId: string;
    assetId: string;
    side: "buy" | "sell";
    price: number;
    qty: number;
    filledQty: number;
    type: "maker" | "taker";
    created_at: Date;
    status: "placed" | "cancelled" | "partiallyFilled" | "executed";

}



class OrderBook {
    asks:Map<number,Order[]>;
    bids : Map<number,Order[]>;
    asksHeap : MinHeap<number>;
    bidsHeap : MaxHeap<number>;

    public constructor(){
        this.asks = new Map();
        this.bids = new Map();

        this.asksHeap = new MinHeap();
        this.bidsHeap = new MaxHeap();
    }

    public addOrder(order:Order){
        const price = order.price;
        const map = order.side === "buy" ? this.bids : this.asks ;
        const heap = order.side === "buy" ? this.bidsHeap : this.asksHeap;

        const ordersArr = map.get(price);

        if(ordersArr === undefined){
            map.set(price,[order]);
            heap.offer(price);
        }
        else{
            ordersArr.push(order);
        }

        return {
            success:true
        }
    }

    public removeOrder(order:Order){
        const orderId = order.id;
        const price = order.price;

        const map = order.side === "buy" ? this.bids : this.asks;
        const heap = order.side === "buy" ? this.bidsHeap : this.asksHeap;

        const orderArr = map.get(price);

        if(orderArr === undefined){
            return {
                success:false,
                reason:"PRICE_LEVEL_DOESNT_EXIST"
            }
        }

        const index = orderArr.findIndex(order=>order.id === orderId);

        if(index === -1){
            return {
                success:false,
                reason:"ORDER_DOESNT_EXIST"
            }
        }

        orderArr.splice(index,1);

        if(orderArr.length === 0){
            map.delete(price);
            heap.remove(price);
        }

        return {
            success:true
        }

    }


    public getBestBid(){
        const price = this.bidsHeap.peek();
        if(price === undefined){
            return {
                success:false,
                reason:"ORDERBOOK_IS_EMPTY"
            }
        }
        const orders = this.bids.get(price);

        if(!orders){
            return { 
                    success: false, 
                    reason: "ORDERBOOK_INCONSISTENT"
                };
        }

        return {
                    success: true, 
                    order: orders[0]
                };

    }

    public getBestAsk(){
        const price = this.asksHeap.peek();
        if(price === undefined){
            return {
                success:false,
                reason:"ORDERBOOK_IS_EMPTY"
            }
        }
        const orders = this.asks.get(price);

        if(!orders){
            return { 
                    success: false, 
                    reason: "ORDERBOOK_INCONSISTENT"
                };
        }

        return {
                    success: true, 
                    order: orders[0]
                };

    }

    public clone(): OrderBook {
        const copy = new OrderBook();
        copy.asks = new Map();
        for (const [price, orders] of this.asks) {          
            copy.asks.set(price,orders.map(order => ({ ...order })));  
        }
        copy.bids = new Map();
        for (const [price, orders] of this.bids) {          
            copy.bids.set(price,orders.map(order => ({ ...order })));  
        }
        copy.asksHeap = new MinHeap();
        for (const price of this.asksHeap.toArray()) {
            copy.asksHeap.offer(price);
        }
        copy.bidsHeap = new MaxHeap();
        for (const price of this.bidsHeap.toArray()) {
            copy.bidsHeap.offer(price);
        }
        return copy;
}


}




let orderBooks:Map<string,OrderBook> = new Map(); 
let assetMap:Map<string,string> = new Map();
async function initialiseOrderbooks(){
    const assets = await prisma.asset.findMany({
        select:{
            id:true,
            Symbol:true
        }
    });

    for (const asset of assets) {
        orderBooks.set(asset.id, new OrderBook());
        assetMap.set(asset.Symbol, asset.id);
    }
}

await initialiseOrderbooks();

export { assetMap, initialiseOrderbooks , Order ,orderBooks,OrderBook};