'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        redirect('/login?error=true&message=' + encodeURIComponent('로그인 실패: 아이디 또는 비밀번호를 확인해주세요.'))
    }

    revalidatePath('/dashboard', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const passwordConfirm = formData.get('password_confirm') as string
    const fullName = formData.get('full_name') as string
    const phoneNumber = formData.get('phone_number') as string
    const termsAgreed = formData.get('terms') === 'on'

    if (password !== passwordConfirm) {
        redirect('/signup?error=true&message=' + encodeURIComponent('비밀번호가 일치하지 않습니다.'))
    }

    if (!termsAgreed) {
        redirect('/signup?error=true&message=' + encodeURIComponent('회원가입 약관에 동의해주세요.'))
    }

    const data = {
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                phone_number: phoneNumber,
            }
        }
    }

    const { error } = await supabase.auth.signUp(data)

    if (error) {
        redirect('/signup?error=true&message=' + encodeURIComponent('회원가입 실패: ' + error.message))
    }

    revalidatePath('/dashboard', 'layout')
    redirect('/login?message=' + encodeURIComponent('회원가입 성공! 로그인해주세요.'))
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()

    revalidatePath('/', 'layout')
    redirect('/login')
}
