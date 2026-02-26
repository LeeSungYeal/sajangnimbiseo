"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Megaphone, Calendar, Building2, ChevronRight, Search, Settings2, RefreshCw, ExternalLink } from "lucide-react";

type Announcement = {
    id: string;
    title: string;
    category: string | null;
    announce_date: string | null;
    description: string | null;
    source_url: string | null;
    scraped_at: string;
    org_id: number | null;
    org_name: string | null;   // rfp_public_org.org_name (join)
};

const CATEGORIES = ["전체", "입찰공고", "공고"];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    "입찰공고": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    "공고": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    "기타": { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
};

function getDateLabel(announce_date: string | null): { label: string; urgent: boolean } {
    if (!announce_date) return { label: "날짜 미정", urgent: false };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(announce_date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: "마감", urgent: false };
    if (diff === 0) return { label: "D-Day", urgent: true };
    if (diff <= 7) return { label: `D-${diff}`, urgent: true };
    return { label: `D-${diff}`, urgent: false };
}

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("전체");
    const [searchQuery, setSearchQuery] = useState("");
    const [lastUpdated, setLastUpdated] = useState<string>("");

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    async function fetchAnnouncements() {
        setLoading(true);
        const { data, error } = await supabase
            .from("rfp_announcements")
            .select(`
                id,
                title,
                category,
                announce_date,
                description,
                source_url,
                scraped_at,
                org_id,
                rfp_public_org ( org_name )
            `)
            .eq("is_active", true)
            .order("announce_date", { ascending: false })
            .limit(200);

        if (!error && data) {
            // rfp_public_org 조인 결과를 flat하게 변환
            const flat: Announcement[] = data.map((row: any) => ({
                id: row.id,
                title: row.title,
                category: row.category,
                announce_date: row.announce_date,
                description: row.description,
                source_url: row.source_url,
                scraped_at: row.scraped_at,
                org_id: row.org_id,
                org_name: row.rfp_public_org?.org_name ?? null,
            }));
            setAnnouncements(flat);
            setLastUpdated(new Date().toLocaleTimeString("ko-KR"));
        }
        setLoading(false);
    }

    const filtered = announcements.filter((a) => {
        const matchCategory = selectedCategory === "전체" || a.category === selectedCategory;
        const q = searchQuery.toLowerCase();
        const matchSearch =
            q === "" ||
            a.title.toLowerCase().includes(q) ||
            (a.org_name ?? "").toLowerCase().includes(q) ||
            (a.description ?? "").toLowerCase().includes(q);
        return matchCategory && matchSearch;
    });

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex justify-between items-start flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Megaphone className="h-6 w-6 text-blue-500" />
                        사업공고
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        공공기관 입찰·지원 공고를 자동 수집하여 제공합니다.
                        {lastUpdated && (
                            <span className="ml-2 text-slate-400 text-xs">· {lastUpdated} 기준</span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchAnnouncements}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
                        title="새로고침"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        새로고침
                    </button>
                    <Link
                        href="/announcements/admin"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                        <Settings2 className="h-4 w-4" />
                        기관 관리
                    </Link>
                    <div className="text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 font-medium">
                        총 {filtered.length}건
                    </div>
                </div>
            </div>

            {/* 검색 + 카테고리 필터 */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="공고명, 기관명, 내용으로 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${selectedCategory === cat
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* 공고 목록 */}
            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-52 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-24 text-slate-400">
                    <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">해당하는 공고가 없습니다.</p>
                    <p className="text-sm mt-1 text-slate-300">기관을 등록하고 수집을 실행해보세요.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((item) => {
                        const dday = getDateLabel(item.announce_date);
                        const catColor = CATEGORY_COLORS[item.category ?? "기타"] ?? CATEGORY_COLORS["기타"];
                        return (
                            <div key={item.id} className="group flex flex-col rounded-xl border border-slate-200 bg-white hover:shadow-md hover:border-blue-200 transition-all duration-200 overflow-hidden">
                                {/* 카드 헤더 */}
                                <div className="px-4 pt-4 pb-3 space-y-2 flex-1">
                                    {/* 배지 행 */}
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                                            {item.category ?? "기타"}
                                        </span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${dday.label === "마감"
                                            ? "bg-slate-100 text-slate-400"
                                            : dday.urgent
                                                ? "bg-red-50 text-red-600 border border-red-200"
                                                : "bg-slate-50 text-slate-600 border border-slate-200"
                                            }`}>
                                            {dday.label}
                                        </span>
                                    </div>

                                    {/* 제목 */}
                                    <p className="text-sm font-semibold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                                        {item.title}
                                    </p>

                                    {/* 설명 */}
                                    {item.description && (
                                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                            {item.description}
                                        </p>
                                    )}
                                </div>

                                {/* 카드 푸터 */}
                                <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <div className="flex flex-col gap-0.5">
                                        {item.org_name && (
                                            <span className="flex items-center gap-1 text-xs text-slate-500">
                                                <Building2 className="h-3 w-3" />
                                                {item.org_name}
                                            </span>
                                        )}
                                        {item.announce_date && (
                                            <span className="flex items-center gap-1 text-xs text-slate-400">
                                                <Calendar className="h-3 w-3" />
                                                {item.announce_date}
                                            </span>
                                        )}
                                    </div>
                                    {item.source_url ? (
                                        <a
                                            href={item.source_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all"
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                            원문 보기
                                        </a>
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
