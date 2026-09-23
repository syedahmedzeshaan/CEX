import { prisma } from "../lib/prisma.ts";

export interface Quantities{
    qty:number;
    lockedQty:number;
}

    // assets:Map<string,Quantities>
    //assets: cash, btc, sol , any other crypto or stock
    //string -> assetId , Quantities -> {}
    
export class inMemoryBalances{
    map:Map<string,Map<string,Quantities>>

    constructor(){
        this.map = new Map();
    }

    createAccount(userId:string){
        const usd = new Map<string , Quantities>();
        usd.set("usd",{
            qty:0,
            lockedQty:0
        });
        this.map.set(userId,usd);
    }

    async initialiseFromDatabase() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            usdBal: true,
            lockedBal: true
        }
    });

    const assetBalances = await prisma.balance.findMany({
        select: {
            userId: true,
            assetId: true,
            qty: true,
            lockedQty: true
        }
    });

    // Create an in-memory account for every user
    // and load their USD balance.
    for (const user of users) {
        const userBalance = new Map<string, Quantities>();

        userBalance.set("usd", {
            qty: user.usdBal,
            lockedQty: user.lockedBal
        });

        this.map.set(user.id, userBalance);
    }

    // Load BTC, ETH, etc. balances.
    for (const balance of assetBalances) {
        let userBalance = this.map.get(balance.userId);

        if (userBalance === undefined) {
            userBalance = new Map<string, Quantities>();
            this.map.set(balance.userId, userBalance);
        }

        userBalance.set(balance.assetId, {
            qty: balance.qty,
            lockedQty: balance.lockedQty
        });
    }

    console.log(
        `Loaded ${users.length} users into in-memory balances`
    );
}

    getBalance(userId:string){
        const userBal = this.map.get(userId);
        return userBal;
    }

    addBalance(userId: string,assetId: string,qty: number) {
            let userBalance = this.map.get(userId);
            if (userBalance === undefined) {
                this.createAccount(userId);
                userBalance = this.map.get(userId)!;
            }
            const balance = userBalance.get(assetId);
            if (balance === undefined) {
                userBalance.set(assetId, {
                    qty,
                    lockedQty: 0
                });
                return;
            }
            balance.qty += qty;
    }

    // updateBalance(userId:string,assetId:string,qty:number,lockedQty:number){
    //     const userAcc = bal.map.get(userId);
    //     if(userAcc === undefined){
    //         return {
    //             status:"failed",
    //             reason:"account does not exist",
    //             balance:null
    //         };
    //     }

    //     const userBal = userAcc.get(assetId);
    //     if(userBal === undefined){
    //         return {
    //             status:"failed",
    //             reason:"asset does not exist",
    //             balance:null
    //         };
    //     }

    //     userBal.qty+=qty;
    //     userBal.lockedQty+=lockedQty;

    // }

}






