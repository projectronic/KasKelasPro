"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Settings,
  UserCog,
  History,
  Landmark,
  CircleHelp,
  LogOut,
  ChevronsUpDown,
} from "lucide-react";
import { signOut } from "@/app/login/actions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  show: boolean;
};

export function DashboardSidebar({
  fullName,
  email,
  role,
  title,
  canManage,
  isAdmin,
  className,
  schoolName,
}: {
  fullName: string | null;
  email: string | null;
  role: string;
  title: string | null;
  canManage: boolean;
  isAdmin: boolean;
  className: string | null;
  schoolName: string | null;
}) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: true },
    { href: "/dashboard/members", label: "Anggota", icon: Users, show: true },
    { href: "/dashboard/payments", label: "Pembayaran", icon: Landmark, show: canManage },
    { href: "/dashboard/wallet", label: "Dompet", icon: Wallet, show: canManage },
    { href: "/dashboard/settings", label: "Pengaturan", icon: Settings, show: isAdmin },
    { href: "/dashboard/users", label: "Pengguna", icon: UserCog, show: canManage },
    { href: "/dashboard/riwayat", label: "Riwayat", icon: History, show: canManage },
    { href: "/dashboard/panduan", label: "Panduan", icon: CircleHelp, show: canManage },
  ];

  const displayName = fullName ?? email ?? "Pengguna";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const subtitle = title || role.toUpperCase();
  const headerTitle = className ? `Kas Kelas ${className}` : "KasKelasPro";
  const headerSubtitle = schoolName || "Kas Kelas";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="pointer-events-none data-[slot=sidebar-menu-button]:hover:bg-transparent"
            >
              <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Landmark className="size-4" />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">{headerTitle}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {headerSubtitle}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems
                .filter((item) => item.show)
                .map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[popup-open]:bg-sidebar-accent data-[popup-open]:text-sidebar-accent-foreground"
                  />
                }
              >
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {initials || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {subtitle}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="top"
                className="w-[--anchor-width] min-w-56"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-0.5">
                      <span className="truncate font-medium">{displayName}</span>
                      {email && (
                        <span className="truncate text-xs text-muted-foreground">
                          {email}
                        </span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <form action={signOut}>
                  <DropdownMenuItem
                    variant="destructive"
                    render={<button type="submit" className="w-full" />}
                  >
                    <LogOut className="size-4" />
                    Keluar
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
