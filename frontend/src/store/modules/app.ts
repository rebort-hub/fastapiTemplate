import { useSyncExternalStore } from "react"

import {
  APP_SETTINGS_STORAGE_KEY,
  DEFAULT_APP_SETTINGS,
  type AppSettings,
} from "@/types/app"

type Listener = () => void

let settings: AppSettings = loadSettings()
const listeners = new Set<Listener>()

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(APP_SETTINGS_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_APP_SETTINGS }
    return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_APP_SETTINGS }
  }
}

function emit() {
  for (const listener of listeners) listener()
}

function applyPrimaryColor(color: string) {
  const root = document.documentElement
  root.style.setProperty("--primary", color)
  root.style.setProperty("--color-primary", color)
  root.style.setProperty("--sidebar-primary", color)
  root.style.setProperty("--color-sidebar-primary", color)
  root.style.setProperty("--ring", color)
  root.style.setProperty("--color-ring", color)
  root.style.setProperty("--sidebar-ring", color)
  root.style.setProperty("--color-sidebar-ring", color)
}

function applyDomSettings(next: AppSettings) {
  const root = document.documentElement
  root.dataset.boxStyle = next.boxStyle
  root.dataset.menuStyle = next.menuStyle
  root.dataset.menuLayout = next.menuLayout
  applyPrimaryColor(next.primaryColor)
}

export function getAppSettings() {
  return settings
}

export function subscribeAppSettings(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function patchAppSettings(partial: Partial<AppSettings>) {
  settings = { ...settings, ...partial }
  applyDomSettings(settings)
  localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  localStorage.setItem("vite-ui-theme", settings.themeMode)
  emit()
}

export function resetAppSettings() {
  settings = { ...DEFAULT_APP_SETTINGS }
  applyDomSettings(settings)
  localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  localStorage.setItem("vite-ui-theme", settings.themeMode)
  emit()
}

export function initAppSettings() {
  applyDomSettings(settings)
  localStorage.setItem("vite-ui-theme", settings.themeMode)
}

export function useAppSettings() {
  const value = useSyncExternalStore(
    subscribeAppSettings,
    getAppSettings,
    () => DEFAULT_APP_SETTINGS,
  )

  return {
    settings: value,
    patchSettings: patchAppSettings,
    resetSettings: resetAppSettings,
  }
}
