import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"

import {
  DATA_SCOPE_OPTIONS,
  batchUpdateRoleStatus,
  buildDeptTree,
  buildMenuTree,
  createRole,
  deleteRole,
  getRolePermissions,
  listDepts,
  listMenus,
  listRoles,
  setRolePermissions,
  type DeptTreeNode,
  type MenuTreeNode,
  type RoleFormBody,
  type RoleItem,
  updateRole,
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
import { Checkbox } from "@/components/ui/form"
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
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/overlay"
import { useClientPagination } from "@/hooks/useClientPagination"
import useCustomToast from "@/hooks/useCustomToast"

type ModalMode = "create" | "update" | "view" | null

const emptyForm = (): RoleFormBody => ({
  code: "",
  name: "",
  available: true,
  description: "",
})

function collectMenuIds(nodes: MenuTreeNode[]): number[] {
  const ids: number[] = []
  for (const n of nodes) {
    ids.push(n.id)
    if (n.children?.length) ids.push(...collectMenuIds(n.children))
  }
  return ids
}

function MenuCheckTree({
  nodes,
  checked,
  onToggle,
  depth = 0,
}: {
  nodes: MenuTreeNode[]
  checked: Set<number>
  onToggle: (id: number, next: boolean, subtree: number[]) => void
  depth?: number
}) {
  return (
    <ul className="space-y-1">
      {nodes.map((node) => {
        const subtree = [node.id, ...(node.children ? collectMenuIds(node.children) : [])]
        const childIds = node.children ? collectMenuIds(node.children) : []
        const allChildrenChecked =
          childIds.length > 0 && childIds.every((id) => checked.has(id))
        const someChildrenChecked =
          childIds.length > 0 && childIds.some((id) => checked.has(id))
        const isChecked = checked.has(node.id)
        return (
          <li key={node.id}>
            <label
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/60"
              style={{ paddingLeft: 8 + depth * 16 }}
            >
              <Checkbox
                checked={
                  isChecked || allChildrenChecked
                    ? true
                    : someChildrenChecked
                      ? "indeterminate"
                      : false
                }
                onCheckedChange={(v) => onToggle(node.id, Boolean(v), subtree)}
              />
              <span className="text-sm">{node.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {node.type === 1 ? "目录" : node.type === 2 ? "页面" : "按钮"}
              </span>
            </label>
            {node.children?.length ? (
              <MenuCheckTree
                nodes={node.children}
                checked={checked}
                onToggle={onToggle}
                depth={depth + 1}
              />
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

function DeptCheckTree({
  nodes,
  checked,
  onToggle,
  depth = 0,
}: {
  nodes: DeptTreeNode[]
  checked: Set<number>
  onToggle: (id: number, next: boolean) => void
  depth?: number
}) {
  return (
    <ul className="space-y-1">
      {nodes.map((node) => (
        <li key={node.id}>
          <label
            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-muted/60"
            style={{ paddingLeft: 4 + depth * 14 }}
          >
            <Checkbox
              checked={checked.has(node.id)}
              onCheckedChange={(v) => onToggle(node.id, Boolean(v))}
            />
            <span className="text-sm">{node.name}</span>
          </label>
          {node.children?.length ? (
            <DeptCheckTree
              nodes={node.children}
              checked={checked}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ) : null}
        </li>
      ))}
    </ul>
  )
}

export function SystemRolePage() {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const [mode, setMode] = useState<ModalMode>(null)
  const [editing, setEditing] = useState<RoleItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RoleItem | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [filters, setFilters] = useState<{ name: string; available: string }>({
    name: "",
    available: "all",
  })
  const [query, setQuery] = useState(filters)
  const [permRole, setPermRole] = useState<RoleItem | null>(null)
  const [permChecked, setPermChecked] = useState<Set<number>>(new Set())
  const [permDataScope, setPermDataScope] = useState(1)
  const [permDeptIds, setPermDeptIds] = useState<Set<number>>(new Set())

  const form = useForm<RoleFormBody>({ defaultValues: emptyForm() })

  const rolesQuery = useQuery({
    queryKey: ["systemRoles", query],
    queryFn: () =>
      listRoles({
        name: query.name || undefined,
        available:
          query.available === "all" ? undefined : query.available === "true",
      }),
  })

  const menusQuery = useQuery({
    queryKey: ["systemMenus"],
    queryFn: listMenus,
    enabled: permRole != null,
  })

  const deptsQuery = useQuery({
    queryKey: ["systemDepts"],
    queryFn: listDepts,
    enabled: permRole != null && permDataScope === 5,
  })

  const menuTree = useMemo(
    () => buildMenuTree(menusQuery.data ?? []),
    [menusQuery.data],
  )

  const deptTree = useMemo(
    () => buildDeptTree(deptsQuery.data ?? []),
    [deptsQuery.data],
  )

  useEffect(() => {
    if (!permRole) return
    getRolePermissions(permRole.id).then((res) => {
      setPermChecked(new Set(res.menu_ids))
      setPermDataScope(res.data_scope || 1)
      setPermDeptIds(new Set(res.dept_ids || []))
    })
  }, [permRole])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["systemRoles"] })
    queryClient.invalidateQueries({ queryKey: ["routeMenus"] })
  }

  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      showSuccessToast("创建成功")
      setMode(null)
      invalidate()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (body: RoleFormBody) => updateRole(editing!.id, body),
    onSuccess: () => {
      showSuccessToast("更新成功")
      setMode(null)
      invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      showSuccessToast("删除成功")
      setDeleteTarget(null)
      invalidate()
    },
  })

  const batchMutation = useMutation({
    mutationFn: ({ ids, available }: { ids: number[]; available: boolean }) =>
      batchUpdateRoleStatus(ids, available),
    onSuccess: (res) => {
      showSuccessToast(res.message)
      setSelected(new Set())
      invalidate()
    },
  })

  const permMutation = useMutation({
    mutationFn: () =>
      setRolePermissions(permRole!.id, {
        menu_ids: [...permChecked],
        data_scope: permDataScope,
        dept_ids: permDataScope === 5 ? [...permDeptIds] : [],
      }),
    onSuccess: () => {
      showSuccessToast("授权保存成功")
      setPermRole(null)
      invalidate()
    },
  })

  const openCreate = () => {
    setEditing(null)
    form.reset(emptyForm())
    setMode("create")
  }

  const openEdit = (record: RoleItem, next: ModalMode) => {
    setEditing(record)
    form.reset({
      code: record.code,
      name: record.name,
      available: record.available,
      description: record.description || "",
    })
    setMode(next)
  }

  const onSubmit = form.handleSubmit((values) => {
    const payload: RoleFormBody = {
      ...values,
      description: values.description || null,
    }
    if (mode === "create") createMutation.mutate(payload)
    else if (mode === "update") updateMutation.mutate(payload)
  })

  const onToggleMenu = (id: number, next: boolean, subtree: number[]) => {
    setPermChecked((prev) => {
      const set = new Set(prev)
      if (next) {
        for (const mid of subtree) set.add(mid)
      } else {
        for (const mid of subtree) set.delete(mid)
      }
      // 勾选子节点时确保父链也被勾选（简化：仅处理当前节点）
      if (next) set.add(id)
      return set
    })
  }

  const readOnly = mode === "view"
  const submitting = createMutation.isPending || updateMutation.isPending
  const allRows = rolesQuery.data ?? []
  const { data: rows, pagination } = useClientPagination(allRows, 10)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">角色管理</h1>
          <p className="text-sm text-muted-foreground">
            维护角色信息，分配菜单权限与数据访问范围
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
              batchMutation.mutate({ ids: [...selected], available: false })
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
        title="角色列表"
        scroll={{ x: 1100 }}
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
            {
              key: "code",
              title: "编码",
              className: "font-mono text-xs",
              dataIndex: "code",
            },
            {
              key: "data_scope",
              title: "数据范围",
              width: 140,
              render: (row) =>
                DATA_SCOPE_OPTIONS.find((o) => o.value === row.data_scope)
                  ?.label ?? `范围${row.data_scope}`,
            },
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
              width: 220,
              hideable: false,
              render: (row) => (
                <div className="flex flex-wrap items-center gap-2 text-sm">
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
                    className="text-primary hover:underline"
                    onClick={() => setPermRole(row)}
                  >
                    授权
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
          ] satisfies ProColumn<RoleItem>[]
        }
        dataSource={rows}
        rowKey={(row) => row.id}
        loading={rolesQuery.isLoading}
        emptyText="暂无角色数据"
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
        description={`确定删除角色「${deleteTarget?.name ?? ""}」？此操作无法撤销。`}
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
                ? "新建角色"
                : mode === "view"
                  ? "查看角色"
                  : "修改角色"}
            </DialogTitle>
          </DialogHeader>
          <form
            id="role-form"
            className="grid gap-4"
            noValidate
            onSubmit={onSubmit}
          >
            <FormField
              label="编码"
              required
              error={
                form.formState.errors.code
                  ? form.formState.errors.code.message || "请输入编码"
                  : undefined
              }
            >
              <Input
                disabled={readOnly || mode === "update"}
                placeholder="如 ops_lead"
                aria-invalid={!!form.formState.errors.code}
                {...form.register("code", { required: "请输入编码" })}
              />
            </FormField>
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
                  form="role-form"
                  loading={submitting}
                >
                  确定
                </LoadingButton>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet
        open={permRole != null}
        onOpenChange={(open) => {
          if (!open) setPermRole(null)
        }}
      >
        <SheetContent className="flex w-full flex-col sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>授权 — {permRole?.name}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 sm:flex-row">
            <div className="sm:w-56 sm:shrink-0">
              <h3 className="mb-2 text-sm font-medium">数据授权</h3>
              <p className="mb-3 text-xs text-muted-foreground">
                授权用户可操作的数据范围
              </p>
              <Select
                value={String(permDataScope)}
                onValueChange={(v) => setPermDataScope(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATA_SCOPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {permDataScope === 5 && (
                <div className="mt-4 max-h-80 overflow-y-auto rounded-md border p-2">
                  {deptsQuery.isLoading ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      加载部门…
                    </p>
                  ) : (
                    <DeptCheckTree
                      nodes={deptTree}
                      checked={permDeptIds}
                      onToggle={(id, next) => {
                        setPermDeptIds((prev) => {
                          const set = new Set(prev)
                          if (next) set.add(id)
                          else set.delete(id)
                          return set
                        })
                      }}
                    />
                  )}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="mb-2 text-sm font-medium">菜单授权</h3>
              <p className="mb-3 text-xs text-muted-foreground">
                勾选该角色可访问的菜单与按钮权限
              </p>
              {menusQuery.isLoading ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  加载菜单中…
                </div>
              ) : (
                <MenuCheckTree
                  nodes={menuTree}
                  checked={permChecked}
                  onToggle={onToggleMenu}
                />
              )}
            </div>
          </div>
          <SheetFooter className="border-t px-4 py-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setPermRole(null)}>
              取消
            </Button>
            <LoadingButton
              loading={permMutation.isPending}
              onClick={() => permMutation.mutate()}
            >
              保存
            </LoadingButton>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default SystemRolePage
