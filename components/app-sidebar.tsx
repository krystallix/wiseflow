"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { GalleryVerticalEndIcon, AudioLinesIcon, TerminalIcon, LayoutDashboard, Search, Sparkle, Inbox, Calendar, Settings2, LifeBuoy, File, CheckCircle, MessageCircle } from "lucide-react"

const data = {
  teams: [
    {
      name: "WiseFlow",
      logo: <GalleryVerticalEndIcon />,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: <AudioLinesIcon />,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: <TerminalIcon />,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Home",
      url: "/dashboard",
      icon: <LayoutDashboard />,
    },
    {
      title: "Chat",
      url: "/dashboard/chat",
      icon: <MessageCircle />,
    },
    {
      title: "Task",
      url: "/dashboard/task",
      icon: <CheckCircle />,
    },
    {
      title: "Ask AI",
      url: "/dashboard/ask-ai",
      icon: <Sparkle />,
    },
    {
      title: "Inbox",
      url: "/dashboard/inbox",
      icon: <Inbox />,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "/dashboard/projects/design-engineering",
      icon: <File />,
    },
    {
      name: "Sales & Marketing",
      url: "/dashboard/projects/sales-marketing",
      icon: <File />,
    },
    {
      name: "Travel",
      url: "/dashboard/projects/travel",
      icon: <File />,
    },
  ],
  navSecondary: [
    {
      title: "Calendar",
      url: "/dashboard/calendar",
      icon: <Calendar />,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: <Settings2 />,
    },
    {
      title: "Help",
      url: "/dashboard/help",
      icon: <LifeBuoy />,
    },
  ],
}


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <NavMain items={data.navSecondary} />
      <SidebarRail />
    </Sidebar>
  )
}
