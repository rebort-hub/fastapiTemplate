import { createFileRoute } from "@tanstack/react-router"

import { SystemPositionPage } from "@/pages/system/position"

export const Route = createFileRoute("/_layout/system/position")({
  component: SystemPositionPage,
  head: () => ({
    meta: [{ title: "岗位管理" }],
  }),
})
