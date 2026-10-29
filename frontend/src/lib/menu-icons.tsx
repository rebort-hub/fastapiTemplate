import * as LucideIcons from "lucide-react"
import type { LucideIcon } from "lucide-react"


const LEGACY_ALIASES: Record<string, string> = {
  DashboardOutlined: "LayoutDashboard",
  SettingOutlined: "Settings",
  SettingsOutlined: "Settings",
  UserOutlined: "User",
  TeamOutlined: "Users",
  MenuOutlined: "Menu",
  FileOutlined: "File",
  FolderOutlined: "Folder",
  AppstoreOutlined: "LayoutGrid",
  SafetyOutlined: "Shield",
  AuditOutlined: "ClipboardList",
  ClusterOutlined: "Network",
  ApartmentOutlined: "Building2",
  IdcardOutlined: "BadgeCheck",
  ProfileOutlined: "Contact",
  LockOutlined: "Lock",
  HomeOutlined: "Home",
  ProjectOutlined: "FolderKanban",
}

const EXCLUDE = new Set([
  "Icon",
  "icons",
  "createLucideIcon",
  "default",
])

type IconRegistry = Record<string, LucideIcon>

function buildRegistry(): IconRegistry {
  const registry: IconRegistry = {}
  for (const [name, value] of Object.entries(LucideIcons)) {
    if (EXCLUDE.has(name)) continue
    if (!/^[A-Z]/.test(name)) continue
    if (name.endsWith("Icon")) continue
    if (typeof value !== "function" && typeof value !== "object") continue
    registry[name] = value as LucideIcon
  }
  return registry
}

const ICON_REGISTRY = buildRegistry()

export type MenuIconComponent = LucideIcon

export function normalizeMenuIconName(name?: string | null): string {
  if (!name) return ""
  if (ICON_REGISTRY[name]) return name
  const alias = LEGACY_ALIASES[name]
  if (alias && ICON_REGISTRY[alias]) return alias
  return name
}


export function resolveMenuIcon(name?: string | null): LucideIcon | null {
  const key = normalizeMenuIconName(name)
  if (key && ICON_REGISTRY[key]) return ICON_REGISTRY[key]
  return null
}

export function hasMenuIcon(name?: string | null): boolean {
  const key = normalizeMenuIconName(name)
  return Boolean(key && ICON_REGISTRY[key])
}

export type MenuIconItem = {
  name: string
  Icon: LucideIcon
}

export type MenuIconGroup = {
  type: string
  icons: MenuIconItem[]
}

let cachedGroups: MenuIconGroup[] | null = null


export function loadMenuIconGroups(): MenuIconGroup[] {
  if (cachedGroups) return cachedGroups

  const buckets = new Map<string, MenuIconItem[]>()
  for (const name of Object.keys(ICON_REGISTRY).sort()) {
    const letter = name[0]!.toUpperCase()
    const list = buckets.get(letter) ?? []
    list.push({ name, Icon: ICON_REGISTRY[name]! })
    buckets.set(letter, list)
  }

  cachedGroups = [...buckets.entries()].map(([type, icons]) => ({
    type,
    icons,
  }))
  return cachedGroups
}

export function listAllMenuIcons(): MenuIconItem[] {
  return loadMenuIconGroups().flatMap((g) => g.icons)
}
