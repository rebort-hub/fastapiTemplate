import { createFileRoute } from "@tanstack/react-router"

import { Exception403Page } from "@/pages/exception/403"
import i18n from "@/i18n"

export const Route = createFileRoute("/403")({
  component: Exception403Page,
  head: () => ({
    meta: [{ title: `403 · ${i18n.t("app.name")}` }],
  }),
})
