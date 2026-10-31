"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  Receipt, Sun, Moon, LayoutDashboard, Users,
  FileText, CreditCard, BarChart3, LogOut, ChevronDown, Plus,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
  manager: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  accountant: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
};

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [theme, setTheme] = useState("light");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 no-underline flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Receipt size={16} className="text-white" />
          </div>
          <span className="font-black text-gray-900 dark:text-white hidden sm:block">BillFlow</span>
        </Link>

        <div className="hidden lg:flex items-center gap-1 flex-1">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold no-underline transition-all ${
                isActive(link.href)
                  ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
              }`}>
              <link.icon size={15} />
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Link href="/dashboard/invoices/new"
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-bold rounded-xl no-underline hover:opacity-90 transition-all shadow-lg shadow-blue-500/20">
            <Plus size={14} /> <span className="hidden sm:inline">New Invoice</span>
          </Link>

          <button onClick={toggleTheme}
            className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {session && (
            <div className="relative">
              <button onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{session.user.name?.charAt(0)}</span>
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[80px] truncate">
                  {session.user.name?.split(" ")[0]}
                </span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 py-2 z-50">
                  <div className="px-4 py-2.5 border-b border-gray-100 dark:border-white/10">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{session.user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
                    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-1 capitalize ${ROLE_COLORS[session.user.role || "accountant"]}`}>
                      {session.user.role}
                    </span>
                  </div>
                  <button onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}