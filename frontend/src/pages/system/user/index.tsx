import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"

import {
  createUser,
  deleteUser,
  listDeptOptions,
  listRoleOptions,
  readUsers,
  type RoleOption,
  type UserCreateBody,
  type UserItem,
  type UserUpdateBody,
  updateUser,
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
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"

type ModalMode = "create" | "update" | "view" | null

type UserFormValues = {
  email: string
  full_name: string
  password: string
  is_active: boolean
  is_superuser: boolean
  dept_id: number | null
  role_ids: number[]
}

const emptyForm = (): UserFormValues => ({
  email: "",
  full_name: "",
  password: "",
  is_active: true,
  is_superuser: false,
  dept_id: null,
  role_ids: [],
})

function RoleCheckboxList({
  options,
  value,
  disabled,
  onChange,
}: {
  options: RoleOption[]
  value: number[]
  disabled?: boolean
  onChange: (next: number[]) => void
}) {
  return (
    <div className="grid max-h-40 gap-2 overflow-y-auto rounded-md border p-3">
      {options.length === 0 && (
        <span className="text-sm text-muted-foreground">暂无角色</span>
      )}
      {options.map((role) => {
        const checked = value.includes(role.id)
        return (
          <label key={role.id} className="flex items-center gap-2 text-sm">
            <Checkbox
              disabled={disabled}
              checked={checked}
              onCheckedChange={(v) => {
                if (v) onChange([...value, role.id])
                else onChange(value.filter((id) => id !== role.id))
              }}
            />
            <span>
              {role.name}
              <span className="ml-1 font-mono text-xs text-muted-foreground">
                ({role.code})
              </span>
            </span>
          </label>
        )
      })}
    </div>
  )
}

export function SystemUserPage() {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const [mode, setMode] = useState<ModalMode>(null)
  const [editing, setEditing] = useState<UserItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null)
  const [filters, setFilters] = useState({
    email: "",
    full_name: "",
    is_active: "all",
  })
  const [query, setQuery] = useState(filters)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const form = useForm<UserFormValues>({ defaultValues: emptyForm() })

  const usersQuery = useQuery({
    queryKey: ["systemUsers", query, page, pageSize],
    queryFn: () =>
      readUsers({
        skip: (page - 1) * pageSize,
        limit: pageSize,
        email: query.email || undefined,
        full_name: query.full_name || undefined,
        is_active:
          query.is_active === "all" ? undefined : query.is_active === "true",
      }),
  })

  const rolesQuery = useQuery({
    queryKey: ["roleOptions"],
    queryFn: listRoleOptions,
    enabled: mode === "create" || mode === "update" || mode === "view",
  })

  const deptsQuery = useQuery({
    queryKey: ["deptOptions"],
    queryFn: listDeptOptions,
    enabled: mode === "create" || mode === "update" || mode === "view",
  })

  const roleOptions = rolesQuery.data ?? []
  const deptOptions = deptsQuery.data ?? []
  const rows = usersQuery.data?.data ?? []
  const total = usersQuery.data?.count ?? 0

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["systemUsers"] })
    queryClient.invalidateQueries({ queryKey: ["users"] })
    queryClient.invalidateQueries({ queryKey: ["routeMenus"] })
  }

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      showSuccessToast("创建成功")
      setMode(null)
      invalidate()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (body: UserUpdateBody) => updateUser(editing!.id, body),
    onSuccess: () => {
      showSuccessToast("更新成功")
      setMode(null)
      invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      showSuccessToast("删除成功")
      setDeleteTarget(null)
      invalidate()
    },
  })

  const openCreate = () => {
    setEditing(null)
    form.reset(emptyForm())
    setMode("create")
  }

  const openEdit = (record: UserItem, next: ModalMode) => {
    setEditing(record)
    form.reset({
      email: record.email,
      full_name: record.full_name || "",
      password: "",
      is_active: record.is_active,
      is_superuser: record.is_superuser,
      dept_id: record.dept_id ?? null,
      role_ids: record.role_ids || [],
    })
    setMode(next)
  }

  const onSubmit = form.handleSubmit((values) => {
    if (mode === "create") {
      const body: UserCreateBody = {
        email: values.email,
        password: values.password,
        full_name: values.full_name || null,
        is_active: values.is_active,
        is_superuser: values.is_superuser,
        dept_id: values.dept_id,
        role_ids: values.role_ids,
      }
      createMutation.mutate(body)
      return
    }
    if (mode === "update" && editing) {
      const body: UserUpdateBody = {
        email: values.email,
        full_name: values.full_name || null,
        is_active: values.is_active,
        is_superuser: values.is_superuser,
        dept_id: values.dept_id,
        role_ids: values.role_ids,
      }
      if (values.password) body.password = values.password
      updateMutation.mutate(body)
    }
  })

  const readOnly = mode === "view"
  const submitting = createMutation.isPending || updateMutation.isPending
  const watchedRoles = form.watch("role_ids")

  const title = useMemo(() => {
    if (mode === "create") return "新建用户"
    if (mode === "view") return "查看用户"
    if (mode === "update") return "修改用户"
    return ""
  }, [mode])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">用户管理</h1>
          <p className="text-sm text-muted-foreground">
            维护系统用户，并分配角色权限
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          新建
        </Button>
      </div>

      <ProTableSearch>
        <div className="grid gap-1.5">
          <Label>邮箱</Label>
          <Input
            className="w-52"
            placeholder="请输入邮箱"
            value={filters.email}
            onChange={(e) =>
              setFilters((f) => ({ ...f, email: e.target.value }))
            }
          />
        </div>
        <div className="grid gap-1.5">
          <Label>姓名</Label>
          <Input
            className="w-40"
            placeholder="请输入姓名"
            value={filters.full_name}
            onChange={(e) =>
              setFilters((f) => ({ ...f, full_name: e.target.value }))
            }
          />
        </div>
        <div className="grid gap-1.5">
          <Label>状态</Label>
          <Select
            value={filters.is_active}
            onValueChange={(v) => setFilters((f) => ({ ...f, is_active: v }))}
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
            const reset = { email: "", full_name: "", is_active: "all" }
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
            用户列表
            <span className="ml-2 font-normal text-muted-foreground">
              共 {total} 人
            </span>
          </>
        }
        scroll={{ x: 1100 }}
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
              key: "email",
              title: "邮箱",
              render: (row) => (
                <span className="font-medium">{row.email}</span>
              ),
            },
            {
              key: "full_name",
              title: "姓名",
              render: (row) => row.full_name || "-",
            },
            {
              key: "dept_name",
              title: "部门",
              render: (row) => row.dept_name || "-",
            },
            {
              key: "role_names",
              title: "角色",
              className: "max-w-[220px] truncate",
              render: (row) =>
                row.role_names?.length ? row.role_names.join("、") : "-",
            },
            {
              key: "is_superuser",
              title: "超管",
              width: 72,
              render: (row) => (row.is_superuser ? "是" : "否"),
            },
            {
              key: "is_active",
              title: "状态",
              width: 96,
              render: (row) => <StatusDot active={row.is_active} />,
            },
            {
              key: "actions",
              title: "操作",
              width: 180,
              hideable: false,
              render: (row) => {
                const isSelf = currentUser?.id === row.id
                return (
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
                    {!isSelf && (
                      <button
                        type="button"
                        className="text-destructive hover:underline"
                        onClick={() => setDeleteTarget(row)}
                      >
                        删除
                      </button>
                    )}
                  </div>
                )
              },
            },
          ] satisfies ProColumn<UserItem>[]
        }
        dataSource={rows}
        rowKey={(row) => row.id}
        loading={usersQuery.isLoading}
        emptyText="暂无用户数据"
      />

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        description={`确定删除用户「${deleteTarget?.email ?? ""}」？此操作无法撤销。`}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <form
            id="user-form"
            className="grid gap-4"
            noValidate
            onSubmit={onSubmit}
          >
            <FormField
              label="邮箱"
              required
              error={
                form.formState.errors.email
                  ? form.formState.errors.email.message || "请输入邮箱"
                  : undefined
              }
            >
              <Input
                type="email"
                disabled={readOnly}
                aria-invalid={!!form.formState.errors.email}
                {...form.register("email", { required: "请输入邮箱" })}
              />
            </FormField>
            <div className="grid gap-2">
              <Label>姓名</Label>
              <Input disabled={readOnly} {...form.register("full_name")} />
            </div>
            {!readOnly && (
              <FormField
                label={
                  mode === "update" ? "密码（留空则不修改）" : "密码"
                }
                required={mode === "create"}
                error={
                  form.formState.errors.password
                    ? form.formState.errors.password.message ||
                      "请输入密码"
                    : undefined
                }
              >
                <Input
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!form.formState.errors.password}
                  {...form.register("password", {
                    required:
                      mode === "create" ? "请输入密码" : false,
                    minLength:
                      mode === "create"
                        ? { value: 8, message: "密码至少 8 位" }
                        : undefined,
                  })}
                />
              </FormField>
            )}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  disabled={readOnly}
                  checked={form.watch("is_active")}
                  onCheckedChange={(v) =>
                    form.setValue("is_active", Boolean(v))
                  }
                />
                启用
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  disabled={readOnly}
                  checked={form.watch("is_superuser")}
                  onCheckedChange={(v) =>
                    form.setValue("is_superuser", Boolean(v))
                  }
                />
                超级管理员
              </label>
            </div>
            <div className="grid gap-2">
              <Label>部门</Label>
              <Select
                disabled={readOnly}
                value={
                  form.watch("dept_id") != null
                    ? String(form.watch("dept_id"))
                    : "none"
                }
                onValueChange={(v) =>
                  form.setValue("dept_id", v === "none" ? null : Number(v))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择部门" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未分配</SelectItem>
                  {deptOptions.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>角色</Label>
              <RoleCheckboxList
                options={roleOptions}
                value={watchedRoles}
                disabled={readOnly}
                onChange={(next) => form.setValue("role_ids", next)}
              />
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
                  form="user-form"
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

export default SystemUserPage
