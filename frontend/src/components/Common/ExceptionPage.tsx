import { useRouter } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { Logo } from "@/components/Common/Logo"
import { Button } from "@/components/ui/action"
import { isLoggedIn } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"

export type ExceptionCode = "401" | "403" | "404" | "500"

type ExceptionPageProps = {
  code: ExceptionCode
  className?: string
}

/**
 * 异常页壳（对齐 admin FaException）：品牌 + 大号状态码 + 说明 + 操作
 */
export function ExceptionPage({ code, className }: ExceptionPageProps) {
  const { t } = useTranslation()
  const router = useRouter()

  const goHome = () => {
    if (!isLoggedIn()) {
      void router.navigate({ to: "/login" })
      return
    }
    void router.navigate({ to: "/" })
  }

  const goBack = () => {
    if (window.history.length > 1) {
      router.history.back()
      return
    }
    goHome()
  }

  return (
    <div
      className={cn(
        "exception-page relative flex min-h-dvh items-center justify-center overflow-hidden bg-background p-6 text-foreground",
        className,
      )}
      data-testid={`exception-${code}`}
    >
      <div
        className="pointer-events-none absolute -top-44 -right-36 size-[560px] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_14%,transparent)_0%,transparent_70%)]"
        aria-hidden
      />
      <div className="relative z-[1] flex w-full max-w-[520px] flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Logo variant="icon" asLink={false} className="size-7" />
          <span>{t("app.name")}</span>
        </div>

        <h1 className="exception-page__code mt-7 text-[72px] leading-none font-bold tracking-[-0.05em] md:text-[96px]">
          {code}
        </h1>
        <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">
          {t(`exceptionPage.${code}`)}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={goHome}>
            {t("exceptionPage.gohome")}
          </Button>
          <Button size="lg" variant="outline" onClick={goBack}>
            {t("exceptionPage.goBack")}
          </Button>
        </div>
      </div>
    </div>
  )
}
