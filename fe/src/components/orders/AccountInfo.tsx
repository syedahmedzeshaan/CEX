import { useEffect, useState } from "react";
import {
    claimMockFunds,
    getAssets,
    getBalances,
    getFills,
    getUSDBalance
} from "../../services/api";
import type {
    USDBalance,
    AssetBalance
} from "../../types/account";
import type { Fill } from "../../types/order";
import type { Asset } from "../../types/asset";
import "./AccountInfo.css";

export default function AccountInfo() {
    const [usdBalance, setUsdBalance] =
        useState<USDBalance | null>(null);

    const [balances, setBalances] =
        useState<AssetBalance[]>([]);

    const [fills, setFills] =
        useState<Fill[]>([]);

    const [assets, setAssets] =
        useState<Asset[]>([]);

    const [claiming, setClaiming] =
        useState(false);

    const [claimMessage, setClaimMessage] =
        useState("");


    async function loadAccountInfo() {
        try {
            const [
                usd,
                userBalances,
                userFills,
                assetList
            ] = await Promise.all([
                getUSDBalance(),
                getBalances(),
                getFills(),
                getAssets()
            ]);

            setUsdBalance(usd);
            setBalances(userBalances);
            setFills(userFills);
            setAssets(assetList);

        } catch (error) {
            console.error(
                "Failed to load account information:",
                error
            );
        }
    }


    useEffect(() => {
        loadAccountInfo();
    }, []);


    async function handleClaimFunds() {
        try {
            setClaiming(true);
            setClaimMessage("");

            await claimMockFunds();

            setClaimMessage(
                "Mock funds added successfully."
            );

            await loadAccountInfo();

        } catch (error) {

            setClaimMessage(
                error instanceof Error
                    ? error.message
                    : "Failed to claim mock funds"
            );

        } finally {
            setClaiming(false);
        }
    }


    function getAssetSymbol(assetId: string) {
        return (
            assets.find(
                (asset) => asset.id === assetId
            )?.symbol ?? assetId
        );
    }


    function getAssetName(symbol: string) {
        if (symbol === "BTC") return "Bitcoin";
        if (symbol === "ETH") return "Ethereum";
        if (symbol === "USD") return "US Dollar";

        return symbol;
    }


    function formatNumber(value: number) {
        return new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }


    return (
        <main className="account-page">

            <div className="account-container">

                {/* HEADER */}

                <div className="account-header">
                    <div>
                        <h2>Account</h2>

                        <p>
                            Manage your balances and trading activity
                        </p>
                    </div>
                </div>


                {/* BALANCE OVERVIEW */}

                <section className="balance-overview">

                    <div className="balance-overview-left">

                        <span className="balance-label">
                            USD Balance
                        </span>

                        <span className="balance-value">
                            $
                            {formatNumber(
                                usdBalance?.balance ?? 0
                            )}
                        </span>

                    </div>


                    <button
                        className="claim-button"
                        type="button"
                        onClick={handleClaimFunds}
                        disabled={claiming}
                    >
                        {claiming
                            ? "Claiming..."
                            : "Claim Mock Funds"}
                    </button>

                </section>


                {claimMessage && (
                    <div className="claim-message">
                        {claimMessage}
                    </div>
                )}


                {/* ASSETS */}

                <section className="account-section">

                    <div className="section-header">

                        <div>

                            <h3>Assets</h3>

                            <p>
                                Your available and locked balances
                            </p>

                        </div>

                    </div>


                    <div className="asset-table">

                        <div className="asset-table-header">

                            <span>Asset</span>
                            <span>Available</span>
                            <span>Locked</span>
                            <span>Total</span>

                        </div>


                        {/* USD */}

                        <div className="asset-row">

                            <div className="asset-name">

                                <div className="asset-icon usd">
                                    $
                                </div>

                                <div>

                                    <strong>
                                        USD
                                    </strong>

                                    <span>
                                        US Dollar
                                    </span>

                                </div>

                            </div>


                            <span>
                                $
                                {formatNumber(
                                    usdBalance?.balance ?? 0
                                )}
                            </span>


                            <span>
                                —
                            </span>


                            <strong>
                                $
                                {formatNumber(
                                    usdBalance?.balance ?? 0
                                )}
                            </strong>

                        </div>


                        {/* CRYPTO ASSETS */}

                        {balances.map((balance) => {

                            const symbol =
                                getAssetSymbol(
                                    balance.assetId
                                );

                            const total =
                                balance.qty +
                                balance.lockedQty;


                            return (
                                <div
                                    className="asset-row"
                                    key={balance.id}
                                >

                                    <div className="asset-name">

                                        <div className="asset-icon">
                                            {symbol.charAt(0)}
                                        </div>

                                        <div>

                                            <strong>
                                                {symbol}
                                            </strong>

                                            <span>
                                                {getAssetName(
                                                    symbol
                                                )}
                                            </span>

                                        </div>

                                    </div>


                                    <span>
                                        {formatNumber(
                                            balance.qty
                                        )}{" "}
                                        {symbol}
                                    </span>


                                    <span>
                                        {formatNumber(
                                            balance.lockedQty
                                        )}{" "}
                                        {symbol}
                                    </span>


                                    <strong>
                                        {formatNumber(total)}{" "}
                                        {symbol}
                                    </strong>

                                </div>
                            );
                        })}


                        {balances.length === 0 && (
                            <div className="empty-assets">
                                No crypto balances
                            </div>
                        )}

                    </div>

                </section>


                {/* FILLS */}

                <section className="account-section">

                    <div className="section-header">

                        <div>

                            <h3>
                                Recent Trades
                            </h3>

                            <p>
                                Your executed trades
                            </p>

                        </div>

                    </div>


                    {fills.length === 0 ? (

                        <div className="empty-trades">
                            No trades yet
                        </div>

                    ) : (

                        <div className="fills-table">

                            <div className="fills-header">

                                <span>Asset</span>
                                <span>Side</span>
                                <span>Price</span>
                                <span>Quantity</span>

                            </div>


                            {fills.map((fill) => {

                                const symbol =
                                    getAssetSymbol(
                                        fill.assetId
                                    );


                                return (
                                    <div
                                        className="fill-row"
                                        key={fill.id}
                                    >

                                        <span>
                                            {symbol}
                                        </span>


                                        <span
                                            className={
                                                fill.side === "buy"
                                                    ? "buy-text"
                                                    : "sell-text"
                                            }
                                        >
                                            {fill.side.toUpperCase()}
                                        </span>


                                        <span>
                                            $
                                            {formatNumber(
                                                fill.price
                                            )}
                                        </span>


                                        <span>
                                            {formatNumber(
                                                fill.filledQty
                                            )}
                                        </span>

                                    </div>
                                );

                            })}

                        </div>
                    )}

                </section>

            </div>

        </main>
    );
}