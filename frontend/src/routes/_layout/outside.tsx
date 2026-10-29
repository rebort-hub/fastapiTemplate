import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

const outsideSearchSchema = z.object({
  url: z.string().min(1),
  title: z.string().optional(),
})

export const Route = createFileRoute("/_layout/outside")({
  validateSearch: outsideSearchSchema,
  component: OutsidePage,
  head: () => ({
    meta: [{ title: "外链页面" }],
  }),
})

function OutsidePage() {
  const { url, title } = Route.useSearch()

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-2">
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="truncate text-sm text-muted-foreground">
          {title || "嵌入页面"}
        </p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-xs text-primary hover:underline"
        >
          新窗口打开
        </a>
      </div>
      <iframe
        title={title || "embedded"}
        src={url}
        className="min-h-0 w-full flex-1 rounded-md border bg-background"
        referrerPolicy="no-referrer"
      />
    </div>
  )
}
