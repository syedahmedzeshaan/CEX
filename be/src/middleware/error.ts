import { Request, Response, NextFunction } from "express";

export const errorHandler = (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error(err);

    return res.status(500).json({
        msg: "internal server error"
    });
};