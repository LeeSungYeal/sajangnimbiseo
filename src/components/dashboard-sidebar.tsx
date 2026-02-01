"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, BarChart3, FileText, Settings, UserCircle } from "lucide-react";

const navigation = [
    { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },
    { name: "내 매장 분석", href: "/analytics", icon: BarChart3 },
    { name: "AI 리포트", href: "/dashboard/reports", icon: FileText },
    { name: "설정", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-64 flex-col bg-slate-900 text-white">
            <div className="flex h-16 items-center px-6">
                <h1 className="text-xl font-bold tracking-tight text-white">
                    사장님비서
                </h1>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-slate-800 text-white"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                                    isActive ? "text-blue-400" : "text-slate-500 group-hover:text-white"
                                )}
                                aria-hidden="true"
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t border-slate-800 p-4">
                <div className="flex items-center">
                    <UserCircle className="h-8 w-8 text-slate-400" />
                    <div className="ml-3">
                        <p className="text-sm font-medium text-white">사용자</p>
                        <p className="text-xs text-slate-500">로그아웃</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
