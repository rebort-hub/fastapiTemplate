import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Link as RouterLink, useNavigate } from "@tanstack/react-router"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { resetPassword } from "@/api/system"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { LoadingButton } from "@/components/ui/action"
import { PasswordInput } from "@/components/ui/form"
import useCustomToast from "@/hooks/useCustomToast"
import { AuthLayout } from "@/layouts/AuthLayout"
import { confirmPasswordField, passwordField } from "@/lib/validators"

export function ResetPasswordPage({ token }: { token: string }) {
  const { t } = useTranslation()
  const { showSuccessToast } = useCustomToast()
  const navigate = useNavigate()

  const formSchema = useMemo(
    () =>
      z
        .object({
          new_password: passwordField(t),
          confirm_password: confirmPasswordField(t),
        })
        .refine((data) => data.new_password === data.confirm_password, {
          message: t("validation.passwordMismatch"),
          path: ["confirm_password"],
        }),
    [t],
  )

  type FormData = z.infer<typeof formSchema>

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: { new_password: "", confirm_password: "" },
  })

  const mutation = useMutation({
    mutationFn: (data: { new_password: string; token: string }) =>
      resetPassword(data),
    onSuccess: () => {
      showSuccessToast(t("auth.resetSuccess"))
      form.reset()
      navigate({ to: "/login" })
    },
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate({ new_password: data.new_password, token })
  }

  return (
    <AuthLayout>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-[28px] font-semibold tracking-tight">
              {t("auth.resetHeading")}
            </h1>
          </div>

          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.newPassword")}</FormLabel>
                  <FormControl>
                    <PasswordInput
                      data-testid="new-password-input"
                      placeholder={t("auth.newPasswordPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.confirmPassword")}</FormLabel>
                  <FormControl>
                    <PasswordInput
                      data-testid="confirm-password-input"
                      placeholder={t("auth.confirmPasswordPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <LoadingButton
              type="submit"
              className="w-full"
              loading={mutation.isPending}
            >
              {t("auth.resetPassword")}
            </LoadingButton>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {t("auth.rememberPassword")}{" "}
            <RouterLink
              to="/login"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              {t("auth.logInLink")}
            </RouterLink>
          </div>
        </form>
      </Form>
    </AuthLayout>
  )
}

export default ResetPasswordPage
