import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Upload } from "lucide-react"
import { useRef, useState } from "react"

import {
  batchDeleteFiles,
  deleteFile,
  formatFileSize,
  getFileDownloadUrl,
  getFileStatistics,
  listFiles,
  type FileItem,
  uploadFile,
} from "@/api/system"
import { ConfirmDialog } from "@/components/Common/ConfirmDialog"
import {
  ProTable,
  ProTableSearch,
  type ProColumn,
} from "@/components/Common/ProTable"
import { Button } from "@/components/ui/action"
import { Input } from "@/components/ui/form"
import { Label } from "@/components/ui/form"
import { LoadingButton } from "@/components/ui/action"
import useCustomToast from "@/hooks/useCustomToast"
import { TOKEN_STORAGE_KEY } from "@/lib/http"

export function SystemFilePage() {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState("")
  const [queryName, setQueryName] = useState("")
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null)
  const [batchOpen, setBatchOpen] = useState(false)

  const statsQuery = useQuery({
    queryKey: ["fileStatistics"],
    queryFn: getFileStatistics,
  })

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filesQuery = useQuery({
    queryKey: ["systemFiles", queryName, page, pageSize],
    queryFn: () =>
      listFiles({
        skip: (page - 1) * pageSize,
        limit: pageSize,
        name: queryName || undefined,
      }),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["systemFiles"] })
    queryClient.invalidateQueries({ queryKey: ["fileStatistics"] })
  }

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: () => {
      showSuccessToast("上传成功")
      invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      showSuccessToast("删除成功")
      setDeleteTarget(null)
      invalidate()
    },
  })

  const batchMutation = useMutation({
    mutationFn: batchDeleteFiles,
    onSuccess: (res) => {
      showSuccessToast(res.message)
      setBatchOpen(false)
      setSelected(new Set())
      invalidate()
    },
  })

  const rows = filesQuery.data?.data ?? []
  const total = filesQuery.data?.count ?? 0
  const stats = statsQuery.data

  const download = async (row: FileItem) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    const res = await fetch(getFileDownloadUrl(row.id), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) {
      showErrorToast("下载失败")
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = row.original_name
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">文件管理</h1>
          <p className="text-sm text-muted-foreground">
            本地存储上传、下载与删除
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) uploadMutation.mutate(file)
              e.target.value = ""
            }}
          />
          <LoadingButton
            loading={uploadMutation.isPending}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-4" />
            上传文件
          </LoadingButton>
          <Button
            variant="destructive"
            disabled={selected.size === 0}
            onClick={() => setBatchOpen(true)}
          >
            批量删除 ({selected.size})
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "文件总数", value: String(stats?.total_count ?? 0) },
          {
            label: "总大小",
            value: formatFileSize(stats?.total_size ?? 0),
          },
          { label: "当前存储", value: stats?.storage_type ?? "local" },
          {
            label: "单文件上限",
            value: `${stats?.max_size_mb ?? 50} MB`,
          },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">{item.label}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">
              {item.value}
            </div>
          </div>
        ))}
      </div>

      <ProTableSearch>
        <div className="grid gap-1.5">
          <Label>文件名</Label>
          <Input
            className="w-56"
            placeholder="搜索文件名"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <Button
          onClick={() => {
            setPage(1)
            setQueryName(name)
          }}
        >
          查询
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setName("")
            setPage(1)
            setQueryName("")
          }}
        >
          重置
        </Button>
      </ProTableSearch>

      <ProTable
        title={
          <>
            文件列表
            <span className="ml-2 font-normal text-muted-foreground">
              共 {total} 个
            </span>
          </>
        }
        scroll={{ x: 1000 }}
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
              key: "original_name",
              title: "文件名",
              className: "max-w-[280px] truncate font-medium",
              dataIndex: "original_name",
            },
            {
              key: "file_size",
              title: "大小",
              render: (row) => formatFileSize(row.file_size),
            },
            {
              key: "content_type",
              title: "类型",
              className: "max-w-[140px] truncate text-xs text-muted-foreground",
              render: (row) => row.content_type || "-",
            },
            {
              key: "storage_type",
              title: "存储",
              dataIndex: "storage_type",
            },
            {
              key: "created_at",
              title: "上传时间",
              className: "text-muted-foreground",
              render: (row) =>
                row.created_at
                  ? new Date(row.created_at).toLocaleString()
                  : "-",
            },
            {
              key: "actions",
              title: "操作",
              width: 140,
              hideable: false,
              render: (row) => (
                <div className="flex items-center gap-2 text-sm">
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => download(row)}
                  >
                    下载
                  </button>
                  <button
                    type="button"
                    className="text-destructive hover:underline"
                    onClick={() => setDeleteTarget(row)}
                  >
                    删除
                  </button>
                </div>
              ),
            },
          ] satisfies ProColumn<FileItem>[]
        }
        dataSource={rows}
        rowKey={(row) => row.id}
        loading={filesQuery.isLoading}
        emptyText="暂无文件"
        rowSelection={{
          selectedRowKeys: [...selected],
          onChange: (keys) => setSelected(new Set(keys.map(Number))),
        }}
      />

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        description={`确定删除文件「${deleteTarget?.original_name ?? ""}」？`}
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
        }}
      />

      <ConfirmDialog
        open={batchOpen}
        onOpenChange={setBatchOpen}
        title="批量删除"
        description={`确定删除选中的 ${selected.size} 个文件？此操作无法撤销。`}
        loading={batchMutation.isPending}
        onConfirm={() => batchMutation.mutate([...selected])}
      />
    </div>
  )
}

export default SystemFilePage
