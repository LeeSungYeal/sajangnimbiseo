"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Megaphone, Calendar, Building2, ChevronRight, Search, Settings2, RefreshCw, ExternalLink, Filter, Trash2 } from "lucide-react";

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
    org_abbr: string | null;   // rfp_public_org.org_abbr (join)
};

const ORGS: { label: string; orgName: string | null }[] = [
    { label: "전체", orgName: null },
    { label: "NIA", orgName: "한국지능정보사회진흥원" },
    { label: "NIPA", orgName: "정보통신산업진흥원" },
    { label: "IITP", orgName: "정보통신기획평가원" },
    { label: "KEIT", orgName: "한국산업기술기획평가원" },
    { label: "G2B", orgName: "나라장터_입찰" },
];

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
    if (diff === 0) return { label: "Today", urgent: true };
    if (diff <= 7) return { label: `D-${diff}`, urgent: true };
    return { label: `D-${diff}`, urgent: false };
}

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrgName, setSelectedOrgName] = useState<string | null>(null);
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
                rfp_public_org ( org_name, org_abbr )
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
                org_abbr: row.rfp_public_org?.org_abbr ?? null,
            }));
            setAnnouncements(flat);
            setLastUpdated(new Date().toLocaleTimeString("ko-KR"));
        }
        setLoading(false);
    }

    const filtered = announcements.filter((a) => {
        const matchOrg = selectedOrgName === null || (a.org_name ?? "") === selectedOrgName;
        const q = searchQuery.toLowerCase();
        const matchSearch =
            q === "" ||
            a.title.toLowerCase().includes(q) ||
            (a.org_name ?? "").toLowerCase().includes(q) ||
            (a.description ?? "").toLowerCase().includes(q);
        return matchOrg && matchSearch;
    });

    async function deleteAnnouncement(id: string, title: string) {
        const short = title.length > 40 ? title.slice(0, 40) + "..." : title;
        if (!confirm(`이 공고를 삭제하시겠습니까?\n\n"${short}"`)) return;
        const { error } = await supabase
            .from("rfp_announcements")
            .delete()
            .eq("id", id);
        if (!error) {
            setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        } else {
            alert("삭제 실패: " + error.message);
        }
    }

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
                    <Link
                        href="/announcements/filter"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 hover:border-indigo-300 transition-all"
                    >
                        <Filter className="h-4 w-4" />
                        필터링 관리
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
                    {ORGS.map(({ label, orgName }) => (
                        <button
                            key={label}
                            onClick={() => setSelectedOrgName(orgName)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${selectedOrgName === orgName
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 공고 목록 */}
            {loading ? (
                <div className="space-y-2">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-24 text-slate-400">
                    <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">해당하는 공고가 없습니다.</p>
                    <p className="text-sm mt-1 text-slate-300">기관을 등록하고 수집을 실행해보세요.</p>
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="py-3 px-4 text-left font-semibold text-slate-600 text-xs w-36 whitespace-nowrap">기관명</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600 text-xs">공고제목</th>
                                <th className="py-3 px-4 text-center font-semibold text-slate-600 text-xs w-28 whitespace-nowrap">공고날짜</th>
                                <th className="py-3 px-4 text-center font-semibold text-slate-600 text-xs w-24 whitespace-nowrap">원문보기</th>
                                <th className="py-3 px-4 text-center font-semibold text-slate-600 text-xs w-16 whitespace-nowrap">삭제</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map((item, i) => {
                                const dday = getDateLabel(item.announce_date);
                                const catColor = CATEGORY_COLORS[item.category ?? "기타"] ?? CATEGORY_COLORS["기타"];
                                return (
                                    <tr key={item.id} className={`group hover:bg-blue-50/40 transition-colors ${i % 2 === 1 ? "bg-slate-50/50" : ""}`}>
                                        {/* 기관명 */}
                                        <td className="py-3 px-4 text-xs text-slate-500 font-medium align-middle whitespace-nowrap">
                                            {item.org_name ?? "-"}
                                        </td>
                                        {/* 공고제목 */}
                                        <td className="py-3 px-4 align-middle">
                                            <Link
                                                href={`/announcements/${item.id}`}
                                                className="text-sm font-medium text-slate-800 hover:text-blue-600 transition-colors leading-snug"
                                            >
                                                {item.title}
                                            </Link>
                                        </td>
                                        {/* 공고날짜 */}
                                        <td className="py-3 px-4 text-center align-middle whitespace-nowrap">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-xs text-slate-500">{item.announce_date ?? "-"}</span>
                                                {dday.label !== "마감" && (
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${dday.urgent
                                                        ? "bg-red-50 text-red-600 border border-red-200"
                                                        : "bg-slate-50 text-slate-500 border border-slate-200"
                                                        }`}>
                                                        {dday.label}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        {/* 원문보기 */}
                                        <td className="py-3 px-4 text-center align-middle">
                                            {item.source_url ? (
                                                <a
                                                    href={item.source_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all whitespace-nowrap"
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                    원문 보기
                                                </a>
                                            ) : (
                                                <span className="text-xs text-slate-300">-</span>
                                            )}
                                        </td>
                                        {/* 삭제 */}
                                        <td className="py-3 px-4 text-center align-middle">
                                            <button
                                                onClick={() => deleteAnnouncement(item.id, item.title)}
                                                className="p-1.5 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                title="삭제"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
