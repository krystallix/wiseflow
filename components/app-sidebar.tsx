"use client"

import * as React from "react"
import { useEffect, useState } from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  GalleryVerticalEndIcon, AudioLinesIcon, TerminalIcon,
  LayoutDashboard, Sparkle, Inbox, Calendar, Settings2, LifeBuoy,
  MessageCircle, Trash2
} from "lucide-react"

import { getProjects, type Project } from "@/lib/supabase/projects"
import { DynamicIcon } from "@/lib/dynamic-icon"

const data = {
  teams: [
    { name: "WiseFlow", logo: <GalleryVerticalEndIcon />, plan: "Personal" },
    { name: "Acme Corp.", logo: <AudioLinesIcon />, plan: "Startup" },
    { name: "Evil Corp.", logo: <TerminalIcon />, plan: "Free" },
  ],
  navMain: [
    { title: "Home", url: "/dashboard", icon: <LayoutDashboard /> },
    { title: "Chat", url: "/dashboard/chat", icon: <MessageCircle /> },
    { title: "Ask AI", url: "/dashboard/ask-ai", icon: <Sparkle /> },
    { title: "Inbox", url: "/dashboard/inbox", icon: <Inbox /> },
  ],
  navSecondary: [
    { title: "Calendar", url: "/dashboard/calendar", icon: <Calendar /> },
    { title: "Trash", url: "/dashboard/trash", icon: <Trash2 /> },
    { title: "Settings", url: "/dashboard/settings", icon: <Settings2 /> },
    { title: "Help", url: "/dashboard/help", icon: <LifeBuoy /> },
  ],
}


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [projects, setProjects] = useState<{ id: string; name: string; url: string; icon: React.ReactNode; iconName: string; description: string | null }[]>([])

  const fetchProjects = React.useCallback(() => {
    getProjects()
      .then((rows: Project[]) => {
        setProjects(
          rows.map((p) => ({
            id: p.id,
            name: p.name,
            url: `/dashboard/task/${p.slug}`,
            icon: <DynamicIcon name={p.icon} />,
            iconName: p.icon,
            description: p.description,
          }))
        )
      })
      .catch(() => { })
  }, [])

  useEffect(() => {
    fetchProjects()

    const handleProjectUpdated = () => fetchProjects()
    window.addEventListener('project-updated', handleProjectUpdated)
    return () => window.removeEventListener('project-updated', handleProjectUpdated)
  }, [fetchProjects])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={projects} onProjectsChange={fetchProjects} />
      </SidebarContent>
      <NavMain items={data.navSecondary} />
      <SidebarRail />
    </Sidebar>
  )
}
