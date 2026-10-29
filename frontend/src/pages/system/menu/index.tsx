import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronDown, ChevronRight, Plus } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"

import {
  batchUpdateMenuStatus,
  buildMenuTree,
  createMenu,
  deleteMenu,
  listMenuOptions,
  listMenus,
  type MenuFormBody,
  type MenuItem,
  type MenuTreeNode,
  type MenuType,
  updateMenu,
} from "@/api/system"
import { ConfirmDialog } from "@/components/Common/ConfirmDialog"
import { FormField } from "@/components/Common/FormField"
import { IconSelect } from "@/components/Common/IconSelect"
import {
  ProTable,
  StatusDot,
  type ProColumn,
} from "@/components/Common/ProTable"
import { Badge } from "@/components/ui/data"
import { Button } from "@/components/ui/action"
import { Checkbox } from "@/components/ui/form"
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
import useCustomToast from "@/hooks/useCustomToast"
import { resolveMenuIcon } from "@/lib/menu-icons"

type ModalMode = "create" | "update" | "view" | null

const TYPE_LABEL: Record<MenuType, string> = {
  1: "目录",
  2: "页面",
  3: "按钮",
  4: "外链",
}

const TYPE_VARIANT: Record<MenuType, "default" | "secondary" | "outline"> = {
  1: "default",
  2: "secondary",
  3: "outline",
  4: "outline",
}

const emptyForm = (): MenuFormBody => ({
  name: "",
  type: 2,
  icon: "",
  order: 1,
  permission: "",
  route_name: "",
  route_path: "",
  component_path: "",
  redirect: "",
  link: "",
  is_iframe: false,
  show_badge: false,
  show_text_badge: "",
  parent_id: null,
  available: true,
  hidden: false,
})

function flattenVisible(
  nodes: MenuTreeNode[],
  expanded: Set<number>,
  depth = 0,
): Array<MenuTreeNode & { depth: number }> {
  const rows: Array<MenuTreeNode & { depth: number }> = []
  for (const node of nodes) {
    rows.push({ ...node, depth })
    if (node.children?.length && expanded.has(node.id)) {
      rows.push(...flattenVisible(node.children, expanded, depth + 1))
    }
  }
  return rows
}

export function SystemMenuPage() {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const [mode, setMode] = useState<ModalMode>(null)
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const form = useForm<MenuFormBody>({ defaultValues: emptyForm() })

  const menusQuery = useQuery({
    queryKey: ["systemMenus"],
    queryFn: listMenus,
  })

  const optionsQuery = useQuery({
    queryKey: ["systemMenuOptions"],
    queryFn: listMenuOptions,
    enabled: mode === "create" || mode === "update",
  })

  const tree = useMemo(
    () => buildMenuTree(menusQuery.data ?? []),
    [menusQuery.data],
  )

  const rows = useMemo(
    () => flattenVisible(tree, expanded),
    [expanded, tree],
  )

  useEffect(() => {
    if (tree.length && expanded.size === 0) {
      setExpanded(new Set(tree.map((n) => n.id)))
    }
  }, [tree, expanded.size])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["systemMenus"] })
    queryClient.invalidateQueries({ queryKey: ["routeMenus"] })
    queryClient.invalidateQueries({ queryKey: ["systemMenuOptions"] })
  }

  const createMutation = useMutation({
    mutationFn: createMenu,
    onSuccess: () => {
      showSuccessToast("创建成功")
      setMode(null)
      invalidate()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (body: MenuFormBody) => updateMenu(editing!.id, body),
    onSuccess: () => {
      showSuccessToast("更新成功")
      setMode(null)
      invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMenu,
    onSuccess: () => {
      showSuccessToast("删除成功")
      setDeleteTarget(null)
      invalidate()
    },
  })

  const batchMutation = useMutation({
    mutationFn: ({ ids, available }: { ids: number[]; available: boolean }) =>
      batchUpdateMenuStatus(ids, available),
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

  const openEdit = (record: MenuItem, next: ModalMode) => {
    setEditing(record)
    form.reset({
      name: record.name,
      type: record.type,
      icon: record.icon || "",
      order: record.order,
      permission: record.permission || "",
      route_name: record.route_name || "",
      route_path: record.route_path || "",
      component_path: record.component_path || "",
      redirect: record.redirect || "",
      link: record.link || "",
      is_iframe: record.is_iframe ?? false,
      show_badge: record.show_badge ?? false,
      show_text_badge: record.show_text_badge || "",
      parent_id: record.parent_id,
      available: record.available,
      hidden: record.hidden,
    })
    setMode(next)
  }

  const onSubmit = form.handleSubmit((values) => {
    const payload: MenuFormBody = {
      ...values,
      parent_id: values.parent_id || null,
      route_name: values.route_name || null,
      route_path: values.route_path || null,
      component_path: values.component_path || null,
      redirect: values.redirect || null,
      link: values.type === 4 ? values.link || null : null,
      is_iframe: values.type === 4 ? Boolean(values.is_iframe) : false,
      show_badge: values.type === 3 ? false : Boolean(values.show_badge),
      show_text_badge:
        values.type !== 3 && values.show_badge
          ? values.show_text_badge || null
          : null,
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

  const menuType = form.watch("type")
  const showBadge = form.watch("show_badge")
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
          const Icon = row.icon ? resolveMenuIcon(row.icon) : null
          return (
            <div
              className="flex items-center gap-1.5"
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
              {Icon ? <Icon className="size-4 shrink-0 text-muted-foreground" /> : null}
              <span className="font-medium">{row.name}</span>
              {row.show_badge && row.show_text_badge ? (
                <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                  {row.show_text_badge}
                </Badge>
              ) : null}
              {row.show_badge && !row.show_text_badge ? (
                <span className="size-1.5 shrink-0 rounded-full bg-destructive" />
              ) : null}
            </div>
          )
        },
      },
      {
        key: "type",
        title: "类型",
        width: 88,
        render: (row) => (
          <Badge variant={TYPE_VARIANT[row.type]}>{TYPE_LABEL[row.type]}</Badge>
        ),
      },
      { key: "order", title: "排序", width: 72, dataIndex: "order" },
      {
        key: "permission",
        title: "权限标识",
        className: "max-w-[180px] truncate font-mono text-xs",
        render: (row) => row.permission || "-",
      },
      {
        key: "route_path",
        title: "路由/外链",
        className: "max-w-[200px] truncate font-mono text-xs",
        render: (row) =>
          row.type === 4 ? row.link || "-" : row.route_path || "-",
      },
      {
        key: "available",
        title: "状态",
        width: 96,
        render: (row) => <StatusDot active={row.available} />,
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
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">菜单管理</h1>
          <p className="text-sm text-muted-foreground">
            维护目录、页面、按钮与外链，驱动侧栏与动态路由
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
              batchMutation.mutate({
                ids: [...selected],
                available: true,
              })
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
        title="菜单列表"
        scroll={{ x: 1100 }}
        columns={columns}
        dataSource={rows}
        rowKey={(row) => row.id}
        loading={menusQuery.isLoading}
        emptyText="暂无菜单数据"
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
        description={`确定删除菜单「${deleteTarget?.name ?? ""}」？此操作无法撤销。`}
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
        }}
      />

      <Sheet
        open={mode != null}
        onOpenChange={(open) => {
          if (!open) setMode(null)
        }}
      >
        <SheetContent className="flex w-full flex-col sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {mode === "create"
                ? "新建菜单"
                : mode === "view"
                  ? "查看菜单"
                  : "修改菜单"}
            </SheetTitle>
          </SheetHeader>

          <form
            id="menu-form"
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
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
              <Label>类型</Label>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    { value: 1, label: "目录" },
                    { value: 2, label: "页面" },
                    { value: 3, label: "按钮" },
                    { value: 4, label: "外链" },
                  ] as const
                ).map((opt) => {
                  const active = menuType === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={readOnly}
                      onClick={() =>
                        form.setValue("type", opt.value as MenuType)
                      }
                      className={
                        active
                          ? "h-9 rounded-md border border-primary bg-primary/10 text-sm font-medium text-primary"
                          : "h-9 rounded-md border border-input bg-background text-sm text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
                      }
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {(menuType === 2 || menuType === 3) && (
              <div className="grid gap-2">
                <Label>权限标识</Label>
                <Input
                  disabled={readOnly}
                  placeholder="如 system:menu:query"
                  {...form.register("permission")}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label>父级菜单</Label>
              <Select
                disabled={readOnly}
                value={
                  form.watch("parent_id") != null
                    ? String(form.watch("parent_id"))
                    : "none"
                }
                onValueChange={(v) =>
                  form.setValue(
                    "parent_id",
                    v === "none" ? null : Number(v),
                  )
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

            {menuType !== 3 && (
              <>
                <div className="grid gap-2">
                  <Label>图标</Label>
                  <IconSelect
                    disabled={readOnly}
                    value={form.watch("icon") || ""}
                    placeholder="选择 Lucide 图标"
                    onChange={(v) => form.setValue("icon", v)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>路由名称</Label>
                  <Input disabled={readOnly} {...form.register("route_name")} />
                </div>
              </>
            )}

            {(menuType === 1 || menuType === 2) && (
              <div className="grid gap-2">
                <Label>路由路径</Label>
                <Input disabled={readOnly} {...form.register("route_path")} />
              </div>
            )}

            {menuType === 4 && (
              <>
                <FormField
                  label="外链地址"
                  required
                  error={
                    form.formState.errors.link
                      ? form.formState.errors.link.message || "请输入外链地址"
                      : undefined
                  }
                >
                  <Input
                    disabled={readOnly}
                    placeholder="https://example.com"
                    aria-invalid={!!form.formState.errors.link}
                    {...form.register("link", {
                      validate: (v) =>
                        menuType !== 4 || Boolean(v?.trim()) || "请输入外链地址",
                    })}
                  />
                </FormField>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    disabled={readOnly}
                    checked={form.watch("is_iframe")}
                    onCheckedChange={(v) =>
                      form.setValue("is_iframe", Boolean(v))
                    }
                  />
                  嵌入 iframe
                </label>
                {form.watch("is_iframe") ? (
                  <div className="grid gap-2">
                    <Label>路由路径</Label>
                    <Input
                      disabled={readOnly}
                      placeholder="/outside/docs"
                      {...form.register("route_path")}
                    />
                  </div>
                ) : null}
              </>
            )}

            {menuType === 1 && (
              <div className="grid gap-2">
                <Label>重定向</Label>
                <Input disabled={readOnly} {...form.register("redirect")} />
              </div>
            )}

            {menuType === 2 && (
              <div className="grid gap-2">
                <Label>组件地址</Label>
                <Input
                  disabled={readOnly}
                  placeholder="system/menu/index"
                  {...form.register("component_path")}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label>排序</Label>
              <Input
                type="number"
                disabled={readOnly}
                {...form.register("order", { valueAsNumber: true })}
              />
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  disabled={readOnly}
                  checked={form.watch("available")}
                  onCheckedChange={(v) =>
                    form.setValue("available", Boolean(v))
                  }
                />
                启用
              </label>
              {menuType !== 3 && (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    disabled={readOnly}
                    checked={form.watch("hidden")}
                    onCheckedChange={(v) =>
                      form.setValue("hidden", Boolean(v))
                    }
                  />
                  隐藏
                </label>
              )}
              {menuType !== 3 && (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    disabled={readOnly}
                    checked={showBadge}
                    onCheckedChange={(v) =>
                      form.setValue("show_badge", Boolean(v))
                    }
                  />
                  红点角标
                </label>
              )}
            </div>

            {menuType !== 3 && showBadge ? (
              <div className="grid gap-2">
                <Label>角标文字</Label>
                <Input
                  disabled={readOnly}
                  placeholder="留空则仅显示红点"
                  maxLength={20}
                  {...form.register("show_text_badge")}
                />
              </div>
            ) : null}
          </form>

          <SheetFooter className="border-t px-4 py-3 sm:flex-row sm:justify-end">
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
                  form="menu-form"
                  loading={submitting}
                >
                  确定
                </LoadingButton>
              </>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default SystemMenuPage
