
export const APP_LOADER_ELEMENT_ID = "ntesterc-app-loader"

/** 首屏淡出后延迟移除节点 */
export const APP_LOADER_FADE_MS = 220

/** 布局就绪后再收起的缓冲 */
export const APP_LOADER_HIDE_DELAY_MS = 280

/** 首屏遮罩兜底超时，避免事件未触发导致常驻 */
export const APP_LOADER_FALLBACK_MS = 2_000

type LoadingListener = (visible: boolean) => void

type AppLoaderHideOptions = {
  /** 开始淡出前的延迟，默认 {@link APP_LOADER_HIDE_DELAY_MS} */
  delayMs?: number
}

type RouterLike = {
  subscribe: (
    eventType: "onResolved" | "onRendered",
    fn: () => void,
  ) => () => void
}

let visible = false
let lockCount = 0
const listeners = new Set<LoadingListener>()
let appLoaderHidden = false

function emit() {
  const next = lockCount > 0
  if (next === visible) return
  visible = next
  listeners.forEach((listener) => listener(visible))
}

/**
 * 收起 `index.html` 首屏 bounce loader。
 * 幂等：多次调用只会执行一次。
 */
export function hideAppLoader(options: AppLoaderHideOptions = {}): void {
  if (appLoaderHidden || typeof document === "undefined") return
  appLoaderHidden = true

  const delayMs = options.delayMs ?? APP_LOADER_HIDE_DELAY_MS

  const run = () => {
    const el = document.getElementById(APP_LOADER_ELEMENT_ID)
    if (!el) return
    el.classList.add("is-done")
    el.setAttribute("aria-hidden", "true")
    el.setAttribute("aria-busy", "false")
    window.setTimeout(() => {
      el.remove()
    }, APP_LOADER_FADE_MS)
  }


  window.requestAnimationFrame(() => {
    if (delayMs <= 0) {
      run()
      return
    }
    window.setTimeout(run, delayMs)
  })
}


export function bindAppLoader(router: RouterLike): () => void {
  const dismiss = () => hideAppLoader()

  const unsubResolved = router.subscribe("onResolved", dismiss)
  const unsubRendered = router.subscribe("onRendered", dismiss)

  const fallbackId = window.setTimeout(() => {
    hideAppLoader({ delayMs: 0 })
  }, APP_LOADER_FALLBACK_MS)

  return () => {
    unsubResolved()
    unsubRendered()
    window.clearTimeout(fallbackId)
  }
}


export const appLoader = {
  elementId: APP_LOADER_ELEMENT_ID,
  hide: hideAppLoader,
  bind: bindAppLoader,
}

/** 全局 Loading 服务（命令式，可在非 React 上下文调用） */
export const loadingService = {
  /** 显示全局遮罩；返回关闭函数 */
  show(): () => void {
    lockCount += 1
    emit()
    let closed = false
    return () => {
      if (closed) return
      closed = true
      loadingService.hide()
    }
  },

  hide(): void {
    lockCount = Math.max(0, lockCount - 1)
    emit()
  },

  /** 强制关闭全部 */
  forceHide(): void {
    lockCount = 0
    emit()
  },

  get visible() {
    return visible
  },

  subscribe(listener: LoadingListener): () => void {
    listeners.add(listener)
    listener(visible)
    return () => {
      listeners.delete(listener)
    }
  },
}
