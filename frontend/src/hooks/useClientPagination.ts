import { useEffect, useMemo, useState } from "react"

import type { ProTablePaginationProps } from "@/components/Common/ProTablePagination"

/** 前端分页：对完整列表切片，并产出 ProTable.pagination 配置 */
export function useClientPagination<T>(
  items: T[],
  defaultPageSize = 10,
): {
  data: T[]
  pagination: Pick<
    ProTablePaginationProps,
    "current" | "pageSize" | "total" | "onChange"
  >
} {
  const [current, setCurrent] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(items.length / pageSize) || 1)
    if (current > maxPage) setCurrent(maxPage)
  }, [items.length, pageSize, current])

  const data = useMemo(() => {
    const start = (current - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, current, pageSize])

  return {
    data,
    pagination: {
      current,
      pageSize,
      total: items.length,
      onChange: (page: number, size: number) => {
        setCurrent(page)
        setPageSize(size)
      },
    },
  }
}
