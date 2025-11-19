import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { VOICE_PROMPTS, getEDEMCorePrompt } from '@/lib/prompts';
import type { VoiceId } from '@/lib/prompts';
import type { PlanId } from '@/lib/plans';
import { getAllowedVoices } from '@/lib/plans';
import { FREE_MESSAGE_ALLOWANCE } from '@/lib/prompts';
import { orchestrateVoice } from '@/lib/edem-orchestra';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

const openai = new OpenAI({ apiKey: openaiApiKey });

export async function POST(request: NextRequest) {
  try {
    const { sessionId, message, voiceId: requestedVoiceId, locale = 'ru', autoSelectVoice = false } = await request.json();

    if (!sessionId || !message) {
      return new Response(
        JSON.stringify({ error: 'sessionId и message обязательны' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // EDEM ORCHESTRA: автоматический выбор голоса, если включен
    let voiceId: VoiceId = requestedVoiceId || 'live';
    
    if (autoSelectVoice || !requestedVoiceId) {
      // Получаем предыдущие сообщения для контекста
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: previousMessages } = await supabase
        .from('chat_messages')
        .select('content, role')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      const previousVoice = previousMessages?.[0]?.role === 'assistant' 
        ? (await supabase.from('chat_sessions').select('voice_id').eq('id', sessionId).single()).data?.voice_id as VoiceId | undefined
        : undefined;
      
      // Автоматически выбираем голос на основе анализа сообщения
      voiceId = orchestrateVoice(message, previousVoice);
    }

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

    if (sessionRecord.voice_id !== voiceId) {
      return new Response(
        JSON.stringify({ error: 'Сессия привязана к другому голосу' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
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

    const corePrompt = getEDEMCorePrompt(locale as 'ru' | 'en');
    const languageInstruction = locale === 'en' 
      ? 'Respond in English.' 
      : 'Отвечай на русском языке.';
    
    const systemPrompt = `${corePrompt}

${VOICE_PROMPTS[voiceId].system}

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

          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: messages as any,
            temperature: 0.8, // Увеличена для более живых ответов
            max_tokens: 400, // Увеличено для более глубоких ответов
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
