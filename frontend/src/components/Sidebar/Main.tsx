import { Link as RouterLink, useRouterState } from "@tanstack/react-router"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/layout"
import {
  openExternalLink,
  resolveNavTarget,
  type NavItem,
} from "@/hooks/useNavItems"
import { cn } from "@/utils"

export type Item = NavItem

interface MainProps {
  items: Item[]
}

function isPathActive(currentPath: string, path: string) {
  if (!path || path === "#" || path.startsWith("http")) return false
  const base = path.split("?")[0]
  if (base === "/") return currentPath === "/"
  return currentPath === base || currentPath.startsWith(`${base}/`)
}

function MenuBadge({ item }: { item: Item }) {
  if (!item.showBadge) return null
  if (item.showTextBadge) {
    return (
      <SidebarMenuBadge className="bg-destructive text-white">
        {item.showTextBadge}
      </SidebarMenuBadge>
    )
  }
  return (
    <SidebarMenuBadge className="right-2 top-1.5 size-1.5 min-w-0 rounded-full bg-destructive p-0" />
  )
}

function NavGroup({
  item,
  currentPath,
  onNavigate,
}: {
  item: Item
  currentPath: string
  onNavigate: () => void
}) {
  const hasChildren = Boolean(item.children?.length)
  const childActive = item.children?.some((c) =>
    isPathActive(currentPath, c.path),
  )
  const [open, setOpen] = useState(Boolean(childActive))

  if (!hasChildren) {
    const active = isPathActive(currentPath, item.path)
    if (item.external) {
      return (
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={item.title}
            onClick={() => {
              openExternalLink(item.link || item.path)
              onNavigate()
            }}
          >
            {item.icon ? <item.icon className="size-4" /> : null}
            <span>{item.title}</span>
          </SidebarMenuButton>
          <MenuBadge item={item} />
        </SidebarMenuItem>
      )
    }
    const target = resolveNavTarget(item)
    return (
      <SidebarMenuItem>
        <SidebarMenuButton tooltip={item.title} isActive={active} asChild>
          <RouterLink
            to={target.to}
            search={target.search}
            onClick={onNavigate}
          >
            {item.icon ? <item.icon className="size-4" /> : null}
            <span>{item.title}</span>
          </RouterLink>
        </SidebarMenuButton>
        <MenuBadge item={item} />
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={item.title}
        onClick={() => setOpen((v) => !v)}
      >
        {item.icon ? <item.icon className="size-4" /> : null}
        <span>{item.title}</span>
        <ChevronDown
          className={cn(
            "ml-auto size-4 transition-transform",
            open && "rotate-180",
          )}
        />
      </SidebarMenuButton>
      <MenuBadge item={item} />
      {open && (
        <SidebarMenuSub>
          {item.children!.map((child) => {
            const target = resolveNavTarget(child)
            return (
              <SidebarMenuSubItem key={child.path}>
                {child.external ? (
                  <SidebarMenuSubButton
                    onClick={() => {
                      openExternalLink(child.link || child.path)
                      onNavigate()
                    }}
                  >
                    {child.icon ? <child.icon className="size-4" /> : null}
                    <span>{child.title}</span>
                  </SidebarMenuSubButton>
                ) : (
                  <SidebarMenuSubButton
                    asChild
                    isActive={isPathActive(currentPath, child.path)}
                  >
                    <RouterLink
                      to={target.to}
                      search={target.search}
                      onClick={onNavigate}
                    >
                      {child.icon ? <child.icon className="size-4" /> : null}
                      <span>{child.title}</span>
                    </RouterLink>
                  </SidebarMenuSubButton>
                )}
                {child.showBadge ? (
                  child.showTextBadge ? (
                    <span className="pointer-events-none absolute right-1 top-1.5 rounded bg-destructive px-1 text-[10px] text-white">
                      {child.showTextBadge}
                    </span>
                  ) : (
                    <span className="pointer-events-none absolute right-2 top-2.5 size-1.5 rounded-full bg-destructive" />
                  )
                ) : null}
              </SidebarMenuSubItem>
            )
          })}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  )
}

export function Main({ items }: MainProps) {
  const { isMobile, setOpenMobile } = useSidebar()
  const router = useRouterState()
  const currentPath = router.location.pathname

  const handleMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <NavGroup
              key={item.path}
              item={item}
              currentPath={currentPath}
              onNavigate={handleMenuClick}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
