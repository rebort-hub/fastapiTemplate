import type { TFunction } from "i18next"
import { z } from "zod"

export const emailField = (t: TFunction) =>
  z.email({ message: t("validation.invalidEmail") })

export const passwordField = (t: TFunction) =>
  z
    .string()
    .min(1, { message: t("validation.passwordRequired") })
    .min(8, { message: t("validation.passwordMin") })

export const optionalPasswordField = (t: TFunction) =>
  z
    .string()
    .min(1, { message: t("validation.passwordRequired") })
    .min(8, { message: t("validation.passwordMin") })
    .or(z.literal(""))

export const confirmPasswordField = (t: TFunction) =>
  z.string().min(1, { message: t("validation.passwordConfirmRequired") })
