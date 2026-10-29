import { createFileRoute } from "@tanstack/react-router"

import { SystemUserPage } from "@/pages/system/user"

export const Route = createFileRoute("/_layout/system/user")({
  component: SystemUserPage,
  head: () => ({
    meta: [{ title: "用户管理" }],
  }),
})
