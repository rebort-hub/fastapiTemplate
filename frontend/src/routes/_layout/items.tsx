import { createFileRoute } from "@tanstack/react-router"

import i18n from "@/i18n"
import { ItemsPage } from "@/pages/items"

export const Route = createFileRoute("/_layout/items")({
  component: ItemsPage,
  head: () => ({
    meta: [{ title: i18n.t("items.title") }],
  }),
})
