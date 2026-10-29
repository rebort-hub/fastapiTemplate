import { useAppSettings } from "@/store"
import { cn } from "@/lib/utils"

type NtestercBounceCubeSpinnerProps = {
  className?: string
  /** 方块边长，默认 50 */
  size?: number
}

/**
 * 弹跳方块加载动画（对齐 lod `loader.css`）
 * 颜色跟随应用主题色 `primaryColor`（`currentColor`）
 */
export function NtestercBounceCubeSpinner({
  className,
  size = 50,
}: NtestercBounceCubeSpinnerProps) {
  const { settings } = useAppSettings()

  return (
    <div
      className={cn("ntesterc-bounce-cube", className)}
      style={{ width: size, height: size, color: settings.primaryColor }}
      aria-hidden
    />
  )
}
