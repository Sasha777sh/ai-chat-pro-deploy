'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function DemoPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userMessagesCount, setUserMessagesCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const DEMO_LIMIT = 2; // 2 сообщения пользователя

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || userMessagesCount >= DEMO_LIMIT) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Добавляем сообщение пользователя
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setUserMessagesCount((prev) => prev + 1);

    try {
      const response = await fetch('/api/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Ошибка: ${data.error}` },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.response || 'Нет ответа' },
        ]);
      }
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Ошибка соединения. Попробуйте позже.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-800 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">EDEM Intelligence — Демо</h1>
          <div className="flex gap-3">
            <Link
              href="/signup"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
            >
              Зарегистрироваться
            </Link>
            <Link
              href="/"
              className="px-4 py-2 border border-gray-600 hover:border-gray-400 text-gray-300 rounded-lg transition-colors"
            >
              На главную
            </Link>
          </div>
        </div>
      </div>

      {/* Demo Banner */}
      <div className="bg-yellow-900/30 border-b border-yellow-800/50">
        <div className="max-w-4xl mx-auto px-4 py-3 text-center">
          <p className="text-yellow-200 text-sm">
            ⚡ Демо-режим: {DEMO_LIMIT} сообщения для знакомства ({userMessagesCount}/{DEMO_LIMIT} использовано). Для полного доступа —{' '}
            <Link href="/signup" className="underline font-semibold">
              зарегистрируйся
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 min-h-[500px] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 py-12">
                <p className="text-lg mb-2">Добро пожаловать в демо EDEM Intelligence</p>
                <p className="text-sm">
                  Напиши что-нибудь — и почувствуй, как он отвечает.
                </p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-700 p-4">
            {userMessagesCount >= DEMO_LIMIT ? (
              <div className="text-center py-4">
                <p className="text-gray-400 mb-4">
                  Демо завершено ({DEMO_LIMIT}/{DEMO_LIMIT} сообщений). Зарегистрируйся для продолжения общения.
                </p>
                <Link
                  href="/signup"
                  className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
                >
                  Зарегистрироваться и продолжить
                </Link>
              </div>
            ) : (
              <div className="flex gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Напиши что-нибудь... (${userMessagesCount}/${DEMO_LIMIT})`}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                  rows={2}
                  disabled={loading || userMessagesCount >= DEMO_LIMIT}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading || userMessagesCount >= DEMO_LIMIT}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-xl transition-colors"
                >
                  Отправить
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>
            После регистрации получишь 10 сообщений в день бесплатно или{' '}
            <Link href="/account" className="text-blue-400 hover:underline">
              обнови до Pro
            </Link>
            {' '}для 500 сообщений в месяц.
          </p>
        </div>
      </div>
    </div>
  );
}

