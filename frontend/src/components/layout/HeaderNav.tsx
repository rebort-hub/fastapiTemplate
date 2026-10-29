import { Link, useRouterState } from "@tanstack/react-router"

import {
  openExternalLink,
  resolveNavTarget,
  useNavItems,
  type NavItem,
} from "@/hooks/useNavItems"
import { cn } from "@/utils"

function collectLeafItems(items: NavItem[]): NavItem[] {
  const leaves: NavItem[] = []
  for (const item of items) {
    if (item.children?.length) {
      leaves.push(...collectLeafItems(item.children))
    } else if (item.path) {
      leaves.push(item)
    }
  }
  return leaves
}

export function HeaderNav() {
  const items = collectLeafItems(
    useNavItems().filter((item) => item.path !== "/settings"),
  )
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex">
      {items.map((item) => {
        const base = item.path.split("?")[0]
        const active =
          !item.external &&
          (pathname === base || pathname.startsWith(`${base}/`))
        const className = cn(
          "relative inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm transition-colors",
          active
            ? "bg-primary/10 font-medium text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )
        const content = (
          <>
            {item.icon ? <item.icon className="size-4" /> : null}
            <span className="whitespace-nowrap">{item.title}</span>
            {item.showBadge && item.showTextBadge ? (
              <span className="rounded bg-destructive px-1 text-[10px] leading-4 text-white">
                {item.showTextBadge}
              </span>
            ) : null}
            {item.showBadge && !item.showTextBadge ? (
              <span className="size-1.5 rounded-full bg-destructive" />
            ) : null}
          </>
        )
        if (item.external) {
          return (
            <button
              key={item.path}
              type="button"
              className={className}
              onClick={() => openExternalLink(item.link || item.path)}
            >
              {content}
            </button>
          )
        }
        const target = resolveNavTarget(item)
        return (
          <Link
            key={item.path}
            to={target.to}
            search={target.search}
            className={className}
          >
            {content}
          </Link>
        )
      })}
    </nav>
  )
}
