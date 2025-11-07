'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const msg = searchParams.get('message');
    if (msg === 'check-email') {
      setMessage('Проверьте email для подтверждения регистрации');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!password || password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      // Более понятные сообщения об ошибках
      if (error.message.includes('Invalid login credentials')) {
        setError('Неверный email или пароль. Проверьте правильность введённых данных.');
      } else if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
        setError('Email не подтверждён. Проверьте почту и перейдите по ссылке подтверждения.');
      } else {
        setError(error.message || 'Ошибка входа');
      }
      setLoading(false);
      return;
    }

    console.log('Login data:', { user: data.user?.id, session: !!data.session });

    if (data.session) {
      // Проверяем redirect параметр
      const redirect = searchParams.get('redirect');
      if (redirect) {
        router.push(redirect);
      } else {
        // Проверяем, проходил ли пользователь онбординг
        const onboardingCompleted = localStorage.getItem('onboarding_completed');
        if (onboardingCompleted === 'true') {
          router.push('/chat');
        } else {
          router.push('/welcome');
        }
      }
    } else {
      console.error('No session after login');
      setError('Не удалось создать сессию. Попробуйте ещё раз.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 border border-gray-700">
        <h1 className="text-3xl font-bold mb-6 text-center">Вход</h1>
        {message && (
          <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-200 text-sm text-center">
            {message}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
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
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-400">
          Нет аккаунта?{' '}
          <Link href="/signup" className="text-blue-400 hover:text-blue-300">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="text-gray-400">Загрузка...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}


