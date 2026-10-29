import { zodResolver } from "@hookform/resolvers/zod"
import { Link as RouterLink } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"

import { SliderCaptcha } from "@/components/Common/SliderCaptcha"
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
import { PasswordInput } from "@/components/ui/form"
import useAuth from "@/hooks/useAuth"
import { AuthLayout } from "@/layouts/AuthLayout"
import { emailField, passwordField } from "@/lib/validators"

export function LoginPage() {
  const { t } = useTranslation()
  const { loginMutation } = useAuth()
  const [captchaVerified, setCaptchaVerified] = useState(false)

  const formSchema = useMemo(
    () =>
      z.object({
        username: emailField(t),
        password: passwordField(t),
      }),
    [t],
  )

  type FormData = z.infer<typeof formSchema>

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: { username: "", password: "" },
  })

  const onSubmit = (data: FormData) => {
    if (loginMutation.isPending) return
    if (!captchaVerified) {
      toast.error(t("captcha.required"))
      return
    }
    loginMutation.mutate(data)
  }

  return (
    <AuthLayout>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <div className="mb-1 flex items-center justify-center gap-4">
            <img
              src="/assets/images/logo.svg"
              alt=""
              className="size-11 object-contain"
            />
            <h1 className="text-[28px] font-semibold tracking-tight">
              {t("auth.welcomeBack")}
            </h1>
          </div>

          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.email")}</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="email-input"
                      placeholder={t("auth.emailPlaceholder")}
                      type="email"
                      autoComplete="username"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel>{t("auth.password")}</FormLabel>
                    <RouterLink
                      to="/recover-password"
                      className="ml-auto text-sm text-primary underline-offset-4 hover:underline"
                    >
                      {t("auth.forgotPassword")}
                    </RouterLink>
                  </div>
                  <FormControl>
                    <PasswordInput
                      data-testid="password-input"
                      placeholder={t("auth.passwordPlaceholder")}
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <SliderCaptcha
              verified={captchaVerified}
              onVerifiedChange={setCaptchaVerified}
            />

            <LoadingButton
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              loading={loginMutation.isPending}
            >
              {t("auth.logIn")}
            </LoadingButton>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <RouterLink
              to="/signup"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              {t("auth.signUp")}
            </RouterLink>
          </div>
        </form>
      </Form>
    </AuthLayout>
  )
}

export default LoginPage
