'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/contexts/LocaleContext';

export default function EnPage() {
  const { setLocale } = useLocale();
  const router = useRouter();

  useEffect(() => {
    // Устанавливаем английскую локаль
    setLocale('en');
    // Сохраняем в localStorage
    localStorage.setItem('locale', 'en');
    // Редиректим на главную
    router.replace('/');
  }, [setLocale, router]);

  return (
    <div className="min-h-screen bg-edem-dark text-edem-main flex items-center justify-center">
      <div className="text-edem-secondary">Switching to English...</div>
    </div>
  );
}

