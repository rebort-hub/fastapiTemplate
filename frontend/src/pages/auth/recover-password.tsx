import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Link as RouterLink } from "@tanstack/react-router"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { recoverPassword } from "@/api/system"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/form"
import { LoadingButton } from "@/components/ui/action"
import useCustomToast from "@/hooks/useCustomToast"
import { AuthLayout } from "@/layouts/AuthLayout"
import { emailField } from "@/lib/validators"

export function RecoverPasswordPage() {
  const { t } = useTranslation()
  const { showSuccessToast } = useCustomToast()

  const formSchema = useMemo(
    () => z.object({ email: emailField(t) }),
    [t],
  )

  type FormData = z.infer<typeof formSchema>

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => recoverPassword(data.email),
    onSuccess: () => {
      showSuccessToast(t("auth.recoverSuccess"))
      form.reset()
    },
  })

  const onSubmit = (data: FormData) => {
    if (mutation.isPending) return
    mutation.mutate(data)
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
              {t("auth.recoverHeading")}
            </h1>
          </div>

          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.email")}</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="email-input"
                      placeholder={t("auth.emailPlaceholder")}
                      type="email"
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
              {t("common.continue")}
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

export default RecoverPasswordPage
