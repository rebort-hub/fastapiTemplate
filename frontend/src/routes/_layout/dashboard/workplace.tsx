import { createFileRoute } from "@tanstack/react-router"

import { WorkplacePage } from "@/pages/dashboard/workplace"

export const Route = createFileRoute("/_layout/dashboard/workplace")({
  component: WorkplacePage,
  head: () => ({
    meta: [{ title: "工作台" }],
  }),
})
