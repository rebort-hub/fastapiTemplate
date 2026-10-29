import { Logo } from "@/components/Common/Logo"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/layout"
import { useNavItems } from "@/hooks/useNavItems"
import { Main } from "./Main"

export function AppSidebar() {
  const items = useNavItems().filter((item) => item.path !== "/settings")

  return (
    <Sidebar collapsible="icon" className="ntesterc-sidebar">
      <SidebarHeader className="px-4 py-6 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <Logo variant="responsive" />
      </SidebarHeader>
      <SidebarContent>
        <Main items={items} />
      </SidebarContent>
    </Sidebar>
  )
}

export default AppSidebar
