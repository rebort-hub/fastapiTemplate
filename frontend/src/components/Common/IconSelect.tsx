import { useEffect, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/action"
import { Input } from "@/components/ui/form"
import {
  loadMenuIconGroups,
  normalizeMenuIconName,
  resolveMenuIcon,
  type MenuIconGroup,
} from "@/lib/menu-icons"
import { cn } from "@/utils"

type IconSelectProps = {
  value?: string
  disabled?: boolean
  placeholder?: string
  onChange: (value: string) => void
}

const PAGE_SIZE = 48

export function IconSelect({
  value = "",
  disabled,
  placeholder = "请选择 Lucide 图标",
  onChange,
}: IconSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [groups] = useState<MenuIconGroup[]>(() => loadMenuIconGroups())
  const [tab, setTab] = useState(0)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const normalized = normalizeMenuIconName(value)
  const SelectedIcon = normalized ? resolveMenuIcon(normalized) : null

  const currentIcons = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (q) {
      return groups.flatMap((g) => g.icons).filter((item) =>
        item.name.toLowerCase().includes(q),
      )
    }
    return groups[tab]?.icons ?? []
  }, [groups, search, tab])

  const totalPages = Math.max(1, Math.ceil(currentIcons.length / PAGE_SIZE))
  const pageIcons = currentIcons.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, tab])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current
      if (!root) return
      const target = event.target
      if (target instanceof Node && !root.contains(target)) {
        setOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    // 捕获阶段：Sheet 内空白区域也能收到
    document.addEventListener("pointerdown", onPointerDown, true)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        className="h-9 w-full justify-start gap-2 font-normal"
        onClick={() => setOpen((v) => !v)}
      >
        {SelectedIcon && normalized ? (
          <>
            <SelectedIcon className="size-4" />
            <span className="truncate">{normalized}</span>
          </>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </Button>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-[min(100vw-2rem,440px)] rounded-lg border bg-popover p-3 shadow-lg">
          <div className="mb-2 flex items-center gap-2">
            <Input
              value={search}
              placeholder="搜索图标，如 Settings / User"
              className="h-8"
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!value}
              className="shrink-0 text-destructive"
              onClick={() => onChange("")}
            >
              清除
            </Button>
          </div>

          {!search.trim() && (
            <div className="mb-2 flex max-h-16 flex-wrap gap-1 overflow-y-auto">
              {groups.map((group, index) => (
                <button
                  key={group.type}
                  type="button"
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs transition-colors",
                    tab === index
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setTab(index)}
                >
                  {group.type}
                </button>
              ))}
            </div>
          )}

          <div className="grid max-h-56 grid-cols-8 gap-1 overflow-y-auto">
            {pageIcons.map(({ name, Icon }) => (
              <button
                key={name}
                type="button"
                title={name}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-md border text-base transition-colors hover:border-primary hover:text-primary",
                  normalized === name &&
                    "border-primary bg-primary/10 text-primary",
                )}
                onClick={() => {
                  onChange(name)
                  setOpen(false)
                }}
              >
                <Icon className="size-4" />
              </button>
            ))}
            {pageIcons.length === 0 && (
              <div className="col-span-8 py-8 text-center text-sm text-muted-foreground">
                无匹配图标
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Lucide · 共 {currentIcons.length} 个 · 第 {page}/{totalPages} 页
            </span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                上一页
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                下一页
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
