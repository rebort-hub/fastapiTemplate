import { createFileRoute } from "@tanstack/react-router"

import { AnalysisPage } from "@/pages/dashboard/analysis"

export const Route = createFileRoute("/_layout/dashboard/analysis")({
  component: AnalysisPage,
  head: () => ({
    meta: [{ title: "分析页" }],
  }),
})
