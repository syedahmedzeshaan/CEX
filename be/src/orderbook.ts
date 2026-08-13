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



class Orderbook{
    asks:Map<Number,Order[]>
    bids:Map<Number,Order[]>
    askHeap:MinHeap<Number>;
    bidHeap:MaxHeap<Number>;
    price:Number;

    public constructor(){
        this.asks = new Map<Number,Order[]>;
        this.bids = new Map<Number,Order[]>;

        this.askHeap = new MinHeap();
        this.bidHeap = new MaxHeap();

        this.price = 0;

    }

    public addOrder(order:Order):void{
        let price = order.price;

        let map = order.side === "buy"?this.bids:this.asks;
        let heap = order.side === "buy"?this.bidHeap:this.askHeap;
        
        // if(!map.has(price)){
        //     let arr:Order[] = [];
        //     arr.push(order);
        //     map.set(price,arr);
        // }else{
        //     let arr = map.get(price)!;
        //     arr.push(order);
        //     map.set(price,arr);
        // }
        let orders = map.get(price);//returns null or reference to the array
    //optimisation -- apparently in ts, map.get() returns you a NOT a copy , but reference to the actual array itself
        if(orders){
            orders.push(order)
        }
        else{
            map.set(price,[order]);
            heap.offer(price);
        }

        
        return ;
    }

    public removeOrder(orderId:String,price:Number,side:"buy"|"sell"){
        const map = side ==="buy"? this.bids : this.asks;

        const orders = map.get(price);
        if(!orders){
            return { 
                    success: false, 
                    reason: "PRICE_LEVEL_NOT_FOUND"
                };
        }
        const index = orders.findIndex(order=>order.id === orderId);
        if(index === -1){
            return { 
                    success: false, 
                    reason: "ORDER_NOT_FOUND"
                };
        }
        orders.splice(index,1);

        if(orders.length === 0){
            map.delete(price);
        }

        return {
            success:true
        }
    }
    
    public getBestBid(){
        const bestBid = this.bidHeap.peek();
        if(bestBid === undefined){
            return { 
                    success: false, 
                    reason: "EMPTY_ORDERBOOK"
                };
        }
        const orders = this.bids.get(bestBid);
        if(!orders){
            return { 
                    success: false, 
                    reason: "PRICE_LEVEL_MISSING"
                };
        }
        
        return { 
                    success: false, 
                    order: orders[0]
                };
    }
    public getBestAsk(){
        const bestAsk = this.askHeap.peek();
        if(bestAsk === undefined){
            return { 
                    success: false, 
                    reason: "EMPTY_ORDERBOOK"
                };;
        }
        const orders = this.asks.get(bestAsk);
        if(orders === undefined){
            return  {
                    success: false, 
                    reason: "PRICE_LEVEL_MISSING"
                };    
        }
        return { 
                    success: true, 
                    order: orders[0]
                };
    }


}


let orderbooks:Map<string,Orderbook> = new Map(); 
let assetMap:Map<string,string> = new Map();
async function initialiseOrderbooks(){
    const assets = await prisma.asset.findMany({
        select:{
            id:true,
            Symbol:true
        }
    });

    for (const asset of assets) {
        orderbooks.set(asset.id, new Orderbook());
        assetMap.set(asset.Symbol, asset.id);
    }
}

export default orderbooks;