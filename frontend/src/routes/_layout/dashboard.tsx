import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/dashboard")({
  beforeLoad: ({ location }) => {
    if (
      location.pathname === "/dashboard" ||
      location.pathname === "/dashboard/"
    ) {
      throw redirect({ to: "/dashboard/workplace" })
    }
  },
  component: () => <Outlet />,
})
