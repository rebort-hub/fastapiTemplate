import { createFileRoute } from "@tanstack/react-router"

import { Exception500Page } from "@/pages/exception/500"
import i18n from "@/i18n"

export const Route = createFileRoute("/500")({
  component: Exception500Page,
  head: () => ({
    meta: [{ title: `500 · ${i18n.t("app.name")}` }],
  }),
})
