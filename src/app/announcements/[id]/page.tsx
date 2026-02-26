"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Building2, Calendar, ExternalLink, Tag, Clock } from "lucide-react";

type Announcement = {
    id: string;
    title: string;
    category: string | null;
    announce_date: string | null;
    description: string | null;
    source_url: string | null;
    scraped_at: string;
    org_id: number | null;
    org_name: string | null;
};

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

export default function AnnouncementDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchAnnouncement(id);
    }, [id]);

    async function fetchAnnouncement(announcementId: string) {
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
            .eq("id", announcementId)
            .single();

        if (!error && data) {
            const row = data as any;
            setAnnouncement({
                id: row.id,
                title: row.title,
                category: row.category,
                announce_date: row.announce_date,
                description: row.description,
                source_url: row.source_url,
                scraped_at: row.scraped_at,
                org_id: row.org_id,
                org_name: row.rfp_public_org?.org_name ?? null,
            });
        }
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="h-8 w-32 bg-slate-100 rounded animate-pulse" />
                <div className="h-12 w-3/4 bg-slate-100 rounded animate-pulse" />
                <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
            </div>
        );
    }

    if (!announcement) {
        return (
            <div className="text-center py-20 text-slate-400">
                <p className="font-medium">공고를 찾을 수 없습니다.</p>
                <button
                    onClick={() => router.push("/announcements")}
                    className="mt-4 text-sm text-blue-500 hover:underline"
                >
                    목록으로 돌아가기
                </button>
            </div>
        );
    }

    const dday = getDateLabel(announcement.announce_date);
    const catColor = CATEGORY_COLORS[announcement.category ?? "기타"] ?? CATEGORY_COLORS["기타"];
    const scrapedDate = announcement.scraped_at
        ? new Date(announcement.scraped_at).toLocaleDateString("ko-KR")
        : null;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* 뒤로가기 */}
            <button
                onClick={() => router.push("/announcements")}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors group"
            >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                사업공고 목록으로
            </button>

            {/* 제목 영역 */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                        <Tag className="h-3.5 w-3.5 mr-1.5" />
                        {announcement.category ?? "기타"}
                    </span>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${dday.label === "마감"
                            ? "bg-slate-100 text-slate-400"
                            : dday.urgent
                                ? "bg-red-50 text-red-600 border border-red-200"
                                : "bg-slate-50 text-slate-600 border border-slate-200"
                        }`}>
                        {dday.label}
                    </span>
                </div>
                <h1 className="text-xl font-bold text-slate-900 leading-snug">
                    {announcement.title}
                </h1>
            </div>

            {/* 메타 정보 카드 */}
            <Card className="border border-slate-200 bg-slate-50">
                <CardContent className="pt-5 pb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* 기관 */}
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
                                <Building2 className="h-4 w-4 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium mb-0.5">주관기관</p>
                                <p className="text-sm font-semibold text-slate-800">
                                    {announcement.org_name ?? "미상"}
                                </p>
                            </div>
                        </div>
                        {/* 날짜 */}
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
                                <Calendar className="h-4 w-4 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium mb-0.5">공고 날짜</p>
                                <p className={`text-sm font-semibold ${dday.urgent ? "text-red-600" : "text-slate-800"}`}>
                                    {announcement.announce_date ?? "미정"}
                                    {announcement.announce_date && (
                                        <span className="ml-1.5 text-xs font-normal text-slate-400">({dday.label})</span>
                                    )}
                                </p>
                            </div>
                        </div>
                        {/* 수집일 */}
                        {scrapedDate && (
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-medium mb-0.5">수집일</p>
                                    <p className="text-sm font-semibold text-slate-500">{scrapedDate}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 공고 내용 */}
            <Card className="border border-slate-200">
                <CardContent className="pt-6">
                    <h2 className="text-base font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                        공고 내용
                    </h2>
                    {announcement.description ? (
                        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                            {announcement.description}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-slate-400">
                            <p className="text-sm">본문 내용이 없습니다.</p>
                            {announcement.source_url && (
                                <p className="text-xs mt-1">원문 링크에서 상세 내용을 확인하세요.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 원문 링크 버튼 */}
            {announcement.source_url && (
                <div className="flex justify-end">
                    <a
                        href={announcement.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm hover:shadow-md"
                    >
                        <ExternalLink className="h-4 w-4" />
                        원문 공고 보러가기
                    </a>
                </div>
            )}
        </div>
    );
}
