import { useTranslation } from "react-i18next"

import { Appearance } from "@/components/Common/Appearance"
import { LanguageSwitcher } from "@/components/Common/LanguageSwitcher"
import "@/styles/login.css"

interface AuthLayoutProps {
  children: React.ReactNode
}

function LoginLeftView() {
  const { t } = useTranslation()

  return (
    <div className="login-left-view">
      <div className="login-left-view__hero">
        <div className="login-left-view__hero-ring">
          <img
            src="/assets/images/logo.svg"
            alt={t("app.name")}
            className="login-left-view__hero-logo"
          />
        </div>
      </div>
      <div className="login-left-view__desc">
        <h2>{t("app.name")}</h2>
        <p>{t("auth.brandDesc")}</p>
        <p className="login-left-view__desc-extra">{t("auth.brandExtra")}</p>
      </div>
      <div className="login-left-view__decor login-left-view__decor--circle" />
      <div className="login-left-view__decor login-left-view__decor--square" />
      <div className="login-left-view__decor login-left-view__decor--dot" />
    </div>
  )
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <div className="login-page-root">
      <div className="login-auth-split">
        <div className="login-auth-split__col login-auth-split__col--illustration">
          <LoginLeftView />
        </div>
        <div className="login-auth-split__col login-auth-split__col--form">
          <div className="login-page-panel">
            <div className="login-page-panel__toolbar">
              <LanguageSwitcher />
              <Appearance />
            </div>
            <div className="login-page-panel__main">
              <div className="login-page-panel__form">{children}</div>
            </div>
            <footer className="login-page-footer">
              {t("app.name")} · {year}
            </footer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
