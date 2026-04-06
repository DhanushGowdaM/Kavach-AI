import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Database, Table2, FileCheck, Users2,
  ShieldAlert, Building2, BarChart3, FileText, Settings,
  Shield, LogOut, AlertTriangle, Scale
} from "lucide-react";

const navGroups = [
  {
    label: "DISCOVERY",
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/sources", icon: Database, label: "Data Sources" },
      { to: "/assets", icon: Table2, label: "Assets" },
    ],
  },
  {
    label: "COMPLIANCE",
    items: [
      { to: "/consent", icon: FileCheck, label: "Consent Manager" },
      { to: "/rights", icon: Users2, label: "Rights Hub" },
      { to: "/risk-flags", icon: AlertTriangle, label: "Risk Flags" },
    ],
  },
  {
    label: "SECURITY",
    items: [
      { to: "/breach", icon: ShieldAlert, label: "Breach Sentinel" },
      { to: "/vendors", icon: Building2, label: "Vendor Trust" },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { to: "/compliance", icon: Scale, label: "Compliance Score" },
      { to: "/reports", icon: FileText, label: "Audit Reports" },
    ],
  },
];

function SidebarLink({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      data-testid={`sidebar-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 text-sm rounded-md transition-all duration-150 ${
          isActive
            ? "bg-[#58A6FF]/10 text-[#58A6FF] border-l-2 border-[#58A6FF]"
            : "text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#1C2333]"
        }`
      }
    >
      <Icon size={18} strokeWidth={1.5} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#0D1117]" data-testid="app-layout">
      {/* Sidebar */}
      <aside className="w-[240px] fixed inset-y-0 left-0 bg-[#0D1117] border-r border-[#30363D] z-50 flex flex-col" data-testid="sidebar">
        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-[#30363D]">
          <Shield size={24} className="text-[#58A6FF]" />
          <span className="text-lg font-semibold text-[#E6EDF3] font-['Outfit']">Kavach</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B949E] px-4 mb-2">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <SidebarLink key={item.to} {...item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-[#30363D] p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1C2333] flex items-center justify-center text-xs text-[#58A6FF] font-semibold">
              {user?.full_name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#E6EDF3] truncate">{user?.full_name || "User"}</p>
              <p className="text-xs text-[#8B949E]">{user?.role || "VIEWER"}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-sm text-[#8B949E] hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/5 py-2 rounded-md transition-all" data-testid="logout-btn">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-[240px] flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 border-b border-[#30363D] bg-[#0D1117]/80 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-6">
          <div>
            <p className="text-xs text-[#8B949E] uppercase tracking-wider">DPDPA 2023 Compliance Platform</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-[#8B949E] font-mono">
              {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
