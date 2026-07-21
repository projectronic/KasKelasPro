"use client";

import { Pie, PieChart, Cell, Label } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

// Status colors (good/critical), not categorical hues — this represents a
// paid/unpaid state, not an arbitrary series, and stays distinct from the
// blue/orange used by the Total Uang chart right next to it.
const chartConfig = {
  lunas: {
    label: "Lunas",
    color: "#0ca30c",
  },
  belumBayar: {
    label: "Belum Bayar",
    color: "#d03b3b",
  },
} satisfies ChartConfig;

export function PaymentStatusDonutChart({
  lunas,
  belumBayar,
}: {
  lunas: number;
  belumBayar: number;
}) {
  const total = lunas + belumBayar;
  const data = [
    { key: "lunas", label: "Lunas", value: lunas, fill: "var(--color-lunas)" },
    { key: "belumBayar", label: "Belum Bayar", value: belumBayar, fill: "var(--color-belumBayar)" },
  ].filter((d) => d.value > 0);

  return (
    <div className="flex flex-col gap-2">
      <ChartContainer config={chartConfig} className="mx-auto h-56 w-56">
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, _name, item) => (
                  <span className="flex w-full justify-between gap-4">
                    <span>{item.payload.label}</span>
                    <span className="font-medium text-foreground">{String(value)} siswa</span>
                  </span>
                )}
              />
            }
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={55}
            outerRadius={100}
            cornerRadius={10}
            paddingAngle={data.length > 1 ? 4 : 0}
            strokeWidth={2}
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={entry.fill} className="stroke-card" />
            ))}
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox)) return null;
                const { cx, cy } = viewBox;
                return (
                  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={cx} y={cy && cy - 8} className="fill-foreground text-sm font-semibold">
                      {total}
                    </tspan>
                    <tspan x={cx} y={cy && cy + 12} className="fill-muted-foreground text-xs">
                      Siswa
                    </tspan>
                  </text>
                );
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="flex justify-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: "#0ca30c" }} />
          <span className="text-muted-foreground">Lunas</span>
          <span className="font-medium text-foreground">{lunas}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: "#d03b3b" }} />
          <span className="text-muted-foreground">Belum Bayar</span>
          <span className="font-medium text-foreground">{belumBayar}</span>
        </span>
      </div>
    </div>
  );
}
