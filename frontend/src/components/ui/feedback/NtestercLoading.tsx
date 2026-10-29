import { useEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"

import { NtestercBounceCubeSpinner } from "./NtestercBounceCubeSpinner"
import { loadingService } from "@/lib/loading"
import { cn } from "@/lib/utils"

type NtestercLoadingProps = {
  /** 是否显示加载 */
  spinning?: boolean
  /** 全屏遮罩（默认局部，需父级 relative） */
  fullscreen?: boolean
  /** 自定义指示器；默认弹跳方块 */
  indicator?: ReactNode
  /** 提示文案 */
  tip?: ReactNode
  /** 局部模式下包裹的内容 */
  children?: ReactNode
  className?: string
  /** 遮罩背景，默认跟随亮/暗色 */
  background?: string
}

/**
 * 加载遮罩：局部 / 全屏。局部用法：
 * ```tsx
 * <NtestercLoading spinning={loading}>
 *   <YourContent />
 * </NtestercLoading>
 * ```
 */
export function NtestercLoading({
  spinning = false,
  fullscreen = false,
  indicator,
  tip,
  children,
  className,
  background,
}: NtestercLoadingProps) {
  const mask = spinning ? (
    <div
      className={cn(
        "ntesterc-loading-mask",
        fullscreen
          ? "ntesterc-loading-mask--fullscreen"
          : "ntesterc-loading-mask--local",
        className,
      )}
      style={background ? { background } : undefined}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="ntesterc-loading-mask__inner">
        {indicator ?? <NtestercBounceCubeSpinner />}
        {tip ? (
          <p className="ntesterc-loading-mask__tip">{tip}</p>
        ) : null}
      </div>
    </div>
  ) : null

  if (fullscreen) {
    if (!spinning || typeof document === "undefined") return null
    return createPortal(mask, document.body)
  }

  return (
    <div className={cn("relative min-h-0", className)}>
      {children}
      {mask}
    </div>
  )
}

/**
 * 挂载在应用根节点，响应 `loadingService.show/hide`。
 * 与首屏 `index.html` 引导层同用弹跳方块。
 */
export function NtestercLoadingHost() {
  const [visible, setVisible] = useState(loadingService.visible)

  useEffect(() => loadingService.subscribe(setVisible), [])

  return <NtestercLoading spinning={visible} fullscreen />
}
