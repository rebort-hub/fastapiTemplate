import axios from "axios"

import { extractErrorMessage, isUnauthorizedError } from "./errors"
import { notifyError, notifySuccess } from "./notify"
import { TOKEN_STORAGE_KEY } from "./types"
import "./types"

export const http = axios.create({
  timeout: 30_000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token) {
    if (typeof config.headers?.set === "function") {
      config.headers.set("Authorization", `Bearer ${token}`)
    } else {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

http.interceptors.response.use(
  (response) => {
    const successMessage = response.config.successMessage
    if (successMessage) {
      notifySuccess(successMessage)
    }
    return response
  },
  (error) => {
    const config = error.config

    if (!config?.skipErrorToast) {
      notifyError(extractErrorMessage(error))
    }

    if (
      !config?.skipAuthRedirect &&
      isUnauthorizedError(error) &&
      !window.location.pathname.startsWith("/login")
    ) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      window.location.href = "/login"
    }

    return Promise.reject(error)
  },
)
