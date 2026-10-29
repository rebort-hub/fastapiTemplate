import "axios"

declare module "axios" {
  export interface AxiosRequestConfig {
    /** Do not show global error toast for this request */
    skipErrorToast?: boolean
    /** Do not redirect to /login on 401/403 */
    skipAuthRedirect?: boolean
    /** Show success toast when the request completes */
    successMessage?: string
  }
}

export const TOKEN_STORAGE_KEY = "access_token"
