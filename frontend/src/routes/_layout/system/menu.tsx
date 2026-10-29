import { createFileRoute } from "@tanstack/react-router"

import { SystemMenuPage } from "@/pages/system/menu"

export const Route = createFileRoute("/_layout/system/menu")({
  component: SystemMenuPage,
  head: () => ({
    meta: [{ title: "菜单管理" }],
  }),
})
