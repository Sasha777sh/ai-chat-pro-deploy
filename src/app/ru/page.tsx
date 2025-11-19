'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/contexts/LocaleContext';

export default function RuPage() {
  const { setLocale } = useLocale();
  const router = useRouter();

  useEffect(() => {
    // Устанавливаем русскую локаль
    setLocale('ru');
    // Сохраняем в localStorage
    localStorage.setItem('locale', 'ru');
    // Редиректим на главную
    router.replace('/');
  }, [setLocale, router]);

  return (
    <div className="min-h-screen bg-edem-dark text-edem-main flex items-center justify-center">
      <div className="text-edem-secondary">Переключение на русский...</div>
    </div>
  );
}

