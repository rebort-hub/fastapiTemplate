import { useEffect, useMemo, useState, type ReactNode } from "react"

import { ProTableColumnSettings } from "@/components/Common/ProTableColumnSettings"
import {
  ProTablePagination,
  type ProTablePaginationProps,
} from "@/components/Common/ProTablePagination"
import { Checkbox } from "@/components/ui/form"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/data"
import { useIsMobile } from "@/hooks/useMobile"
import { cn } from "@/utils"

export type ProColumn<T> = {
  key: string
  title: ReactNode
  width?: number | string
  className?: string
  headerClassName?: string
  align?: "left" | "center" | "right"
  render?: (row: T, index: number) => ReactNode
  dataIndex?: keyof T
  /** 是否可在列设置中隐藏，默认 true */
  hideable?: boolean
  /** 初始是否隐藏 */
  defaultHidden?: boolean
  /**
   * 移动端卡片角色：
   * - title：卡片主标题（默认取第一个非 actions 列）
   * - actions：底部操作区
   * - hide：移动端卡片不展示
   */
  mobile?: "title" | "actions" | "hide" | "field"
}

export type ProTableScroll = {
  /** 横向最小宽度，超出出现横向滚动条 */
  x?: number | string
  /** 表体最大高度，超出出现纵向滚动条 */
  y?: number | string
}

export type ProTableProps<T> = {
  title?: ReactNode
  toolbar?: ReactNode
  columns: ProColumn<T>[]
  dataSource: T[]
  rowKey: (row: T) => string | number
  loading?: boolean
  emptyText?: string
  className?: string
  rowSelection?: {
    selectedRowKeys: Array<string | number>
    onChange: (keys: Array<string | number>, rows: T[]) => void
  }
  /** 滚动区域；默认开启纵向滚动 */
  scroll?: ProTableScroll
  /** 表头列显隐 / 拖拽排序快捷设置，默认开启 */
  columnSettings?: boolean
  /** 分页；传入后显示底部分页栏 */
  pagination?: Omit<ProTablePaginationProps, "className">
  /** 底部额外区域（在分页上方） */
  footer?: ReactNode
  /** 窄屏改卡片列表，默认开启 */
  mobileCards?: boolean
}

const alignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
}

const DEFAULT_SCROLL_Y = "min(62vh, 520px)"

function syncColumnOrder(prev: string[], keys: string[]) {
  const keep = prev.filter((key) => keys.includes(key))
  const extras = keys.filter((key) => !keep.includes(key))
  return [...keep, ...extras]
}

function cellValue<T>(col: ProColumn<T>, row: T, index: number): ReactNode {
  if (col.render) return col.render(row, index)
  if (col.dataIndex) return row[col.dataIndex] as ReactNode
  return null
}

/**
 * 企业级表格壳：标题栏 + 列设置 + 横/纵滚动 + 分页 + 移动端卡片。
 */
export function ProTable<T>({
  title,
  toolbar,
  columns,
  dataSource,
  rowKey,
  loading,
  emptyText = "暂无数据",
  className,
  rowSelection,
  scroll,
  columnSettings = true,
  pagination,
  footer,
  mobileCards = true,
}: ProTableProps<T>) {
  const isMobile = useIsMobile()
  const useCards = mobileCards && isMobile
  const scrollY = scroll?.y ?? DEFAULT_SCROLL_Y
  const scrollX = scroll?.x
  const columnKeys = columns.map((col) => col.key)

  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(
    () => new Set(columns.filter((c) => c.defaultHidden).map((c) => c.key)),
  )
  const [columnOrder, setColumnOrder] = useState<string[]>(() => columnKeys)

  useEffect(() => {
    setColumnOrder((prev) => syncColumnOrder(prev, columnKeys))
  }, [columnKeys.join("|")])

  const orderedColumns = useMemo(() => {
    const map = new Map(columns.map((col) => [col.key, col]))
    return columnOrder
      .map((key) => map.get(key))
      .filter((col): col is ProColumn<T> => Boolean(col))
  }, [columns, columnOrder])

  const visibleColumns = useMemo(
    () => orderedColumns.filter((col) => !hiddenKeys.has(col.key)),
    [orderedColumns, hiddenKeys],
  )

  const titleColumn = useMemo(() => {
    return (
      visibleColumns.find((c) => c.mobile === "title") ??
      visibleColumns.find((c) => c.key !== "actions" && c.mobile !== "hide")
    )
  }, [visibleColumns])

  const fieldColumns = useMemo(() => {
    return visibleColumns.filter((c) => {
      if (c.mobile === "hide" || c.mobile === "actions") return false
      if (titleColumn && c.key === titleColumn.key) return false
      return c.key !== "actions"
    })
  }, [visibleColumns, titleColumn])

  const actionsColumn = useMemo(() => {
    return (
      visibleColumns.find((c) => c.mobile === "actions" || c.key === "actions") ??
      null
    )
  }, [visibleColumns])

  const allKeys = dataSource.map(rowKey)
  const selectedSet = new Set(rowSelection?.selectedRowKeys ?? [])
  const allSelected =
    allKeys.length > 0 && allKeys.every((k) => selectedSet.has(k))
  const someSelected =
    allKeys.some((k) => selectedSet.has(k)) && !allSelected

  const colSpan = visibleColumns.length + (rowSelection ? 1 : 0)

  const toggleRow = (key: string | number, checked: boolean) => {
    if (!rowSelection) return
    const next = new Set(selectedSet)
    if (checked) next.add(key)
    else next.delete(key)
    const keys = [...next]
    const rows = dataSource.filter((item) => next.has(rowKey(item)))
    rowSelection.onChange(keys, rows)
  }

  const columnSettingsBtn = columnSettings ? (
    <ProTableColumnSettings
      columns={columns.map((col) => ({
        key: col.key,
        title: col.title,
        hideable: col.hideable,
      }))}
      columnOrder={columnOrder}
      hiddenKeys={hiddenKeys}
      visibleCount={visibleColumns.length}
      onOrderChange={setColumnOrder}
      onHiddenChange={setHiddenKeys}
    />
  ) : null

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm",
        className,
      )}
    >
      {(title || toolbar || columnSettings) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-3 py-3 sm:px-4">
          <div className="text-sm font-semibold tracking-tight text-foreground">
            {title}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {toolbar}
            {!useCards ? columnSettingsBtn : null}
          </div>
        </div>
      )}

      {useCards ? (
        <div
          className="min-h-0 flex-1 space-y-3 overflow-auto p-3"
          style={{ maxHeight: scrollY }}
        >
          {rowSelection && dataSource.length > 0 ? (
            <label className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
              <Checkbox
                checked={
                  allSelected ? true : someSelected ? "indeterminate" : false
                }
                onCheckedChange={(checked) => {
                  if (checked) rowSelection.onChange(allKeys, dataSource)
                  else rowSelection.onChange([], [])
                }}
              />
              全选
            </label>
          ) : null}

          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              加载中…
            </div>
          ) : null}

          {!loading && dataSource.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {emptyText}
            </div>
          ) : null}

          {!loading &&
            dataSource.map((row, index) => {
              const key = rowKey(row)
              const checked = selectedSet.has(key)
              return (
                <div
                  key={key}
                  className={cn(
                    "rounded-lg border border-border bg-card p-3 shadow-xs",
                    checked && "border-primary/40 bg-primary/5",
                  )}
                >
                  <div className="flex items-start gap-2">
                    {rowSelection ? (
                      <Checkbox
                        className="mt-0.5"
                        checked={checked}
                        onCheckedChange={(v) => toggleRow(key, Boolean(v))}
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      {titleColumn ? (
                        <div className="text-sm font-medium text-foreground">
                          {cellValue(titleColumn, row, index)}
                        </div>
                      ) : null}
                      {fieldColumns.length > 0 ? (
                        <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                          {fieldColumns.map((col) => (
                            <div
                              key={col.key}
                              className="min-w-0 text-xs text-muted-foreground"
                            >
                              <span className="mr-1 text-muted-foreground/80">
                                {col.title}：
                              </span>
                              <span className="break-words text-foreground">
                                {cellValue(col, row, index) ?? "-"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {actionsColumn ? (
                        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border/80 pt-2">
                          {cellValue(actionsColumn, row, index)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      ) : (
        <div
          className="min-h-0 flex-1 overflow-auto"
          style={{ maxHeight: scrollY }}
        >
          <Table
            containerClassName="overflow-visible rounded-none border-0"
            style={
              scrollX ? { minWidth: scrollX } : { minWidth: "max-content" }
            }
          >
            <TableHeader className="sticky top-0 z-10 bg-muted/45 backdrop-blur supports-backdrop-filter:bg-muted/45">
              <TableRow className="hover:bg-transparent">
                {rowSelection && (
                  <TableHead className="h-10 w-10 bg-muted/45 px-3">
                    <Checkbox
                      checked={
                        allSelected
                          ? true
                          : someSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          rowSelection.onChange(allKeys, dataSource)
                        } else {
                          rowSelection.onChange([], [])
                        }
                      }}
                    />
                  </TableHead>
                )}
                {visibleColumns.map((col) => (
                  <TableHead
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={cn(
                      "h-10 bg-muted/45 px-3 text-xs font-semibold tracking-wide text-muted-foreground",
                      alignClass[col.align ?? "left"],
                      col.headerClassName,
                    )}
                  >
                    {col.title}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell
                    colSpan={Math.max(colSpan, 1)}
                    className="h-28 text-center text-sm text-muted-foreground"
                  >
                    加载中…
                  </TableCell>
                </TableRow>
              )}
              {!loading && dataSource.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={Math.max(colSpan, 1)}
                    className="h-28 text-center text-sm text-muted-foreground"
                  >
                    {emptyText}
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                dataSource.map((row, index) => {
                  const key = rowKey(row)
                  const checked = selectedSet.has(key)
                  return (
                    <TableRow
                      key={key}
                      data-state={checked ? "selected" : undefined}
                      className={cn(
                        "border-border",
                        index % 2 === 1 && "bg-muted/45",
                      )}
                    >
                      {rowSelection && (
                        <TableCell className="px-3 py-2.5">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) =>
                              toggleRow(key, Boolean(v))
                            }
                          />
                        </TableCell>
                      )}
                      {visibleColumns.map((col) => (
                        <TableCell
                          key={col.key}
                          className={cn(
                            "px-3 py-2.5 text-sm",
                            alignClass[col.align ?? "left"],
                            col.className,
                          )}
                        >
                          {cellValue(col, row, index)}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </div>
      )}

      {(footer || pagination) && (
        <div className="space-y-2 border-t border-border bg-muted/40 px-3 py-2.5 sm:px-4">
          {footer}
          {pagination ? <ProTablePagination {...pagination} /> : null}
        </div>
      )}
    </div>
  )
}

/** 列表页顶部筛选区容器 */
export function ProTableSearch({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-3 shadow-sm sm:p-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-end gap-3">{children}</div>
    </div>
  )
}

/** 状态点 */
export function StatusDot({
  active,
  activeText = "启用",
  inactiveText = "停用",
}: {
  active: boolean
  activeText?: string
  inactiveText?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm",
        active ? "text-emerald-600" : "text-destructive",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          active ? "bg-emerald-500" : "bg-destructive",
        )}
      />
      {active ? activeText : inactiveText}
    </span>
  )
}

export type { ProTablePaginationProps }
