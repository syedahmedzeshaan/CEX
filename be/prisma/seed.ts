import { prisma } from "../lib/prisma";

const assets = [
    {
        name: "Bitcoin",
        Symbol: "BTC"
    },
    {
        name: "Solana",
        Symbol: "SOL"
    },
    {
        name: "Anthropic",
        Symbol: "ANTHROPIC"
    },
    {
        name: "OpenAI",
        Symbol: "OPENAI"
    },
    {
        name: "SpaceX",
        Symbol: "SPACEX"
    }
];

async function main() {
    await prisma.asset.createMany({
        data: assets
    });

    console.log("Seeded assets:");

    for (const asset of assets) {
        console.log(`- ${asset.Symbol}`);
    }
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });