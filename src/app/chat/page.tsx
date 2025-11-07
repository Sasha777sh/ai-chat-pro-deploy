'use client';

import { useState, useEffect, useRef, useOptimistic } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import type { ChatMessage } from '@/lib/types';

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Optimistic updates для мгновенного отображения сообщений
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: ChatMessage) => [...state, newMessage]
  );

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (sessionId) {
      loadMessages();
    }
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [optimisticMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkAuth = async () => {
    // Проверяем сессию сначала
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Если нет сессии, проверяем пользователя
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No session and no user, redirecting to login');
        router.push('/login');
        return;
      }
      // Если есть user но нет session, пытаемся обновить
      console.log('User exists but no session, refreshing...');
      await supabase.auth.refreshSession();
    }

    // Проверяем пользователя
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No user after session check, redirecting to login');
      router.push('/login');
      return;
    }

    console.log('Auth check passed, user:', user.id);
    setUser(user);
    await createOrGetSession();
  };

  const createOrGetSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      setSessionId(existing.id);
    } else {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title: 'Новый разговор',
        })
        .select()
        .single();

      if (data) {
        setSessionId(data.id);
      } else if (error) {
        toast.error('Ошибка создания сессии');
      }
    }
  };

  const loadMessages = async () => {
    if (!sessionId) return;

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
    } else if (error) {
      toast.error('Ошибка загрузки сообщений');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !sessionId) return;

    const messageText = input.trim();
    setInput('');
    setLoading(true);

    // Optimistic update - показываем сообщение пользователя сразу
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    };

    const assistantMessageId = crypto.randomUUID();
    addOptimisticMessage(userMessage);

    // Сохраняем сообщение пользователя
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: messageText,
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Сессия не найдена');
      }

      // Используем streaming API
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sessionId,
          message: messageText,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка сервера');
      }

      // Читаем stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('Не удалось получить stream');
      }

      let fullResponse = '';
      let hasError = false;
      
      // Создаём временное сообщение для streaming
      const tempMessage: ChatMessage = {
        id: assistantMessageId,
        session_id: sessionId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
      };

      addOptimisticMessage(tempMessage);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // Сохраняем полный ответ
              await supabase.from('chat_messages').insert({
                session_id: sessionId,
                role: 'assistant',
                content: fullResponse,
              });

              // Обновляем сообщение с полным ответом
              setMessages((prev) => {
                const updated = [...prev];
                const index = updated.findIndex(m => m.id === assistantMessageId);
                if (index !== -1) {
                  updated[index] = {
                    ...updated[index],
                    content: fullResponse,
                  };
                }
                return updated;
              });
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullResponse += parsed.content;
                
                // Обновляем сообщение по мере получения данных
                setMessages((prev) => {
                  const updated = [...prev];
                  const index = updated.findIndex(m => m.id === assistantMessageId);
                  if (index !== -1) {
                    updated[index] = {
                      ...updated[index],
                      content: fullResponse,
                    };
                  } else {
                    // Если сообщения нет, добавляем
                    updated.push({
                      id: assistantMessageId,
                      session_id: sessionId,
                      role: 'assistant',
                      content: fullResponse,
                      created_at: new Date().toISOString(),
                    });
                  }
                  return updated;
                });
              } else if (parsed.error) {
                hasError = true;
                throw new Error(parsed.error);
              }
            } catch (e) {
              // Игнорируем ошибки парсинга
            }
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      toast.error(`Ошибка: ${errorMessage}`);
      
      // Удаляем optimistic сообщения при ошибке
      setMessages((prev) => {
        const filtered = prev.filter(m => m.id !== userMessage.id);
        // Удаляем assistant message если оно было создано
        return filtered.filter(m => !(m.id === assistantMessageId && m.content === ''));
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">EDEM Intelligence</h1>
          <div className="flex gap-4 items-center">
            <Link
              href="/account"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Кабинет
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/');
              }}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {optimisticMessages.length === 0 && (
            <div className="text-center text-gray-400 mt-16">
              <p className="text-xl mb-2">Начните разговор с EDEM</p>
              <p className="text-sm">Он помнит всю историю ваших бесед</p>
            </div>
          )}

          {optimisticMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100 border border-gray-700'
                }`}
              >
                <p className="whitespace-pre-wrap">
                  {msg.content || (
                    <span className="text-gray-500 italic">Думает...</span>
                  )}
                </p>
              </div>
            </div>
          ))}

          {loading && optimisticMessages[optimisticMessages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-2xl px-6 py-4 border border-gray-700">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <footer className="bg-gray-800 border-t border-gray-700 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Напишите сообщение..."
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
            >
              Отправить
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}
