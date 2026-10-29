import { request } from "@/lib/http"

const API_PATH = "/api/v1/system/dept"

export type DeptItem = {
  id: number
  name: string
  order: number
  parent_id: number | null
  available: boolean
  description: string | null
}

export type DeptOption = {
  id: number
  name: string
  parent_id: number | null
}

export type DeptFormBody = {
  name: string
  order?: number
  parent_id?: number | null
  available?: boolean
  description?: string | null
}

export type DeptTreeNode = DeptItem & { children?: DeptTreeNode[] }

/** 部门列表 */
export function listDepts() {
  return request<DeptItem[]>({
    url: `${API_PATH}/list`,
    method: "get",
  })
}

/** 部门选项 */
export function listDeptOptions() {
  return request<DeptOption[]>({
    url: `${API_PATH}/options`,
    method: "get",
  })
}

/** 新建部门 */
export function createDept(body: DeptFormBody) {
  return request<DeptItem>({
    url: `${API_PATH}/`,
    method: "post",
    data: body,
  })
}

/** 更新部门 */
export function updateDept(id: number, body: Partial<DeptFormBody>) {
  return request<DeptItem>({
    url: `${API_PATH}/${id}`,
    method: "patch",
    data: body,
  })
}

/** 删除部门 */
export function deleteDept(id: number) {
  return request<{ message: string }>({
    url: `${API_PATH}/${id}`,
    method: "delete",
  })
}

/** 批量启停 */
export function batchUpdateDeptStatus(ids: number[], available: boolean) {
  return request<{ message: string }>({
    url: `${API_PATH}/batch/status`,
    method: "patch",
    data: { ids, available },
  })
}

/** 扁平列表 → 树 */
export function buildDeptTree(items: DeptItem[]): DeptTreeNode[] {
  const map = new Map<number, DeptTreeNode>()
  const roots: DeptTreeNode[] = []
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
  const prune = (nodes: DeptTreeNode[]) => {
    for (const n of nodes) {
      if (n.children?.length) prune(n.children)
      else delete n.children
    }
  }
  prune(roots)
  return roots
}
