import { useCallback, useEffect, useState } from "react"

import { loadingService } from "@/lib/loading"

/**
 * 运行时全局 Loading（`loadingService` + `NtestercLoadingHost`）。
 * 首屏刷新引导层请用 `appLoader`（见 `lib/loading.ts`），不在此 hook 内。
 *
 * ```ts
 * const { showLoading, hideLoading, withLoading, visible } = useLoading()
 * await withLoading(async () => { await api.save() })
 * ```
 */
export function useLoading() {
  const [visible, setVisible] = useState(loadingService.visible)

  useEffect(() => loadingService.subscribe(setVisible), [])

  const showLoading = useCallback(() => loadingService.show(), [])
  const hideLoading = useCallback(() => loadingService.hide(), [])
  const forceHide = useCallback(() => loadingService.forceHide(), [])

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      const close = loadingService.show()
      try {
        return await fn()
      } finally {
        close()
      }
    },
    [],
  )

  return {
    visible,
    showLoading,
    hideLoading,
    forceHide,
    withLoading,
  }
}
