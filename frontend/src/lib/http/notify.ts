import { toast } from "sonner"

import i18n from "@/i18n"


export function notifySuccess(description: string) {
  toast.success(i18n.t("common.success"), {
    description,
    position: "top-right",
  })
}

export function notifyError(description: string) {
  toast.error(i18n.t("common.error"), {
    description,
    position: "top-right",
  })
}
