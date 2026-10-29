import { createFileRoute } from "@tanstack/react-router"

import { Exception404Page } from "@/pages/exception/404"
import i18n from "@/i18n"

export const Route = createFileRoute("/404")({
  component: Exception404Page,
  head: () => ({
    meta: [{ title: `404 · ${i18n.t("app.name")}` }],
  }),
})
