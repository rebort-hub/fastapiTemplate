import * as LucideIcons from "lucide-react"
import type { LucideIcon } from "lucide-react"

/** 历史 Ant Design 图标名 → Lucide 兼容映射（种子数据等） */
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
    // lucide 同时导出 Home / HomeIcon，只保留无 Icon 后缀的主名
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

/** 解析菜单图标名（Lucide 组件名，如 Settings / LayoutDashboard）；未配置时返回 null */
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

/** 按首字母分组的 Lucide 图标列表（同步，无需额外 JSON） */
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
