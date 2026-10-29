import { createFileRoute, redirect } from "@tanstack/react-router"

/** 兼容旧路径：跳转到系统用户管理 */
export const Route = createFileRoute("/_layout/admin")({
  beforeLoad: () => {
    throw redirect({ to: "/system/user" })
  },
})
