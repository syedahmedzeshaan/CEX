import { prisma } from "../../lib/prisma";
import { balances } from "../state";
import { assetMap } from "../orderbook";
import { orderService } from "../orderService";
import { BotManager } from "./botManager";
import { MarketMaker } from "./marketMaker";
import { RandomTrader } from "./randomTrader";

async function ensureBotAccount(username: string) {
    let user = await prisma.user.findUnique({
        where: { username }
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                username,
                password: await Bun.password.hash(
                    crypto.randomUUID()
                )
            }
        });
    }

    return user;
}

async function fundBot(
    userId: string,
    assetId: string
) {
    const USD_AMOUNT = 10_000_000;
    const ASSET_AMOUNT = 10_000;

    await prisma.user.update({
        where: { id: userId },
        data: {
            usdBal: {
                increment: USD_AMOUNT
            }
        }
    });

    const existingBalance = await prisma.balance.findFirst({
        where: {
            userId,
            assetId
        }
    });

    if (existingBalance) {
        await prisma.balance.update({
            where: {
                id: existingBalance.id
            },
            data: {
                qty: {
                    increment: ASSET_AMOUNT
                }
            }
        });
    } else {
        await prisma.balance.create({
            data: {
                userId,
                assetId,
                qty: ASSET_AMOUNT,
                lockedQty: 0
            }
        });
    }

    balances.addBalance(
        userId,
        "usd",
        USD_AMOUNT
    );

    balances.addBalance(
        userId,
        assetId,
        ASSET_AMOUNT
    );
}

function getInitialPrice(symbol: string) {
    switch (symbol) {
        case "BTC":
            return 100_000;

        case "SOL":
            return 200;

        case "ANTHROPIC":
            return 100;

        case "OPENAI":
            return 150;

        case "SPACEX":
            return 300;

        default:
            return 100;
    }
}

export async function setupBots(
    orderServiceObject: orderService
) {
    const botManager = new BotManager();

    const marketMakerUser =
        await ensureBotAccount("bot_market_maker");

    const buyerUser =
        await ensureBotAccount("bot_buyer");

    const sellerUser =
        await ensureBotAccount("bot_seller");

    const assets = [...assetMap.entries()];

    if (assets.length === 0) {
        throw new Error("No assets found for bots");
    }

    const assetIds = assets.map(
        ([assetId]) => assetId
    );

    for (const [assetId] of assets) {
        await fundBot(
            marketMakerUser.id,
            assetId
        );

        await fundBot(
            buyerUser.id,
            assetId
        );

        await fundBot(
            sellerUser.id,
            assetId
        );
    }

    const marketMakerAssets = assets.map(
        ([assetId, symbol]) => ({
            assetId,
            anchorPrice: getInitialPrice(symbol),
            spread: Math.max(
                1,
                Math.floor(
                    getInitialPrice(symbol) * 0.01
                )
            ),
            orderQty: 5,
            maxDeviation: Math.max(
                10,
                Math.floor(
                    getInitialPrice(symbol) * 0.20
                )
            ),
            movementSize: Math.max(
                1,
                Math.floor(
                    getInitialPrice(symbol) * 0.02
                )
            )
        })
    );

    botManager.addBot(
        new MarketMaker(
            {
                userId: marketMakerUser.id,
                assets: marketMakerAssets,
                checkInterval: 5_000
            },
            orderServiceObject
        )
    );

    botManager.addBot(
        new RandomTrader(
            {
                userId: buyerUser.id,
                assetIds,
                checkInterval: 7_000,
                tradeProbability: 0.35,
                buyProbability: 0.5
            },
            orderServiceObject
        )
    );

    botManager.addBot(
        new RandomTrader(
            {
                userId: sellerUser.id,
                assetIds,
                checkInterval: 9_000,
                tradeProbability: 0.35,
                buyProbability: 0.5
            },
            orderServiceObject
        )
    );

    console.log(
        `Bots configured for ${assets.length} assets:`,
        assets.map(([, symbol]) => symbol).join(", ")
    );

    return botManager;
}