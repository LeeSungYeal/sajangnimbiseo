"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowUpRight, Users, MousePointerClick, Phone, CalendarCheck } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const data = [
    { name: '월', visitors: 120, clicks: 40 },
    { name: '화', visitors: 150, clicks: 55 },
    { name: '수', visitors: 180, clicks: 70 },
    { name: '목', visitors: 140, clicks: 45 },
    { name: '금', visitors: 250, clicks: 90 },
    { name: '토', visitors: 300, clicks: 120 },
    { name: '일', visitors: 280, clicks: 110 },
];

const data2 = [
    { name: '영도 맛집', score: 400 },
    { name: '동삼동 점심', score: 300 },
    { name: '부산 핫플', score: 200 },
    { name: '데이트', score: 278 },
];

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">대시보드</h2>
                    <p className="text-slate-500">사장님, 오늘의 매장 현황을 한눈에 확인하세요.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-500">최근 업데이트: 오늘 13:00</span>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">총 방문자 수</CardTitle>
                        <Users className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2,350명</div>
                        <p className="text-xs text-slate-500 flex items-center mt-1">
                            <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                            <span className="text-green-500 font-medium">+12.5%</span>
                            <span className="ml-1">지난주 대비</span>
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">플레이스 클릭</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,203회</div>
                        <p className="text-xs text-slate-500 flex items-center mt-1">
                            <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                            <span className="text-green-500 font-medium">+8.2%</span>
                            <span className="ml-1">지난주 대비</span>
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">전화 문의</CardTitle>
                        <Phone className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">54건</div>
                        <p className="text-xs text-slate-500 flex items-center mt-1">
                            <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                            <span className="text-green-500 font-medium">+4.1%</span>
                            <span className="ml-1">지난주 대비</span>
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">예약 확정</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">32건</div>
                        <p className="text-xs text-slate-500 flex items-center mt-1">
                            <span className="text-slate-500 font-medium">변동 없음</span>
                            <span className="ml-1">지난주 대비</span>
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>주간 방문 추이</CardTitle>
                        <CardDescription>이번 주 방문자 수 변화를 확인하세요.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                        itemStyle={{ color: '#1e293b' }}
                                    />
                                    <Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>유입 키워드 TOP 5</CardTitle>
                        <CardDescription>
                            고객들이 이 검색어로 방문했습니다.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={data2} margin={{ top: 0, right: 0, bottom: 0, left: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={80} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                    <Bar dataKey="score" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>💡 AI 마케팅 인사이트</CardTitle>
                        <CardDescription>최근 데이터를 분석하여 드리는 제안입니다.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <h4 className="font-semibold text-blue-900 mb-2">키워드 효율 개선</h4>
                            <p className="text-sm text-blue-800">
                                '동삼동 점심' 키워드의 유입이 지난주 대비 15% 상승했습니다. 해당 키워드로 검색 광고 예산을 10% 증액하는 것을 추천합니다.
                            </p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <h4 className="font-semibold text-slate-900 mb-2">리뷰 관리 필요</h4>
                            <p className="text-sm text-slate-700">
                                최근 3일간 평점 4점 이하의 리뷰가 표본의 5%를 차지합니다. &quot;음식이 짜다&quot;는 의견이 반복되고 있으니 주방 점검이 필요해 보입니다.
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>할 일 목록</CardTitle>
                        <CardDescription>오늘 꼭 챙겨야 할 마케팅 항목입니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                                <label className="ml-3 text-sm font-medium text-slate-700">부재중 전화 3건 콜백</label>
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                                <label className="ml-3 text-sm font-medium text-slate-700">네이버 예약 확정 처리 (2건)</label>
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" checked onChange={() => { }} />
                                <label className="ml-3 text-sm font-medium text-slate-500 line-through">신메뉴 사진 업데이트</label>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
