'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    setUser(user);

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(data);
    setLoading(false);
  };

  const handleUpgrade = async (method: 'yookassa' | 'crypto') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Необходимо войти в систему');
        return;
      }

      let endpoint = '';
      if (method === 'yookassa') {
        endpoint = '/api/yookassa/checkout';
      } else {
        endpoint = '/api/crypto/checkout';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan: 'month' }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(`Ошибка: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Ошибка: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-gray-400">Загрузка...</div>
      </div>
    );
  }

  const isPro = profile?.subscription_tier === 'pro';
  const expiresAt = profile?.subscription_expires_at
    ? new Date(profile.subscription_expires_at).toLocaleDateString('ru')
    : null;

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Личный кабинет</h1>

        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 mb-8">
          <h2 className="text-2xl font-bold mb-4">Профиль</h2>
          <div className="space-y-2 text-gray-300">
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Тариф:</strong> {isPro ? 'Pro' : 'Free'}</p>
            {isPro && expiresAt && (
              <p><strong>Подписка до:</strong> {expiresAt}</p>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 mb-8">
          <h2 className="text-2xl font-bold mb-4">Тариф</h2>
          {isPro ? (
            <div>
              <p className="text-gray-300 mb-4">У вас активна подписка Pro</p>
              <div className="space-y-2 text-gray-300">
                <p>✅ 500 сообщений в месяц</p>
                <p>✅ Полная история чатов</p>
                <p>✅ Приоритетная поддержка</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-300 mb-6">Бесплатный тариф: 10 сообщений в день</p>
              <p className="text-sm text-gray-400 mb-4">Выберите способ оплаты:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleUpgrade('yookassa')}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all"
                >
                  🏦 ЮKassa (990₽/мес)
                </button>
                <button
                  onClick={() => handleUpgrade('crypto')}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all"
                >
                  ₿ Криптовалюта
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Link
            href="/chat"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            Вернуться в чат
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/');
            }}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-colors"
          >
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
}

