"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";

// Theme-neutral translucent grays (SVG stroke attrs can't use CSS vars).
const AXIS = { stroke: "rgba(113,113,122,0.4)", fontSize: 11, tickLine: false, axisLine: false };
const GRID = "rgba(113,113,122,0.18)";

function currencyTooltip(value: number) {
  return [formatCurrency(value), "Revenue"] as [string, string];
}

export function RevenueLineChart({
  data,
}: {
  data: { date: string; revenue: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis
          dataKey="date"
          {...AXIS}
          tickFormatter={(d) => formatDate(d, "short")}
          minTickGap={28}
        />
        <YAxis {...AXIS} tickFormatter={(v) => `$${v}`} width={48} />
        <Tooltip
          formatter={currencyTooltip}
          labelFormatter={(l) => formatDate(l, "medium")}
          contentStyle={{ background: "rgb(var(--popover))", border: "1px solid rgb(var(--border))", borderRadius: 8 }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="url(#lineGrad)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4, fill: "#7c3aed" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RevenueAreaChart({
  data,
  height = 300,
}: {
  data: { date: string; revenue: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis
          dataKey="date"
          {...AXIS}
          tickFormatter={(d) => formatDate(d, "short")}
          minTickGap={28}
        />
        <YAxis {...AXIS} tickFormatter={(v) => `$${v}`} width={48} />
        <Tooltip
          formatter={currencyTooltip}
          labelFormatter={(l) => formatDate(l, "medium")}
          contentStyle={{ background: "rgb(var(--popover))", border: "1px solid rgb(var(--border))", borderRadius: 8 }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#7c3aed"
          strokeWidth={2.5}
          fill="url(#areaGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryPieChart({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={3}
          stroke="none"
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number, n) => [formatCurrency(v), n as string]}
          contentStyle={{ background: "rgb(var(--popover))", border: "1px solid rgb(var(--border))", borderRadius: 8 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function AcquisitionBarChart({
  data,
}: {
  data: { week: string; new: number; returning: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="week" {...AXIS} />
        <YAxis {...AXIS} width={36} />
        <Tooltip
          cursor={{ fill: "rgba(124,58,237,0.08)" }}
          contentStyle={{ background: "rgb(var(--popover))", border: "1px solid rgb(var(--border))", borderRadius: 8 }}
        />
        <Bar dataKey="new" stackId="a" fill="#7c3aed" radius={[0, 0, 0, 0]} name="New" />
        <Bar dataKey="returning" stackId="a" fill="#3f3f46" radius={[4, 4, 0, 0]} name="Returning" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WeightLineChart({
  data,
}: {
  data: { week: string; weight: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="week" {...AXIS} />
        <YAxis {...AXIS} width={40} domain={["dataMin - 2", "dataMax + 2"]} unit="kg" />
        <Tooltip
          formatter={(v: number) => [`${v} kg`, "Weight"]}
          contentStyle={{ background: "rgb(var(--popover))", border: "1px solid rgb(var(--border))", borderRadius: 8 }}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#7c3aed"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "#7c3aed" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CaloriesBarChart({
  data,
}: {
  data: { day: string; calories: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="day" {...AXIS} />
        <YAxis {...AXIS} width={44} />
        <Tooltip
          cursor={{ fill: "rgba(124,58,237,0.08)" }}
          formatter={(v: number) => [`${v} kcal`, "Calories"]}
          contentStyle={{ background: "rgb(var(--popover))", border: "1px solid rgb(var(--border))", borderRadius: 8 }}
        />
        <Bar dataKey="calories" fill="#7c3aed" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
