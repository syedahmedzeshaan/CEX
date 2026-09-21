import { WebSocket } from "ws";

interface message{
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
    }

}
export class SubscriptionsManager{
    subscriptions:Map<string,Set<WebSocket>>

    //string -> symbol
    //BTC-{ws1,ws2}
    //ETH-{ws3,ws4}

    constructor(){
        this.subscriptions = new Map();
    }

    public subscribe(symbol:string,ws:WebSocket){
        let clients = this.subscriptions.get(symbol);

        if(clients === undefined){
            clients = new Set<WebSocket>();
            this.subscriptions.set(symbol,clients);
        }

        clients.add(ws);
    }

    public unsubscribe(symbol:string,ws:WebSocket){
        const clients = this.subscriptions.get(symbol);

        if(clients === undefined)return;

        clients.delete(ws);

        if(clients.size === 0){
            this.subscriptions.delete(symbol);
        }
    }

    public broadcast(symbol:string,message:message){
        const clients = this.subscriptions.get(symbol);
        if(clients === undefined){
            return;
        }
        for (const ws of clients){
            if(ws.readyState === WebSocket.OPEN){
                ws.send(JSON.stringify(message))
            }
        }
    }

    public removeConnection(ws:WebSocket){
        for( const [sym,clients] of this.subscriptions){
            clients.delete(ws);
            if (clients.size === 0) {
                this.subscriptions.delete(sym);
            }
    }
        }
        
}