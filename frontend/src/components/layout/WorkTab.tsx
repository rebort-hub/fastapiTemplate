import { Link, useNavigate, useRouterState } from "@tanstack/react-router"
import { X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/overlay"
import { getNavTitleByPath, useNavItems } from "@/hooks/useNavItems"
import {
  closeAllWorkTabs,
  closeLeftWorkTabs,
  closeOtherWorkTabs,
  closeRightWorkTabs,
  closeWorkTab,
  openWorkTab,
  useAppSettings,
  useWorkTabs,
} from "@/store"
import { cn } from "@/utils"

type ContextState = {
  path: string
  x: number
  y: number
}

export function WorkTab() {
  const { settings } = useAppSettings()
  const { opened } = useWorkTabs()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()
  const navItems = useNavItems()
  const { t } = useTranslation()
  const [context, setContext] = useState<ContextState | null>(null)

  useEffect(() => {
    if (!settings.showWorkTab) return
    const title =
      pathname === "/"
        ? t("nav.dashboard")
        : getNavTitleByPath(pathname, navItems)
    openWorkTab({
      path: pathname,
      title,
      fixedTab: pathname === "/",
    })
  }, [pathname, settings.showWorkTab, t, navItems])

  const menuState = useMemo(() => {
    if (!context) return null
    const index = opened.findIndex((tab) => tab.path === context.path)
    const tab = opened[index]
    if (!tab || index < 0) return null

    const fixed = Boolean(tab.fixedTab)
    const closable = !fixed && opened.length > 1
    const hasClosableLeft = opened.slice(0, index).some((item) => !item.fixedTab)
    const hasClosableRight = opened
      .slice(index + 1)
      .some((item) => !item.fixedTab)
    const closableCount = opened.filter((item) => !item.fixedTab).length

    return {
      path: context.path,
      closable,
      // 对齐 web：有多个可关闭标签，或在固定页上仍可关掉其它页
      canCloseOther: closableCount > 1 || (fixed && closableCount > 0),
      canCloseLeft: hasClosableLeft,
      canCloseRight: hasClosableRight,
      canCloseAll: closableCount > 0,
    }
  }, [context, opened])

  const goPath = (path: string) => {
    void navigate({ to: path })
  }

  const runAction = (action: string, path: string) => {
    switch (action) {
      case "refresh":
        if (pathname === path) {
          window.location.reload()
        } else {
          goPath(path)
        }
        break
      case "close": {
        const next = closeWorkTab(path)
        if (pathname === path) goPath(next)
        break
      }
      case "closeOther":
        closeOtherWorkTabs(path)
        if (pathname !== path) goPath(path)
        break
      case "closeLeft":
        closeLeftWorkTabs(path)
        break
      case "closeRight":
        closeRightWorkTabs(path)
        break
      case "closeAll": {
        const next = closeAllWorkTabs()
        goPath(next)
        break
      }
      default:
        break
    }
    setContext(null)
  }

  if (!settings.showWorkTab) return null

  return (
    <div className="ntesterc-work-tab flex h-10 shrink-0 items-center gap-1 border-b border-border bg-card px-2">
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {opened.map((tab) => {
          const active = tab.path === pathname
          return (
            <div
              key={tab.path}
              className={cn(
                "group inline-flex h-7 max-w-[160px] items-center gap-1 rounded-md border px-2 text-xs transition-colors",
                active
                  ? "border-primary/30 bg-primary/10 text-foreground"
                  : "border-transparent bg-muted/60 text-muted-foreground hover:bg-muted",
              )}
              onContextMenu={(e) => {
                e.preventDefault()
                setContext({ path: tab.path, x: e.clientX, y: e.clientY })
              }}
            >
              <Link to={tab.path} className="truncate">
                {tab.title}
              </Link>
              {!tab.fixedTab && (
                <button
                  type="button"
                  className="rounded p-0.5 opacity-60 hover:bg-background hover:opacity-100"
                  aria-label="close"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const next = closeWorkTab(tab.path)
                    if (pathname === tab.path) {
                      goPath(next)
                    }
                  }}
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {context && menuState && (
        <DropdownMenu
          open
          modal={false}
          onOpenChange={(open) => {
            if (!open) setContext(null)
          }}
        >
          <DropdownMenuTrigger asChild>
            <span
              aria-hidden
              className="pointer-events-none fixed size-0"
              style={{ left: context.x, top: context.y }}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="bottom"
            className="min-w-[140px]"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <DropdownMenuItem onClick={() => runAction("refresh", menuState.path)}>
              {t("worktab.refresh")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={!menuState.closable}
              onClick={() => runAction("close", menuState.path)}
            >
              {t("worktab.close")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!menuState.canCloseOther}
              onClick={() => runAction("closeOther", menuState.path)}
            >
              {t("worktab.closeOther")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!menuState.canCloseLeft}
              onClick={() => runAction("closeLeft", menuState.path)}
            >
              {t("worktab.closeLeft")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!menuState.canCloseRight}
              onClick={() => runAction("closeRight", menuState.path)}
            >
              {t("worktab.closeRight")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={!menuState.canCloseAll}
              onClick={() => runAction("closeAll", menuState.path)}
            >
              {t("worktab.closeAll")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
