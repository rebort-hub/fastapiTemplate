import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Settings2 } from "lucide-react"
import { useState, type ReactNode } from "react"

import { Button } from "@/components/ui/action"
import { Checkbox } from "@/components/ui/form"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/overlay"
import { cn } from "@/utils"

export type ColumnSettingItem = {
  key: string
  title: ReactNode
  hideable?: boolean
}

type SortableRowProps = {
  item: ColumnSettingItem
  checked: boolean
  disabled: boolean
  onCheckedChange: (checked: boolean) => void
}

function SortableColumnRow({
  item,
  checked,
  disabled,
  onCheckedChange,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.key })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const label =
    typeof item.title === "string" || typeof item.title === "number"
      ? item.title
      : item.key

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-md px-1 py-1.5",
        isDragging && "z-10 bg-accent/80 shadow-sm",
      )}
    >
      <button
        type="button"
        className="flex size-6 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
        aria-label={`拖拽排序 ${label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>
      <label
        className={cn(
          "flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <Checkbox
          checked={checked}
          disabled={disabled}
          onCheckedChange={(value) => onCheckedChange(value === true)}
        />
        <span className="truncate">{label}</span>
      </label>
    </div>
  )
}

export type ProTableColumnSettingsProps = {
  columns: ColumnSettingItem[]
  columnOrder: string[]
  hiddenKeys: Set<string>
  onOrderChange: (order: string[]) => void
  onHiddenChange: (hidden: Set<string>) => void
  visibleCount: number
}

export function ProTableColumnSettings({
  columns,
  columnOrder,
  hiddenKeys,
  onOrderChange,
  onHiddenChange,
  visibleCount,
}: ProTableColumnSettingsProps) {
  const [open, setOpen] = useState(false)
  const columnMap = new Map(columns.map((c) => [c.key, c]))
  const orderedItems = columnOrder
    .map((key) => columnMap.get(key))
    .filter((item): item is ColumnSettingItem => Boolean(item))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = columnOrder.indexOf(String(active.id))
    const newIndex = columnOrder.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    onOrderChange(arrayMove(columnOrder, oldIndex, newIndex))
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          title="列设置"
        >
          <Settings2 className="size-3.5" />
          列设置
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 p-2"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuLabel className="px-1">显示列</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={orderedItems.map((item) => item.key)}
            strategy={verticalListSortingStrategy}
          >
            <div className="max-h-72 space-y-0.5 overflow-y-auto py-1">
              {orderedItems.map((item) => {
                const hideable = item.hideable !== false
                const checked = !hiddenKeys.has(item.key)
                const disabled =
                  !hideable || (checked && visibleCount <= 1)
                return (
                  <SortableColumnRow
                    key={item.key}
                    item={item}
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={(value) => {
                      const next = new Set(hiddenKeys)
                      if (value) next.delete(item.key)
                      else next.add(item.key)
                      onHiddenChange(next)
                    }}
                  />
                )
              })}
            </div>
          </SortableContext>
        </DndContext>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
