import { request } from "@/lib/http"

const API_PATH = "/api/v1/system/file"

export type FileItem = {
  id: number
  name: string
  original_name: string
  file_url: string
  file_size: number
  content_type: string
  storage_type: string
  uploader_id: string | null
  created_at: string
}

export type FilesPage = {
  data: FileItem[]
  count: number
}

export type FileStatistics = {
  total_count: number
  total_size: number
  storage_type: string
  max_size_mb: number
}

/** 文件列表 */
export function listFiles(params?: {
  skip?: number
  limit?: number
  name?: string
  storage_type?: string
}) {
  return request<FilesPage>({
    url: `${API_PATH}/list`,
    method: "get",
    params,
  })
}

/** 统计 */
export function getFileStatistics() {
  return request<FileStatistics>({
    url: `${API_PATH}/statistics`,
    method: "get",
  })
}

/** 上传 */
export function uploadFile(file: File) {
  const data = new FormData()
  data.append("file", file)
  return request<FileItem>({
    url: `${API_PATH}/upload`,
    method: "post",
    data,
    headers: { "Content-Type": "multipart/form-data" },
  })
}

/** 删除 */
export function deleteFile(id: number) {
  return request<{ message: string }>({
    url: `${API_PATH}/${id}`,
    method: "delete",
  })
}

/** 批量删除 */
export function batchDeleteFiles(ids: number[]) {
  return request<{ message: string }>({
    url: `${API_PATH}/batch/delete`,
    method: "post",
    data: { ids },
  })
}

/** 下载地址（同源走 Vite 代理） */
export function getFileDownloadUrl(id: number) {
  return `${API_PATH}/download/${id}`
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}
