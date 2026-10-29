import { Link } from "@tanstack/react-router"

import { cn } from "@/lib/utils"

const LOGO_SRC = "/assets/images/logo.svg"

interface LogoProps {
  variant?: "full" | "icon" | "responsive"
  className?: string
  asLink?: boolean
}

export function Logo({
  variant = "full",
  className,
  asLink = true,
}: LogoProps) {
  const content =
    variant === "responsive" ? (
      <>
        <img
          src={LOGO_SRC}
          alt="Logo"
          className={cn(
            "h-6 w-auto group-data-[collapsible=icon]:hidden",
            className,
          )}
        />
        <img
          src={LOGO_SRC}
          alt="Logo"
          className={cn(
            "size-5 hidden object-contain group-data-[collapsible=icon]:block",
            className,
          )}
        />
      </>
    ) : (
      <img
        src={LOGO_SRC}
        alt="Logo"
        className={cn(
          variant === "full" ? "h-6 w-auto" : "size-5 object-contain",
          className,
        )}
      />
    )

  if (!asLink) {
    return content
  }

  return <Link to="/">{content}</Link>
}
