import { createFileRoute } from "@tanstack/react-router"

import { SystemLogPage } from "@/pages/system/log"

export const Route = createFileRoute("/_layout/system/log")({
  component: SystemLogPage,
  head: () => ({
    meta: [{ title: "操作日志" }],
  }),
})
