import { Link as RouterLink, useNavigate, useRouterState } from "@tanstack/react-router"
import { useMemo } from "react"

import { Logo } from "@/components/Common/Logo"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/layout"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/overlay"
import {
  openExternalLink,
  resolveNavTarget,
  useNavItems,
  type NavItem,
} from "@/hooks/useNavItems"
import { cn } from "@/utils"
import { Main } from "./Main"

const RAIL_WIDTH = "3rem"
const PANEL_WIDTH = "14rem"
const DUAL_WIDTH = `calc(${RAIL_WIDTH} + ${PANEL_WIDTH})`

function isPathActive(currentPath: string, path: string) {
  if (!path || path === "#" || path.startsWith("http")) return false
  const base = path.split("?")[0]
  if (base === "/") return currentPath === "/"
  return currentPath === base || currentPath.startsWith(`${base}/`)
}

function containsPath(item: NavItem, currentPath: string): boolean {
  if (isPathActive(currentPath, item.path)) return true
  return item.children?.some((child) => containsPath(child, currentPath)) ?? false
}

function findFirstLeaf(item: NavItem): NavItem | null {
  if (!item.children?.length) {
    return item.path && item.path !== "#" ? item : null
  }
  for (const child of item.children) {
    const leaf = findFirstLeaf(child)
    if (leaf) return leaf
  }
  return null
}

function findActiveTop(items: NavItem[], currentPath: string): NavItem | undefined {
  const matched = items.find((item) => containsPath(item, currentPath))
  if (matched) return matched
  return items.find((item) => item.children?.length) ?? items[0]
}

function navigateNavItem(
  item: NavItem,
  navigate: ReturnType<typeof useNavigate>,
) {
  if (item.external) {
    openExternalLink(item.link || item.path)
    return
  }
  if (!item.path || item.path === "#") return
  const target = resolveNavTarget(item)
  void navigate({ to: target.to, search: target.search })
}

export function DualSidebar() {
  const navigate = useNavigate()
  const { isMobile, openMobile, setOpenMobile } = useSidebar()
  const currentPath = useRouterState({ select: (s) => s.location.pathname })
  const items = useNavItems().filter((item) => item.path !== "/settings")

  const activeTop = useMemo(
    () => findActiveTop(items, currentPath),
    [items, currentPath],
  )

  const secondaryItems = useMemo(() => {
    if (!activeTop) return []
    if (activeTop.children?.length) return activeTop.children
    return [activeTop]
  }, [activeTop])

  const handleTopClick = (item: NavItem) => {
    if (item.children?.length) {
      const leaf = findFirstLeaf(item)
      if (leaf) {
        navigateNavItem(leaf, navigate)
        return
      }
    }
    navigateNavItem(item, navigate)
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          side="left"
          className="w-[18rem] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>导航菜单</SheetTitle>
            <SheetDescription>双列菜单移动端面板</SheetDescription>
          </SheetHeader>
          <div className="flex h-full flex-col">
            <div className="px-4 py-6">
              <Logo variant="full" />
            </div>
            <Main items={items} />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className="group peer text-sidebar-foreground hidden md:block"
      data-state="expanded"
      data-collapsible=""
      data-variant="sidebar"
      data-side="left"
      data-slot="sidebar"
    >
      <div
        data-slot="sidebar-gap"
        className="relative bg-transparent transition-[width] duration-200 ease-linear"
        style={{ width: DUAL_WIDTH }}
      />
      <div
        data-slot="sidebar-container"
        className="fixed inset-y-0 left-0 z-10 hidden h-svh border-r md:flex"
        style={{ width: DUAL_WIDTH }}
      >
        {/* 左栏：一级菜单图标轨 */}
        <div
          className="ntesterc-sidebar flex h-full flex-col border-r border-sidebar-border bg-sidebar"
          style={{ width: RAIL_WIDTH }}
        >
          <div className="flex items-center justify-center py-5">
            <Logo variant="icon" />
          </div>
          <div className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto px-1.5 pb-3">
            {items.map((item) => {
              const active = activeTop?.path === item.path
              return (
                <button
                  key={item.path}
                  type="button"
                  title={item.title}
                  onClick={() => handleTopClick(item)}
                  className={cn(
                    "relative flex size-9 items-center justify-center rounded-lg border border-transparent text-sidebar-foreground/80 transition-colors",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    active &&
                      "border-primary bg-sidebar font-medium text-sidebar-foreground",
                  )}
                >
                  {item.icon ? (
                    <item.icon className="size-4" />
                  ) : (
                    <span className="text-xs font-medium">
                      {item.title.slice(0, 1)}
                    </span>
                  )}
                  {item.showBadge && !item.showTextBadge ? (
                    <span className="absolute right-1 top-1 size-1.5 rounded-full bg-destructive" />
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>

        {/* 右栏：当前一级下的子菜单 */}
        <div
          className="ntesterc-sidebar flex h-full min-w-0 flex-1 flex-col bg-sidebar"
          style={{ width: PANEL_WIDTH }}
        >
          <div className="flex h-14 items-center border-b border-sidebar-border px-4">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              {activeTop?.title ?? "菜单"}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto py-2">
            {secondaryItems.length > 0 ? (
              activeTop?.children?.length ? (
                <Main items={secondaryItems} />
              ) : (
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {secondaryItems.map((item) => {
                        const target = resolveNavTarget(item)
                        return (
                          <SidebarMenuItem key={item.path}>
                            {item.external ? (
                              <SidebarMenuButton
                                tooltip={item.title}
                                onClick={() => navigateNavItem(item, navigate)}
                              >
                                {item.icon ? (
                                  <item.icon className="size-4" />
                                ) : null}
                                <span>{item.title}</span>
                              </SidebarMenuButton>
                            ) : (
                              <SidebarMenuButton
                                tooltip={item.title}
                                isActive={isPathActive(currentPath, item.path)}
                                asChild
                              >
                                <RouterLink
                                  to={target.to}
                                  search={target.search}
                                >
                                  {item.icon ? (
                                    <item.icon className="size-4" />
                                  ) : null}
                                  <span>{item.title}</span>
                                </RouterLink>
                              </SidebarMenuButton>
                            )}
                            {item.showBadge ? (
                              item.showTextBadge ? (
                                <SidebarMenuBadge className="bg-destructive text-white">
                                  {item.showTextBadge}
                                </SidebarMenuBadge>
                              ) : (
                                <SidebarMenuBadge className="right-2 top-1.5 size-1.5 min-w-0 rounded-full bg-destructive p-0" />
                              )
                            ) : null}
                          </SidebarMenuItem>
                        )
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )
            ) : (
              <SidebarGroup>
                <SidebarGroupLabel>暂无子菜单</SidebarGroupLabel>
              </SidebarGroup>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DualSidebar
