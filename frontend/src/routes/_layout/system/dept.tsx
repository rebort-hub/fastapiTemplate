import { createFileRoute } from "@tanstack/react-router"

import { SystemDeptPage } from "@/pages/system/dept"

export const Route = createFileRoute("/_layout/system/dept")({
  component: SystemDeptPage,
  head: () => ({
    meta: [{ title: "部门管理" }],
  }),
})
