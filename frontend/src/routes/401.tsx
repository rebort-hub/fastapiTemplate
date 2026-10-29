import { createFileRoute } from "@tanstack/react-router"

import { Exception401Page } from "@/pages/exception/401"
import i18n from "@/i18n"

export const Route = createFileRoute("/401")({
  component: Exception401Page,
  head: () => ({
    meta: [{ title: `401 · ${i18n.t("app.name")}` }],
  }),
})
