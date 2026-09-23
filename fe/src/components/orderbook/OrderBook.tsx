import { useDepth } from "../../hooks/useDepth";
import "./OrderBook.css";

type OrderBookProps = {
    symbol: string;
};

export default function OrderBook({ symbol }: OrderBookProps) {
    const { depth, tradePrice } = useDepth(symbol);

    const maxQty = Math.max(
        ...depth.asks.map(level => level.qty),
        ...depth.bids.map(level => level.qty),
        0
    );

    function getDepthWidth(qty: number) {
        if (maxQty === 0) return 0;
        return (qty / maxQty) * 100;
    }

    return (
        <div className="orderbook">
            <div className="orderbook-header">
                <span>Price</span>
                <span>Quantity</span>
            </div>

            <div className="asks">
                {depth.asks.length === 0 ? (
                    <div className="empty-orderbook">No asks</div>
                ) : (
                    depth.asks.map((level) => (
                        <div
                            className="orderbook-row ask"
                            key={`ask-${level.price}`}
                        >
                            <div
                                className="depth-bar"
                                style={{
                                    width: `${getDepthWidth(level.qty)}%`
                                }}
                            />

                            <span>{level.price.toLocaleString()}</span>
                            <span>{level.qty.toLocaleString()}</span>
                        </div>
                    ))
                )}
            </div>

            <div className="current-price">
                {tradePrice !== undefined
                    ? `$${tradePrice.toLocaleString()}`
                    : "—"}
            </div>

            <div className="bids">
                {depth.bids.length === 0 ? (
                    <div className="empty-orderbook">No bids</div>
                ) : (
                    depth.bids.map((level) => (
                        <div
                            className="orderbook-row bid"
                            key={`bid-${level.price}`}
                        >
                            <div
                                className="depth-bar"
                                style={{
                                    width: `${getDepthWidth(level.qty)}%`
                                }}
                            />

                            <span>{level.price.toLocaleString()}</span>
                            <span>{level.qty.toLocaleString()}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}