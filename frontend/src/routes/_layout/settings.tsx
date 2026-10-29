import { createFileRoute } from "@tanstack/react-router"

import i18n from "@/i18n"
import { SettingsPage } from "@/pages/settings"

export const Route = createFileRoute("/_layout/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [{ title: i18n.t("settings.title") }],
  }),
})
