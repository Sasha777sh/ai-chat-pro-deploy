'use client';

import React, { useEffect, useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import OnboardingThreeSteps from '@/components/OnboardingThreeSteps';
import ChatPanel from '@/components/ChatPanel';
import TariffsCard from '@/components/TariffsCard';
import WhyDifferentBlock from '@/components/WhyDifferentBlock';
import MarketingHero from '@/components/MarketingHero';
import WhatIsWhatIsNot from '@/components/WhatIsWhatIsNot';
import FullDescription from '@/components/FullDescription';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import type { VoiceId } from '@/lib/prompts';

type Step = 'onboarding' | 'chat' | 'paywall';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  voice?: VoiceId;
}

export default function HomePage() {
  const { locale, setLocale } = useLocale();
  const router = useRouter();
  const [step, setStep] = useState<Step>('onboarding');
  const [freeMessages, setFreeMessages] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Auto-detect language from browser
  useEffect(() => {
    const userLang = navigator.language.toLowerCase();
    if (userLang.startsWith('en')) {
      setLocale('en');
    }
  }, [setLocale]);

  // Check auth and create session
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        // Create or get session for chat
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          const { data: existingSession } = await supabase
            .from('chat_sessions')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('voice_id', 'live')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (existingSession) {
            setSessionId(existingSession.id);
          } else {
            const { data: newSession } = await supabase
              .from('chat_sessions')
              .insert({
                user_id: session.user.id,
                voice_id: 'live',
              })
              .select('id')
              .single();
            if (newSession) {
              setSessionId(newSession.id);
            }
          }
        }
      }
    };
    checkAuth();
  }, []);

  const handleSend = async (voice: VoiceId, text: string): Promise<Message> => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push('/login');
      throw new Error('Требуется авторизация');
    }

    if (!sessionId) {
      throw new Error('Сессия не найдена');
    }

    setFreeMessages((n) => {
      const next = n + 1;
      if (next >= 2) {
        setTimeout(() => setStep('paywall'), 100);
      }
      return next;
    });

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      router.push('/login');
      throw new Error('Сессия не найдена');
    }

    // Проверяем, что токен есть
    if (!session.access_token) {
      console.error('No access token in session');
      router.push('/login');
      throw new Error('Токен не найден');
    }

    // Save user message
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: text,
    });

    // Call real API
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        sessionId,
        message: text,
        voiceId: voice,
        locale,
        autoSelectVoice: true, // Включаем авто-выбор голоса
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.code === 'PAYWALL_REQUIRED') {
        setStep('paywall');
        throw new Error(error.error);
      }
      throw new Error(error.error || 'Ошибка сервера');
    }

    // Read SSE stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) {
      throw new Error('Не удалось прочитать поток');
    }

    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);

        if (data === '[DONE]') {
          await supabase.from('chat_messages').insert({
            session_id: sessionId,
            role: 'assistant',
            content: fullResponse,
          });
          break;
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed.content) {
            fullResponse += parsed.content;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }

    return {
      id: Date.now().toString(),
      role: 'assistant',
      text: fullResponse,
      voice,
    };
  };

  const handleLimitReached = () => {
    setStep('paywall');
  };

  const handleChoosePlan = async (planId: string) => {
    if (planId === 'free') return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('/api/yookassa/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(locale === 'ru' ? `Ошибка: ${error.error}` : `Error: ${error.error}`);
        return;
      }

      const { paymentUrl } = await response.json();
      if (paymentUrl) {
        window.location.href = paymentUrl;
      }
    } catch (error: any) {
      alert(locale === 'ru' ? `Ошибка: ${error.message}` : `Error: ${error.message}`);
    }
  };

  return (
    <main className="min-h-screen bg-edem-dark text-edem-main">
      {/* Language Switcher */}
      <div className="flex justify-end p-4 sticky top-0 z-20 bg-edem-dark/80 backdrop-blur-sm">
        <LanguageSwitcher />
      </div>

      {/* Onboarding */}
      {step === 'onboarding' && (
        <OnboardingThreeSteps lang={locale} onFinish={() => setStep('chat')} />
      )}

      {/* Chat */}
      {step === 'chat' && (
        <ChatPanel
          lang={locale}
          onSend={handleSend}
          freeMessagesCount={freeMessages}
          freeMessagesLimit={2}
          onLimitReached={handleLimitReached}
        />
      )}

      {/* Paywall */}
      {step === 'paywall' && (
        <div className="py-12">
          <TariffsCard lang={locale} onChoose={handleChoosePlan} />
        </div>
      )}

      {/* Marketing Blocks - показываем на paywall */}
      {step === 'paywall' && (
        <>
          <MarketingHero lang={locale} />
          <WhatIsWhatIsNot lang={locale} />
          <FullDescription lang={locale} />
        </>
      )}

      {/* Why Different Block - показываем после онбординга или на paywall */}
      {(step === 'paywall' || step === 'chat') && (
        <WhyDifferentBlock lang={locale} />
      )}
    </main>
  );
}
