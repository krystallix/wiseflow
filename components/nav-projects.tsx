"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { MoreHorizontalIcon, Trash2Icon, Plus, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import DialogProject from "@/components/dialog/create-projects"
import DialogEditProject from "@/components/dialog/edit-projects"
import DialogDeleteProject from "@/components/dialog/delete-project"

export function NavProjects({
  projects,
  onProjectsChange,
}: {
  projects: {
    id: string
    name: string
    url: string
    icon: React.ReactNode
    iconName: string
    description: string | null
  }[]
  onProjectsChange?: () => void
}) {
  const { isMobile } = useSidebar()
  const pathname = usePathname()
  const [openDialogEdit, setOpenDialogEdit] = useState(false)
  const [openDialogDelete, setOpenDialogDelete] = useState(false)
  const [activeProject, setActiveProject] = useState<any>(null)

  const [openDialogCreate, setopenDialogCreate] = useState(false)

  return (
    <>
      <DialogEditProject open={openDialogEdit} onOpenChange={setOpenDialogEdit} project={activeProject} onSuccess={onProjectsChange} />
      <DialogDeleteProject open={openDialogDelete} onOpenChange={setOpenDialogDelete} project={activeProject} onSuccess={onProjectsChange} />

      <DialogProject open={openDialogCreate} onOpenChange={setopenDialogCreate} onSuccess={onProjectsChange} />
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <div className="flex justify-between items-center gap-2">
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <Button variant="ghost" size="icon" onClick={() => setopenDialogCreate(true)}>
            <Plus />
          </Button>
        </div>
        <SidebarMenu>
          {projects.map((item) => {
            const isActive = pathname === item.url || pathname.startsWith(item.url + '/')

            return (
              <SidebarMenuItem key={item.name} className="py-0.5">
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link href={item.url}>
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction showOnHover className="aria-expanded:bg-muted m-0.5">
                      <MoreHorizontalIcon />
                      <span className="sr-only">More</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-48 rounded-lg p-2"
                    side={isMobile ? "bottom" : "right"}
                    align={isMobile ? "end" : "start"}
                  >
                    <DropdownMenuItem onClick={() => { setActiveProject(item); setOpenDialogEdit(true); }}>
                      <Edit className="text-muted-foreground" />
                      <span>Edit Project</span>
                    </DropdownMenuItem>
                    {/* <DropdownMenuItem>
                      <ArrowRightIcon className="text-muted-foreground" />
                      <span>Share Project</span>
                    </DropdownMenuItem> */}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { setActiveProject(item); setOpenDialogDelete(true); }} className="text-destructive hover:bg-destructive focus:bg-destructive/10 focus:text-destructive">
                      <Trash2Icon />
                      <span>Delete Project</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            )
          })}
          <SidebarMenuItem>
            <SidebarMenuButton className="text-sidebar-foreground/70">
              <MoreHorizontalIcon className="text-sidebar-foreground/70" />
              <span>More</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  )
}
