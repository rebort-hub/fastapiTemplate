import { http } from "./client"

export function setupHttpClient() {
  http.defaults.baseURL = import.meta.env.VITE_API_URL ?? ""
}
