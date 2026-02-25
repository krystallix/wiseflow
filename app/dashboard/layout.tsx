"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { SearchIcon, Bell, StarIcon, MailIcon, SettingsIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NavUser } from "@/components/nav-user"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/animate-ui/components/radix/popover"
import { PinList, type PinListItem } from "@/components/animate-ui/components/community/pin-list"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const lastSegment = pathname.split("/").filter(Boolean).pop() ?? ""
    const data = {
        user: {
            name: "shadcn",
            email: "m@example.com",
            avatar: "/avatars/shadcn.jpg",
        },
    }

    const notifications: PinListItem[] = [
        { id: 1, name: "New Feature", info: "Check out the new dashboard layout!", icon: StarIcon, pinned: true },
        { id: 2, name: "System Update", info: "Maintenance scheduled for tomorrow.", icon: SettingsIcon, pinned: false },
        { id: 3, name: "Welcome Message", info: "We're glad you're here.", icon: MailIcon, pinned: false }
    ]
    return (
        <SidebarProvider>
            <AppSidebar variant="floating" />
            <SidebarInset className="overflow-x-hidden">
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-20">
                    <div className="flex items-center justify-between p-4 w-full mt-4">
                        {lastSegment == 'dashboard' ? (<div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold capitalize">{lastSegment}</h1>
                            <InputGroup className="bg-card h-10">
                                <InputGroupInput placeholder="Search..." />
                                <InputGroupAddon>
                                    <SearchIcon />
                                </InputGroupAddon>
                            </InputGroup>
                        </div>)
                            : (
                                <div className="flex items-center gap-4">
                                    <InputGroup className="bg-card h-10">
                                        <InputGroupInput placeholder="Search..." />
                                        <InputGroupAddon>
                                            <SearchIcon />
                                        </InputGroupAddon>
                                    </InputGroup>
                                </div>
                            )}

                        <div className="flex items-center justify-end gap-4">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button size="icon-lg" variant="outline" className="rounded-sm group bg-card text-primary cursor-pointer">
                                        <Bell className="group-hover:fill-primary text-primary" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-100 p-0" align="end">
                                    <div className="p-4 rounded-xl border-border bg-card shadow-lg">
                                        <PinList items={notifications} labels={{ unpinned: 'Other Notifications', pinned: 'Pinned' }} />
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <NavUser user={data.user} />
                        </div>
                    </div>
                </header>
                <main className="p-4 w-full">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider >
    )
}
