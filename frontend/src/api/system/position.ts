import { request } from "@/lib/http"

const API_PATH = "/api/v1/system/position"

export type PositionItem = {
  id: number
  name: string
  order: number
  available: boolean
  description: string | null
}

export type PositionOption = {
  id: number
  name: string
}

export type PositionFormBody = {
  name: string
  order?: number
  available?: boolean
  description?: string | null
}

/** 岗位列表 */
export function listPositions(params?: {
  name?: string
  available?: boolean
}) {
  return request<PositionItem[]>({
    url: `${API_PATH}/list`,
    method: "get",
    params,
  })
}

/** 岗位选项 */
export function listPositionOptions() {
  return request<PositionOption[]>({
    url: `${API_PATH}/options`,
    method: "get",
  })
}

/** 新建岗位 */
export function createPosition(body: PositionFormBody) {
  return request<PositionItem>({
    url: `${API_PATH}/`,
    method: "post",
    data: body,
  })
}

/** 更新岗位 */
export function updatePosition(id: number, body: Partial<PositionFormBody>) {
  return request<PositionItem>({
    url: `${API_PATH}/${id}`,
    method: "patch",
    data: body,
  })
}

/** 删除岗位 */
export function deletePosition(id: number) {
  return request<{ message: string }>({
    url: `${API_PATH}/${id}`,
    method: "delete",
  })
}

/** 批量启停 */
export function batchUpdatePositionStatus(ids: number[], available: boolean) {
  return request<{ message: string }>({
    url: `${API_PATH}/batch/status`,
    method: "patch",
    data: { ids, available },
  })
}
