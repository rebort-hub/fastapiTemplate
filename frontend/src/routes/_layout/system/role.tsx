import { createFileRoute } from "@tanstack/react-router"

import { SystemRolePage } from "@/pages/system/role"

export const Route = createFileRoute("/_layout/system/role")({
  component: SystemRolePage,
  head: () => ({
    meta: [{ title: "角色管理" }],
  }),
})
