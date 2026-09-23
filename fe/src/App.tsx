import { useEffect, useState } from "react";
import {
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Header from "./components/header/Header";
import CandleChart from "./components/chart/CandleChart";
import OrderBook from "./components/orderbook/OrderBook";
import OrderForm from "./components/trading/OrderForm";
import Orders from "./components/orders/Orders";
import AccountInfo from "./components/orders/AccountInfo";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import { useAuth } from "./context/AuthContext";
import { useCandles } from "./hooks/useCandles";

import { getAssets } from "./services/api";

import type { Asset } from "./types/asset";

import "./App.css";

type TradingProps = {
    symbol: string;
};

function Trading({
    symbol
}: TradingProps) {
    const [timeframe, setTimeframe] =
        useState(60_000);

    const [assets, setAssets] =
        useState<Asset[]>([]);

    const [assetLoading, setAssetLoading] =
        useState(true);

    const [assetError, setAssetError] =
        useState<string | null>(null);

    const {
        candles,
        loading,
        error
    } = useCandles(
        symbol,
        timeframe
    );

    useEffect(() => {
        async function loadAssets() {
            try {
                setAssetLoading(true);
                setAssetError(null);

                const data =
                    await getAssets();

                setAssets(data);
            } catch (error) {
                setAssetError(
                    error instanceof Error
                        ? error.message
                        : "Failed to load assets"
                );
            } finally {
                setAssetLoading(false);
            }
        }

        loadAssets();
    }, []);

    const asset = assets.find(
        item => item.symbol === symbol
    );

    return (
        <main className="app-main">
            <section className="panel chart-panel">
                <h3 className="panel-title">
                    {symbol}/USD
                </h3>

                <div className="timeframes">
                    <button
                        className={
                            timeframe === 60_000
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setTimeframe(60_000)
                        }
                    >
                        1m
                    </button>

                    <button
                        className={
                            timeframe === 900_000
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setTimeframe(900_000)
                        }
                    >
                        15m
                    </button>

                    <button
                        className={
                            timeframe === 3_600_000
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setTimeframe(
                                3_600_000
                            )
                        }
                    >
                        1h
                    </button>
                </div>

                {loading && (
                    <p>
                        Loading candles...
                    </p>
                )}

                {error && (
                    <p>{error}</p>
                )}

                {!loading && !error && (
                    <CandleChart
                        candles={candles}
                    />
                )}
            </section>

            <section className="panel orderbook-panel">
                <OrderBook
                    symbol={symbol}
                />
            </section>

            <section className="panel order-form-panel">
                {assetLoading && (
                    <p>
                        Loading assets...
                    </p>
                )}

                {assetError && (
                    <p>{assetError}</p>
                )}

                {!assetLoading &&
                    !assetError &&
                    asset && (
                        <OrderForm
                            assetId={asset.id}
                            symbol={symbol}
                        />
                    )}
            </section>
        </main>
    );
}

function LoginRoute() {
    const { isAuthenticated } =
        useAuth();

    if (isAuthenticated) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    return <Login />;
}

function SignupRoute() {
    const { isAuthenticated } =
        useAuth();

    if (isAuthenticated) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    return <Signup />;
}

function App() {
    const [symbol, setSymbol] =
        useState("BTC");

    return (
        <div className="app">
            <Header
                symbol={symbol}
                onSymbolChange={
                    setSymbol
                }
            />

            <Routes>
                <Route
                    path="/"
                    element={
                        <Trading
                            symbol={symbol}
                        />
                    }
                />

                <Route
                    path="/orders"
                    element={
                        <ProtectedRoute>
                            <Orders />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/account"
                    element={
                        <ProtectedRoute>
                            <AccountInfo />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/login"
                    element={<LoginRoute />}
                />

                <Route
                    path="/signup"
                    element={<SignupRoute />}
                />
            </Routes>
        </div>
    );
}

export default App;