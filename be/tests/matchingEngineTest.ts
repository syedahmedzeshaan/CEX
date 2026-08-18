import { matchingEngine } from "../src/matchingEngine";
import { orderBooks, Order, OrderBook } from "../src/orderbook";

const engine = new matchingEngine();

const assetId = "BTC";
const user1 = "user-1";
const user2 = "user-2";

function makeOrder(
    id: string,
    side: "buy" | "sell",
    price: number,
    qty: number,
    userId: string,
    filledQty = 0
): Order {
    return {
        id,
        userId,
        assetId,
        side,
        price,
        qty,
        filledQty,
        type: "maker",
        created_at: new Date(),
        status: "placed",
    };
}

function resetBook() {
    orderBooks.set(assetId, new OrderBook());
}

function printResult(result: ReturnType<typeof engine.match>) {
    console.log("success:", result.success);
    console.log("reason:", result.reason);

    console.log(
        "ordersToUpdate:",
        [...result.ordersToUpdate.values()].map(order => ({
            id: order.id,
            side: order.side,
            price: order.price,
            qty: order.qty,
            filledQty: order.filledQty,
            status: order.status,
        }))
    );

    console.log(
        "fills:",
        result.fills.map(fill => ({
            orderId: fill.orderId,
            side: fill.side,
            type: fill.type,
            price: fill.price,
            filledQty: fill.filledQty,
        }))
    );

    console.log(
        "USD updates:",
        [...result.usdBalanceUpdates.values()]
    );

    console.log(
        "Asset updates:",
        [...result.assetBalanceUpdates.values()]
    );
}

function printBook(book: OrderBook | undefined) {
    if (!book) {
        console.log("NO ORDER BOOK");
        return;
    }

    console.log("\nASKS:");

    for (const [price, orders] of book.asks) {
        console.log(
            price,
            orders.map(order => ({
                id: order.id,
                qty: order.qty,
                filledQty: order.filledQty,
                status: order.status,
            }))
        );
    }

    console.log("\nBIDS:");

    for (const [price, orders] of book.bids) {
        console.log(
            price,
            orders.map(order => ({
                id: order.id,
                qty: order.qty,
                filledQty: order.filledQty,
                status: order.status,
            }))
        );
    }
}


/*
==================================================
TEST 1 — Empty book
==================================================
*/

console.log("\n========================================");
console.log("TEST 1 — Empty book");
console.log("========================================");

resetBook();

let result = engine.match(
    makeOrder("buy-1", "buy", 100, 10, user1)
);

printResult(result);
printBook(result.newOrderBook);


/*
==================================================
TEST 2 — BUY partial fill
==================================================
*/

console.log("\n========================================");
console.log("TEST 2 — BUY partial fill");
console.log("========================================");

resetBook();

const book2 = orderBooks.get(assetId)!;

book2.addOrder(
    makeOrder("sell-1", "sell", 95, 5, user2)
);

result = engine.match(
    makeOrder("buy-1", "buy", 100, 10, user1)
);

printResult(result);
printBook(result.newOrderBook);


/*
==================================================
TEST 3 — BUY complete fill
==================================================
*/

console.log("\n========================================");
console.log("TEST 3 — BUY complete fill");
console.log("========================================");

resetBook();

const book3 = orderBooks.get(assetId)!;

book3.addOrder(
    makeOrder("sell-1", "sell", 95, 10, user2)
);

result = engine.match(
    makeOrder("buy-1", "buy", 100, 10, user1)
);

printResult(result);
printBook(result.newOrderBook);


/*
==================================================
TEST 4 — SELL partial fill
==================================================
*/

console.log("\n========================================");
console.log("TEST 4 — SELL partial fill");
console.log("========================================");

resetBook();

const book4 = orderBooks.get(assetId)!;

book4.addOrder(
    makeOrder("buy-1", "buy", 100, 10, user1)
);

result = engine.match(
    makeOrder("sell-1", "sell", 95, 5, user2)
);

printResult(result);
printBook(result.newOrderBook);


/*
==================================================
TEST 5 — SELL complete fill
==================================================
*/

console.log("\n========================================");
console.log("TEST 5 — SELL complete fill");
console.log("========================================");

resetBook();

const book5 = orderBooks.get(assetId)!;

book5.addOrder(
    makeOrder("buy-1", "buy", 100, 5, user1)
);

result = engine.match(
    makeOrder("sell-1", "sell", 95, 5, user2)
);

printResult(result);
printBook(result.newOrderBook);


/*
==================================================
TEST 6 — BUY across multiple price levels
==================================================
*/

console.log("\n========================================");
console.log("TEST 6 — BUY across multiple price levels");
console.log("========================================");

resetBook();

const book6 = orderBooks.get(assetId)!;

book6.addOrder(
    makeOrder("sell-1", "sell", 100, 5, user2)
);

book6.addOrder(
    makeOrder("sell-2", "sell", 101, 5, user2)
);

book6.addOrder(
    makeOrder("sell-3", "sell", 102, 5, user2)
);

result = engine.match(
    makeOrder("buy-1", "buy", 105, 12, user1)
);

printResult(result);
printBook(result.newOrderBook);


/*
==================================================
TEST 7 — SELL across multiple price levels
==================================================
*/

console.log("\n========================================");
console.log("TEST 7 — SELL across multiple price levels");
console.log("========================================");

resetBook();

const book7 = orderBooks.get(assetId)!;

book7.addOrder(
    makeOrder("buy-1", "buy", 105, 5, user1)
);

book7.addOrder(
    makeOrder("buy-2", "buy", 104, 5, user1)
);

book7.addOrder(
    makeOrder("buy-3", "buy", 103, 5, user1)
);

result = engine.match(
    makeOrder("sell-1", "sell", 100, 12, user2)
);

printResult(result);
printBook(result.newOrderBook);


/*
==================================================
TEST 8 — Non-crossing BUY
==================================================
*/

console.log("\n========================================");
console.log("TEST 8 — Non-crossing BUY");
console.log("========================================");

resetBook();

const book8 = orderBooks.get(assetId)!;

book8.addOrder(
    makeOrder("sell-1", "sell", 110, 10, user2)
);

result = engine.match(
    makeOrder("buy-1", "buy", 100, 10, user1)
);

printResult(result);
printBook(result.newOrderBook);


/*
==================================================
TEST 9 — Non-crossing SELL
==================================================
*/

console.log("\n========================================");
console.log("TEST 9 — Non-crossing SELL");
console.log("========================================");

resetBook();

const book9 = orderBooks.get(assetId)!;

book9.addOrder(
    makeOrder("buy-1", "buy", 100, 10, user1)
);

result = engine.match(
    makeOrder("sell-1", "sell", 110, 10, user2)
);

printResult(result);
printBook(result.newOrderBook);


/*
==================================================
TEST 10 — Multiple fills against same user
==================================================
*/

console.log("\n========================================");
console.log("TEST 10 — Multiple fills / balance aggregation");
console.log("========================================");

resetBook();

const book10 = orderBooks.get(assetId)!;

book10.addOrder(
    makeOrder("sell-1", "sell", 100, 5, user2)
);

book10.addOrder(
    makeOrder("sell-2", "sell", 101, 5, user2)
);

result = engine.match(
    makeOrder("buy-1", "buy", 105, 10, user1)
);

printResult(result);
printBook(result.newOrderBook);


/*
==================================================
FINAL
==================================================
*/

console.log("\n========================================");
console.log("TESTING COMPLETE");
console.log("========================================");