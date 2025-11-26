'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { VoiceId } from '@/lib/prompts';
import { VOICE_DEFINITIONS } from '@/lib/voices';
import type { Locale } from '@/lib/i18n';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  voice?: VoiceId;
}

interface ChatPanelProps {
  lang: Locale;
  onSend: (voice: VoiceId, text: string) => Promise<Message>;
  freeMessagesCount?: number;
  freeMessagesLimit?: number;
  onLimitReached?: () => void;
}

export default function ChatPanel({
  lang,
  onSend,
  freeMessagesCount = 0,
  freeMessagesLimit = 2,
  onLimitReached,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>('live');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const texts = {
    ru: {
      placeholder: 'Напиши сообщение...',
      send: 'Отправить',
      chooseVoice: 'Выбери голос',
      messagesLeft: 'Осталось {count} бесплатных сообщений',
      limitReached: 'Бесплатный лимит исчерпан',
      upgrade: 'Оформить подписку',
    },
    en: {
      placeholder: 'Type a message...',
      send: 'Send',
      chooseVoice: 'Choose voice',
      messagesLeft: '{count} free messages left',
      limitReached: 'Free limit reached',
      upgrade: 'Subscribe',
    },
  };

  const content = texts[lang];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    if (freeMessagesCount >= freeMessagesLimit) {
      onLimitReached?.();
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await onSend(selectedVoice, input);
      setMessages((prev) => [...prev, response]);
    } catch (error) {
      console.error('Send error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = freeMessagesCount < freeMessagesLimit && !loading && input.trim();

  return (
    <div className="min-h-screen flex flex-col bg-edem-dark">
      {/* Voice Selector */}
      <div className="border-b border-edem-line bg-edem-secondary-bg/50 backdrop-blur-sm sticky top-0 z-10 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold text-edem-main mb-3">{content.chooseVoice}</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {VOICE_DEFINITIONS.map((voice) => (
              <button
                key={voice.id}
                onClick={() => setSelectedVoice(voice.id as VoiceId)}
                className={`px-4 py-2 rounded-xl border transition-all whitespace-nowrap ${
                  selectedVoice === voice.id
                    ? 'border-edem-live bg-edem-live/10 text-edem-main'
                    : 'border-edem-line bg-edem-surface text-edem-secondary hover:border-edem-muted'
                }`}
              >
                <span className="text-lg mr-2">{voice.emoji}</span>
                <span className="text-sm font-medium">{voice.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-edem-secondary py-12">
              <p className="text-lg mb-2 text-glow-edem">
                {lang === 'ru' ? 'Добро пожаловать в EDEM Intelligence' : 'Welcome to EDEM Intelligence'}
              </p>
              <p className="text-sm text-edem-muted">
                {lang === 'ru'
                  ? 'Напиши что-нибудь — и почувствуй, как он отвечает.'
                  : 'Write something — and feel how it responds.'}
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 inner-shadow-edem ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-edem-surface to-edem-secondary-bg text-edem-main'
                    : 'card-edem text-edem-main'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="card-edem px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-edem-live rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-edem-live rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-edem-live rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-edem-line bg-edem-secondary-bg/50 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {freeMessagesCount >= freeMessagesLimit ? (
            <div className="text-center py-4">
              <p className="text-edem-secondary mb-4">{content.limitReached}</p>
              <button
                onClick={onLimitReached}
                className="px-6 py-3 bg-edem-live hover:bg-edem-live/80 text-white font-semibold rounded-xl transition-colors"
              >
                {content.upgrade}
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={content.placeholder}
                  className="w-full bg-edem-surface border border-edem-line rounded-xl px-4 py-3 text-edem-main placeholder:text-edem-muted focus:outline-none focus:border-edem-live resize-none"
                  rows={2}
                  disabled={loading}
                />
                <div className="absolute bottom-2 right-2 text-xs text-edem-muted">
                  {content.messagesLeft.replace('{count}', String(freeMessagesLimit - freeMessagesCount))}
                </div>
              </div>
              <button
                onClick={handleSend}
                disabled={!canSend}
                className="px-6 py-3 bg-edem-live hover:bg-edem-live/80 disabled:bg-edem-surface disabled:text-edem-muted text-white font-semibold rounded-xl transition-colors"
              >
                {content.send}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

