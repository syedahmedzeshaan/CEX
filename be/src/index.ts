import express from "express";
import cors from "cors";
import { z } from "zod";
import {prisma} from "../lib/prisma.ts"
import jwt from "jsonwebtoken";

import auth from "./auth.ts";
import { errorHandler } from "./error.ts";

const app = express();

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
    type: z.enum(["maker", "taker"])

});

app.post("/order", auth ,async (req,res)=>{
    const result = orderSchema.safeParse(req.body);
    if(!result.success){
        return res.status(400).json({
                error: result.error
            });
    }
    const userId = req.userId!;
    const {assetId,side,price,qty,type} = result.data;


    const order = await prisma.order.create({
        data:{
        userId,
        assetId,
        side,
        price,
        qty,
        type,
        created_at:new Date(),
        status:"placed"
    }
    });

});


app.get("/orders",(req,res)=>{});
app.get("/order/:orderId",(req,res)=>{});
app.delete("/order/:orderId",(req,res)=>{});

//----MARKET DATA---
app.get("/depth/:symbol",(req,res)=>{});


//--------ACCOUNT INFORMATION--------
app.get("/fills",(req,res)=>{});
app.get("/balance/usd",(req,res)=>{});
app.get("/balance",(req,res)=>{});

app.use(errorHandler);

app.listen(port,()=>{
    console.log("HEEHe, listening on port "+ port);
});
