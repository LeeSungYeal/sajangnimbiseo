"use client";

import React, { useState } from "react";
import { extractStoreName, registerStore } from "@/lib/actions/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Search, Store } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AnalyticsPage() {
    const [storeUrl, setStoreUrl] = useState("");
    const [extractedName, setExtractedName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleExtract = async () => {
        if (!storeUrl) {
            setError("매장 URL을 입력해주세요.");
            return;
        }

        setIsLoading(true);
        setError("");
        setSuccessMessage("");
        setExtractedName("");

        try {
            const result = await extractStoreName(storeUrl);
            if (result.success && result.name) {
                setExtractedName(result.name);
            } else {
                setError(result.error || "매장명을 추출할 수 없습니다.");
            }
        } catch (e) {
            console.error(e)
            setError("매장명 추출 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!extractedName || !storeUrl) return;

        setIsRegistering(true);
        setError("");
        setSuccessMessage("");

        try {
            const result = await registerStore(extractedName, storeUrl);
            if (result.success) {
                setSuccessMessage("매장이 성공적으로 등록되었습니다!");
                // Optional: clear form or redirect
                // setStoreUrl("");
                // setExtractedName("");
            } else {
                setError(result.error || "매장 등록에 실패했습니다.");
            }
        } catch (e) {
            console.error(e)
            setError("매장 등록 중 시스템 오류가 발생했습니다.");
        } finally {
            setIsRegistering(false);
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">내 매장 분석</h2>
                <p className="text-slate-400 mt-2">
                    매장 URL을 등록하고 분석 리포트를 받아보세요.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-slate-900 border-slate-800 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Store className="h-5 w-5 text-blue-400" />
                            매장 등록
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="store-url" className="text-white">네이버 지도 매장 URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="store-url"
                                    placeholder="https://naver.me/..."
                                    value={storeUrl}
                                    onChange={(e) => setStoreUrl(e.target.value)}
                                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                />
                                <Button
                                    onClick={handleExtract}
                                    disabled={isLoading || !storeUrl}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {isLoading ? "추출 중..." : <><Search className="mr-2 h-4 w-4" /> 찾기</>}
                                </Button>
                            </div>
                            <p className="text-xs text-slate-500">
                                예: https://naver.me/5Kqz2lc7
                            </p>
                        </div>

                        {extractedName && (
                            <div className="p-4 rounded-lg bg-slate-800 border border-slate-700 space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-1">
                                    <Label className="text-slate-400 text-xs">추출된 매장명</Label>
                                    <div className="text-lg font-bold text-white">{extractedName}</div>
                                </div>

                                <Button
                                    onClick={handleRegister}
                                    disabled={isRegistering}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {isRegistering ? "등록 중..." : "이 매장 등록하기"}
                                </Button>
                            </div>
                        )}

                        {error && (
                            <Alert variant="destructive" className="bg-red-900/20 border-red-900">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>오류</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {successMessage && (
                            <Alert className="bg-green-900/20 border-green-900 text-green-400">
                                <CheckCircle className="h-4 w-4" />
                                <AlertTitle>성공</AlertTitle>
                                <AlertDescription>{successMessage}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Placeholder for future analysis content or description */}
                <div className="space-y-6 text-slate-400">
                    <div className="p-6 rounded-lg bg-slate-900/50 border border-slate-800 border-dashed h-full flex flex-col items-center justify-center text-center">
                        <BarChartIcon className="h-12 w-12 text-slate-600 mb-4" />
                        <h3 className="text-lg font-medium text-white">매장 분석 인사이트</h3>
                        <p className="text-sm mt-2 max-w-xs">
                            매장을 등록하면 리뷰 분석, 키워드 트렌드, 방문자 통계 등 다양한 인사이트를 확인할 수 있습니다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BarChartIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="12" x2="12" y1="20" y2="10" />
            <line x1="18" x2="18" y1="20" y2="4" />
            <line x1="6" x2="6" y1="20" y2="16" />
        </svg>
    )
}
