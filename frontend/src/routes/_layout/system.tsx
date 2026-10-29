import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/system")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/system" || location.pathname === "/system/") {
      throw redirect({ to: "/system/menu" })
    }
  },
  component: () => <Outlet />,
})
