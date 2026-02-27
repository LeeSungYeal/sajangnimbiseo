"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
    ArrowLeft, Plus, Pencil, Trash2, Tag, X, Save, ToggleLeft, ToggleRight, Filter,
} from "lucide-react";

// ── 타입 ──────────────────────────────────────────────────────────────────────
type FilterKeyword = {
    id: number;
    keyword: string;
    is_active: boolean;
    created_at: string | null;
    updated_at: string | null;
};

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────
export default function FilterKeywordAdminPage() {
    const [keywords, setKeywords] = useState<FilterKeyword[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formKeyword, setFormKeyword] = useState("");
    const [formActive, setFormActive] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<FilterKeyword | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchKeywords();
    }, []);

    async function fetchKeywords() {
        setLoading(true);
        const { data, error } = await supabase
            .from("rfp_filter_keywords")
            .select("*")
            .order("id", { ascending: true });
        if (!error && data) setKeywords(data as FilterKeyword[]);
        setLoading(false);
    }

    // ─ 모달 열기 ─
    function openCreate() {
        setEditingId(null);
        setFormKeyword("");
        setFormActive(true);
        setError(null);
        setModalOpen(true);
    }

    function openEdit(kw: FilterKeyword) {
        setEditingId(kw.id);
        setFormKeyword(kw.keyword);
        setFormActive(kw.is_active);
        setError(null);
        setModalOpen(true);
    }

    // ─ 저장 ─
    async function handleSave() {
        if (!formKeyword.trim()) {
            setError("키워드는 필수입니다.");
            return;
        }
        setSaving(true);
        setError(null);

        const payload = {
            keyword: formKeyword.trim(),
            is_active: formActive,
        };

        if (editingId === null) {
            const { error: err } = await supabase.from("rfp_filter_keywords").insert(payload);
            if (err) {
                setError(err.code === "23505" ? "이미 존재하는 키워드입니다." : err.message);
                setSaving(false);
                return;
            }
        } else {
            const { error: err } = await supabase
                .from("rfp_filter_keywords")
                .update(payload)
                .eq("id", editingId);
            if (err) {
                setError(err.code === "23505" ? "이미 존재하는 키워드입니다." : err.message);
                setSaving(false);
                return;
            }
        }

        setSaving(false);
        setModalOpen(false);
        fetchKeywords();
    }

    // ─ 삭제 ─
    async function handleDelete() {
        if (!deleteTarget) return;
        await supabase.from("rfp_filter_keywords").delete().eq("id", deleteTarget.id);
        setDeleteTarget(null);
        fetchKeywords();
    }

    // ─ 활성 토글 ─
    async function handleToggle(kw: FilterKeyword) {
        await supabase
            .from("rfp_filter_keywords")
            .update({ is_active: !kw.is_active })
            .eq("id", kw.id);
        setKeywords((prev) =>
            prev.map((k) => (k.id === kw.id ? { ...k, is_active: !k.is_active } : k))
        );
    }

    const activeCount = keywords.filter((k) => k.is_active).length;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* ── 헤더 ── */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
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
                            <Filter className="h-5 w-5 text-indigo-500" />
                            <h1 className="text-lg font-semibold text-slate-900">필터링 키워드 관리</h1>
                        </div>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        키워드 추가
                    </button>
                </div>
            </div>

            {/* ── 본문 ── */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* 통계 카드 */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { label: "전체 키워드", value: keywords.length, color: "text-slate-700" },
                        { label: "활성 키워드", value: activeCount, color: "text-indigo-600" },
                        { label: "비활성 키워드", value: keywords.length - activeCount, color: "text-slate-400" },
                    ].map((s) => (
                        <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
                            <p className="text-xs text-slate-400 font-medium mb-1">{s.label}</p>
                            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* 안내 배너 */}
                <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3">
                    <Filter className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-indigo-800">필터링 키워드 안내</p>
                        <p className="text-xs text-indigo-600 mt-0.5 leading-relaxed">
                            활성화된 키워드가 포함된 공고만 수집·표시됩니다. 키워드를 추가하거나 비활성화하여 수집 범위를 조절하세요.
                        </p>
                    </div>
                </div>

                {/* 키워드 목록 */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="p-8 space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : keywords.length === 0 ? (
                        <div className="py-20 text-center text-slate-400">
                            <Tag className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">등록된 키워드가 없습니다.</p>
                            <button
                                onClick={openCreate}
                                className="mt-4 text-sm text-indigo-500 hover:underline"
                            >
                                첫 키워드 추가하기
                            </button>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">키워드</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">등록일</th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">활성</th>
                                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">작업</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {keywords.map((kw) => (
                                    <tr key={kw.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                    <Tag className="h-3.5 w-3.5" />
                                                    {kw.keyword}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-xs text-slate-400">
                                                {kw.created_at
                                                    ? new Date(kw.created_at).toLocaleDateString("ko-KR")
                                                    : "-"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <button
                                                onClick={() => handleToggle(kw)}
                                                title={kw.is_active ? "클릭하여 비활성화" : "클릭하여 활성화"}
                                                className="focus:outline-none"
                                            >
                                                {kw.is_active ? (
                                                    <ToggleRight className="h-7 w-7 text-emerald-500 hover:text-emerald-600 transition-colors" />
                                                ) : (
                                                    <ToggleLeft className="h-7 w-7 text-slate-300 hover:text-slate-400 transition-colors" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(kw)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="수정"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(kw)}
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
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        {/* 모달 헤더 */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                                <Tag className="h-4 w-4 text-indigo-500" />
                                {editingId === null ? "키워드 추가" : "키워드 수정"}
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
                            {/* 키워드 입력 */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                                    키워드 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="예) AI, 인공지능, 소상공인..."
                                    value={formKeyword}
                                    onChange={(e) => setFormKeyword(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                    autoFocus
                                />
                            </div>

                            {/* 활성화 토글 */}
                            <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div>
                                    <p className="text-sm font-semibold text-slate-700">활성화</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {formActive ? "수집 필터에 적용됩니다" : "수집 필터에서 제외됩니다"}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormActive(!formActive)}
                                    className="focus:outline-none"
                                >
                                    {formActive ? (
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
                                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
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
                                <h3 className="text-base font-semibold text-slate-900 mb-1">키워드 삭제</h3>
                                <p className="text-sm text-slate-500">
                                    <span className="font-semibold text-slate-800">"{deleteTarget.keyword}"</span> 키워드를<br />
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
