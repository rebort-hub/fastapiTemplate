import { useLayoutEffect } from "react"

import { hideAppLoader } from "@/lib/loading"

/**
 * 挂在应用树内：首次提交后收起 `index.html` 首屏引导层。
 * 不依赖路由事件时序，避免刷新后遮罩常驻导致白屏。
 */
export function AppLoaderDismiss() {
  useLayoutEffect(() => {
    hideAppLoader()
  }, [])

  return null
}
