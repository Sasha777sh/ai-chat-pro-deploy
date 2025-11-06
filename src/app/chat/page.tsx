'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);
    await createOrGetSession();
  };

  const createOrGetSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Проверяем, есть ли активная сессия сегодня
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
      // Создаём новую сессию
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
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !sessionId) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = input;
    setInput('');
    setLoading(true);

    // Сохраняем сообщение пользователя
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: messageText,
    });

    try {
      // Получаем токен для API
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Сессия не найдена');
      }

      const response = await fetch('/api/chat', {
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

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Сохраняем ответ ИИ
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        role: 'assistant',
        content: data.message,
      });
    } catch (error: any) {
      alert(`Ошибка: ${error.message}`);
      // Удаляем последнее сообщение пользователя при ошибке
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">AI Chat Pro</h1>
          <div className="flex gap-4 items-center">
            <Link
              href="/account"
              className="text-sm text-gray-300 hover:text-white"
            >
              Кабинет
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/');
              }}
              className="text-sm text-gray-300 hover:text-white"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-16">
              <p className="text-xl mb-2">Начните разговор с ИИ</p>
              <p className="text-sm">ИИ помнит всю историю ваших бесед</p>
            </div>
          )}

          {messages.map((msg) => (
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
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-2xl px-6 py-4 border border-gray-700">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
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
