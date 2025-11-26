import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { VOICE_PROMPTS, getEDEMCorePrompt } from '@/lib/prompts';
import type { VoiceId } from '@/lib/prompts';
import type { PlanId } from '@/lib/plans';
import { getAllowedVoices } from '@/lib/plans';
import { FREE_MESSAGE_ALLOWANCE } from '@/lib/prompts';
import { detectEmotion } from '@/lib/edem-orchestra';
import { detectLanguage, type SupportedLanguage } from '@/lib/languageRouter';
// Оркестратор убран - используем только ручной выбор голоса

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

const openai = new OpenAI({ apiKey: openaiApiKey });

export async function POST(request: NextRequest) {
  try {
    const { sessionId, message, voiceId: requestedVoiceId, locale = 'ru' } = await request.json();

    if (!sessionId || !message) {
      return new Response(
        JSON.stringify({ error: 'sessionId и message обязательны' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Используем выбранный пользователем голос или 'live' по умолчанию
    const voiceId: VoiceId = requestedVoiceId || 'live';

    if (!isVoiceValid(voiceId)) {
      return new Response(
        JSON.stringify({ error: 'Неизвестный голос' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Не авторизован' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      console.error('Empty token');
      return new Response(
        JSON.stringify({ error: 'Токен не предоставлен' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Для проверки пользовательского токена используем anon key
    // Service role key обходит RLS и не подходит для проверки пользовательских токенов
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', {
        error: authError,
        message: authError?.message,
        tokenLength: token.length,
        tokenStart: token.substring(0, 20) + '...'
      });
      return new Response(
        JSON.stringify({
          error: authError?.message || 'Не авторизован',
          details: process.env.NODE_ENV === 'development' ? authError : undefined
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Для чтения данных используем service role key (обходит RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const subscriptionTier = (profile?.subscription_tier ?? 'free') as PlanId;
    const allowedVoices = getAllowedVoices(subscriptionTier);

    if (!allowedVoices.includes(voiceId)) {
      return new Response(
        JSON.stringify({ error: 'Этот голос недоступен на текущем тарифе. Оформите подписку.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (subscriptionTier === 'free') {
      const totalMessages = await countUserMessages(supabase, user.id);
      if (totalMessages >= FREE_MESSAGE_ALLOWANCE) {
        return new Response(
          JSON.stringify({
            error: 'Лимит ознакомительных сообщений исчерпан. Оформите подписку, чтобы продолжить.',
            code: 'PAYWALL_REQUIRED'
          }),
          { status: 402, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const { data: sessionRecord } = await supabase
      .from('chat_sessions')
      .select('user_id, voice_id')
      .eq('id', sessionId)
      .maybeSingle();

    if (!sessionRecord || sessionRecord.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Нет доступа к этой сессии' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Обновляем voice_id в сессии, если голос изменился
    if (sessionRecord.voice_id !== voiceId) {
      await supabase
        .from('chat_sessions')
        .update({ voice_id: voiceId })
        .eq('id', sessionId);
    }

    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(50);

    // Проверяем, это первое сообщение?
    const isFirstMessage = !history || history.length === 0;

    // Первое приветствие от ИИ
    const firstGreeting: string | null = isFirstMessage
      ? (locale === 'en'
        ? "I'm here.\n\nSpeak as you are — no need to be correct.\n\nI hear not only your words, but where they come from."
        : "Я здесь.\n\nГовори как есть — не надо быть правильным.\n\nЯ слышу не только то, что ты пишешь, но и то, откуда это идёт.")
      : null;

    // Определяем эмоциональное состояние для адаптации голоса
    const emotionState = detectEmotion(message);

    // Определяем язык сообщения пользователя
    const detectedLang = detectLanguage(message);
    const responseLanguage = detectedLang.detected ? detectedLang.language : (locale as SupportedLanguage);

    const corePrompt = getEDEMCorePrompt(locale as 'ru' | 'en');

    // Инструкция по языку ответа
    const languageNames: Record<SupportedLanguage, string> = {
      ru: 'русском',
      en: 'English',
      vi: 'Tiếng Việt',
      es: 'Español',
      pt: 'Português',
      fr: 'Français',
      de: 'Deutsch',
      ko: '한국어',
      ja: '日本語',
      zh: '中文',
    };

    const languageInstruction = responseLanguage === 'en'
      ? 'Respond in English.'
      : `Отвечай на ${languageNames[responseLanguage] || 'русском'} языке. Если пользователь написал на другом языке, отвечай на том же языке, на котором он обратился.`;

    const systemPrompt = `${corePrompt}

${VOICE_PROMPTS[voiceId].system}

Эмоциональное состояние пользователя: ${emotionState}

Выбери соответствующий режим из промпта выше и отвечай в этом режиме.

ВАЖНО: Отвечай на том языке, на котором пользователь обратился к тебе. Если пользователь написал на английском — отвечай на английском. Если на вьетнамском — на вьетнамском. Если на русском — на русском. И так далее для всех языков.

${languageInstruction}`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(history || []).map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Если первое сообщение, отправляем приветствие сразу
          if (firstGreeting) {
            const greetingChunks = firstGreeting.split('');
            for (const char of greetingChunks) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: char })}\n\n`));
              await new Promise(resolve => setTimeout(resolve, 20)); // Небольшая задержка для эффекта печати
            }
            // Добавляем паузу перед основным ответом
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: '\n\n' })}\n\n`));
          }

          // Параметры генерации для обоих голосов
          const temperature = 0.8;
          const maxTokens = 400;

          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: messages as any,
            temperature,
            max_tokens: maxTokens,
            stream: true,
          });

          let fullResponse = firstGreeting ? firstGreeting + '\n\n' : '';

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }

          await supabase.from('chat_messages').insert({
            session_id: sessionId,
            role: 'assistant',
            content: fullResponse,
          });

          controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (error: any) {
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ error: error.message || 'Ошибка сервера' })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Chat stream API error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Ошибка сервера' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

function isVoiceValid(voiceId: string): voiceId is VoiceId {
  return voiceId in VOICE_PROMPTS;
}

async function countUserMessages(supabase: SupabaseClient, userId: string) {
  const { data: sessions } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('user_id', userId);

  if (!sessions || sessions.length === 0) {
    return 0;
  }

  const sessionIds = sessions.map((s) => s.id);

  const { count } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .in('session_id', sessionIds)
    .eq('role', 'user');

  return count ?? 0;
}
