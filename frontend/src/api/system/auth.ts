import type { Message, Token } from "@/client/types.gen"
import { request } from "@/lib/http"

const API_PATH = "/api/v1/system/auth"

/** 登录 */
export function login(email: string, password: string) {
  const data = new URLSearchParams()
  data.set("username", email)
  data.set("password", password)
  return request<Token>({
    url: `${API_PATH}/login`,
    method: "post",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    data,
  })
}

/** 发送密码找回邮件 */
export function recoverPassword(email: string) {
  return request<Message>({
    url: `${API_PATH}/password-recovery`,
    method: "post",
    data: { email },
  })
}

/** 重置密码 */
export function resetPassword(body: {
  token: string
  new_password: string
}) {
  return request<Message>({
    url: `${API_PATH}/reset-password`,
    method: "post",
    data: body,
  })
}
