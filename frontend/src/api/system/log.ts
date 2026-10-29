import { request } from "@/lib/http"

const API_PATH = "/api/v1/system/log"

export type LogItem = {
  id: number
  request_path: string
  request_method: string
  request_ip: string | null
  request_browser: string | null
  request_os: string | null
  request_payload: string | null
  response_code: number
  response_json: string | null
  process_time: number
  creator_id: string | null
  creator_name: string | null
  created_at: string
}

export type LogsPage = {
  data: LogItem[]
  count: number
}

/** 日志列表 */
export function listLogs(params?: {
  skip?: number
  limit?: number
  request_path?: string
  creator_name?: string
  start_date?: string
  end_date?: string
}) {
  return request<LogsPage>({
    url: `${API_PATH}/list`,
    method: "get",
    params,
  })
}

/** 日志详情 */
export function getLog(id: number) {
  return request<LogItem>({
    url: `${API_PATH}/${id}`,
    method: "get",
  })
}
