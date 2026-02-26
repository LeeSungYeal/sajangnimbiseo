"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
    ArrowLeft, Plus, Pencil, Trash2, Building2, ToggleLeft, ToggleRight, X, Save, Globe, ExternalLink, ChevronDown,
} from "lucide-react";

// ── 타입 ──────────────────────────────────────────────────────────────────────
type OrgType = "국가기관" | "정부출연기관";
type CollMeth = "API" | "RSS" | "Static Scraper" | "Dynamic Scraper";

type PublicOrg = {
    id: number;
    org_name: string;
    org_type: OrgType | null;
    homepage_url: string | null;
    rfp_url: string | null;
    coll_meth: CollMeth | null;
    is_active: boolean;
    created_at: string | null;
    updated_at: string | null;
};

const EMPTY_FORM: Omit<PublicOrg, "id" | "created_at" | "updated_at"> = {
    org_name: "",
    org_type: null,
    homepage_url: "",
    rfp_url: "",
    coll_meth: null,
    is_active: true,
};

const ORG_TYPES: OrgType[] = ["국가기관", "정부출연기관"];
const COLL_METHS: CollMeth[] = ["API", "RSS", "Static Scraper", "Dynamic Scraper"];

const METH_BADGE: Record<CollMeth, string> = {
    API: "bg-blue-100 text-blue-700",
    RSS: "bg-green-100 text-green-700",
    "Static Scraper": "bg-amber-100 text-amber-700",
    "Dynamic Scraper": "bg-purple-100 text-purple-700",
};

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────
export default function PublicOrgAdminPage() {
    const [orgs, setOrgs] = useState<PublicOrg[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<PublicOrg | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchOrgs();
    }, []);

    async function fetchOrgs() {
        setLoading(true);
        const { data, error } = await supabase
            .from("rfp_public_org")
            .select("*")
            .order("id", { ascending: true });
        if (!error && data) setOrgs(data as PublicOrg[]);
        setLoading(false);
    }

    // ─ 모달 열기 ─
    function openCreate() {
        setEditingId(null);
        setForm({ ...EMPTY_FORM });
        setError(null);
        setModalOpen(true);
    }

    function openEdit(org: PublicOrg) {
        setEditingId(org.id);
        setForm({
            org_name: org.org_name,
            org_type: org.org_type,
            homepage_url: org.homepage_url ?? "",
            rfp_url: org.rfp_url ?? "",
            coll_meth: org.coll_meth,
            is_active: org.is_active,
        });
        setError(null);
        setModalOpen(true);
    }

    // ─ 저장 ─
    async function handleSave() {
        if (!form.org_name.trim()) {
            setError("기관명은 필수입니다.");
            return;
        }
        setSaving(true);
        setError(null);

        const payload = {
            org_name: form.org_name.trim(),
            org_type: form.org_type || null,
            homepage_url: form.homepage_url?.trim() || null,
            rfp_url: form.rfp_url?.trim() || null,
            coll_meth: form.coll_meth || null,
            is_active: form.is_active,
        };

        if (editingId === null) {
            const { error: err } = await supabase.from("rfp_public_org").insert(payload);
            if (err) { setError(err.message); setSaving(false); return; }
        } else {
            const { error: err } = await supabase
                .from("rfp_public_org")
                .update(payload)
                .eq("id", editingId);
            if (err) { setError(err.message); setSaving(false); return; }
        }

        setSaving(false);
        setModalOpen(false);
        fetchOrgs();
    }

    // ─ 삭제 ─
    async function handleDelete() {
        if (!deleteTarget) return;
        await supabase.from("rfp_public_org").delete().eq("id", deleteTarget.id);
        setDeleteTarget(null);
        fetchOrgs();
    }

    // ─ 활성 토글 ─
    async function handleToggle(org: PublicOrg) {
        await supabase
            .from("rfp_public_org")
            .update({ is_active: !org.is_active })
            .eq("id", org.id);
        setOrgs((prev) =>
            prev.map((o) => (o.id === org.id ? { ...o, is_active: !o.is_active } : o))
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* ── 헤더 ── */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/announcements"
                            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors group"
                        >
                            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                            사업공고
                        </Link>
                        <span className="text-slate-300">/</span>
                        <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-500" />
                            <h1 className="text-lg font-semibold text-slate-900">공공기관 관리</h1>
                        </div>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        기관 추가
                    </button>
                </div>
            </div>

            {/* ── 본문 ── */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* 통계 카드 */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { label: "전체 기관", value: orgs.length, color: "text-slate-700" },
                        { label: "수집 활성", value: orgs.filter((o) => o.is_active).length, color: "text-emerald-600" },
                        { label: "수집 중지", value: orgs.filter((o) => !o.is_active).length, color: "text-slate-400" },
                    ].map((s) => (
                        <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
                            <p className="text-xs text-slate-400 font-medium mb-1">{s.label}</p>
                            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* 테이블 */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="p-8 space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : orgs.length === 0 ? (
                        <div className="py-20 text-center text-slate-400">
                            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">등록된 기관이 없습니다.</p>
                            <button
                                onClick={openCreate}
                                className="mt-4 text-sm text-blue-500 hover:underline"
                            >
                                첫 기관 추가하기
                            </button>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">기관명</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">유형</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">수집방식</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">링크</th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">수집활성</th>
                                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">작업</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orgs.map((org) => (
                                    <tr key={org.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-5 py-4">
                                            <span className="font-medium text-slate-900">{org.org_name}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            {org.org_type ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                    {org.org_type}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            {org.coll_meth ? (
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${METH_BADGE[org.coll_meth]}`}>
                                                    {org.coll_meth}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                {org.homepage_url && (
                                                    <a
                                                        href={org.homepage_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="홈페이지"
                                                        className="text-slate-400 hover:text-blue-500 transition-colors"
                                                    >
                                                        <Globe className="h-4 w-4" />
                                                    </a>
                                                )}
                                                {org.rfp_url && (
                                                    <a
                                                        href={org.rfp_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="사업공고"
                                                        className="text-slate-400 hover:text-blue-500 transition-colors"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                )}
                                                {!org.homepage_url && !org.rfp_url && (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <button
                                                onClick={() => handleToggle(org)}
                                                title={org.is_active ? "클릭하여 비활성화" : "클릭하여 활성화"}
                                                className="focus:outline-none"
                                            >
                                                {org.is_active ? (
                                                    <ToggleRight className="h-7 w-7 text-emerald-500 hover:text-emerald-600 transition-colors" />
                                                ) : (
                                                    <ToggleLeft className="h-7 w-7 text-slate-300 hover:text-slate-400 transition-colors" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(org)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="수정"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(org)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="삭제"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ── 등록/수정 모달 ── */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        {/* 모달 헤더 */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                            <h2 className="text-base font-semibold text-slate-900">
                                {editingId === null ? "기관 추가" : "기관 수정"}
                            </h2>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* 모달 본문 */}
                        <div className="px-6 py-5 space-y-5">
                            {/* 기관명 */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                                    기관명 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="예) 중소벤처기업부"
                                    value={form.org_name}
                                    onChange={(e) => setForm({ ...form, org_name: e.target.value })}
                                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                            </div>

                            {/* 기관유형 */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">기관 유형</label>
                                <div className="relative">
                                    <select
                                        value={form.org_type ?? ""}
                                        onChange={(e) => setForm({ ...form, org_type: (e.target.value as OrgType) || null })}
                                        className="w-full appearance-none px-3.5 py-2.5 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                                    >
                                        <option value="">선택 안 함</option>
                                        {ORG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* 홈페이지 주소 */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">홈페이지 주소</label>
                                <input
                                    type="url"
                                    placeholder="https://www.example.go.kr"
                                    value={form.homepage_url ?? ""}
                                    onChange={(e) => setForm({ ...form, homepage_url: e.target.value })}
                                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                            </div>

                            {/* 사업공고 주소 */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">사업공고 주소</label>
                                <input
                                    type="url"
                                    placeholder="https://www.example.go.kr/biz/notice"
                                    value={form.rfp_url ?? ""}
                                    onChange={(e) => setForm({ ...form, rfp_url: e.target.value })}
                                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                            </div>

                            {/* 수집 방식 */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">수집 방식</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {COLL_METHS.map((m) => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setForm({ ...form, coll_meth: m })}
                                            className={`px-3.5 py-2 text-sm font-medium rounded-lg border transition-all ${form.coll_meth === m
                                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                                                }`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 수집 활성화 토글 */}
                            <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div>
                                    <p className="text-sm font-semibold text-slate-700">수집 활성화</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {form.is_active ? "현재 수집 중입니다" : "현재 수집이 중지되어 있습니다"}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, is_active: !form.is_active })}
                                    className="focus:outline-none"
                                >
                                    {form.is_active ? (
                                        <ToggleRight className="h-8 w-8 text-emerald-500 hover:text-emerald-600 transition-colors" />
                                    ) : (
                                        <ToggleLeft className="h-8 w-8 text-slate-300 hover:text-slate-400 transition-colors" />
                                    )}
                                </button>
                            </div>

                            {/* 에러 메시지 */}
                            {error && (
                                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}
                        </div>

                        {/* 모달 푸터 */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                            >
                                <Save className="h-4 w-4" />
                                {saving ? "저장 중..." : "저장"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 삭제 확인 다이얼로그 ── */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="p-2.5 bg-red-50 rounded-xl border border-red-100 flex-shrink-0">
                                <Trash2 className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 mb-1">기관 삭제</h3>
                                <p className="text-sm text-slate-500">
                                    <span className="font-semibold text-slate-800">{deleteTarget.org_name}</span>을(를)<br />
                                    영구 삭제합니다. 이 작업은 되돌릴 수 없습니다.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
