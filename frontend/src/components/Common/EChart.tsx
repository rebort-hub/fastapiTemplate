import { useEffect, useRef, useState, type CSSProperties } from "react"

import type { EChartsOption } from "@/lib/echarts"
import { cn } from "@/lib/utils"

type EChartProps = {
  option: EChartsOption
  className?: string
  style?: CSSProperties
  /** 高度，默认 320 */
  height?: number | string
  loading?: boolean
  notMerge?: boolean
  lazyUpdate?: boolean
  /**
   * 进入视口后再初始化（默认 true）
   * 避免一页多图时一次性拉起全部实例
   */
  lazy?: boolean
}

type EchartsApi = typeof import("@/lib/echarts")

/**
 * 按需 ECharts：
 * 1. 动态 import `@/lib/echarts`（路由未进图表页时不打包进首屏）
 * 2. IntersectionObserver：滚入视口才 init
 */
export function EChart({
  option,
  className,
  style,
  height = 320,
  loading = false,
  notMerge = true,
  lazyUpdate = true,
  lazy = true,
}: EChartProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<{
    setOption: (opt: EChartsOption, opts?: object) => void
    resize: () => void
    showLoading: () => void
    hideLoading: () => void
    dispose: () => void
  } | null>(null)
  const [visible, setVisible] = useState(!lazy)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!lazy) {
      setVisible(true)
      return
    }
    const el = hostRef.current
    if (!el) return

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: "120px 0px", threshold: 0.01 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [lazy])

  useEffect(() => {
    if (!visible) return
    const el = hostRef.current
    if (!el) return

    let cancelled = false
    let ro: ResizeObserver | null = null
    let onResize: (() => void) | null = null

    void import("@/lib/echarts").then((mod: EchartsApi) => {
      if (cancelled || !hostRef.current) return
      const chart = mod.echarts.init(hostRef.current, undefined, {
        renderer: "canvas",
      })
      chartRef.current = chart
      chart.setOption(option, { notMerge, lazyUpdate })
      if (loading) chart.showLoading()
      setReady(true)

      onResize = () => chart.resize()
      ro = new ResizeObserver(onResize)
      ro.observe(hostRef.current)
      window.addEventListener("resize", onResize)
    })

    return () => {
      cancelled = true
      if (onResize) window.removeEventListener("resize", onResize)
      ro?.disconnect()
      chartRef.current?.dispose()
      chartRef.current = null
      setReady(false)
    }
    // 仅在进入视口后初始化一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  useEffect(() => {
    if (!ready || !chartRef.current) return
    chartRef.current.setOption(option, { notMerge, lazyUpdate })
  }, [option, notMerge, lazyUpdate, ready])

  useEffect(() => {
    if (!ready || !chartRef.current) return
    if (loading) chartRef.current.showLoading()
    else chartRef.current.hideLoading()
  }, [loading, ready])

  return (
    <div
      ref={hostRef}
      className={cn(
        "w-full",
        !ready && "animate-pulse rounded-md bg-muted/40",
        className,
      )}
      style={{ width: "100%", height, ...style }}
    />
  )
}

export default EChart
