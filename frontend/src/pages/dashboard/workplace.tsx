import { useMemo } from "react"
import {
  ArrowUpRight,
  Package,
  ShoppingBag,
  TrendingUp,
} from "lucide-react"

import { EChart } from "@/components/Common/EChart"
import type { EChartsOption } from "@/lib/echarts"
import { cn } from "@/lib/utils"

import { ChartCard } from "./components/ChartCard"
import { getPrimaryColor } from "./chart-theme"
import {
  activeUsers,
  annualSales,
  conversionSeries,
  hotProducts,
  kpiCards,
  salesClass,
  salesTrend,
  trafficOverview,
} from "./mock/workplace"

const kpiIcons = {
  orders: ShoppingBag,
  products: Package,
  sales: TrendingUp,
  growth: ArrowUpRight,
} as const

function sparkOption(data: number[], color: string): EChartsOption {
  return {
    grid: { left: 0, right: 0, top: 8, bottom: 0 },
    xAxis: { type: "category", show: false, data: data.map((_, i) => i) },
    yAxis: { type: "value", show: false },
    series: [
      {
        type: "line",
        data,
        smooth: true,
        symbol: "none",
        lineStyle: { width: 2, color },
        areaStyle: { color, opacity: 0.18 },
      },
    ],
  }
}

export function WorkplacePage() {
  const primary = useMemo(() => getPrimaryColor(), [])

  const conversionOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: "axis" },
      grid: { left: 40, right: 16, top: 24, bottom: 28 },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: salesTrend.months,
        axisTick: { show: false },
      },
      yAxis: { type: "value", splitLine: { lineStyle: { type: "dashed" } } },
      series: [
        {
          name: "转化率",
          type: "line",
          smooth: true,
          data: conversionSeries,
          areaStyle: { opacity: 0.15 },
          itemStyle: { color: primary },
        },
      ],
    }),
    [primary],
  )

  const trendOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: "axis" },
      legend: { data: ["线上", "线下"], top: 0 },
      grid: { left: 40, right: 12, top: 36, bottom: 28 },
      xAxis: { type: "category", data: salesTrend.months },
      yAxis: { type: "value", splitLine: { lineStyle: { type: "dashed" } } },
      series: [
        {
          name: "线上",
          type: "bar",
          data: salesTrend.online,
          itemStyle: { color: primary, borderRadius: [4, 4, 0, 0] },
        },
        {
          name: "线下",
          type: "bar",
          data: salesTrend.offline,
          itemStyle: {
            color: "color-mix(in srgb, var(--primary) 35%, #94a3b8)",
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    }),
    [primary],
  )

  const classOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: "item" },
      legend: { bottom: 0, icon: "circle" },
      series: [
        {
          type: "pie",
          radius: ["48%", "72%"],
          center: ["50%", "44%"],
          label: { show: false },
          data: salesClass,
          color: [
            primary,
            "color-mix(in srgb, var(--primary) 55%, #13c2c2)",
            "color-mix(in srgb, var(--primary) 40%, #94a3b8)",
          ],
        },
      ],
    }),
    [primary],
  )

  const annualOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: "axis" },
      grid: { left: 40, right: 12, top: 16, bottom: 28 },
      xAxis: { type: "category", data: salesTrend.months },
      yAxis: { type: "value", splitLine: { lineStyle: { type: "dashed" } } },
      series: [
        {
          type: "bar",
          data: annualSales,
          barWidth: "42%",
          itemStyle: { color: primary, borderRadius: [4, 4, 0, 0] },
        },
      ],
    }),
    [primary],
  )

  const activeOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: "axis" },
      grid: { left: 40, right: 12, top: 16, bottom: 28 },
      xAxis: { type: "category", data: activeUsers.labels },
      yAxis: { type: "value", splitLine: { lineStyle: { type: "dashed" } } },
      series: [
        {
          type: "bar",
          data: activeUsers.values,
          itemStyle: { color: primary, borderRadius: [4, 4, 0, 0] },
        },
      ],
    }),
    [primary],
  )

  const trafficOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: "axis" },
      grid: { left: 40, right: 16, top: 16, bottom: 28 },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: trafficOverview.labels,
      },
      yAxis: { type: "value", splitLine: { lineStyle: { type: "dashed" } } },
      series: [
        {
          type: "line",
          smooth: true,
          data: trafficOverview.values,
          areaStyle: { opacity: 0.12 },
          itemStyle: { color: primary },
        },
      ],
    }),
    [primary],
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">工作台</h1>
        <p className="text-sm text-muted-foreground">销售概览与核心经营指标</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((item) => {
          const Icon = kpiIcons[item.key]
          return (
            <ChartCard
              key={item.key}
              title={item.title}
              description={item.tip}
              className="min-h-[168px]"
            >
              <div className="mb-2 flex items-end justify-between gap-3">
                <div>
                  <div className="text-2xl font-semibold tracking-tight">
                    {item.value}
                  </div>
                </div>
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
              </div>
              <EChart option={sparkOption([...item.spark], primary)} height={56} />
            </ChartCard>
          )
        })}
      </div>

      <ChartCard title="购物车转化率" description="近 12 个月转化趋势">
        <EChart option={conversionOption} height={260} />
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <ChartCard title="销售趋势" description="线上 / 线下对比">
          <EChart option={trendOption} height={240} />
        </ChartCard>
        <ChartCard title="销售分类" description="订单状态分布">
          <EChart option={classOption} height={240} />
        </ChartCard>
        <ChartCard title="热销商品" description="本周 Top 3">
          <ul className="space-y-3 pt-1">
            {hotProducts.map((p, idx) => (
              <li
                key={p.name}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                      idx === 0
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span className="truncate">{p.name}</span>
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {p.sales}
                </span>
              </li>
            ))}
          </ul>
        </ChartCard>
        <ChartCard title="年度销售额" description="单位：万元">
          <EChart option={annualOption} height={240} />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="活跃用户" description="近 7 日活跃">
          <div className="mb-3 grid grid-cols-4 gap-2">
            {activeUsers.metrics.map((m) => (
              <div
                key={m.name}
                className="rounded-lg border bg-muted/30 px-2 py-2 text-center"
              >
                <div className="text-sm font-semibold">{m.num}</div>
                <div className="text-xs text-muted-foreground">{m.name}</div>
              </div>
            ))}
          </div>
          <EChart option={activeOption} height={220} />
        </ChartCard>
        <ChartCard title="访问量概览" description="同比访问趋势">
          <EChart option={trafficOption} height={280} />
        </ChartCard>
      </div>
    </div>
  )
}

export default WorkplacePage
