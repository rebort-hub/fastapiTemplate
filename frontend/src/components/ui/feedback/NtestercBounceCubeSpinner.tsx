import { useAppSettings } from "@/store"
import { cn } from "@/lib/utils"

type NtestercBounceCubeSpinnerProps = {
  className?: string
  size?: number
}


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
