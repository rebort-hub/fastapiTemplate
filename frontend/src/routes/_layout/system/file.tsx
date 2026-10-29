import { createFileRoute } from "@tanstack/react-router"

import { SystemFilePage } from "@/pages/system/file"

export const Route = createFileRoute("/_layout/system/file")({
  component: SystemFilePage,
  head: () => ({
    meta: [{ title: "文件管理" }],
  }),
})
