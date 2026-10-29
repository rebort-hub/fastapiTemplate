import type { AxiosRequestConfig } from "axios"

import { http } from "./client"


export function request<T = unknown>(config: AxiosRequestConfig) {
  return http.request<T>(config).then((response) => response.data)
}
