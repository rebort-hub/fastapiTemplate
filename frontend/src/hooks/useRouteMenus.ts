import { useQuery } from "@tanstack/react-query"
import type { ComponentType, CSSProperties } from "react"
import { useMemo } from "react"

import {
  buildMenuTree,
  listMyRouteMenus,
  type MenuTreeNode,
  type MenuType,
} from "@/api/system"
import { isLoggedIn } from "@/hooks/useAuth"
import { resolveMenuIcon } from "@/lib/menu-icons"

export type MenuIconComponent = ComponentType<{
  className?: string
  style?: CSSProperties
}>

export type NavMenuItem = {
  key: string
  title: string
  path?: string
  icon: MenuIconComponent | null
  type?: MenuType
  link?: string | null
  isIframe?: boolean
  showBadge?: boolean
  showTextBadge?: string | null
  children?: NavMenuItem[]
}


export function buildIframePath(link: string) {
  return `/outside?url=${encodeURIComponent(link)}`
}

function resolveNavPath(node: MenuTreeNode): string | undefined {
  if (node.type === 4) {
    if (!node.link) return undefined
    if (node.is_iframe) return buildIframePath(node.link)
    return node.link
  }
  return node.route_path ?? undefined
}

function toNavItems(nodes: MenuTreeNode[]): NavMenuItem[] {
  return nodes.map((node) => {
    const children = node.children?.length
      ? toNavItems(node.children)
      : undefined
    return {
      key: String(node.id),
      title: node.name,
      path: resolveNavPath(node),
      icon: resolveMenuIcon(node.icon),
      type: node.type,
      link: node.link,
      isIframe: node.is_iframe,
      showBadge: node.show_badge,
      showTextBadge: node.show_text_badge,
      children,
    }
  })
}

export function useRouteMenus() {
  const query = useQuery({
    queryKey: ["routeMenus"],
    queryFn: listMyRouteMenus,
    enabled: isLoggedIn(),
    staleTime: 60_000,
  })

  const navItems = useMemo(() => {
    if (!query.data) return []
    return toNavItems(buildMenuTree(query.data))
  }, [query.data])

  return {
    ...query,
    navItems,
  }
}
