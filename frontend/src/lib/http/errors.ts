import { AxiosError, isAxiosError } from "axios"

import i18n from "@/i18n"

export function extractErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { detail?: unknown; message?: string }
      | undefined
    const detail = data?.detail

    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: string; message?: string }
      return first.msg || first.message || i18n.t("common.errorGeneric")
    }
    if (typeof detail === "string" && detail.trim()) {
      return detail
    }
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message
    }
    if (error.message) {
      return error.message
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return i18n.t("common.errorGeneric")
}

export function isUnauthorizedError(error: unknown): boolean {
  return (
    isAxiosError(error) &&
    [401, 403].includes(error.response?.status ?? 0)
  )
}

export type { AxiosError }
