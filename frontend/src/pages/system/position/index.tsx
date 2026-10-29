import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"

import {
  batchUpdatePositionStatus,
  createPosition,
  deletePosition,
  listPositions,
  type PositionFormBody,
  type PositionItem,
  updatePosition,
} from "@/api/system"
import { ConfirmDialog } from "@/components/Common/ConfirmDialog"
import { FormField } from "@/components/Common/FormField"
import {
  ProTable,
  ProTableSearch,
  StatusDot,
  type ProColumn,
} from "@/components/Common/ProTable"
import { Button } from "@/components/ui/action"
import { useClientPagination } from "@/hooks/useClientPagination"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/overlay"
import { Input } from "@/components/ui/form"
import { Label } from "@/components/ui/form"
import { LoadingButton } from "@/components/ui/action"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/form"
import useCustomToast from "@/hooks/useCustomToast"

type ModalMode = "create" | "update" | "view" | null

const emptyForm = (): PositionFormBody => ({
  name: "",
  order: 1,
  available: true,
  description: "",
})

export function SystemPositionPage() {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const [mode, setMode] = useState<ModalMode>(null)
  const [editing, setEditing] = useState<PositionItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PositionItem | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [filters, setFilters] = useState({ name: "", available: "all" })
  const [query, setQuery] = useState(filters)

  const form = useForm<PositionFormBody>({ defaultValues: emptyForm() })

  const positionsQuery = useQuery({
    queryKey: ["systemPositions", query],
    queryFn: () =>
      listPositions({
        name: query.name || undefined,
        available:
          query.available === "all" ? undefined : query.available === "true",
      }),
  })

  const allRows = positionsQuery.data ?? []
  const { data: rows, pagination } = useClientPagination(allRows, 10)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["systemPositions"] })
  }

  const createMutation = useMutation({
    mutationFn: createPosition,
    onSuccess: () => {
      showSuccessToast("创建成功")
      setMode(null)
      invalidate()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (body: PositionFormBody) => updatePosition(editing!.id, body),
    onSuccess: () => {
      showSuccessToast("更新成功")
      setMode(null)
      invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deletePosition,
    onSuccess: () => {
      showSuccessToast("删除成功")
      setDeleteTarget(null)
      invalidate()
    },
  })

  const batchMutation = useMutation({
    mutationFn: ({ ids, available }: { ids: number[]; available: boolean }) =>
      batchUpdatePositionStatus(ids, available),
    onSuccess: (res) => {
      showSuccessToast(res.message)
      setSelected(new Set())
      invalidate()
    },
  })

  const openCreate = () => {
    setEditing(null)
    form.reset(emptyForm())
    setMode("create")
  }

  const openEdit = (record: PositionItem, next: ModalMode) => {
    setEditing(record)
    form.reset({
      name: record.name,
      order: record.order,
      available: record.available,
      description: record.description || "",
    })
    setMode(next)
  }

  const onSubmit = form.handleSubmit((values) => {
    const payload: PositionFormBody = {
      ...values,
      description: values.description || null,
    }
    if (mode === "create") createMutation.mutate(payload)
    else if (mode === "update") updateMutation.mutate(payload)
  })

  const readOnly = mode === "view"
  const submitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">岗位管理</h1>
          <p className="text-sm text-muted-foreground">维护岗位信息与启停状态</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            新建
          </Button>
          <Button
            variant="success"
            disabled={selected.size === 0 || batchMutation.isPending}
            onClick={() =>
              batchMutation.mutate({ ids: [...selected], available: true })
            }
          >
            批量启用
          </Button>
          <Button
            variant="warning"
            disabled={selected.size === 0 || batchMutation.isPending}
            onClick={() =>
              batchMutation.mutate({
                ids: [...selected],
                available: false,
              })
            }
          >
            批量停用
          </Button>
        </div>
      </div>

      <ProTableSearch>
        <div className="grid gap-1.5">
          <Label>名称</Label>
          <Input
            className="w-48"
            placeholder="请输入名称"
            value={filters.name}
            onChange={(e) =>
              setFilters((f) => ({ ...f, name: e.target.value }))
            }
          />
        </div>
        <div className="grid gap-1.5">
          <Label>状态</Label>
          <Select
            value={filters.available}
            onValueChange={(v) => setFilters((f) => ({ ...f, available: v }))}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="true">启用</SelectItem>
              <SelectItem value="false">停用</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setQuery(filters)}>查询</Button>
        <Button
          variant="outline"
          onClick={() => {
            const reset = { name: "", available: "all" }
            setFilters(reset)
            setQuery(reset)
          }}
        >
          重置
        </Button>
      </ProTableSearch>

      <ProTable
        title="岗位列表"
        scroll={{ x: 960 }}
        pagination={pagination}
        columns={
          [
            {
              key: "index",
              title: "序号",
              width: 64,
              hideable: false,
              render: (_row, index) =>
                (pagination.current - 1) * pagination.pageSize + index + 1,
            },
            {
              key: "name",
              title: "名称",
              render: (row) => (
                <span className="font-medium">{row.name}</span>
              ),
            },
            { key: "order", title: "排序", width: 80, dataIndex: "order" },
            {
              key: "available",
              title: "状态",
              width: 96,
              render: (row) => <StatusDot active={row.available} />,
            },
            {
              key: "description",
              title: "备注",
              className: "max-w-[240px] truncate text-muted-foreground",
              render: (row) => row.description || "-",
            },
            {
              key: "actions",
              title: "操作",
              width: 160,
              hideable: false,
              render: (row) => (
                <div className="flex items-center gap-2 text-sm">
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => openEdit(row, "view")}
                  >
                    查看
                  </button>
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => openEdit(row, "update")}
                  >
                    修改
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
          ] satisfies ProColumn<PositionItem>[]
        }
        dataSource={rows}
        rowKey={(row) => row.id}
        loading={positionsQuery.isLoading}
        emptyText="暂无岗位数据"
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
        description={`确定删除岗位「${deleteTarget?.name ?? ""}」？此操作无法撤销。`}
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
        }}
      />

      <Dialog
        open={mode != null}
        onOpenChange={(open) => {
          if (!open) setMode(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mode === "create"
                ? "新建岗位"
                : mode === "view"
                  ? "查看岗位"
                  : "修改岗位"}
            </DialogTitle>
          </DialogHeader>
          <form
            id="position-form"
            className="grid gap-4"
            noValidate
            onSubmit={onSubmit}
          >
            <FormField
              label="名称"
              required
              error={
                form.formState.errors.name
                  ? form.formState.errors.name.message || "请输入名称"
                  : undefined
              }
            >
              <Input
                disabled={readOnly}
                aria-invalid={!!form.formState.errors.name}
                {...form.register("name", { required: "请输入名称" })}
              />
            </FormField>
            <div className="grid gap-2">
              <Label>排序</Label>
              <Input
                type="number"
                disabled={readOnly}
                {...form.register("order", { valueAsNumber: true })}
              />
            </div>
            {mode !== "create" && (
              <div className="grid gap-2">
                <Label>状态</Label>
                <Select
                  disabled={readOnly}
                  value={form.watch("available") ? "true" : "false"}
                  onValueChange={(v) =>
                    form.setValue("available", v === "true")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">启用</SelectItem>
                    <SelectItem value="false">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <Label>备注</Label>
              <Input disabled={readOnly} {...form.register("description")} />
            </div>
          </form>
          <DialogFooter>
            {readOnly ? (
              <Button variant="outline" onClick={() => setMode(null)}>
                关闭
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setMode(null)}>
                  取消
                </Button>
                <LoadingButton
                  type="submit"
                  form="position-form"
                  loading={submitting}
                >
                  确定
                </LoadingButton>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SystemPositionPage
