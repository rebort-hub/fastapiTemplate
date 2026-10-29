import { useMemo } from "react"
import {
  BarChart3,
  Download,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react"

import { EChart } from "@/components/Common/EChart"
import { Button } from "@/components/ui/action"
import type { EChartsOption } from "@/lib/echarts"
import { cn } from "@/lib/utils"

import { ChartCard } from "./components/ChartCard"
import { getPrimaryColor } from "./chart-theme"
import {
  regionSales,
  revenue,
  satisfaction,
  targetVsReality,
  todaySales,
  topProducts,
  visitorInsights,
  volumeService,
} from "./mock/analysis"

const todayIcons = [BarChart3, ShoppingCart, Package, Users]

export function AnalysisPage() {
  const primary = useMemo(() => getPrimaryColor(), [])

  const visitorOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: "axis" },
      legend: { data: ["老客户", "新客户"], top: 0 },
      grid: { left: 40, right: 12, top: 36, bottom: 28 },
      xAxis: { type: "category", data: visitorInsights.labels },
      yAxis: { type: "value", splitLine: { lineStyle: { type: "dashed" } } },
      series: [
        {
          name: "老客户",
          type: "line",
          smooth: true,
          data: visitorInsights.loyal,
          itemStyle: { color: primary },
        },
        {
          name: "新客户",
          type: "line",
          smooth: true,
          data: visitorInsights.newUsers,
          itemStyle: { color: "#13c2c2" },
        },
      ],
    }),
    [primary],
  )

  const satisfactionOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: "axis" },
      legend: { data: ["上个月", "本月"], top: 0 },
      grid: { left: 40, right: 12, top: 36, bottom: 28 },
      xAxis: { type: "category", data: satisfaction.labels },
      yAxis: { type: "value", min: 50, splitLine: { lineStyle: { type: "dashed" } } },
      series: [
        {
          name: "上个月",
          type: "line",
          smooth: true,
          data: satisfaction.lastMonth,
          areaStyle: { opacity: 0.08 },
          itemStyle: { color: "#94a3b8" },
        },
        {
          name: "本月",
          type: "line",
          smooth: true,
          data: satisfaction.thisMonth,
          areaStyle: { opacity: 0.12 },
          itemStyle: { color: primary },
        },
      ],
    }),
    [primary],
  )

  const revenueOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: "axis" },
      legend: { data: ["线上销售", "线下销售"], top: 0 },
      grid: { left: 40, right: 12, top: 36, bottom: 28 },
      xAxis: { type: "category", data: revenue.labels },
      yAxis: { type: "value", splitLine: { lineStyle: { type: "dashed" } } },
      series: [
        {
          name: "线上销售",
          type: "bar",
          data: revenue.online,
          itemStyle: { color: primary, borderRadius: [4, 4, 0, 0] },
        },
        {
          name: "线下销售",
          type: "bar",
          data: revenue.offline,
          itemStyle: { color: "#13c2c2", borderRadius: [4, 4, 0, 0] },
        },
      ],
    }),
    [primary],
  )

  const targetOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: "axis" },
      legend: { data: ["目标", "现实"], top: 0 },
      grid: { left: 40, right: 12, top: 36, bottom: 28 },
      xAxis: { type: "category", data: targetVsReality.labels },
      yAxis: { type: "value", splitLine: { lineStyle: { type: "dashed" } } },
      series: [
        {
          name: "目标",
          type: "bar",
          data: targetVsReality.target,
          itemStyle: { color: "color-mix(in srgb, var(--primary) 35%, #cbd5e1)" },
        },
        {
          name: "现实",
          type: "bar",
          data: targetVsReality.reality,
          itemStyle: { color: primary },
        },
      ],
    }),
    [primary],
  )

  const regionOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: "item" },
      legend: { bottom: 0, icon: "circle" },
      series: [
        {
          type: "pie",
          radius: ["42%", "68%"],
          center: ["50%", "42%"],
          label: { formatter: "{b}\n{d}%" },
          data: regionSales,
          color: [primary, "#13c2c2", "#722ed1"],
        },
      ],
    }),
    [primary],
  )

  const volumeOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: "axis" },
      legend: { data: ["业务量", "服务水平"], top: 0 },
      grid: { left: 40, right: 12, top: 36, bottom: 28 },
      xAxis: { type: "category", data: volumeService.labels },
      yAxis: { type: "value", splitLine: { lineStyle: { type: "dashed" } } },
      series: [
        {
          name: "业务量",
          type: "bar",
          stack: "total",
          data: volumeService.volume,
          itemStyle: { color: primary },
        },
        {
          name: "服务水平",
          type: "bar",
          stack: "total",
          data: volumeService.service,
          itemStyle: { color: "#13c2c2" },
        },
      ],
    }),
    [primary],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">分析页</h1>
          <p className="text-sm text-muted-foreground">
            销售、访客与目标达成数据洞察
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="size-3.5" />
          导出
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <ChartCard title="今日销售" description="销售总结">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {todaySales.map((item, idx) => {
              const Icon = todayIcons[idx] ?? BarChart3
              return (
                <div
                  key={item.label}
                  className="flex flex-col justify-center rounded-xl border px-4 py-5"
                >
                  <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <div className="text-2xl font-semibold tabular-nums">
                    {item.value}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {item.label}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    较昨天{" "}
                    <span
                      className={cn(
                        "font-medium",
                        item.up ? "text-emerald-600" : "text-rose-500",
                      )}
                    >
                      {item.change}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </ChartCard>

        <ChartCard title="访客洞察" description="老客户 / 新客户">
          <EChart option={visitorOption} height={260} />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <ChartCard title="客户满意度" description="近 7 日对比">
            <EChart option={satisfactionOption} height={240} />
          </ChartCard>
          <ChartCard title="总收入" description="线上 / 线下">
            <EChart option={revenueOption} height={240} />
          </ChartCard>
        </div>
        <div className="flex flex-col gap-4">
          <ChartCard title="目标与现实" description="销量达成">
            <EChart option={targetOption} height={200} />
            <div className="mt-3 grid grid-cols-2 gap-3">
              {targetVsReality.summary.map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border bg-muted/20 px-3 py-2"
                >
                  <div className="text-xs text-muted-foreground">{s.sub}</div>
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="text-lg font-semibold tabular-nums">
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
          <ChartCard title="热门产品" description="人气与销售额">
            <div className="space-y-4">
              {topProducts.map((p) => (
                <div key={p.name} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {p.sales}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${p.popularity}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="全国销售分布" description="重点城市占比">
          <EChart option={regionOption} height={280} />
        </ChartCard>
        <ChartCard
          title="业务量与服务水平"
          description="堆叠对比"
          className="lg:col-span-2"
        >
          <EChart option={volumeOption} height={280} />
        </ChartCard>
      </div>
    </div>
  )
}

export default AnalysisPage
