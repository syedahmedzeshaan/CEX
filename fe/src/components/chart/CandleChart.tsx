import { useEffect, useRef } from "react";

import {
    createChart,
    CandlestickSeries,
    type IChartApi,
    type ISeriesApi,
    type CandlestickData,
    type Time
} from "lightweight-charts";

import type { Candle } from "../../types/market";

type Props = {
    candles: Candle[];
};

export default function CandleChart({
    candles
}: Props) {
    const containerRef =
        useRef<HTMLDivElement>(null);

    const chartRef =
        useRef<IChartApi | null>(null);

    const seriesRef =
        useRef<
            ISeriesApi<"Candlestick"> | null
        >(null);

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        const chartHeight = 400;

        const chart = createChart(
            containerRef.current,
            {
                width:
                    containerRef.current
                        .clientWidth,

                height: chartHeight,

                layout: {
                    background: {
                        color: "#0f1115"
                    },
                    textColor: "#9ca3af"
                },

                grid: {
                    vertLines: {
                        color: "#1d2026"
                    },
                    horzLines: {
                        color: "#1d2026"
                    }
                },

                crosshair: {
                    vertLine: {
                        color: "#4b5563"
                    },
                    horzLine: {
                        color: "#4b5563"
                    }
                },

                rightPriceScale: {
                    borderColor: "#252932"
                },

                timeScale: {
                    borderColor: "#252932",
                    timeVisible: true,
                    secondsVisible: false
                }
            }
        );

        const series = chart.addSeries(
            CandlestickSeries,
            {
                upColor: "#26a69a",
                downColor: "#ef5350",

                borderUpColor: "#26a69a",
                borderDownColor: "#ef5350",

                wickUpColor: "#26a69a",
                wickDownColor: "#ef5350"
            }
        );

        chartRef.current = chart;
        seriesRef.current = series;

        const handleResize = () => {
            if (!containerRef.current) {
                return;
            }

            chart.applyOptions({
                width:
                    containerRef.current
                        .clientWidth
            });
        };

        window.addEventListener(
            "resize",
            handleResize
        );

        return () => {
            window.removeEventListener(
                "resize",
                handleResize
            );

            chart.remove();

            chartRef.current = null;
            seriesRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!seriesRef.current) {
            return;
        }

        const data: CandlestickData<Time>[] =
            candles.map(candle => ({
                time: Math.floor(
                    candle.timestamp / 1000
                ) as Time,

                open: candle.open,
                high: candle.high,
                low: candle.low,
                close: candle.close
            }));

        seriesRef.current.setData(data);

        if (data.length > 0) {
            chartRef.current
                ?.timeScale()
                .fitContent();
        }
    }, [candles]);

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "400px"
            }}
        />
    );
}