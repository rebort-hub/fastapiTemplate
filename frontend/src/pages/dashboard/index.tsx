import { useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  LayoutDashboard,
  LineChart,
  Settings2,
  Users,
  Wallet,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout"
import { Button } from "@/components/ui/action"
import { Checkbox } from "@/components/ui/form"
import useAuth from "@/hooks/useAuth"
import { cn } from "@/lib/utils"

import {
  homeStats,
  progressCards,
  quickLinks,
  recentLogins,
  timeline,
  todos as initialTodos,
} from "./mock/home"

const toneClass: Record<(typeof homeStats)[number]["tone"], string> = {
  primary: "bg-primary/10 text-primary",
  info: "bg-sky-500/10 text-sky-600",
  success: "bg-emerald-500/10 text-emerald-600",
  warning: "bg-amber-500/10 text-amber-600",
}

const toneIcon = {
  income: Wallet,
  users: Users,
  login: Activity,
  tasks: CheckCircle2,
} as const

export function DashboardPage() {
  const { user: currentUser } = useAuth()
  const { t } = useTranslation()
  const displayName =
    currentUser?.full_name || currentUser?.email || t("common.user")
  const [todos, setTodos] = useState(initialTodos)

  const pendingCount = useMemo(
    () => todos.filter((item) => !item.done).length,
    [todos],
  )

  const toggleTodo = (index: number) => {
    setTodos((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, done: !item.done } : item,
      ),
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/10 via-card to-card py-0 shadow-none">
        <CardContent className="relative flex flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div className="relative z-[1] max-w-2xl">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {t("dashboard.greeting", { name: displayName })}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("dashboard.welcome")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link to="/dashboard/workplace">
                  <LayoutDashboard className="size-3.5" />
                  进入工作台
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/dashboard/analysis">
                  <LineChart className="size-3.5" />
                  查看分析
                </Link>
              </Button>
            </div>
          </div>
          <div
            className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_22%,transparent)_0%,transparent_70%)]"
            aria-hidden
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {homeStats.map((item) => {
          const Icon = toneIcon[item.key as keyof typeof toneIcon] ?? Activity
          return (
            <Card key={item.key} className="gap-3 py-4 shadow-none">
              <CardContent className="flex items-start justify-between gap-3 px-4">
                <div>
                  <div className="text-sm text-muted-foreground">{item.title}</div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight">
                    {item.value}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {item.tip}
                  </div>
                </div>
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl",
                    toneClass[item.tone],
                  )}
                >
                  <Icon className="size-4" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-4">
          <Card className="gap-4 py-4 shadow-none">
            <CardHeader className="px-4 pb-0">
              <CardTitle className="text-base">快捷入口</CardTitle>
              <CardDescription>常用功能一键直达</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 px-4 sm:grid-cols-4">
              {quickLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group rounded-xl border bg-card px-3 py-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{link.title}</span>
                    <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {link.desc}
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {progressCards.map((item) => (
              <Card key={item.title} className="gap-3 py-4 shadow-none">
                <CardContent className="px-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">{item.title}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {item.percent}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width]"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="gap-4 py-4 shadow-none">
            <CardHeader className="px-4 pb-0">
              <CardTitle className="text-base">最近登录</CardTitle>
              <CardDescription>今日登录动态（演示数据）</CardDescription>
            </CardHeader>
            <CardContent className="px-4">
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">用户</th>
                      <th className="px-3 py-2 font-medium">地点</th>
                      <th className="px-3 py-2 font-medium">时间</th>
                      <th className="px-3 py-2 font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogins.map((row) => (
                      <tr key={`${row.username}-${row.time}`} className="border-t">
                        <td className="px-3 py-2.5">{row.username}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {row.location}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                          {row.time}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-xs",
                              row.ok
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-rose-500/10 text-rose-500",
                            )}
                          >
                            {row.ok ? "成功" : "异常"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="gap-4 py-4 shadow-none">
            <CardHeader className="px-4 pb-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">待办事项</CardTitle>
                  <CardDescription>
                    待处理{" "}
                    <span className="font-medium text-rose-500">
                      {pendingCount}
                    </span>
                  </CardDescription>
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/settings">
                    <Settings2 className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-2">
              <ul className="max-h-[360px] space-y-1 overflow-auto px-2">
                {todos.map((item, index) => (
                  <li
                    key={`${item.user}-${item.target}`}
                    className="flex items-start justify-between gap-3 rounded-lg border border-transparent px-2 py-2.5 hover:border-border hover:bg-muted/30"
                  >
                    <div className="min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{item.user}</span>
                        <span className="mx-1.5 text-muted-foreground">
                          {item.type}
                        </span>
                        <span className="text-primary">{item.target}</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.date}
                      </p>
                    </div>
                    <Checkbox
                      checked={item.done}
                      onCheckedChange={() => toggleTodo(index)}
                      aria-label={item.target}
                    />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="gap-4 py-4 shadow-none">
            <CardHeader className="px-4 pb-0">
              <CardTitle className="text-base">最近动态</CardTitle>
              <CardDescription>今日业务时间线</CardDescription>
            </CardHeader>
            <CardContent className="px-4">
              <ol className="relative space-y-4 border-l border-border pl-4">
                {timeline.map((item) => (
                  <li key={`${item.time}-${item.content}`} className="relative">
                    <span
                      className="absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-background"
                      style={{ backgroundColor: item.tone }}
                    />
                    <div className="text-sm">
                      <div className="text-xs text-muted-foreground">
                        {item.time}
                        {item.code ? (
                          <span className="ml-2 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                            {item.code}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-0.5">{item.content}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
