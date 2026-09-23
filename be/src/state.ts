import { inMemoryBalances } from "./inMemoryBalances";
import { SubscriptionsManager } from "./websocket/SubscriptionsManager";
import { CandleManager } from "./CandleManager";

export const balances = new inMemoryBalances();

export const subscriptionsManager = new SubscriptionsManager();

export const candleManager = new CandleManager();