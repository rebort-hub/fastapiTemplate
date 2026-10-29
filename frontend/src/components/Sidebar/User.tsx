import { Link as RouterLink } from "@tanstack/react-router"
import { LogOut, Settings } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Avatar, AvatarFallback } from "@/components/ui/layout"
import { Button } from "@/components/ui/action"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/overlay"
import useAuth from "@/hooks/useAuth"
import { getInitials } from "@/utils"

interface UserInfoProps {
  fullName?: string
  email?: string
  compact?: boolean
}

function UserInfo({ fullName, email, compact }: UserInfoProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <Avatar className={compact ? "size-8" : "size-9"}>
        <AvatarFallback className="bg-zinc-600 text-white">
          {getInitials(fullName || t("common.user"))}
        </AvatarFallback>
      </Avatar>
      {!compact && (
        <div className="hidden flex-col items-start min-w-0 sm:flex">
          <p className="text-sm font-medium truncate max-w-[140px] md:max-w-[200px]">
            {fullName}
          </p>
          <p className="text-xs text-muted-foreground truncate max-w-[140px] md:max-w-[200px]">
            {email}
          </p>
        </div>
      )}
    </div>
  )
}

export function HeaderUserMenu({ user }: { user: any }) {
  const { logout } = useAuth()
  const { t } = useTranslation()

  if (!user) return null

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 gap-2 px-2 sm:px-3"
          data-testid="user-menu"
        >
          <UserInfo
            fullName={user?.full_name}
            email={user?.email}
            compact={false}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56 rounded-lg" align="end" sideOffset={8}>
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2.5 px-2 py-2 min-w-0">
            <Avatar className="size-9">
              <AvatarFallback className="bg-zinc-600 text-white">
                {getInitials(user?.full_name || t("common.user"))}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start min-w-0">
              <p className="text-sm font-medium truncate w-full">
                {user?.full_name}
              </p>
              <p className="text-xs text-muted-foreground truncate w-full">
                {user?.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <RouterLink to="/settings">
          <DropdownMenuItem>
            <Settings />
            {t("nav.userSettings")}
          </DropdownMenuItem>
        </RouterLink>
        <DropdownMenuItem onClick={() => logout()}>
          <LogOut />
          {t("nav.logOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
