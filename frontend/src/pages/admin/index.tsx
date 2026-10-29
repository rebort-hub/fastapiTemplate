import { useSuspenseQuery } from "@tanstack/react-query"
import { Suspense } from "react"
import { useTranslation } from "react-i18next"

import { readUsers } from "@/api/system"
import type { UserPublic } from "@/client"
import AddUser from "@/components/Admin/AddUser"
import { useAdminColumns, type UserTableData } from "@/components/Admin/columns"
import { DataTable } from "@/components/Common/DataTable"
import PendingUsers from "@/components/Pending/PendingUsers"
import useAuth from "@/hooks/useAuth"

function getUsersQueryOptions() {
  return {
    queryFn: () => readUsers({ skip: 0, limit: 100 }),
    queryKey: ["users"],
  }
}

function UsersTableContent() {
  const { user: currentUser } = useAuth()
  const columns = useAdminColumns()
  const { data: users } = useSuspenseQuery(getUsersQueryOptions())

  const tableData: UserTableData[] = users.data.map((user: UserPublic) => ({
    ...user,
    isCurrentUser: currentUser?.id === user.id,
  }))

  return <DataTable columns={columns} data={tableData} />
}

function UsersTable() {
  return (
    <Suspense fallback={<PendingUsers />}>
      <UsersTableContent />
    </Suspense>
  )
}

export function AdminPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("admin.heading")}
          </h1>
          <p className="text-muted-foreground">{t("admin.subtitle")}</p>
        </div>
        <AddUser />
      </div>
      <UsersTable />
    </div>
  )
}

export default AdminPage
