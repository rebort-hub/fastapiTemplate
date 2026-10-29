import { createFileRoute } from "@tanstack/react-router"

import { DashboardPage } from "@/pages/dashboard"
import i18n from "@/i18n"

export const Route = createFileRoute("/_layout/")({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: i18n.t("dashboard.title") }],
  }),
})
