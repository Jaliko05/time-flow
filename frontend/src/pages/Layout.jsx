import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  ListChecks,
  FolderKanban,
  Settings,
  Users,
  LogOut,
  Moon,
  Sun,
  Menu,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);

    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const navigationItems = [
    {
      title: "Panel Principal",
      url: createPageUrl("Dashboard"),
      icon: LayoutDashboard,
      roles: ["superadmin", "admin", "user"],
    },
    {
      title: "Mis Actividades",
      url: createPageUrl("Activities"),
      icon: ListChecks,
      roles: ["superadmin", "admin", "user"],
    },
    {
      title: "Mis Proyectos",
      url: createPageUrl("Projects"),
      icon: FolderKanban,
      roles: ["superadmin", "admin", "user"],
    },
    {
      title: "Calendario",
      url: createPageUrl("Calendar"),
      icon: CalendarDays,
      roles: ["superadmin", "admin", "user"],
    },
    {
      title: "Panel Administrativo",
      url: createPageUrl("Admin"),
      icon: Users,
      roles: ["superadmin", "admin"],
    },
    {
      title: "Configuración",
      url: createPageUrl("Settings"),
      icon: Settings,
      roles: ["superadmin", "admin", "user"],
    },
  ];

  console.log("Layout - Current user:", user);
  console.log("Layout - User role:", user?.role);

  const filteredNav = navigationItems.filter(
    (item) => !user || item.roles.includes(user.role)
  );

  console.log("Layout - Filtered nav items:", filteredNav.length);

  return (
    <SidebarProvider
      defaultOpen={true}
      style={{
        "--sidebar-width": "16rem",
        "--sidebar-width-icon": "4rem",
      }}
    >
      <style>{`
        :root {
          --background: 0 0% 98%;
          --foreground: 222.2 84% 4.9%;
          --card: 0 0% 100%;
          --card-foreground: 222.2 84% 4.9%;
          --primary: 221.2 83.2% 53.3%;
          --primary-foreground: 210 40% 98%;
          --secondary: 210 40% 96.1%;
          --secondary-foreground: 222.2 47.4% 11.2%;
          --muted: 210 40% 96.1%;
          --muted-foreground: 215.4 16.3% 46.9%;
          --accent: 210 40% 96.1%;
          --accent-foreground: 222.2 47.4% 11.2%;
          --border: 214.3 31.8% 91.4%;
        }

        .dark {
          --background: 222.2 84% 4.9%;
          --foreground: 210 40% 98%;
          --card: 222.2 84% 6%;
          --card-foreground: 210 40% 98%;
          --primary: 217.2 91.2% 59.8%;
          --primary-foreground: 222.2 47.4% 11.2%;
          --secondary: 217.2 32.6% 17.5%;
          --secondary-foreground: 210 40% 98%;
          --muted: 217.2 32.6% 17.5%;
          --muted-foreground: 215 20.2% 65.1%;
          --accent: 217.2 32.6% 17.5%;
          --accent-foreground: 210 40% 98%;
          --border: 217.2 32.6% 17.5%;
        }
      `}</style>

      <div className="min-h-screen flex w-full bg-background transition-colors duration-300">
        <SidebarComponent
          user={user}
          logout={logout}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          navigationItems={filteredNav}
          location={location}
        />

        <main className="flex-1 flex flex-col">
          <header className="bg-card border-b border-border px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-accent p-2 rounded-lg transition-colors duration-200">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
              <h1 className="text-xl font-semibold text-foreground">
                TimeTracker
              </h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto bg-background p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function SidebarComponent({
  user,
  logout,
  darkMode,
  toggleDarkMode,
  navigationItems,
  location,
}) {
  const { open, toggleSidebar } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
              <ListChecks className="w-6 h-6 text-white" />
            </div>
            {open && (
              <div className="min-w-0">
                <h2 className="font-bold text-foreground truncate">
                  Sistemas gyg
                </h2>
                <p className="text-xs text-muted-foreground truncate">
                  Gestión Laboral
                </p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden md:flex flex-shrink-0 h-8 w-8"
          >
            {open ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          {open && (
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2">
              Navegación
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <TooltipProvider delayDuration={0}>
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          className={`hover:bg-accent hover:text-accent-foreground transition-colors duration-200 rounded-lg mb-1 ${
                            location.pathname === item.url
                              ? "bg-accent text-accent-foreground font-medium"
                              : ""
                          } ${!open ? "justify-center" : ""}`}
                        >
                          <Link
                            to={item.url}
                            className={`flex items-center gap-3 px-3 py-2 ${
                              !open ? "justify-center" : ""
                            }`}
                          >
                            <item.icon className="w-4 h-4 flex-shrink-0" />
                            {open && <span>{item.title}</span>}
                          </Link>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {!open && (
                        <TooltipContent side="right">
                          <p>{item.title}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </SidebarMenuItem>
                ))}
              </TooltipProvider>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4 space-y-3">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleDarkMode}
                className={`w-full ${
                  open ? "justify-start" : "justify-center"
                } gap-2`}
              >
                {darkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
                {open && (darkMode ? "Modo Claro" : "Modo Oscuro")}
              </Button>
            </TooltipTrigger>
            {!open && (
              <TooltipContent side="right">
                <p>{darkMode ? "Modo Claro" : "Modo Oscuro"}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {user && open && (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-muted">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user.full_name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate">
                {user.full_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}

        {user && !open && (
          <div className="flex justify-center">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user.full_name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className={`w-full ${
                  open ? "justify-start" : "justify-center"
                } gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950`}
              >
                <LogOut className="w-4 h-4" />
                {open && "Cerrar Sesión"}
              </Button>
            </TooltipTrigger>
            {!open && (
              <TooltipContent side="right">
                <p>Cerrar Sesión</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </SidebarFooter>
    </Sidebar>
  );
}
