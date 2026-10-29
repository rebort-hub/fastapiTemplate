import { useTranslation } from "react-i18next"

import ChangePassword from "@/components/UserSettings/ChangePassword"
import DeleteAccount from "@/components/UserSettings/DeleteAccount"
import UserInformation from "@/components/UserSettings/UserInformation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/layout"
import useAuth from "@/hooks/useAuth"

export function SettingsPage() {
  const { user: currentUser } = useAuth()
  const { t } = useTranslation()

  const tabsConfig = [
    {
      value: "my-profile",
      title: t("settings.tabs.profile"),
      component: UserInformation,
    },
    {
      value: "password",
      title: t("settings.tabs.password"),
      component: ChangePassword,
    },
    {
      value: "danger-zone",
      title: t("settings.tabs.danger"),
      component: DeleteAccount,
    },
  ]

  if (!currentUser) {
    return null
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("settings.heading")}
        </h1>
        <p className="text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <Tabs defaultValue="my-profile">
        <TabsList>
          {tabsConfig.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.title}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabsConfig.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <tab.component />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default SettingsPage
