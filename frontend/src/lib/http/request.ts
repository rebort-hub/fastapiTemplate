import type { AxiosRequestConfig } from "axios"

import { http } from "./client"

/**
 * 统一请求封装。
 * 返回响应体 data，错误由 http 拦截器统一处理。
 */
export function request<T = unknown>(config: AxiosRequestConfig) {
  return http.request<T>(config).then((response) => response.data)
}
