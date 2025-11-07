'use client';

import { useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Пароль должен быть не менее 8 символов';
    }
    if (!/[A-Za-z]/.test(pwd)) {
      return 'Пароль должен содержать хотя бы одну букву';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Пароль должен содержать хотя бы одну цифру';
    }
    return null;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Валидация пароля
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    // Проверка совпадения паролей
    if (password !== passwordConfirm) {
      setError('Пароли не совпадают');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        // Отключаем email confirmation для автоматического входа (если не требуется)
        // Если в Supabase включено подтверждение, это не сработает
      },
    });

    if (error) {
      console.error('Signup error:', error);
      setError(error.message);
      setLoading(false);
      return;
    }

    console.log('Signup data:', { user: data.user?.id, session: !!data.session });

    // Проверяем, требуется ли подтверждение email
    if (data.user && !data.session) {
      // Email confirmation required
      console.log('Email confirmation required');
      setSuccess(true);
      setError('');
      // Показываем сообщение о необходимости подтверждения
      setTimeout(() => {
        router.push('/login?message=check-email');
      }, 3000);
      setLoading(false);
      return;
    }

    // Если есть session, ждём немного чтобы cookies установились
    if (data.session) {
      console.log('Auto-login successful, waiting for session to be set...');
      setSuccess(true);
      
      // Ждём немного, чтобы Supabase установил cookies
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Проверяем, что сессия действительно установлена
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        console.log('Session confirmed, redirecting to welcome');
        // Проверяем, проходил ли пользователь онбординг
        const onboardingCompleted = localStorage.getItem('onboarding_completed');
        if (onboardingCompleted === 'true') {
          router.push('/chat');
        } else {
          router.push('/welcome');
        }
      } else {
        console.error('Session not found after signup, redirecting to login');
        setError('Сессия не установлена. Попробуйте войти вручную.');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
      setLoading(false);
      return;
    }

    // Неожиданная ситуация
    console.error('Unexpected signup result:', data);
    setError('Произошла ошибка при регистрации. Попробуйте войти вручную.');
    setTimeout(() => {
      router.push('/login');
    }, 2000);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 border border-gray-700 text-center">
          <h1 className="text-2xl font-bold mb-4">✅ Регистрация успешна!</h1>
          <p className="text-gray-400">Перенаправляем в чат...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 border border-gray-700">
        <h1 className="text-3xl font-bold mb-6 text-center">Регистрация</h1>
        {plan === 'pro' && (
          <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-200 text-sm text-center">
            Вы выбрали тариф Pro. После регистрации перейдёте к оплате.
          </div>
        )}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Минимум 8 символов, буквы и цифры"
            />
            <p className="text-xs text-gray-500 mt-1">
              Минимум 8 символов, должна быть хотя бы одна буква и одна цифра
            </p>
          </div>
          <div>
            <label className="block text-sm mb-2">Подтвердите пароль</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-400">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="text-gray-400">Загрузка...</div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}


