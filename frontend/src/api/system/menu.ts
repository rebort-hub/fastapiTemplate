import { request } from "@/lib/http"

const API_PATH = "/api/v1/system/menu"

/** 菜单类型：1 目录 / 2 页面 / 3 按钮 / 4 外链 */
export type MenuType = 1 | 2 | 3 | 4

export type MenuItem = {
  id: number
  name: string
  type: MenuType
  icon: string
  order: number
  permission: string
  route_name: string | null
  route_path: string | null
  component_path: string | null
  redirect: string | null
  link: string | null
  is_iframe: boolean
  show_badge: boolean
  show_text_badge: string | null
  parent_id: number | null
  available: boolean
  hidden: boolean
}

export type MenuOption = {
  id: number
  name: string
  parent_id: number | null
  type: MenuType
}

export type MenuFormBody = {
  name: string
  type: MenuType
  icon?: string
  order?: number
  permission?: string
  route_name?: string | null
  route_path?: string | null
  component_path?: string | null
  redirect?: string | null
  link?: string | null
  is_iframe?: boolean
  show_badge?: boolean
  show_text_badge?: string | null
  parent_id?: number | null
  available?: boolean
  hidden?: boolean
}

export type MenuTreeNode = MenuItem & { children?: MenuTreeNode[] }

/** 管理端：全部菜单列表 */
export function listMenus() {
  return request<MenuItem[]>({
    url: `${API_PATH}/list`,
    method: "get",
  })
}

/** 父级菜单选项（目录/页面） */
export function listMenuOptions() {
  return request<MenuOption[]>({
    url: `${API_PATH}/options`,
    method: "get",
  })
}

/** 当前用户侧栏/路由菜单 */
export function listMyRouteMenus() {
  return request<MenuItem[]>({
    url: `${API_PATH}/routes`,
    method: "get",
  })
}

/** 新建菜单 */
export function createMenu(body: MenuFormBody) {
  return request<MenuItem>({
    url: `${API_PATH}/`,
    method: "post",
    data: body,
  })
}

/** 更新菜单 */
export function updateMenu(id: number, body: Partial<MenuFormBody>) {
  return request<MenuItem>({
    url: `${API_PATH}/${id}`,
    method: "patch",
    data: body,
  })
}

/** 删除菜单 */
export function deleteMenu(id: number) {
  return request<{ message: string }>({
    url: `${API_PATH}/${id}`,
    method: "delete",
  })
}

/** 批量启用/停用 */
export function batchUpdateMenuStatus(ids: number[], available: boolean) {
  return request<{ message: string }>({
    url: `${API_PATH}/batch/status`,
    method: "patch",
    data: { ids, available },
  })
}

/** 扁平列表 → 树 */
export function buildMenuTree(items: MenuItem[]): MenuTreeNode[] {
  const map = new Map<number, MenuTreeNode>()
  const roots: MenuTreeNode[] = []

  for (const item of items) {
    map.set(item.id, { ...item, children: [] })
  }
  for (const item of items) {
    const node = map.get(item.id)!
    if (item.parent_id != null && map.has(item.parent_id)) {
      map.get(item.parent_id)!.children!.push(node)
    } else {
      roots.push(node)
    }
  }
  const prune = (nodes: MenuTreeNode[]) => {
    for (const n of nodes) {
      if (n.children?.length) prune(n.children)
      else delete n.children
    }
  }
  prune(roots)
  return roots
}
