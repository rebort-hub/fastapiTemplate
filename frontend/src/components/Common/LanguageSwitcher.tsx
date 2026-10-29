import { Languages } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/action"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/overlay"
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/layout"

const LANGUAGES = [
  { code: "zh", labelKey: "language.zh" },
  { code: "en", labelKey: "language.en" },
] as const

export function SidebarLanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const { isMobile } = useSidebar()

  return (
    <SidebarMenuItem>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton tooltip={t("language.label")} data-testid="language-button">
            <Languages className="size-4 text-muted-foreground" />
            <span>{t("language.label")}</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={isMobile ? "top" : "right"}
          align="end"
          className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
        >
          {LANGUAGES.map(({ code, labelKey }) => (
            <DropdownMenuItem
              key={code}
              data-testid={`language-${code}`}
              onClick={() => void i18n.changeLanguage(code)}
              className={i18n.language === code ? "font-semibold" : undefined}
            >
              {t(labelKey)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          data-testid="language-button"
          variant="ghost"
          size="icon"
          className="size-9"
          aria-label={t("language.label")}
        >
          <Languages className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map(({ code, labelKey }) => (
          <DropdownMenuItem
            key={code}
            data-testid={`language-${code}`}
            onClick={() => void i18n.changeLanguage(code)}
            className={i18n.language === code ? "font-semibold" : undefined}
          >
            {t(labelKey)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
