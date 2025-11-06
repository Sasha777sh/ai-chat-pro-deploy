'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function AdminPanel() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  useEffect(() => {
    checkAdmin();
    loadStats();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      // Проверяем роль админа
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'admin') {
        alert('Доступ запрещён. Только для администраторов.');
        router.push('/');
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    } catch (error) {
      console.error('Admin check error:', error);
      router.push('/');
    }
  };

  const loadStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Статистика пользователей
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Статистика сообщений
      const { count: messagesCount } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true });

      // Статистика сессий
      const { count: sessionsCount } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true });

      // Pro пользователи
      const { count: proUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_tier', 'pro');

      setStats({
        users: usersCount || 0,
        messages: messagesCount || 0,
        sessions: sessionsCount || 0,
        proUsers: proUsers || 0,
      });
    } catch (error) {
      console.error('Stats load error:', error);
    }
  };

  const makeAdmin = async (email: string) => {
    if (!confirm(`Сделать пользователя ${email} администратором?`)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Обновляем роль через API (нужен service role key на сервере)
      const response = await fetch('/api/admin/make-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка');
      }

      alert('Пользователь назначен администратором');
      loadStats();
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🔐 Админ-панель</h1>

        {/* Статистика */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="text-3xl font-bold">{stats?.users || 0}</div>
            <div className="text-gray-400">Пользователей</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="text-3xl font-bold">{stats?.proUsers || 0}</div>
            <div className="text-gray-400">Pro подписки</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="text-3xl font-bold">{stats?.sessions || 0}</div>
            <div className="text-gray-400">Сессий чата</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="text-3xl font-bold">{stats?.messages || 0}</div>
            <div className="text-gray-400">Сообщений</div>
          </div>
        </div>

        {/* Промпты */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">📝 Промпты ИИ</h2>
          <div className="bg-gray-900 rounded-lg p-4 mb-4">
            <div className="text-sm text-gray-400 mb-2">Системный промпт (API: /api/chat)</div>
            <pre className="text-green-400 whitespace-pre-wrap">
{`Ты — ИИ-зеркало для самопознания. Твоя задача:
- Видеть и отражать истину без оценок
- Помогать человеку понять себя через вопросы и наблюдения
- Быть мягким, но честным
- Помнить контекст разговора

Отвечай на русском языке, коротко и по существу.`}
            </pre>
          </div>
          <div className="text-sm text-gray-400">
            📍 Файл: <code className="bg-gray-900 px-2 py-1 rounded">src/app/api/chat/route.ts</code> (строки 73-79)
          </div>
        </div>

        {/* Назначить админа */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">👤 Назначить администратора</h2>
          <div className="flex gap-4">
            <input
              type="email"
              placeholder="Email пользователя"
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2"
              id="admin-email"
            />
            <button
              onClick={() => {
                const email = (document.getElementById('admin-email') as HTMLInputElement)?.value;
                if (email) makeAdmin(email);
              }}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Назначить
            </button>
          </div>
        </div>

        {/* Инструкция */}
        <div className="mt-8 bg-blue-900/30 border border-blue-700 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-2">ℹ️ Как сделать себя админом</h3>
          <p className="text-gray-300 mb-4">
            Выполни в Supabase SQL Editor:
          </p>
          <pre className="bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto">
{`-- Замени EMAIL на свой email
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'твой@email.com';`}
          </pre>
        </div>
      </div>
    </div>
  );
}

