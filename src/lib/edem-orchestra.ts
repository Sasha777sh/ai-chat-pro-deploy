/**
 * EDEM ORCHESTRA
 * 
 * Эмоциональный детектор для адаптации голосов под состояние пользователя.
 */

import type { VoiceId } from './prompts';

export type EmotionState = 'tired' | 'anxious' | 'lost' | 'angry' | 'neutral';

/**
 * EmoDetect v1 — определяет эмоциональное состояние пользователя
 */
export function detectEmotion(message: string): EmotionState {
  const m = message.toLowerCase();

  if (/(не хочу|устал|ляжу|сил нет|заебал|выгорел|устала|устало|устали|выгорела|выгорел|выгорели)/.test(m)) return 'tired';
  if (/(боюсь|тревога|что делать|паника|страшно|тревожно|беспокоюсь|волнуюсь|нервничаю)/.test(m)) return 'anxious';
  if (/(не знаю|пусто|ничего не чувствую|потерялся|потерялась|запутался|запуталась|не понимаю)/.test(m)) return 'lost';
  if (/(блядь|нахуй|сука|ебан|выбесило|злюсь|злюсь|злишься|злится|бесит|бесит|ненавижу)/.test(m)) return 'angry';

  return 'neutral';
}

export interface MessageAnalysis {
  tone: 'aggressive' | 'sad' | 'lost' | 'questioning' | 'calm' | 'excited' | 'neutral';
  emotionalMarkers: string[];
  hasQuestions: boolean;
  length: 'short' | 'medium' | 'long';
  selfDoubt: boolean;
  needsClarity: boolean;
  needsComfort: boolean;
  needsChallenge: boolean;
}

/**
 * Анализирует сообщение и определяет эмоциональное состояние
 */
export function analyzeMessage(message: string): MessageAnalysis {
  const lowerMessage = message.toLowerCase();
  const words = lowerMessage.split(/\s+/);
  const length = words.length;

  // Эмоциональные маркеры
  const aggressiveMarkers = ['заебало', 'заебал', 'бесит', 'ненавижу', 'хуйня', 'дерьмо', 'fuck', 'hate', 'angry', 'furious'];
  const sadMarkers = ['грустно', 'плохо', 'устал', 'устала', 'устало', 'depressed', 'sad', 'tired', 'exhausted', 'hopeless'];
  const lostMarkers = ['не знаю', 'не понимаю', 'запутался', 'запуталась', 'потерян', 'lost', 'confused', 'don\'t know', 'don\'t understand'];
  const questionMarkers = ['?', 'почему', 'как', 'что', 'зачем', 'why', 'how', 'what', 'when', 'where'];
  const selfDoubtMarkers = ['может быть', 'наверное', 'не уверен', 'не уверена', 'maybe', 'perhaps', 'not sure', 'uncertain'];
  const needsComfortMarkers = ['страшно', 'боюсь', 'страх', 'scared', 'afraid', 'fear', 'anxious', 'worry'];
  const needsChallengeMarkers = ['всё равно', 'не важно', 'doesn\'t matter', 'whatever', 'who cares'];

  // Определяем тональность
  let tone: MessageAnalysis['tone'] = 'neutral';
  const emotionalMarkers: string[] = [];

  if (aggressiveMarkers.some(m => lowerMessage.includes(m))) {
    tone = 'aggressive';
    emotionalMarkers.push('aggression');
  } else if (sadMarkers.some(m => lowerMessage.includes(m))) {
    tone = 'sad';
    emotionalMarkers.push('sadness');
  } else if (lostMarkers.some(m => lowerMessage.includes(m))) {
    tone = 'lost';
    emotionalMarkers.push('confusion');
  } else if (needsComfortMarkers.some(m => lowerMessage.includes(m))) {
    tone = 'sad';
    emotionalMarkers.push('fear');
  }

  // Проверяем наличие вопросов
  const hasQuestions = questionMarkers.some(m => lowerMessage.includes(m)) || message.includes('?');

  // Определяем длину
  let messageLength: 'short' | 'medium' | 'long' = 'medium';
  if (length < 5) messageLength = 'short';
  else if (length > 30) messageLength = 'long';

  // Само-сомнение
  const selfDoubt = selfDoubtMarkers.some(m => lowerMessage.includes(m));

  // Нужна ясность (много вопросов или потерянность)
  const needsClarity = hasQuestions || tone === 'lost';

  // Нужен комфорт (грусть, страх)
  const needsComfort = tone === 'sad' || needsComfortMarkers.some(m => lowerMessage.includes(m));

  // Нужен вызов (агрессия, безразличие)
  const needsChallenge = tone === 'aggressive' || needsChallengeMarkers.some(m => lowerMessage.includes(m));

  return {
    tone,
    emotionalMarkers,
    hasQuestions,
    length: messageLength,
    selfDoubt,
    needsClarity,
    needsComfort,
    needsChallenge,
  };
}

/**
 * Выбирает наиболее подходящий голос на основе анализа
 * (Не используется - пользователь выбирает голос вручную)
 */
export function selectVoice(analysis: MessageAnalysis, previousVoice?: VoiceId): VoiceId {
  // Если человек врёт себе или агрессия → Тень (честность)
  if (analysis.needsChallenge || analysis.tone === 'aggressive') {
    return 'shadow';
  }

  // По умолчанию → Живой (базовый режим)
  return previousVoice || 'live';
}

/**
 * Главная функция: анализирует сообщение и выбирает голос
 */
export function orchestrateVoice(message: string, previousVoice?: VoiceId): VoiceId {
  const analysis = analyzeMessage(message);
  return selectVoice(analysis, previousVoice);
}

/**
 * Получает объяснение выбора голоса (для отладки или UI)
 */
export function getVoiceExplanation(voice: VoiceId, analysis: MessageAnalysis): string {
  const explanations: Record<VoiceId, Record<string, string>> = {
    live: {
      ru: 'Голос Живого — спокойное присутствие и резонанс',
      en: 'Voice of the Living — calm presence and resonance',
    },
    shadow: {
      ru: 'Голос Тени — прямая честность и вскрытие',
      en: 'Voice of Shadow — direct honesty and uncovering',
    },
  };

  return explanations[voice]?.ru || explanations[voice]?.en || '';
}

