import { createFileRoute, redirect } from "@tanstack/react-router"

import { isLoggedIn } from "@/hooks/useAuth"
import i18n from "@/i18n"
import { SignUpPage } from "@/pages/auth/signup"

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({ to: "/" })
    }
  },
  head: () => ({
    meta: [{ title: i18n.t("auth.signupTitle") }],
  }),
})
