"use client";

import {
  RadialBar,
  RadialBarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Label,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const chartConfig = {
  saldo: {
    label: "Saldo",
    color: "var(--chart-1)",
  },
  pengeluaran: {
    label: "Pengeluaran",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function TotalUangRadialChart({
  saldo,
  pengeluaran,
}: {
  saldo: number;
  pengeluaran: number;
}) {
  const totalUang = saldo + pengeluaran;
  const data = [{ month: "total", saldo, pengeluaran }];

  return (
    <div className="flex flex-col gap-2">
      <ChartContainer config={chartConfig} className="mx-auto h-56 w-56">
        <RadialBarChart
          data={data}
          startAngle={90}
          endAngle={-270}
          innerRadius={55}
          outerRadius={100}
        >
          <PolarAngleAxis type="number" domain={[0, totalUang]} tick={false} axisLine={false} />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
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
          <PolarGrid gridType="circle" radialLines={false} stroke="none" />
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox)) return null;
                const { cx, cy } = viewBox;
                return (
                  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={cx} y={cy && cy - 8} className="fill-foreground text-sm font-semibold">
                      {formatRupiah(totalUang)}
                    </tspan>
                    <tspan x={cx} y={cy && cy + 12} className="fill-muted-foreground text-xs">
                      Total Uang
                    </tspan>
                  </text>
                );
              }}
            />
          </PolarRadiusAxis>
          <RadialBar
            dataKey="saldo"
            stackId="a"
            cornerRadius={10}
            fill="var(--color-saldo)"
            className="stroke-card stroke-2"
          />
          <RadialBar
            dataKey="pengeluaran"
            stackId="a"
            cornerRadius={10}
            fill="var(--color-pengeluaran)"
            className="stroke-card stroke-2"
          />
        </RadialBarChart>
      </ChartContainer>
      <div className="flex justify-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: "var(--chart-1)" }} />
          <span className="text-muted-foreground">Saldo</span>
          <span className="font-medium text-foreground">{formatRupiah(saldo)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: "var(--chart-2)" }} />
          <span className="text-muted-foreground">Pengeluaran</span>
          <span className="font-medium text-foreground">{formatRupiah(pengeluaran)}</span>
        </span>
      </div>
    </div>
  );
}
