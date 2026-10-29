import { useSyncExternalStore } from "react"

import type { WorkTabItem } from "@/types/worktab"

type Listener = () => void

type WorkTabSnapshot = {
  opened: WorkTabItem[]
  activePath: string
}

const HOME_TAB: WorkTabItem = {
  path: "/",
  title: "Dashboard",
  fixedTab: true,
}

let opened: WorkTabItem[] = [{ ...HOME_TAB }]
let activePath = HOME_TAB.path
let snapshot: WorkTabSnapshot = { opened, activePath }
const listeners = new Set<Listener>()

function emit() {
  snapshot = { opened, activePath }
  for (const listener of listeners) listener()
}

export function subscribeWorkTabs(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getWorkTabs() {
  return snapshot
}

export function openWorkTab(tab: WorkTabItem) {
  const idx = opened.findIndex((t) => t.path === tab.path)
  if (idx === -1) {
    opened = tab.fixedTab ? [tab, ...opened] : [...opened, tab]
    activePath = tab.path
    emit()
    return
  }

  const current = opened[idx]
  const sameTab =
    current.title === tab.title && Boolean(current.fixedTab) === Boolean(tab.fixedTab)
  if (sameTab && activePath === tab.path) {
    return
  }

  if (!sameTab) {
    opened = opened.map((t, i) => (i === idx ? { ...t, ...tab } : t))
  }
  activePath = tab.path
  emit()
}

export function closeWorkTab(path: string) {
  const tab = opened.find((t) => t.path === path)
  if (!tab || tab.fixedTab) return activePath
  opened = opened.filter((t) => t.path !== path)
  if (activePath === path) {
    activePath = opened[opened.length - 1]?.path ?? HOME_TAB.path
  }
  emit()
  return activePath
}

export function closeOtherWorkTabs(path: string) {
  opened = opened.filter((t) => t.fixedTab || t.path === path)
  activePath = path
  emit()
}

export function closeLeftWorkTabs(path: string) {
  const index = opened.findIndex((t) => t.path === path)
  if (index <= 0) return
  opened = opened.filter((t, i) => t.fixedTab || i >= index)
  if (!opened.some((t) => t.path === activePath)) {
    activePath = path
  }
  emit()
}

export function closeRightWorkTabs(path: string) {
  const index = opened.findIndex((t) => t.path === path)
  if (index < 0) return
  opened = opened.filter((t, i) => t.fixedTab || i <= index)
  if (!opened.some((t) => t.path === activePath)) {
    activePath = path
  }
  emit()
}

export function closeAllWorkTabs() {
  opened = opened.filter((t) => t.fixedTab)
  activePath = opened[0]?.path ?? HOME_TAB.path
  emit()
  return activePath
}

export function setActiveWorkTab(path: string) {
  if (activePath === path) return
  activePath = path
  emit()
}

export function useWorkTabs() {
  return useSyncExternalStore(subscribeWorkTabs, getWorkTabs, getWorkTabs)
}
