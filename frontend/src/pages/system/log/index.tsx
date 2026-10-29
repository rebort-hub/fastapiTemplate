import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { listLogs, type LogItem } from "@/api/system"
import {
  ProTable,
  ProTableSearch,
  type ProColumn,
} from "@/components/Common/ProTable"
import { Badge } from "@/components/ui/data"
import { Button } from "@/components/ui/action"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/overlay"
import { Input } from "@/components/ui/form"
import { Label } from "@/components/ui/form"
export function SystemLogPage() {
  const [filters, setFilters] = useState({
    request_path: "",
    creator_name: "",
  })
  const [query, setQuery] = useState(filters)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detail, setDetail] = useState<LogItem | null>(null)

  const logsQuery = useQuery({
    queryKey: ["systemLogs", query, page, pageSize],
    queryFn: () =>
      listLogs({
        skip: (page - 1) * pageSize,
        limit: pageSize,
        request_path: query.request_path || undefined,
        creator_name: query.creator_name || undefined,
      }),
  })

  const rows = logsQuery.data?.data ?? []
  const total = logsQuery.data?.count ?? 0

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">操作日志</h1>
        <p className="text-sm text-muted-foreground">
          审计写操作与失败请求，支持详情查看
        </p>
      </div>

      <ProTableSearch>
        <div className="grid gap-1.5">
          <Label>请求路径</Label>
          <Input
            className="w-56"
            placeholder="如 /api/v1/system/user"
            value={filters.request_path}
            onChange={(e) =>
              setFilters((f) => ({ ...f, request_path: e.target.value }))
            }
          />
        </div>
        <div className="grid gap-1.5">
          <Label>操作人</Label>
          <Input
            className="w-40"
            placeholder="姓名或邮箱"
            value={filters.creator_name}
            onChange={(e) =>
              setFilters((f) => ({ ...f, creator_name: e.target.value }))
            }
          />
        </div>
        <Button
          onClick={() => {
            setPage(1)
            setQuery(filters)
          }}
        >
          查询
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const reset = { request_path: "", creator_name: "" }
            setFilters(reset)
            setPage(1)
            setQuery(reset)
          }}
        >
          重置
        </Button>
      </ProTableSearch>

      <ProTable
        title={
          <>
            日志列表
            <span className="ml-2 font-normal text-muted-foreground">
              共 {total} 条
            </span>
          </>
        }
        scroll={{ x: 1200 }}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (nextPage, nextSize) => {
            setPage(nextPage)
            setPageSize(nextSize)
          },
        }}
        columns={
          [
            {
              key: "index",
              title: "序号",
              width: 64,
              hideable: false,
              render: (_row, index) => (page - 1) * pageSize + index + 1,
            },
            {
              key: "request_method",
              title: "方法",
              className: "font-mono text-xs",
              dataIndex: "request_method",
            },
            {
              key: "request_path",
              title: "请求路径",
              className: "max-w-[260px] truncate font-mono text-xs",
              dataIndex: "request_path",
            },
            {
              key: "response_code",
              title: "状态码",
              width: 88,
              render: (row) => (
                <Badge
                  variant={
                    row.response_code >= 200 && row.response_code < 400
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {row.response_code}
                </Badge>
              ),
            },
            {
              key: "creator_name",
              title: "操作人",
              render: (row) => row.creator_name || "-",
            },
            {
              key: "request_ip",
              title: "IP",
              className: "text-muted-foreground",
              render: (row) => row.request_ip || "-",
            },
            {
              key: "process_time",
              title: "耗时",
              render: (row) => `${(row.process_time * 1000).toFixed(0)} ms`,
            },
            {
              key: "created_at",
              title: "时间",
              className: "text-muted-foreground",
              render: (row) =>
                row.created_at
                  ? new Date(row.created_at).toLocaleString()
                  : "-",
            },
            {
              key: "actions",
              title: "操作",
              width: 80,
              hideable: false,
              render: (row) => (
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setDetail(row)}
                >
                  查看
                </button>
              ),
            },
          ] satisfies ProColumn<LogItem>[]
        }
        dataSource={rows}
        rowKey={(row) => row.id}
        loading={logsQuery.isLoading}
        emptyText="暂无日志（执行写操作后会出现记录）"
      />

      <Dialog
        open={detail != null}
        onOpenChange={(open) => {
          if (!open) setDetail(null)
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>查看日志</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="grid gap-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-muted-foreground">请求方法</div>
                  <div className="font-medium">{detail.request_method}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">状态码</div>
                  <div className="font-medium">{detail.response_code}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-muted-foreground">请求路径</div>
                  <div className="break-all font-mono text-xs">
                    {detail.request_path}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">操作人</div>
                  <div>{detail.creator_name || "-"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">IP</div>
                  <div>{detail.request_ip || "-"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">浏览器</div>
                  <div>{detail.request_browser || "-"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">系统</div>
                  <div>{detail.request_os || "-"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">耗时</div>
                  <div>{(detail.process_time * 1000).toFixed(0)} ms</div>
                </div>
                <div>
                  <div className="text-muted-foreground">时间</div>
                  <div>
                    {detail.created_at
                      ? new Date(detail.created_at).toLocaleString()
                      : "-"}
                  </div>
                </div>
              </div>
              <div>
                <div className="mb-1 text-muted-foreground">请求体</div>
                <pre className="max-h-48 overflow-auto rounded-md border bg-muted/40 p-3 text-xs whitespace-pre-wrap break-all">
                  {detail.request_payload || "-"}
                </pre>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetail(null)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SystemLogPage
