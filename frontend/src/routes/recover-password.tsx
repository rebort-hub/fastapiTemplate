import { createFileRoute, redirect } from "@tanstack/react-router"

import { isLoggedIn } from "@/hooks/useAuth"
import i18n from "@/i18n"
import { RecoverPasswordPage } from "@/pages/auth/recover-password"

export const Route = createFileRoute("/recover-password")({
  component: RecoverPasswordPage,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({ to: "/" })
    }
  },
  head: () => ({
    meta: [{ title: i18n.t("auth.recoverTitle") }],
  }),
})
