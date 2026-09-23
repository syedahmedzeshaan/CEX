import { useEffect, useState } from "react";

import {
    cancelOrder,
    getAssets,
    getOrders
} from "../../services/api";

import type { Order } from "../../types/order";
import type { Asset } from "../../types/asset";

import "./Orders.css";

export default function Orders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadOrders() {
            try {
                const [ordersData, assetsData] =
                    await Promise.all([
                        getOrders(),
                        getAssets()
                    ]);

                setOrders(ordersData);
                setAssets(assetsData);
            } catch (error) {
                console.error(
                    "Failed to load orders:",
                    error
                );
            } finally {
                setLoading(false);
            }
        }

        loadOrders();
    }, []);

    function getAssetSymbol(assetId: string) {
        return (
            assets.find(
                asset => asset.id === assetId
            )?.symbol ?? "UNKNOWN"
        );
    }

    async function handleCancel(orderId: string) {
        try {
            await cancelOrder(orderId);

            setOrders(current =>
                current.map(order =>
                    order.id === orderId
                        ? {
                              ...order,
                              status: "cancelled"
                          }
                        : order
                )
            );
        } catch (error) {
            console.error(
                "Failed to cancel order:",
                error
            );
        }
    }

    if (loading) {
        return (
            <div className="orders-page">
                <div className="orders-container">
                    <div className="orders-header-section">
                        <h2>Orders</h2>
                        <p>
                            Your order history and
                            active orders
                        </p>
                    </div>

                    <p className="orders-empty">
                        Loading orders...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="orders-page">
            <div className="orders-container">
                <div className="orders-header-section">
                    <h2>Orders</h2>
                    <p>
                        Your order history and active
                        orders
                    </p>
                </div>

                <section className="orders-section">
                    <div className="section-header">
                        <div>
                            <h3>Order History</h3>
                            <p>
                                Orders placed across all
                                markets
                            </p>
                        </div>
                    </div>

                    {orders.length === 0 ? (
                        <div className="orders-empty">
                            No orders
                        </div>
                    ) : (
                        <div className="orders-table">
                            <div className="orders-row orders-table-header">
                                <span>Asset</span>
                                <span>Side</span>
                                <span>Price</span>
                                <span>Quantity</span>
                                <span>Filled</span>
                                <span>Status</span>
                                <span></span>
                            </div>

                            {orders.map(order => (
                                <div
                                    className="orders-row"
                                    key={order.id}
                                >
                                    <span className="asset-cell">
                                        {getAssetSymbol(
                                            order.assetId
                                        )}
                                        /USD
                                    </span>

                                    <span
                                        className={
                                            order.side ===
                                            "buy"
                                                ? "buy-text"
                                                : "sell-text"
                                        }
                                    >
                                        {order.side.toUpperCase()}
                                    </span>

                                    <span>
                                        {order.price}
                                    </span>

                                    <span>
                                        {order.qty}
                                    </span>

                                    <span>
                                        {order.filledQty}
                                    </span>

                                    <span className="status-cell">
                                        {order.status}
                                    </span>

                                    <span className="action-cell">
                                        {order.status !==
                                            "executed" &&
                                            order.status !==
                                                "cancelled" && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleCancel(
                                                            order.id
                                                        )
                                                    }
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}