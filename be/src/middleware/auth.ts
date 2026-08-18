import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const jwt_secret = process.env.JWT_SECRET!;

interface JwtPayload {
    id: string;
}

const auth = (req: Request, res: Response, next: NextFunction) => {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            msg: "authentication required"
        });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            msg: "authentication required"
        });
    }

    try {
        const payload = jwt.verify(token, jwt_secret) as JwtPayload;

        req.userId = payload.id;

        next();

    } catch {
        return res.status(401).json({
            msg: "invalid or expired token"
        });
    }
};

export default auth;