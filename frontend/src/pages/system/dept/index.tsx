import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronDown, ChevronRight, Plus } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"

import {
  batchUpdateDeptStatus,
  buildDeptTree,
  createDept,
  deleteDept,
  listDeptOptions,
  listDepts,
  type DeptFormBody,
  type DeptItem,
  type DeptTreeNode,
  updateDept,
} from "@/api/system"
import { ConfirmDialog } from "@/components/Common/ConfirmDialog"
import { FormField } from "@/components/Common/FormField"
import {
  ProTable,
  StatusDot,
  type ProColumn,
} from "@/components/Common/ProTable"
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

const emptyForm = (): DeptFormBody => ({
  name: "",
  order: 1,
  parent_id: null,
  available: true,
  description: "",
})

function flattenVisible(
  nodes: DeptTreeNode[],
  expanded: Set<number>,
  depth = 0,
): Array<DeptTreeNode & { depth: number }> {
  const rows: Array<DeptTreeNode & { depth: number }> = []
  for (const node of nodes) {
    rows.push({ ...node, depth })
    if (node.children?.length && expanded.has(node.id)) {
      rows.push(...flattenVisible(node.children, expanded, depth + 1))
    }
  }
  return rows
}

export function SystemDeptPage() {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const [mode, setMode] = useState<ModalMode>(null)
  const [editing, setEditing] = useState<DeptItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeptItem | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const form = useForm<DeptFormBody>({ defaultValues: emptyForm() })

  const deptsQuery = useQuery({
    queryKey: ["systemDepts"],
    queryFn: listDepts,
  })

  const optionsQuery = useQuery({
    queryKey: ["systemDeptOptions"],
    queryFn: listDeptOptions,
    enabled: mode === "create" || mode === "update",
  })

  const tree = useMemo(
    () => buildDeptTree(deptsQuery.data ?? []),
    [deptsQuery.data],
  )
  const rows = useMemo(() => flattenVisible(tree, expanded), [expanded, tree])

  useEffect(() => {
    if (tree.length && expanded.size === 0) {
      setExpanded(new Set(tree.map((n) => n.id)))
    }
  }, [tree, expanded.size])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["systemDepts"] })
    queryClient.invalidateQueries({ queryKey: ["systemDeptOptions"] })
  }

  const createMutation = useMutation({
    mutationFn: createDept,
    onSuccess: () => {
      showSuccessToast("创建成功")
      setMode(null)
      invalidate()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (body: DeptFormBody) => updateDept(editing!.id, body),
    onSuccess: () => {
      showSuccessToast("更新成功")
      setMode(null)
      invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDept,
    onSuccess: () => {
      showSuccessToast("删除成功")
      setDeleteTarget(null)
      invalidate()
    },
  })

  const batchMutation = useMutation({
    mutationFn: ({ ids, available }: { ids: number[]; available: boolean }) =>
      batchUpdateDeptStatus(ids, available),
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

  const openEdit = (record: DeptItem, next: ModalMode) => {
    setEditing(record)
    form.reset({
      name: record.name,
      order: record.order,
      parent_id: record.parent_id,
      available: record.available,
      description: record.description || "",
    })
    setMode(next)
  }

  const onSubmit = form.handleSubmit((values) => {
    const payload: DeptFormBody = {
      ...values,
      parent_id: values.parent_id || null,
      description: values.description || null,
    }
    if (mode === "create") createMutation.mutate(payload)
    else if (mode === "update") updateMutation.mutate(payload)
  })

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const readOnly = mode === "view"
  const submitting = createMutation.isPending || updateMutation.isPending

  const columns = useMemo<ProColumn<(typeof rows)[number]>[]>(
    () => [
      {
        key: "name",
        title: "名称",
        width: 240,
        render: (row) => {
          const hasChildren = Boolean(row.children?.length)
          return (
            <div
              className="flex items-center gap-1"
              style={{ paddingLeft: row.depth * 16 }}
            >
              {hasChildren ? (
                <button
                  type="button"
                  className="rounded p-0.5 hover:bg-muted"
                  onClick={() => toggleExpand(row.id)}
                >
                  {expanded.has(row.id) ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                </button>
              ) : (
                <span className="inline-block size-5" />
              )}
              <span className="font-medium">{row.name}</span>
            </div>
          )
        },
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
    ],
    [expanded],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">部门管理</h1>
          <p className="text-sm text-muted-foreground">
            维护组织架构树，支持多级部门
          </p>
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

      <ProTable
        title="部门列表"
        scroll={{ x: 960 }}
        columns={columns}
        dataSource={rows}
        rowKey={(row) => row.id}
        loading={deptsQuery.isLoading}
        emptyText="暂无部门，点击「新建」添加"
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
        description={`确定删除部门「${deleteTarget?.name ?? ""}」？此操作无法撤销。`}
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
                ? "新建部门"
                : mode === "view"
                  ? "查看部门"
                  : "修改部门"}
            </DialogTitle>
          </DialogHeader>
          <form
            id="dept-form"
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
              <Label>父级部门</Label>
              <Select
                disabled={readOnly}
                value={
                  form.watch("parent_id") != null
                    ? String(form.watch("parent_id"))
                    : "none"
                }
                onValueChange={(v) =>
                  form.setValue("parent_id", v === "none" ? null : Number(v))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="无" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无</SelectItem>
                  {(optionsQuery.data ?? [])
                    .filter((o) => o.id !== editing?.id)
                    .map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
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
                  form="dept-form"
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

export default SystemDeptPage
