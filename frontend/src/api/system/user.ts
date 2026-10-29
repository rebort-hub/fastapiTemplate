import { request } from "@/lib/http"

const API_PATH = "/api/v1/system/user"

export type UserItem = {
  id: string
  email: string
  is_active: boolean
  is_superuser: boolean
  full_name: string | null
  created_at?: string | null
  dept_id: number | null
  dept_name?: string | null
  role_ids: number[]
  role_names: string[]
}

export type UsersPage = {
  data: UserItem[]
  count: number
}

export type UserCreateBody = {
  email: string
  password: string
  full_name?: string | null
  is_active?: boolean
  is_superuser?: boolean
  dept_id?: number | null
  role_ids?: number[]
}

export type UserUpdateBody = {
  email?: string | null
  password?: string | null
  full_name?: string | null
  is_active?: boolean | null
  is_superuser?: boolean | null
  dept_id?: number | null
  role_ids?: number[]
}

export type UserRegisterBody = {
  email: string
  password: string
  full_name?: string | null
}

export type UpdatePasswordBody = {
  current_password: string
  new_password: string
}

/** 当前用户信息 */
export function readUserMe() {
  return request<UserItem>({
    url: `${API_PATH}/me`,
    method: "get",
  })
}

/** 注册 */
export function registerUser(body: UserRegisterBody) {
  return request<UserItem & { message: string }>({
    url: `${API_PATH}/register`,
    method: "post",
    data: body,
  })
}

/** 用户列表 */
export function readUsers(params?: {
  skip?: number
  limit?: number
  email?: string
  full_name?: string
  is_active?: boolean
}) {
  return request<UsersPage>({
    url: `${API_PATH}/`,
    method: "get",
    params,
  })
}

/** 创建用户 */
export function createUser(body: UserCreateBody) {
  return request<UserItem>({
    url: `${API_PATH}/`,
    method: "post",
    data: body,
  })
}

/** 更新当前用户资料 */
export function updateUserMe(body: {
  full_name?: string | null
  email?: string | null
}) {
  return request<UserItem>({
    url: `${API_PATH}/me`,
    method: "patch",
    data: body,
  })
}

/** 修改当前用户密码 */
export function updatePasswordMe(body: UpdatePasswordBody) {
  return request<{ message: string }>({
    url: `${API_PATH}/me/password`,
    method: "patch",
    data: body,
  })
}

/** 注销当前用户 */
export function deleteUserMe() {
  return request<{ message: string }>({
    url: `${API_PATH}/me`,
    method: "delete",
  })
}

/** 更新用户 */
export function updateUser(userId: string, body: UserUpdateBody) {
  return request<UserItem>({
    url: `${API_PATH}/${userId}`,
    method: "patch",
    data: body,
  })
}

/** 删除用户 */
export function deleteUser(userId: string) {
  return request<{ message: string }>({
    url: `${API_PATH}/${userId}`,
    method: "delete",
  })
}
