 "use client";

import { useEffect, useRef } from "react";
import {
  CategoryScale,
  Chart,
  ChartConfiguration,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Title,
} from "chart.js";
import { CHART_COLORS, months, numbers, transparentize } from "./utils";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Legend,
);

const DATA_COUNT = 7;
const NUMBER_CFG = { count: DATA_COUNT, min: -100, max: 100 };

const OrdersLinechart = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart<"line"> | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const labels = months(DATA_COUNT);
    const data = {
      labels,
      datasets: [
        {
          label: "Dispatched",
          data: numbers(NUMBER_CFG),
          borderColor: CHART_COLORS.red,
          backgroundColor: transparentize(CHART_COLORS.red, 0.5),
        },
        {
          label: "Requested",
          data: numbers(NUMBER_CFG),
          borderColor: CHART_COLORS.blue,
          backgroundColor: transparentize(CHART_COLORS.blue, 0.5),
        },
      ],
    };

    const config: ChartConfiguration<"line"> = {
      type: "line",
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
          title: {
            display: true,
            text: "Orders over time",
          },
        },
      },
    };

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    chartRef.current = new Chart(ctx, config);

    return () => {
      chartRef.current?.destroy();
    };
  }, []);

  return <canvas ref={canvasRef} className="h-full w-full" />;
};

export default OrdersLinechart;

