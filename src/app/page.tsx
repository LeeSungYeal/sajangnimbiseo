"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { IntroAnimation } from "@/components/intro-animation";
import { Logo } from "@/components/logo";
import { ArrowRight, BarChart2, MessageSquare, Zap } from "lucide-react";

export default function LandingPage() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Intro Animation */}
      {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} />}

      {/* Main Content - hidden while intro is playing? Or just overlay? 
          Overlay is better so content is ready underneath. */}

      {!showIntro && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
            <div className="w-full px-6 h-16 flex items-center justify-between">
              <Logo />
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="text-sm font-bold text-slate-900 px-5 py-2 rounded-lg border border-transparent hover:border-[#5548F9] hover:text-[#5548F9] transition-all"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-bold bg-white text-slate-900 px-5 py-2 rounded-lg border border-slate-300 transition-all hover:bg-[#5548F9] hover:text-white hover:border-[#5548F9]"
                >
                  회원가입
                </Link>
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <section className="pt-32 pb-20 px-6">
            <div className="container mx-auto text-center max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mb-6 border border-blue-100">
                  <Zap className="w-3 h-3" />
                  <span>AI 기반 마케팅 자동화</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
                  사장님의 아이디어가 <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
                    매출이 되는 순간
                  </span>
                </h1>
                <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                  흩어진 데이터를 모으고, AI가 분석하여, <br className="hidden md:block" />
                  매출 상승을 위한 최적의 액션을 24시간 제안합니다.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/signup"
                    className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-slate-900 px-8 font-medium text-white transition-all duration-300 hover:bg-slate-800 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                  >
                    <span className="mr-2">회원가입하기</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-white border border-slate-200 px-8 font-medium text-slate-700 transition-all duration-300 hover:bg-slate-50 hover:border-slate-300"
                  >
                    데모 보기
                  </Link>
                </div>
              </motion.div>

              {/* Hero Image / Dashboard Preview */}
              <motion.div
                className="mt-16 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden bg-slate-50"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
              >
                <div className="aspect-[16/9] w-full bg-slate-100 relative items-center justify-center flex text-slate-400">
                  {/* Placeholder for Dashboard Screenshot */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-white flex flex-col items-center justify-center">
                    <BarChart2 className="w-16 h-16 text-slate-300 mb-4" />
                    <p>대시보드 미리보기 화면</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-24 bg-slate-50">
            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">데이터 분석부터 실행까지 한번에</h2>
                <p className="text-slate-600">복잡한 마케팅 툴은 이제 그만. 사장님비서 하나로 충분합니다.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-6">
                    <BarChart2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">실시간 데이터 통합</h3>
                  <p className="text-slate-600">네이버 플레이스, 전화, 예약 데이터를 한곳에 모아 실시간으로 시각화합니다.</p>
                </div>
                {/* Feature 2 */}
                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600 mb-6">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">AI 마케팅 인사이트</h3>
                  <p className="text-slate-600">"왜 매출이 떨어졌지?" AI가 원인을 분석하고 구체적인 해결책을 제안합니다.</p>
                </div>
                {/* Feature 3 */}
                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mb-6">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">자동화 리포트</h3>
                  <p className="text-slate-600">매주 월요일 아침, 지난주의 성과와 이번 주의 목표를 정리해서 보내드립니다.</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-24">
            <div className="container mx-auto px-6">
              <div className="bg-slate-900 rounded-3xl p-12 text-center text-white relative overflow-hidden">
                {/* Background decorative blobs */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

                <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10">지금 바로 시작해보세요</h2>
                <p className="text-slate-300 mb-10 max-w-2xl mx-auto relative z-10">
                  가입비, 설치비 없이 14일 동안 모든 기능을 무료로 체험하실 수 있습니다.
                </p>
                <Link
                  href="/signup"
                  className="relative z-10 inline-flex h-12 items-center justify-center rounded-full bg-white text-slate-900 px-8 font-bold hover:bg-slate-100 transition-colors"
                >
                  회원가입
                </Link>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-white border-t border-slate-100 py-12">
            <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
              <Logo className="mb-4 md:mb-0" />
              <p className="text-slate-500 text-sm">
                © 2026 Sajangnim Biseo. All rights reserved.
              </p>
            </div>
          </footer>
        </motion.div>
      )}
    </div>
  );
}
