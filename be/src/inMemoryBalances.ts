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

    getBalance(userId:string){
        const userBal = this.map.get(userId);
        return userBal;
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

    clone(userId:string){
        const userBal = this.map.get(userId);
        const clonedBal = new Map<string,Quantities>;
        if (userBal === undefined) {
            return undefined;
        }

        for(const asset of userBal.keys()){
            const val = userBal.get(asset);
            clonedBal.set(asset,{...val!});
        }
        return clonedBal;
    }

    commit(userId:string,userBal:Map<string,Quantities>){
        this.map.set(userId,userBal);
    }
}






