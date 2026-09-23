import { useState } from "react";
import { placeOrder } from "../../services/api";
import type {
    OrderStatus,
    Side
} from "../../types/order";
import "./OrderForm.css";

type Props = {
    assetId: string;
    symbol: string;
};

export default function OrderForm({
    assetId,
    symbol
}: Props) {
    const [side, setSide] =
        useState<Side>("buy");

    const [price, setPrice] =
        useState("");

    const [qty, setQty] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [orderStatus, setOrderStatus] =
        useState<OrderStatus | null>(null);

    const [statusMessage, setStatusMessage] =
        useState("");

    const [filledQty, setFilledQty] =
        useState(0);

    const [error, setError] =
        useState("");

    async function handleSubmit() {
        setLoading(true);

        setOrderStatus(null);
        setStatusMessage("");
        setFilledQty(0);
        setError("");

        try {
            const response = await placeOrder({
                assetId,
                side,
                price: Number(price),
                qty: Number(qty)
            });

            const order = response.order;

            setOrderStatus(order.status);
            setFilledQty(order.filledQty);

            if (order.status === "executed") {
                setStatusMessage(
                    `${side === "buy" ? "Buy" : "Sell"} order executed`
                );
            } else if (
                order.status === "partiallyFilled"
            ) {
                setStatusMessage(
                    `${side === "buy" ? "Buy" : "Sell"} order partially filled`
                );
            } else if (
                order.status === "placed"
            ) {
                setStatusMessage(
                    `${side === "buy" ? "Buy" : "Sell"} order placed`
                );
            }
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to place order"
            );
        } finally {
            setLoading(false);
        }
    }

    function handleSideChange(
        newSide: Side
    ) {
        setSide(newSide);
        setOrderStatus(null);
        setStatusMessage("");
        setFilledQty(0);
        setError("");
    }

    return (
        <div className="order-form">

            {/* STATUS */}
            {(orderStatus || error) && (
                <div
                    className={
                        error
                            ? "order-status error"
                            : `order-status ${side}`
                    }
                >
                    {error ? (
                        <>
                            <strong>
                                Order failed
                            </strong>

                            <span>
                                {error}
                            </span>
                        </>
                    ) : (
                        <>
                            <strong>
                                {statusMessage}
                            </strong>

                            <span>
                                {qty} {symbol} @ $
                                {price}
                            </span>

                            {orderStatus ===
                                "partiallyFilled" && (
                                <span>
                                    Filled:{" "}
                                    {filledQty}{" "}
                                    {symbol}
                                </span>
                            )}
                        </>
                    )}
                </div>
            )}

            <h3 className="panel-title">
                Place Order
            </h3>

            {/* SIDE */}
            <div className="side-tabs">

                <button
                    type="button"
                    className={
                        side === "buy"
                            ? "active buy"
                            : ""
                    }
                    onClick={() =>
                        handleSideChange("buy")
                    }
                >
                    Buy
                </button>

                <button
                    type="button"
                    className={
                        side === "sell"
                            ? "active sell"
                            : ""
                    }
                    onClick={() =>
                        handleSideChange("sell")
                    }
                >
                    Sell
                </button>

            </div>

            {/* PRICE */}
            <div className="order-input">

                <label>
                    Price
                </label>

                <input
                    type="number"
                    value={price}
                    onChange={(event) =>
                        setPrice(
                            event.target.value
                        )
                    }
                    placeholder="0.00"
                />

                <span>
                    USD
                </span>

            </div>

            {/* QUANTITY */}
            <div className="order-input">

                <label>
                    Quantity
                </label>

                <input
                    type="number"
                    value={qty}
                    onChange={(event) =>
                        setQty(
                            event.target.value
                        )
                    }
                    placeholder="0"
                />

                <span>
                    {symbol}
                </span>

            </div>

            <button
                className={`place-order-button ${side}`}
                type="button"
                onClick={handleSubmit}
                disabled={loading}
            >
                {loading
                    ? "Placing..."
                    : `Place ${side} order`}
            </button>

        </div>
    );
}