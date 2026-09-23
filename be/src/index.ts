import express from "express";
import cors from "cors";
import { z } from "zod";
import {prisma} from "../lib/prisma.ts"
import jwt from "jsonwebtoken";
import { WebSocket } from "ws";

import auth from "./middleware/auth.ts";
import { errorHandler } from "./middleware/error.ts";
import { orderService } from "./orderService.ts";
import { WebSocketServer } from "ws";
import {assetMap , orderBooks } from "./orderbook.ts";
import {balances,subscriptionsManager,candleManager } from "./state";
import { setupBots } from "./bots/setupBots";

const app = express();
const orderServiceObject = new orderService();
await balances.initialiseFromDatabase();
const botManager = await setupBots(orderServiceObject);
botManager.start();

const port = process.env.PORT!;
const jwt_secret = process.env.JWT_SECRET!;

app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173"
}));

type Status = "placed"|"cancelled"|"partiallyFilled"|"executed";
  

const signupSchema = z.object({
    username: z.string().min(8).max(30),
    password: z.string().min(8)
});

export const loginSchema = z.object({
    username: z.string().min(8).max(30),
    password: z.string().min(8)
});



app.post("/",(req,res)=>{
    res.json({
        "message":"hey there!"
    });
})


//----AUTH --------
app.post("/signup",async(req,res)=>{
    
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            error: result.error
        });
    }

    const { username, password } = result.data;

    const isExistingUser = await prisma.user.findUnique({
        where:{
            username:username
        }
    });
        if(isExistingUser){
            return res.status(400).json({
                "msg":"try another username"
        });
        }

        const hashedPassword = await Bun.password.hash(password);

        const user = await prisma.user.create({
                data:{
                    username,
                    password:hashedPassword
                }
        });

        balances.createAccount(user.id);

        return res.status(201).json({
            "msg":"account successfully created"
        });
    });





    app.post("/login", async (req, res) => {
    const result = signupSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            error: result.error
        });
    }

    const { username, password } = result.data;

    const user = await prisma.user.findUnique({
        where: {
            username
        }
    });

    if (!user) {
        return res.status(400).json({
            msg: "invalid credentials"
        });
    }

    const isValid = await Bun.password.verify(
        password,
        user.password
    );

    if (!isValid) {
        return res.status(400).json({
            msg: "invalid credentials"
        });
    }

    const token = jwt.sign(
        {
            id: user.id
        },
        jwt_secret
    );

    return res.status(200).json({
        token
    });
});
app.post("/faucet", auth, async (req, res) => {
    const userId = req.userId!;

    const USD_AMOUNT = 100_000;
    const ASSET_AMOUNT = 1_000;

    const assets = await prisma.asset.findMany();

    if (assets.length === 0) {
        return res.status(500).json({
            status: "failed",
            reason: "No assets exist"
        });
    }

    await prisma.$transaction(async (tx) => {
        // Add USD
        await tx.user.update({
            where: { id: userId },
            data: {
                usdBal: {
                    increment: USD_AMOUNT
                }
            }
        });

        // Add every asset
        for (const asset of assets) {
            const balance = await tx.balance.findFirst({
                where: {
                    userId,
                    assetId: asset.id
                }
            });

            if (balance) {
                await tx.balance.update({
                    where: {
                        id: balance.id
                    },
                    data: {
                        qty: {
                            increment: ASSET_AMOUNT
                        }
                    }
                });
            } else {
                await tx.balance.create({
                    data: {
                        userId,
                        assetId: asset.id,
                        qty: ASSET_AMOUNT,
                        lockedQty: 0
                    }
                });
            }
        }
    });

    // Keep in-memory balances in sync
    if (balances.getBalance(userId) === undefined) {
        balances.createAccount(userId);
    }

    balances.addBalance(
        userId,
        "usd",
        USD_AMOUNT
    );

    for (const asset of assets) {
        balances.addBalance(
            userId,
            asset.id,
            ASSET_AMOUNT
        );
    }

    return res.status(200).json({
        status: "successful",
        usd: USD_AMOUNT,
        assets: assets.map(asset => ({
            symbol: asset.Symbol,
            qty: ASSET_AMOUNT
        }))
    });
});

const orderSchema = z.object({
    assetId: z.string().uuid(),
    side: z.enum(["buy", "sell"]),
    price: z.number().int().positive(),
    qty: z.number().int().positive(),
});
//create an order.
app.post("/order", auth ,async (req,res)=>{
    const result = orderSchema.safeParse(req.body);
    //req.body will contain -> assetId, side , price, qty
    if(!result.success){
        return res.status(400).json({
                error: result.error
            });
    }
    const userId = req.userId!;
    
    const response = await orderServiceObject.placeOrder(result.data,userId);
    if(response.success === false){
        return res.status(400).json({
            "status":"failed",
            "reason":response.reason
        })
    }

    return res.status(201).json(response);

});


app.get("/orders",auth ,async (req,res)=>{
    const userId = req.userId!;
    const userOrders = await prisma.order.findMany({
        where:{
            userId:userId
        },
        orderBy:{
            created_at:"desc"
        }
    });

    return res.json(userOrders);
});

app.get("/asset", (req, res) => {
    const assets = Array.from(
        assetMap.entries()
    ).map(([id, symbol]) => ({
        id,
        symbol
    }));

    return res.status(200).json(assets);
});

app.get("/order/:orderId",auth, async (req,res)=>{
    const userId = req.userId;
    const orderId = req.params.orderId;

    if (typeof orderId !== "string") {
        return res.status(400).json({
            msg: "invalid order id"
        });
    }

    const order = await prisma.order.findFirst({
        where:{
            userId:userId,
            id:orderId
        }
    });
    if (order === null) {
        return res.status(404).json({
            status: "failed",
            msg: "order not found"
        });
    }
    return res.status(200).json(order);
});

app.delete("/order/:orderId", auth, async (req, res) => {
    const userId = req.userId!;
    const orderId = req.params.orderId;

    if (typeof orderId !== "string") {
        return res.status(400).json({
            msg: "invalid order id"
        });
    }

    const response = await orderServiceObject.cancelOrder(
        orderId,
        userId
    );

    if (!response.success) {
        return res.status(400).json({
            status: "failed",
            reason: response.reason
        });
    }

    return res.status(200).json(response);
});


//----MARKET DATA---
app.get("/depth/:symbol", async (req, res) => {
    const symbol = req.params.symbol;

    let assetId: string | undefined;

    for (const [id, assetSymbol] of assetMap) {
        if (assetSymbol === symbol) {
            assetId = id;
            break;
        }
    }

    if (assetId === undefined) {
        return res.status(404).json({
            status: "failed",
            reason: "asset not found"
        });
    }

    const orderBook = orderBooks.get(assetId);

    if (orderBook === undefined) {
        return res.status(404).json({
            status: "failed",
            reason: "orderbook not found"
        });
    }

     const depth = orderBook.getDepth();

    const lastFill = await prisma.fills.findFirst({
        where: {
            assetId
        },
        orderBy: {
            filled_at: "desc"
        }
    });
    return res.status(200).json({
        symbol,
        ...depth,
        price: lastFill?.price
    });
});

app.get("/candles/:symbol", async (req, res) => {
    const symbol = req.params.symbol;
    const timeframe = Number(req.query.timeframe);
    const limit = Number(req.query.limit) || 500;

    if (timeframe !== 60_000 && timeframe !== 900_000 && timeframe !== 3_600_000) {
        return res.status(400).json({
            status: "failed",
            reason: "invalid timeframe"
        });
    }

    const asset = await prisma.asset.findFirst({
        where: {
            Symbol: symbol
        }
    });

    if (!asset) {
        return res.status(404).json({
            status: "failed",
            reason: "asset not found"
        });
    }

    let candles;

    if (timeframe === 60_000) {
        candles = await prisma.candle_1m.findMany({
            where: {
                assetId: asset.id
            },
            orderBy: {
                timestamp: "desc"
            },
            take: limit
        });
    }

    if (timeframe === 900_000) {
        candles = await prisma.candle_15m.findMany({
            where: {
                assetId: asset.id
            },
            orderBy: {
                timestamp: "desc"
            },
            take: limit
        });
    }

    if (timeframe === 3_600_000) {
        candles = await prisma.candle_1h.findMany({
            where: {
                assetId: asset.id
            },
            orderBy: {
                timestamp: "desc"
            },
            take: limit
        });
    }

    candles!.reverse();

    return res.status(200).json(candles);
});


//--------ACCOUNT INFORMATION--------
app.get("/fills",auth,async(req,res)=>{
    const userId = req.userId!;
    
    const fills = await prisma.fills.findMany({
        where:{
            userId:userId
        }
    });

    return res.status(200).json(fills);

});
app.get("/balance/usd",auth, async(req,res)=>{
    const userId = req.userId;
    const user = await prisma.user.findFirst({
        where:{
            id:userId
        }
    });
    return res.json({
        balance:user?.usdBal
    });
});

app.get("/balance",auth,async(req,res)=>{
    const userId = req.userId;
    const balances = await prisma.balance.findMany({
        where:{
            userId
        }
    });
    return res.json(balances);
});

app.use(errorHandler);

const httpServer = app.listen(3000,()=>{
    console.log("HEEHeeeee zeee, listening on port "+ port);
});

export const wss = new WebSocketServer({
    server:httpServer
});

wss.on("connection",(ws)=>{
    console.log("WebSocket connection established");

    ws.on("message", (message) => {
        const msg = JSON.parse(message.toString());
        const stream = msg.stream;
        if(msg.type === "subscribe")subscriptionsManager.subscribe(msg.symbol, ws,stream);
        if(msg.type === "unsubscribe")subscriptionsManager.unsubscribe(msg.symbol, ws,stream);
    });

    ws.on("close", () => {
        console.log("WebSocket connection closed");
    });
})
