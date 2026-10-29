import { createFileRoute, redirect } from "@tanstack/react-router"

import { BasicLayout } from "@/layouts/BasicLayout"
import { isLoggedIn } from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout")({
  component: BasicLayout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})
