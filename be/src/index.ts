import express from "express";
import cors from "cors";
import { z } from "zod";
import {prisma} from "../lib/prisma.ts"
import jwt from "jsonwebtoken";

import auth from "./middleware/auth.ts";
import { errorHandler } from "./middleware/error.ts";
import { orderService } from "./orderService.ts";
import { inMemoryBalances } from "./inMemoryBalances.ts";

const app = express();
const orderServiceObject = new orderService();

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

export const userBalances = new BalanceManager();

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

        userBalances.balances.set(user.id, {
            usdBal: 0,
            lockedBal: 0,
            assets: new Map()
        });

        return res.status(201).json({
            "msg":"account successfully created"
        });
    });





    app.post("/login",async(req,res)=>{
        const result = signupSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: result.error
            });
        }

        const { username, password } = result.data;

        const user = await prisma.user.findUnique({
            where:{
                username
            }
        });

        if(!user){
            return res.status(400).json({
                "msg":"invalid credentials"
        });
        }

        const isValid = await Bun.password.verify(password,user.password);

        if(!isValid){
            return res.status(400).json({
                "msg":"invalid credentials"
        });
        }

        const token = jwt.sign({
            id:user.id
        },jwt_secret);

        return res.status(204).json({
            token
        });
    });


//----ORDER --------

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


app.delete("/order/:orderId",auth,async (req,res)=>{
    const userId = req.userId;
    const orderId = req.params.orderId;
    if(typeof orderId !== "string"){
        return res.status(400).json({
            msg: "invalid order id"
        });
    }
    const order = await prisma.order.findFirst({
        where:{
            id:orderId,
            userId:userId
        }
    });
    if(order === undefined){
        return res.status(400).json({
            status:"failed",
            reason:"order doesnt exist"
        });
    }
    await prisma.order.delete({
        where:{
            id:orderId
        }
    });
    return res.status(204).json({
        status:"successful",
    })
});

//----MARKET DATA---
app.get("/depth/:symbol",(req,res)=>{});


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

app.listen(port,()=>{
    console.log("HEEHe, listening on port "+ port);
});
