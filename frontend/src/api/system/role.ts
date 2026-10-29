import { request } from "@/lib/http"

const API_PATH = "/api/v1/system/role"

export type RoleItem = {
  id: number
  code: string
  name: string
  available: boolean
  description: string | null
  data_scope: number
}

export type RoleOption = {
  id: number
  code: string
  name: string
}

export type RoleFormBody = {
  code: string
  name: string
  available?: boolean
  description?: string | null
  data_scope?: number
}

export type RolePermission = {
  role_id: number
  menu_ids: number[]
  data_scope: number
  dept_ids: number[]
}

export const DATA_SCOPE_OPTIONS = [
  { value: 1, label: "仅本人数据权限" },
  { value: 2, label: "本部门数据权限" },
  { value: 3, label: "本部门及以下数据权限" },
  { value: 4, label: "全部数据权限" },
  { value: 5, label: "自定义数据权限" },
] as const

/** 角色列表 */
export function listRoles(params?: {
  name?: string
  available?: boolean
}) {
  return request<RoleItem[]>({
    url: `${API_PATH}/list`,
    method: "get",
    params,
  })
}

/** 角色下拉选项 */
export function listRoleOptions() {
  return request<RoleOption[]>({
    url: `${API_PATH}/options`,
    method: "get",
  })
}

/** 新建角色 */
export function createRole(body: RoleFormBody) {
  return request<RoleItem>({
    url: `${API_PATH}/`,
    method: "post",
    data: body,
  })
}

/** 更新角色 */
export function updateRole(id: number, body: Partial<RoleFormBody>) {
  return request<RoleItem>({
    url: `${API_PATH}/${id}`,
    method: "patch",
    data: body,
  })
}

/** 删除角色 */
export function deleteRole(id: number) {
  return request<{ message: string }>({
    url: `${API_PATH}/${id}`,
    method: "delete",
  })
}

/** 批量启用/停用 */
export function batchUpdateRoleStatus(ids: number[], available: boolean) {
  return request<{ message: string }>({
    url: `${API_PATH}/batch/status`,
    method: "patch",
    data: { ids, available },
  })
}

/** 获取角色菜单 + 数据权限 */
export function getRolePermissions(roleId: number) {
  return request<RolePermission>({
    url: `${API_PATH}/${roleId}/permissions`,
    method: "get",
  })
}

/** 设置角色菜单 + 数据权限 */
export function setRolePermissions(
  roleId: number,
  body: { menu_ids: number[]; data_scope: number; dept_ids: number[] },
) {
  return request<RolePermission>({
    url: `${API_PATH}/${roleId}/permissions`,
    method: "put",
    data: body,
  })
}
