'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Bike,
  ChevronsUpDown,
  Cpu,
  Images,
  Map,
  Rss,
  Settings,
  Trophy,
  User,
} from 'lucide-react'

import { BlindspotMark } from '@/components/blindspot-mark'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

const sections = [
  {
    label: 'Explore',
    items: [
      { title: 'Live Map', url: '/', icon: Map },
      { title: 'Feed', url: '/feed', icon: Rss },
      { title: 'Leaderboard', url: '/leaderboard', icon: Trophy },
    ],
  },
  {
    label: 'My Riding',
    items: [
      { title: 'Rides', url: '/rides', icon: Bike },
      { title: 'Photos', url: '/photos', icon: Images },
      { title: 'Stats', url: '/stats', icon: BarChart3 },
    ],
  },
  {
    label: 'Hardware',
    items: [{ title: 'Device', url: '/device', icon: Cpu }],
  },
  {
    label: 'Account',
    items: [
      { title: 'Profile', url: '/profile', icon: User },
      { title: 'Settings', url: '/settings', icon: Settings },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b border-sidebar-border p-0">
        <Link
          href="/"
          className="flex h-14 items-center gap-2.5 px-4 text-sidebar-foreground transition-colors hover:text-primary"
        >
          <BlindspotMark className="size-7 shrink-0 text-primary" />
          <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-serif text-2xl leading-none tracking-tight">
              blindspot
            </span>
            <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              ride · map · see
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {sections.map((section) => (
          <SidebarGroup
            key={section.label}
            className="border-b border-sidebar-border py-3"
          >
            <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = pathname === item.url
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        render={<Link href={item.url} />}
                        isActive={active}
                        tooltip={item.title}
                        className="font-mono text-[13px] uppercase tracking-wide data-[active]:bg-primary data-[active]:text-primary-foreground data-[active]:hover:bg-primary data-[active]:hover:text-primary-foreground"
                      >
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent"
            >
              <span className="flex size-8 shrink-0 items-center justify-center border border-sidebar-border bg-primary font-mono text-sm font-bold text-primary-foreground">
                R
              </span>
              <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <span className="font-mono text-[13px]">rider</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  Rank #5 · 11,890 pts
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
