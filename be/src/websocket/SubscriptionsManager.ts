import { WebSocket } from "ws";

type stream = "depth"|"candles";


interface depthMessage{
    type:"depth";
    symbol:string;
    trades:{
        price:number;
        qty:number;
    }[];
    depth:{
        asks:{
        price:number;
        qty:number;
    }[];
        bids:{
        price:number;
        qty:number;
    }[]
    };
    price:number|undefined;

}

interface candlesMessage{
    type:"candles";
    symbol:string;
    candle:{
        timeframe: number;
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }
} 


export class SubscriptionsManager{

    //string -> symbol
    //BTC-{ws1,ws2}
    //ETH-{ws3,ws4}

    subscriptions:Map<string,Map<stream,Set<WebSocket>>>
    //string -> asset symbol
    //stream - depth or candles
    //set<ws> -> corresponding ws

    constructor(){
        this.subscriptions = new Map();
    }

    public subscribe(symbol:string,ws:WebSocket,stream:stream){
        // let clients = this.subscriptions.get(symbol);

        // if(clients === undefined){
        //     clients = new Set<WebSocket>();
        //     this.subscriptions.set(symbol,clients);
        // }

        // clients.add(ws);

        let subscriptions = this.subscriptions.get(symbol);
        if(subscriptions === undefined){
            subscriptions = new Map();
            this.subscriptions.set(symbol,subscriptions);
        }
        let client = subscriptions.get(stream);
        if(client === undefined){
            client = new Set<WebSocket>();
            subscriptions.set(stream,client);
        }
        client.add(ws);

    }

    public unsubscribe(symbol:string,ws:WebSocket,stream:stream){
        // const  = this.subscriptions.get(symbol);

        // if(clients === undefined)return;

        // clients.delete(ws);

        // if(clients.size === 0){
        //     this.subscriptions.delete(symbol);
        // }

        const subscriptions = this.subscriptions.get(symbol);
        if(subscriptions === undefined) return;
        let clients = subscriptions.get(stream);
        if(clients === undefined)return;
        clients.delete(ws);
        if(clients.size === 0){
            subscriptions.delete(stream);
        }
        if (subscriptions.size === 0) {
        this.subscriptions.delete(symbol);
}

    }

    public broadcast(symbol:string,message:candlesMessage|depthMessage,stream:stream){
        const subscriptions = this.subscriptions.get(symbol);
        if (subscriptions === undefined) return;

        const clients = subscriptions.get(stream);
        if (clients === undefined) return;

        for (const ws of clients){
            if(ws.readyState === WebSocket.OPEN){
                ws.send(JSON.stringify(message))
            }
        }
    }

    public removeConnection(ws:WebSocket){
        for (const [symbol, subscriptions] of this.subscriptions) {
            for (const [stream, clients] of subscriptions) {
                clients.delete(ws);
                if (clients.size === 0) {
                    subscriptions.delete(stream);
                }
            }
            if (subscriptions.size === 0) {
                this.subscriptions.delete(symbol);
            }

        }
        }
        
}