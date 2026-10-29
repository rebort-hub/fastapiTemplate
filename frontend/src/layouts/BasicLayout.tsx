import { Link, Outlet, useRouterState } from "@tanstack/react-router"
import { Settings } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { LanguageSwitcher } from "@/components/Common/LanguageSwitcher"
import { HeaderNav } from "@/components/layout/HeaderNav"
import { SettingsPanel } from "@/components/layout/SettingsPanel"
import { WorkTab } from "@/components/layout/WorkTab"
import AppSidebar from "@/components/Sidebar/AppSidebar"
import DualSidebar from "@/components/Sidebar/DualSidebar"
import { HeaderUserMenu } from "@/components/Sidebar/User"
import { Button } from "@/components/ui/action"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/layout"
import useAuth from "@/hooks/useAuth"
import { getNavTitleByPath, useNavItems } from "@/hooks/useNavItems"
import { useAppSettings } from "@/store"
import { cn } from "@/utils"

function useBreadcrumbs() {
  const { t } = useTranslation()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navItems = useNavItems()

  return useMemo(() => {
    const title = getNavTitleByPath(pathname, navItems)
    if (!title || title === pathname) {
      const fallback: Record<string, string> = {
        "/": t("nav.dashboard"),
        "/items": t("nav.items"),
        "/settings": t("nav.userSettings"),
      }
      const label = fallback[pathname]
      if (!label) return []
      if (pathname === "/") return [{ label }]
      return [{ label: t("nav.dashboard"), to: "/" as const }, { label }]
    }
    if (pathname === "/" || pathname === "/dashboard/workplace") {
      return [{ label: title }]
    }
    return [{ label: t("nav.dashboard"), to: "/" as const }, { label: title }]
  }, [navItems, pathname, t])
}

export function BasicLayout() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const { settings } = useAppSettings()
  const breadcrumbs = useBreadcrumbs()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const layout = settings.menuLayout
  const showSidebar = layout !== "horizontal"
  const showHeaderNav = layout === "horizontal" || layout === "mixed"
  const showCollapse =
    layout === "vertical" || layout === "mixed"
  const dualMode = layout === "dual"
  const providerOpen = dualMode ? true : sidebarOpen

  return (
    <SidebarProvider
      open={showSidebar ? providerOpen : false}
      onOpenChange={(next) => {
        if (dualMode || !showSidebar) return
        setSidebarOpen(next)
      }}
      className={cn(!showSidebar && "[&_[data-slot=sidebar-gap]]:hidden [&_[data-slot=sidebar-container]]:hidden")}
    >
      {showSidebar && (dualMode ? <DualSidebar /> : <AppSidebar />)}
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card/90 px-3 backdrop-blur-md sm:gap-3 sm:px-4">
          {showCollapse && showSidebar && (
            <SidebarTrigger className="-ml-1 shrink-0 text-muted-foreground" />
          )}
          {dualMode && (
            <SidebarTrigger className="-ml-1 shrink-0 text-muted-foreground md:hidden" />
          )}
          {showHeaderNav && <HeaderNav />}
          {/* 移动端：当前页标题；桌面：面包屑 */}
          {!showHeaderNav && breadcrumbs.length > 0 && (
            <>
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground md:hidden">
                {breadcrumbs[breadcrumbs.length - 1]?.label}
              </p>
              {settings.showBreadcrumb && (
                <nav className="hidden min-w-0 items-center gap-1 text-sm text-muted-foreground md:flex">
                  {breadcrumbs.map((item, index) => (
                    <span
                      key={`${item.label}-${index}`}
                      className="flex items-center gap-1"
                    >
                      {index > 0 && <span className="opacity-40">/</span>}
                      {"to" in item && item.to ? (
                        <Link to={item.to} className="hover:text-foreground">
                          {item.label}
                        </Link>
                      ) : (
                        <span className="truncate font-medium text-foreground">
                          {item.label}
                        </span>
                      )}
                    </span>
                  ))}
                </nav>
              )}
            </>
          )}
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
            <LanguageSwitcher />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9"
              title={t("settingsPanel.title")}
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="size-4 text-muted-foreground" />
            </Button>
            <HeaderUserMenu user={user} />
          </div>
        </header>

        <WorkTab />

        <main className="min-w-0 flex-1 p-3 sm:p-4 md:p-6">
          <div
            className={cn(
              "app-content-card mx-auto min-w-0 rounded-xl border border-border bg-card p-3 sm:p-4 md:p-6",
              settings.containerWidth === "full" && "max-w-none",
            )}
            style={
              settings.containerWidth === "fixed"
                ? { maxWidth: settings.containerFixedWidth }
                : undefined
            }
          >
            <Outlet />
          </div>
        </main>
      </SidebarInset>

      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
    </SidebarProvider>
  )
}

export default BasicLayout
