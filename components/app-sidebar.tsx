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
  MessageCircle,
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
    { title: "Settings", url: "/dashboard/settings", icon: <Settings2 /> },
    { title: "Help", url: "/dashboard/help", icon: <LifeBuoy /> },
  ],
}


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [projects, setProjects] = useState<{ name: string; url: string; icon: React.ReactNode }[]>([])

  useEffect(() => {
    getProjects()
      .then((rows: Project[]) => {
        setProjects(
          rows.map((p) => ({
            name: p.name,
            url: `/dashboard/task/${p.slug}`,
            icon: <DynamicIcon name={p.icon} />,
          }))
        )
      })
      .catch(() => {
      })
  }, [])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={projects} />
      </SidebarContent>
      <NavMain items={data.navSecondary} />
      <SidebarRail />
    </Sidebar>
  )
}
