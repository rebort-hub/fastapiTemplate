import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { useMemo } from "react"

import { Button } from "@/components/ui/action"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/form"
import { cn } from "@/utils"

export type ProTablePaginationProps = {
  current: number
  pageSize: number
  total: number
  pageSizeOptions?: number[]
  onChange: (page: number, pageSize: number) => void
  className?: string
}

function buildPageList(current: number, pageCount: number): Array<number | "…"> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1)
  }
  const pages = new Set<number>([1, pageCount, current - 1, current, current + 1])
  if (current <= 3) {
    pages.add(2)
    pages.add(3)
    pages.add(4)
  }
  if (current >= pageCount - 2) {
    pages.add(pageCount - 1)
    pages.add(pageCount - 2)
    pages.add(pageCount - 3)
  }
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b)
  const result: Array<number | "…"> = []
  for (let i = 0; i < sorted.length; i++) {
    const page = sorted[i]!
    if (i > 0 && page - sorted[i - 1]! > 1) result.push("…")
    result.push(page)
  }
  return result
}

export function ProTablePagination({
  current,
  pageSize,
  total,
  pageSizeOptions = [10, 20, 50, 100],
  onChange,
  className,
}: ProTablePaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1)
  const safePage = Math.min(Math.max(current, 1), pageCount)
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const to = Math.min(safePage * pageSize, total)
  const pages = useMemo(
    () => buildPageList(safePage, pageCount),
    [safePage, pageCount],
  )

  return (
    <div
      className={cn(
        "flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="text-xs sm:text-sm">
        <span className="sm:hidden">共 {total} 条</span>
        <span className="hidden sm:inline">
          显示第 {from} 至 {to} 条，共 {total} 条
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          <span className="hidden whitespace-nowrap sm:inline">每页行数</span>
          <span className="whitespace-nowrap sm:hidden">每页</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onChange(1, Number(v))}
          >
            <SelectTrigger className="h-8 w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            disabled={safePage <= 1}
            onClick={() => onChange(1, pageSize)}
            title="第一页"
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            disabled={safePage <= 1}
            onClick={() => onChange(safePage - 1, pageSize)}
            title="上一页"
          >
            <ChevronLeft className="size-4" />
          </Button>
          {pages.map((item, index) =>
            item === "…" ? (
              <span
                key={`ellipsis-${index}`}
                className="inline-flex size-8 items-center justify-center text-muted-foreground"
              >
                …
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                size="icon"
                variant="outline"
                className={cn(
                  "size-8",
                  item === safePage &&
                    "border-info bg-info text-info-foreground hover:bg-info hover:text-info-foreground",
                )}
                onClick={() => onChange(item, pageSize)}
              >
                {item}
              </Button>
            ),
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            disabled={safePage >= pageCount}
            onClick={() => onChange(safePage + 1, pageSize)}
            title="下一页"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            disabled={safePage >= pageCount}
            onClick={() => onChange(pageCount, pageSize)}
            title="最后一页"
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
