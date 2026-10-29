import { useSuspenseQuery } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { Suspense } from "react"
import { useTranslation } from "react-i18next"

import { readItems } from "@/api/items"
import { DataTable } from "@/components/Common/DataTable"
import AddItem from "@/components/Items/AddItem"
import { useItemColumns } from "@/components/Items/columns"
import PendingItems from "@/components/Pending/PendingItems"

function getItemsQueryOptions() {
  return {
    queryFn: () => readItems({ skip: 0, limit: 100 }),
    queryKey: ["items"],
  }
}

function ItemsTableContent() {
  const { t } = useTranslation()
  const columns = useItemColumns()
  const { data: items } = useSuspenseQuery(getItemsQueryOptions())

  if (items.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">{t("items.emptyTitle")}</h3>
        <p className="text-muted-foreground">{t("items.emptySubtitle")}</p>
      </div>
    )
  }

  return <DataTable columns={columns} data={items.data} />
}

function ItemsTable() {
  return (
    <Suspense fallback={<PendingItems />}>
      <ItemsTableContent />
    </Suspense>
  )
}

export function ItemsPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("items.heading")}
          </h1>
          <p className="text-muted-foreground">{t("items.subtitle")}</p>
        </div>
        <AddItem />
      </div>
      <ItemsTable />
    </div>
  )
}

export default ItemsPage
