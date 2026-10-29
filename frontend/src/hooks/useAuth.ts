import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import {
  login,
  readUserMe,
  registerUser,
  type UserItem,
  type UserRegisterBody,
} from "@/api/system"
import { notifySuccess, TOKEN_STORAGE_KEY } from "@/lib/http"

const isLoggedIn = () => {
  return localStorage.getItem(TOKEN_STORAGE_KEY) !== null
}

const useAuth = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const { data: user } = useQuery<UserItem | null, Error>({
    queryKey: ["currentUser"],
    queryFn: readUserMe,
    enabled: isLoggedIn(),
  })

  const signUpMutation = useMutation({
    mutationFn: (data: UserRegisterBody) => registerUser(data),
    onSuccess: (data) => {
      notifySuccess(data.message || t("auth.registerSuccess"))
      navigate({ to: "/login" })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const response = await login(data.username, data.password)
      localStorage.setItem(TOKEN_STORAGE_KEY, response.access_token)
      return response
    },
    onSuccess: (response) => {
      notifySuccess(response.message || t("auth.loginSuccess"))
      navigate({ to: "/" })
    },
  })

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    navigate({ to: "/login" })
  }

  return {
    signUpMutation,
    loginMutation,
    logout,
    user,
  }
}

export { isLoggedIn }
export default useAuth
