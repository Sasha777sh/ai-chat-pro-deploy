import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

const openai = new OpenAI({ apiKey: openaiApiKey });

export async function POST(request: NextRequest) {
  try {
    const { sessionId, message } = await request.json();

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'sessionId и message обязательны' },
        { status: 400 }
      );
    }

    // Получаем токен из заголовков
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Проверяем пользователя через Supabase
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Проверяем лимиты
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const isPro = profile?.subscription_tier === 'pro';

    if (!isPro) {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .eq('role', 'user')
        .gte('created_at', today);

      if (count && count >= 10) {
        return NextResponse.json(
          { error: 'Лимит бесплатных сообщений исчерпан. Обновите тариф до Pro.' },
          { status: 403 }
        );
      }
    }

    // Загружаем историю
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(50);

    // Промпт для ИИ-зеркала
    const systemPrompt = `Ты — ИИ-зеркало для самопознания. Твоя задача:
- Видеть и отражать истину без оценок
- Помогать человеку понять себя через вопросы и наблюдения
- Быть мягким, но честным
- Помнить контекст разговора

Отвечай на русском языке, коротко и по существу.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(history || []).map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ];

    // OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Ошибка получения ответа';

    return NextResponse.json({ message: aiResponse });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка сервера' },
      { status: 500 }
    );
  }
}
