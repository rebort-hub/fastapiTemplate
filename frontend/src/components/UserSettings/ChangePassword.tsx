import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { updatePasswordMe } from "@/api/system"
import type { UpdatePassword } from "@/client"
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
import {
  confirmPasswordField,
  passwordField,
} from "@/lib/validators"

const ChangePassword = () => {
  const { t } = useTranslation()
  const { showSuccessToast } = useCustomToast()

  const formSchema = useMemo(
    () =>
      z
        .object({
          current_password: passwordField(t),
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
    mode: "onSubmit",
    criteriaMode: "all",
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: UpdatePassword) => updatePasswordMe(data),
    onSuccess: () => {
      showSuccessToast(t("settings.changePassword.updatedSuccess"))
      form.reset()
    },
  })

  const onSubmit = async (data: FormData) => {
    mutation.mutate(data)
  }

  return (
    <div className="max-w-md">
      <h3 className="text-lg font-semibold py-4">
        {t("settings.changePassword.heading")}
      </h3>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="current_password"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>{t("settings.changePassword.currentPassword")}</FormLabel>
                <FormControl>
                  <PasswordInput
                    data-testid="current-password-input"
                    placeholder="••••••••"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="new_password"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>{t("settings.changePassword.newPassword")}</FormLabel>
                <FormControl>
                  <PasswordInput
                    data-testid="new-password-input"
                    placeholder="••••••••"
                    aria-invalid={fieldState.invalid}
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
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>{t("settings.changePassword.confirmPassword")}</FormLabel>
                <FormControl>
                  <PasswordInput
                    data-testid="confirm-password-input"
                    placeholder="••••••••"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <LoadingButton
            type="submit"
            loading={mutation.isPending}
            className="self-start"
          >
            {t("settings.changePassword.updatePassword")}
          </LoadingButton>
        </form>
      </Form>
    </div>
  )
}

export default ChangePassword
