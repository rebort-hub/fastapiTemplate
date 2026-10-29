export type ThemeMode = "light" | "dark" | "system"
export type BoxStyle = "border" | "shadow"
export type ContainerWidth = "full" | "fixed"
export type MenuLayout = "vertical" | "horizontal" | "mixed" | "dual"
export type MenuStyle = "simple" | "card" | "outline" | "immersive" | "glass"

export interface AppSettings {
  themeMode: ThemeMode
  primaryColor: string
  menuLayout: MenuLayout
  menuStyle: MenuStyle
  boxStyle: BoxStyle
  containerWidth: ContainerWidth
  containerFixedWidth: number
  showBreadcrumb: boolean
  showWorkTab: boolean
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  themeMode: "light",
  primaryColor: "#1677ff",
  menuLayout: "vertical",
  menuStyle: "simple",
  boxStyle: "border",
  containerWidth: "full",
  containerFixedWidth: 1280,
  showBreadcrumb: true,
  showWorkTab: true,
}

export const PRESET_COLORS = [
  "#1677ff",
  "#13c2c2",
  "#52c41a",
  "#722ed1",
  "#fa8c16",
  "#f5222d",
  "#2f54eb",
]

export const APP_SETTINGS_STORAGE_KEY = "fastapi-app-settings"
