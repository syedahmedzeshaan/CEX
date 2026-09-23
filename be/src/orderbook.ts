//import {MinHeap , MaxHeap} from "heap-js";
import { Heap } from "heap-js";
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
    asksHeap : Heap<number>;
    bidsHeap : Heap<number>;

    public constructor(){
        this.asks = new Map();
        this.bids = new Map();

        this.asksHeap = new Heap<number>((a,b)=>a-b); 
        this.bidsHeap = new Heap<number>((a,b)=>b-a); 
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
        };
    }

    const orders = this.bids.get(price);


    if(!orders){
        return {
            success:false,
            reason:"ORDERBOOK_INCONSISTENT"
        };
    }

    return {
        success:true,
        order:orders[0]
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

   public getDepth(){
    const asks = [];
    const bids = [];
    
    for(const [price,orders] of this.asks){
        let qty = 0;

        for(const order of orders){

            if(order.filledQty > order.qty){
                console.error("INVALID ASK ORDER STATE", {
                    orderId: order.id,
                    price: order.price,
                    qty: order.qty,
                    filledQty: order.filledQty,
                    side: order.side,
                    status: order.status
                });
            }

            qty += order.qty - order.filledQty;
        }

        asks.push({
            price: price,
            qty: qty
        });
    }

    for(const [prices,orders] of this.bids){
        let qty = 0;

        for(const order of orders){

            if(order.filledQty > order.qty){
                console.error("INVALID BID ORDER STATE", {
                    orderId: order.id,
                    price: order.price,
                    qty: order.qty,
                    filledQty: order.filledQty,
                    side: order.side,
                    status: order.status
                });
            }

            qty += order.qty - order.filledQty;
        }

        bids.push({
            price: prices,
            qty: qty
        });
    }

    asks.sort((a, b) => a.price - b.price);
    bids.sort((a, b) => b.price - a.price);

    return { asks, bids };
}
    public hasOrder(orderId: string, side: "buy" | "sell", price: number) {
            const map = side === "buy" ? this.bids : this.asks;
            const orders = map.get(price);
            if (!orders) return false;
            return orders.some(order => order.id === orderId);
}

    

    

}




let orderBooks:Map<string,OrderBook> = new Map(); 
let assetMap:Map<string,string> = new Map();
async function initialiseOrderbooks() {
    const assets = await prisma.asset.findMany({
        select: {
            id: true,
            Symbol: true
        }
    });

    for (const asset of assets) {
        const orderBook = new OrderBook();

        orderBooks.set(asset.id, orderBook);
        assetMap.set(asset.id, asset.Symbol);

        const activeOrders = await prisma.order.findMany({
            where: {
                assetId: asset.id,
                status: {
                    in: ["placed", "partiallyFilled"]
                }
            },
            orderBy: {
                created_at: "asc"
            }
        });

        for (const order of activeOrders) {
            orderBook.addOrder({
                id: order.id,
                userId: order.userId,
                assetId: order.assetId,
                side: order.side,
                price: order.price,
                qty: order.qty,
                filledQty: order.filledQty,
                type: order.type,
                created_at: order.created_at,
                status: order.status
            });
        }
    }
}

await initialiseOrderbooks();

export { assetMap, initialiseOrderbooks , Order ,orderBooks,OrderBook};