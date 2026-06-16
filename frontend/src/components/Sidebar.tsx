"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  FileText,
  Activity,
  Heart,
  Pill,
  History,
  User,
  LogOut,
  Menu,
  X,
  PlusCircle,
  ActivitySquare,
  Calendar,
  Bell
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Scan Prescription", href: "/upload-prescription", icon: FileText },
    { name: "Report Interpreter", href: "/report-analyzer", icon: Activity },
    { name: "Preventive Care", href: "/preventive-care", icon: Heart },
    { name: "Drug Interactions", href: "/drug-interaction", icon: Pill },
    { name: "Expiry Checker", href: "/expiry", icon: Calendar },
    { name: "Pill Reminders", href: "/reminders", icon: Bell },
    { name: "History", href: "/history", icon: History },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:text-white"
        aria-label="Toggle Sidebar"
      >
        {isOpen ? <X className="h-6 h-6" /> : <Menu className="h-6 h-6" />}
      </button>

      {/* Sidebar background overlay for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
        />
      )}

      {/* Actual Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-45 flex flex-col w-72 bg-slate-950 border-r border-slate-900 transition-transform duration-300 transform lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-900">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
            <ActivitySquare className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              HealthQ AI
            </h1>
            <p className="text-xs text-slate-500 font-medium">Smart Clinical Companion</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-teal-500/10 to-cyan-500/10 text-teal-400 border border-teal-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                }`}
                onClick={() => {
                  if (window.innerWidth < 1024) setIsOpen(false);
                }}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-teal-400" : "text-slate-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User profile footer */}
        {user && (
          <div className="p-4 border-t border-slate-900 bg-slate-900/30">
            <div className="flex items-center gap-3 px-2 py-3">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.email}`}
                alt="Avatar"
                className="w-10 h-10 rounded-xl border border-slate-800 bg-slate-950"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-200 truncate">{user.full_name}</h4>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 mt-2 rounded-xl text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
