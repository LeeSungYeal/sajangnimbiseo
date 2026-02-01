"use client";

import { useState } from "react";
import { signup } from "@/app/login/actions";
import { Mail, Lock, User, Phone, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useFormStatus } from "react-dom";

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full flex justify-center py-3 px-4 border border-slate-200 rounded-lg shadow-sm text-sm font-semibold text-[#5548F9] bg-[#F8F9FF] hover:bg-[#5548F9] hover:text-white hover:border-[#5548F9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5548F9] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
            {pending ? <Loader2 className="w-5 h-5 animate-spin" /> : "가입하기"}
        </button>
    );
}

export function SignupForm({ message, error }: { message?: string; error?: boolean }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <div className="w-full">
            {message && (
                <div
                    className={`mb-6 p-4 rounded-lg text-sm font-medium ${error
                        ? "bg-red-50 text-red-600 border border-red-100"
                        : "bg-green-50 text-green-600 border border-green-100"
                        }`}
                >
                    {message}
                </div>
            )}

            <form action={signup} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-1">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            placeholder="이메일 주소"
                            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5548F9] focus:border-transparent transition-all hover:border-[#8075FF]"
                        />
                    </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            placeholder="비밀번호"
                            className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5548F9] focus:border-transparent transition-all hover:border-[#8075FF]"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Password Confirm Field */}
                <div className="space-y-1">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Check className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            id="password_confirm"
                            name="password_confirm"
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            placeholder="비밀번호 확인"
                            className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5548F9] focus:border-transparent transition-all hover:border-[#8075FF]"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                            {showConfirmPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Name Field */}
                <div className="space-y-1">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            id="full_name"
                            name="full_name"
                            type="text"
                            required
                            placeholder="이름"
                            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5548F9] focus:border-transparent transition-all hover:border-[#8075FF]"
                        />
                    </div>
                </div>

                {/* Phone Field */}
                <div className="space-y-1">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            id="phone_number"
                            name="phone_number"
                            type="tel"
                            required
                            placeholder="휴대폰 번호"
                            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5548F9] focus:border-transparent transition-all hover:border-[#8075FF]"
                        />
                    </div>
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-center space-x-2 py-1">
                    <input
                        id="terms"
                        name="terms"
                        type="checkbox"
                        required
                        className="h-4 w-4 rounded border-slate-300 text-[#5548F9] focus:ring-[#5548F9]"
                    />
                    <label htmlFor="terms" className="text-sm text-slate-600">
                        <span className="text-[#5548F9] hover:underline cursor-pointer font-medium">서비스 이용약관</span>에 동의 합니다.
                    </label>
                </div>

                <div className="pt-2">
                    <SubmitButton />
                </div>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                <p className="text-sm text-slate-600">
                    이미 계정이 있으신가요?{" "}
                    <Link href="/login" className="font-semibold text-[#5548F9] hover:text-[#4438c9] transition-colors">
                        로그인
                    </Link>
                </p>
            </div>
        </div>
    );
}
