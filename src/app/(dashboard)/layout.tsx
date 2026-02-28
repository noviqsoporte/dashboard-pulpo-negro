"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, CheckSquare, LogOut, Menu, X } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navLinks = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Inventario", href: "/inventario", icon: Package },
        { name: "Compras", href: "/compras", icon: ShoppingCart },
        { name: "Tareas", href: "/tareas", icon: CheckSquare },
    ];

    const handleLogout = async () => {
        try {
            const res = await fetch("/api/auth/logout", { method: "POST" });
            if (res.ok) {
                router.push("/");
                router.refresh();
            }
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const currentRouteName = navLinks.find((link) => link.href === pathname)?.name || "Dashboard";

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-[#f1f1f4] flex font-[var(--font-dm-sans)]">
            {/* Mobile Header / Hamburger */}
            <div className="md:hidden fixed top-0 w-full bg-[#12121a] border-b border-[#2a2a3e] z-50 p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Image src="/logo.png" alt="Logo" width={32} height={32} className="mix-blend-screen rounded-full" />
                    <span className="font-bold">El Pulpo Negro</span>
                </div>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X size={24} color="#f1f1f4" /> : <Menu size={24} color="#f1f1f4" />}
                </button>
            </div>

            {/* Sidebar */}
            <aside
                className={`${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    } md:translate-x-0 fixed md:sticky top-0 h-screen w-[260px] bg-[#12121a] border-r border-[#2a2a3e] z-40 transition-transform duration-300 flex flex-col`}
            >
                <div className="p-6 flex items-center gap-3">
                    <Image src="/logo.png" alt="Logo" width={40} height={40} className="mix-blend-screen rounded-full" />
                    <span className="font-bold text-lg">El Pulpo Negro</span>
                </div>

                <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive
                                    ? "bg-[#1a1a2e] border-l-4 border-[#d4a853] text-[#f1f1f4]"
                                    : "text-[#8a8a9a] hover:bg-[#1a1a2e] hover:text-[#f1f1f4] border-l-4 border-transparent"
                                    }`}
                            >
                                <Icon size={20} />
                                <span>{link.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-[#2a2a3e]">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[#8a8a9a] hover:bg-[#1a1a2e] hover:text-[#f1f1f4] rounded-md transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen">
                <header className="hidden md:flex h-20 items-center px-8 bg-[#0a0a0f] border-b border-[#2a2a3e]">
                    <h2 className="text-xl font-bold">{currentRouteName}</h2>
                </header>

                {/* Mobile spacing */}
                <div className="md:hidden h-16 w-full shrink-0"></div>

                <main className="flex-1 p-6 md:p-8 bg-[#0a0a0f]">
                    <div className="md:hidden mb-6">
                        <h2 className="text-xl font-bold">{currentRouteName}</h2>
                    </div>
                    {children}
                </main>
            </div>

            {/* Mobile overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}
        </div>
    );
}
