"use client";

import {
  ComposedChart,
  Bar,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { MonthlyFlow } from "@/lib/dashboard-stats";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCompact(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(abs % 1_000_000 === 0 ? 0 : 1)}jt`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
  return String(n);
}

function formatMonthLabel(month: string) {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString("id-ID", {
    month: "short",
    year: "2-digit",
  });
}

const chartConfig = {
  diterima: {
    label: "Pembayaran Diterima",
    color: "var(--chart-3)",
  },
  tunggakan: {
    label: "Tunggakan",
    color: "var(--chart-4)",
  },
  pemasukan: {
    label: "Pemasukan",
    color: "var(--chart-5)",
  },
  pengeluaran: {
    label: "Pengeluaran",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function MonthlyComboChart({ data }: { data: MonthlyFlow[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-80 w-full">
      <ComposedChart data={data} margin={{ left: 8, right: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={formatMonthLabel}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={56}
          tickFormatter={formatCompact}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => formatMonthLabel(String(label))}
              formatter={(value, name) => (
                <span className="flex w-full justify-between gap-4">
                  <span>{chartConfig[name as keyof typeof chartConfig]?.label}</span>
                  <span className="font-medium text-foreground">
                    {formatRupiah(Number(value))}
                  </span>
                </span>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="diterima"
          stackId="dues"
          fill="var(--color-diterima)"
          radius={[0, 0, 4, 4]}
          maxBarSize={24}
        />
        <Bar
          dataKey="tunggakan"
          stackId="dues"
          fill="var(--color-tunggakan)"
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
        />
        <Area
          type="monotone"
          dataKey="pemasukan"
          stroke="var(--color-pemasukan)"
          fill="var(--color-pemasukan)"
          fillOpacity={0.12}
          strokeWidth={2}
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="pengeluaran"
          stroke="var(--color-pengeluaran)"
          fill="var(--color-pengeluaran)"
          fillOpacity={0.12}
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
