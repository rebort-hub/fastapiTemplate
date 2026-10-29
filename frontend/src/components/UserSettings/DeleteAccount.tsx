import { useTranslation } from "react-i18next"

import DeleteConfirmation from "./DeleteConfirmation"

const DeleteAccount = () => {
  const { t } = useTranslation()

  return (
    <div className="max-w-md mt-4 rounded-lg border border-destructive/50 p-4">
      <h3 className="font-semibold text-destructive">
        {t("settings.deleteAccount.heading")}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("settings.deleteAccount.description")}
      </p>
      <DeleteConfirmation />
    </div>
  )
}

export default DeleteAccount
