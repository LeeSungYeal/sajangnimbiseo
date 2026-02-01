import { SignupForm } from "@/components/auth/signup-form";
import { Logo } from "@/components/logo";

export default async function SignupPage(props: {
    searchParams: Promise<{ message: string; error?: string }>;
}) {
    const searchParams = await props.searchParams;

    return (
        <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-[#F8F9FF] font-sans">

            {/* Logo Top Left */}
            <div className="absolute top-6 left-6 md:top-10 md:left-10 z-50">
                <Logo />
            </div>

            {/* Background Decorative Elements (Visily Style) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none bg-[#F4F6FC]">
                {/* Base Gradient */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#F8F9FF] via-[#F3F5FF] to-[#EBEFFF]"></div>

                {/* SVG Curves matching the reference images */}
                <svg className="absolute w-full h-full top-0 left-0" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1920 1080">
                    <defs>
                        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: 'white', stopOpacity: 0.4 }} />
                            <stop offset="100%" style={{ stopColor: 'white', stopOpacity: 0 }} />
                        </linearGradient>
                    </defs>

                    {/* Top Right large gentle curves */}
                    <circle cx="1600" cy="-200" r="600" fill="none" stroke="white" strokeWidth="2" opacity="0.4" />
                    <circle cx="1600" cy="-200" r="800" fill="none" stroke="white" strokeWidth="2" opacity="0.3" />
                    <circle cx="1600" cy="-200" r="1000" fill="url(#grad1)" opacity="0.1" />

                    {/* Bottom Center sweeping curves */}
                    <path d="M0 1080 Q 960 540 1920 1080" stroke="white" strokeWidth="3" fill="none" opacity="0.5" />
                    <path d="M-200 1200 Q 960 400 2120 1200" stroke="white" strokeWidth="2" fill="none" opacity="0.3" />

                    {/* Top Left subtle arc */}
                    <path d="M-100 -100 Q 400 400 900 -100" stroke="white" strokeWidth="2" fill="none" opacity="0.3" />

                    {/* Center highlight blob */}
                    <circle cx="960" cy="540" r="500" fill="url(#grad1)" opacity="0.2" filter="url(#blur)" />

                    <filter id="blur">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="60" />
                    </filter>
                </svg>
            </div>

            <div className="w-full max-w-[440px] relative z-10 px-4 py-10">
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-slate-100/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center mb-6">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">회원가입</h1>
                        <p className="mt-2 text-sm text-slate-500">사장님비서 서비스 이용을 위해 가입해주세요.</p>
                    </div>

                    <SignupForm
                        message={searchParams?.message}
                        error={searchParams?.error === "true"}
                    />
                </div>

                {/* Footer simple text */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-400">
                        © 2026 Sajangnim Biseo. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
