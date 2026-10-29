import { Check, Monitor, Moon, RotateCcw, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/action"
import { Input } from "@/components/ui/form"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/overlay"
import { useAppSettings } from "@/store"
import {
  DEFAULT_APP_SETTINGS,
  PRESET_COLORS,
  type AppSettings,
  type BoxStyle,
  type ContainerWidth,
  type MenuLayout,
  type MenuStyle,
  type ThemeMode,
} from "@/types/app"
import { cn } from "@/utils"

interface SettingsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function OptionCard({
  active,
  label,
  onClick,
  children,
  className,
}: {
  active: boolean
  label: string
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex min-h-[72px] flex-col items-center justify-center rounded-lg border-[1.5px] bg-muted/50 px-1.5 py-2 transition-all",
        active
          ? "border-primary bg-primary/5 shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_18%,transparent)]"
          : "border-border hover:border-primary/40",
        className,
      )}
    >
      {children}
      <span className="mt-1 text-xs text-foreground">{label}</span>
      <span
        className={cn(
          "absolute right-0 bottom-0 flex size-4 items-center justify-center rounded-tl-lg rounded-br-md bg-primary text-white transition-all",
          active ? "scale-100 opacity-100" : "scale-75 opacity-0",
        )}
      >
        <Check className="size-2.5" />
      </span>
    </button>
  )
}

function LayoutWire({ type }: { type: MenuLayout }) {
  return (
    <span className={cn("layout-wire", `layout-wire--${type}`)}>
      <i />
      <i />
      <i />
    </span>
  )
}

function MenuWire({ type }: { type: MenuStyle }) {
  return (
    <span className={cn("menu-wire", `menu-wire--${type}`)}>
      <i />
      <i />
      <i />
    </span>
  )
}

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  const { t } = useTranslation()
  const { setTheme } = useTheme()
  const { settings, patchSettings, resetSettings } = useAppSettings()

  /** 选择即生效并持久化（与 admin 一致） */
  const update = (partial: Partial<AppSettings>) => {
    patchSettings(partial)
    if (partial.themeMode) setTheme(partial.themeMode)
  }

  const onReset = () => {
    resetSettings()
    setTheme(DEFAULT_APP_SETTINGS.themeMode)
    toast.success(t("settingsPanel.resetSuccess"))
  }

  const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: t("theme.light"), icon: <Sun className="size-5" /> },
    { value: "dark", label: t("theme.dark"), icon: <Moon className="size-5" /> },
    { value: "system", label: t("theme.system"), icon: <Monitor className="size-5" /> },
  ]

  const layoutOptions: { value: MenuLayout; label: string }[] = [
    { value: "vertical", label: t("settingsPanel.layoutVertical") },
    { value: "horizontal", label: t("settingsPanel.layoutHorizontal") },
    { value: "mixed", label: t("settingsPanel.layoutMixed") },
    { value: "dual", label: t("settingsPanel.layoutDual") },
  ]

  const menuStyleOptions: { value: MenuStyle; label: string }[] = [
    { value: "simple", label: t("settingsPanel.menuSimple") },
    { value: "card", label: t("settingsPanel.menuCard") },
    { value: "outline", label: t("settingsPanel.menuOutline") },
    { value: "immersive", label: t("settingsPanel.menuImmersive") },
    { value: "glass", label: t("settingsPanel.menuGlass") },
  ]

  const boxOptions: { value: BoxStyle; label: string }[] = [
    { value: "border", label: t("settingsPanel.boxBorder") },
    { value: "shadow", label: t("settingsPanel.boxShadow") },
  ]

  const widthOptions: { value: ContainerWidth; label: string }[] = [
    { value: "full", label: t("settingsPanel.widthFull") },
    { value: "fixed", label: t("settingsPanel.widthFixed") },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-[400px]">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>{t("settingsPanel.title")}</SheetTitle>
          <SheetDescription>{t("settingsPanel.subtitle")}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
          <section>
            <div className="mb-2.5 text-[13px] font-semibold">
              {t("settingsPanel.themeStyle")}
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {themeOptions.map((item) => (
                <OptionCard
                  key={item.value}
                  active={settings.themeMode === item.value}
                  label={item.label}
                  onClick={() => update({ themeMode: item.value })}
                >
                  <span className="text-muted-foreground">{item.icon}</span>
                </OptionCard>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-2.5 text-[13px] font-semibold">
              {t("settingsPanel.menuLayout")}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {layoutOptions.map((item) => (
                <OptionCard
                  key={item.value}
                  active={settings.menuLayout === item.value}
                  label={item.label}
                  onClick={() => update({ menuLayout: item.value })}
                  className="min-h-[76px] px-1"
                >
                  <LayoutWire type={item.value} />
                </OptionCard>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-2.5 text-[13px] font-semibold">
              {t("settingsPanel.menuStyle")}
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {menuStyleOptions.map((item) => (
                <OptionCard
                  key={item.value}
                  active={settings.menuStyle === item.value}
                  label={item.label}
                  onClick={() => update({ menuStyle: item.value })}
                  className="min-h-[76px] px-0.5"
                >
                  <MenuWire type={item.value} />
                </OptionCard>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-2.5 text-[13px] font-semibold">
              {t("settingsPanel.primaryColor")}
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  onClick={() => update({ primaryColor: color })}
                  className={cn(
                    "inline-flex size-7 items-center justify-center rounded-full text-white",
                    settings.primaryColor === color &&
                      "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  )}
                  style={{ background: color }}
                >
                  {settings.primaryColor === color ? (
                    <Check className="size-3" />
                  ) : null}
                </button>
              ))}
              <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="relative size-7 shrink-0 overflow-hidden rounded-full"
                  style={{
                    background:
                      "conic-gradient(from 180deg,#ff6b6b,#feca57,#48dbfb,#ff9ff3,#54a0ff,#5f27cd,#ff6b6b)",
                  }}
                >
                  <input
                    type="color"
                    value={settings.primaryColor}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                    onChange={(e) => update({ primaryColor: e.target.value })}
                  />
                </span>
                <span className="whitespace-nowrap">{t("settingsPanel.custom")}</span>
              </label>
            </div>
          </section>

          <section>
            <div className="mb-2.5 text-[13px] font-semibold">
              {t("settingsPanel.boxStyle")}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {boxOptions.map((item) => (
                <OptionCard
                  key={item.value}
                  active={settings.boxStyle === item.value}
                  label={item.label}
                  onClick={() => update({ boxStyle: item.value })}
                >
                  <span className="text-sm text-muted-foreground">
                    {item.value === "border" ? "▭" : "▒"}
                  </span>
                </OptionCard>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-2.5 text-[13px] font-semibold">
              {t("settingsPanel.containerWidth")}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {widthOptions.map((item) => (
                <OptionCard
                  key={item.value}
                  active={settings.containerWidth === item.value}
                  label={item.label}
                  onClick={() => update({ containerWidth: item.value })}
                  className="min-h-[64px]"
                >
                  <span className="text-xs text-muted-foreground">
                    {item.value === "full" ? "⟷" : "│ │"}
                  </span>
                </OptionCard>
              ))}
            </div>
            {settings.containerWidth === "fixed" && (
              <div className="mt-3 flex items-center gap-2">
                <Input
                  type="number"
                  min={960}
                  max={1920}
                  step={20}
                  value={settings.containerFixedWidth}
                  onChange={(e) =>
                    update({
                      containerFixedWidth: Number(e.target.value) || 1280,
                    })
                  }
                  className="h-9"
                />
                <span className="text-sm text-muted-foreground">px</span>
              </div>
            )}
          </section>

          <section>
            <div className="mb-2.5 text-[13px] font-semibold">
              {t("settingsPanel.basic")}
            </div>
            <div className="divide-y border-t">
              <label className="flex min-h-11 items-center justify-between text-[13px] text-muted-foreground">
                <span>{t("settingsPanel.showBreadcrumb")}</span>
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--primary)]"
                  checked={settings.showBreadcrumb}
                  onChange={(e) =>
                    update({ showBreadcrumb: e.target.checked })
                  }
                />
              </label>
              <label className="flex min-h-11 items-center justify-between text-[13px] text-muted-foreground">
                <span>{t("settingsPanel.showWorkTab")}</span>
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--primary)]"
                  checked={settings.showWorkTab}
                  onChange={(e) => update({ showWorkTab: e.target.checked })}
                />
              </label>
            </div>
          </section>
        </div>

        <SheetFooter className="flex-row items-center justify-end border-t px-5 py-4 sm:space-x-0">
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="size-3.5" />
            {t("settingsPanel.reset")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
