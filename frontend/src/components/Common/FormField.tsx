import type { ReactNode } from "react"

import { Label } from "@/components/ui/form"
import { cn } from "@/utils"


export function FormField({
  label,
  error,
  required,
  children,
  className,
}: {
  label: ReactNode
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label className="gap-0.5">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function fieldError(
  errors: Record<string, { message?: string } | undefined> | undefined,
  name: string,
  fallback = "请填写此项",
): string | undefined {
  const err = errors?.[name]
  if (!err) return undefined
  return err.message || fallback
}
