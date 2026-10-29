import { Home, FolderKanban, Settings } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import {
  useRouteMenus,
  type MenuIconComponent,
  type NavMenuItem,
} from "@/hooks/useRouteMenus"

export type NavItem = {
  icon: MenuIconComponent | null
  title: string
  path: string
  children?: NavItem[]
  link?: string | null
  isIframe?: boolean
  showBadge?: boolean
  showTextBadge?: string | null
  external?: boolean
}

function flattenLeafPaths(items: NavMenuItem[]): NavItem[] {
  const result: NavItem[] = []
  for (const item of items) {
    if (item.children?.length) {
      result.push({
        icon: item.icon,
        title: item.title,
        path: item.path || item.key,
        link: item.link,
        isIframe: item.isIframe,
        showBadge: item.showBadge,
        showTextBadge: item.showTextBadge,
        external: item.type === 4 && !item.isIframe,
        children: flattenLeafPaths(item.children),
      })
    } else if (item.path) {
      result.push({
        icon: item.icon,
        title: item.title,
        path: item.path,
        link: item.link,
        isIframe: item.isIframe,
        showBadge: item.showBadge,
        showTextBadge: item.showTextBadge,
        external: item.type === 4 && !item.isIframe,
      })
    }
  }
  return result
}

/** 侧栏导航：优先后端动态菜单，失败时回退本地默认项 */
export function useNavItems(): NavItem[] {
  const { t } = useTranslation()
  const { navItems, isError, isLoading } = useRouteMenus()

  return useMemo(() => {
    if (!isLoading && !isError && navItems.length > 0) {
      const items = flattenLeafPaths(navItems)
      items.push({
        icon: Settings,
        title: t("nav.userSettings"),
        path: "/settings",
      })
      return items
    }

    return [
      { icon: Home, title: t("nav.dashboard"), path: "/" },
      { icon: FolderKanban, title: t("nav.items"), path: "/items" },
      { icon: Settings, title: t("nav.userSettings"), path: "/settings" },
    ]
  }, [isError, isLoading, navItems, t])
}

export function getNavTitleByPath(path: string, items: NavItem[]) {
  const walk = (list: NavItem[]): string | undefined => {
    for (const item of list) {
      if (item.path === path) return item.title
      if (item.children) {
        const found = walk(item.children)
        if (found) return found
      }
    }
    return undefined
  }
  return walk(items) ?? path
}

/** 外链新窗口打开；iframe / 普通路由由调用方自行 navigate */
export function openExternalLink(url: string) {
  window.open(url, "_blank", "noopener,noreferrer")
}

/** 将 NavItem 解析为 TanStack Router 的 to + search */
export function resolveNavTarget(item: NavItem): {
  to: string
  search?: Record<string, string>
} {
  if (item.isIframe && item.link) {
    return {
      to: "/outside",
      search: {
        url: item.link,
        ...(item.title ? { title: item.title } : {}),
      },
    }
  }
  const [pathname, qs] = item.path.split("?")
  if (!qs) return { to: pathname }
  const search = Object.fromEntries(new URLSearchParams(qs).entries())
  return { to: pathname, search }
}
