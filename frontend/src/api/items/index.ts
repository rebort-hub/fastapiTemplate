import type {ItemCreate,ItemPublic,ItemsPublic,ItemUpdate,Message,} from "@/client/types.gen"
import { request } from "@/lib/http"

const API_PATH = "/api/v1/items"

/** 物品列表 */
export function readItems(params?: { skip?: number; limit?: number }) {
  return request<ItemsPublic>({
    url: `${API_PATH}/`,
    method: "get",
    params,
  })
}

/** 创建物品 */
export function createItem(body: ItemCreate) {
  return request<ItemPublic>({
    url: `${API_PATH}/`,
    method: "post",
    data: body,
  })
}

/** 更新物品 */
export function updateItem(id: string, body: ItemUpdate) {
  return request<ItemPublic>({
    url: `${API_PATH}/${id}`,
    method: "put",
    data: body,
  })
}

/** 删除物品 */
export function deleteItem(id: string) {
  return request<Message>({
    url: `${API_PATH}/${id}`,
    method: "delete",
  })
}
