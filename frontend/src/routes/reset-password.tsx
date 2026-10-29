import { createFileRoute, redirect } from "@tanstack/react-router"
import { z } from "zod"

import { isLoggedIn } from "@/hooks/useAuth"
import i18n from "@/i18n"
import { ResetPasswordPage } from "@/pages/auth/reset-password"

const searchSchema = z.object({
  token: z.string().catch(""),
})

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordRoute,
  validateSearch: searchSchema,
  beforeLoad: async ({ search }) => {
    if (isLoggedIn()) {
      throw redirect({ to: "/" })
    }
    if (!search.token) {
      throw redirect({ to: "/login" })
    }
  },
  head: () => ({
    meta: [{ title: i18n.t("auth.resetTitle") }],
  }),
})

function ResetPasswordRoute() {
  const { token } = Route.useSearch()
  return <ResetPasswordPage token={token} />
}
