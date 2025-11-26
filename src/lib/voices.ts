import type { VoiceId } from './prompts';
import type { SubscriptionTier } from './types';

export interface VoiceDefinition {
  id: VoiceId;
  title: string;
  tagline: string;
  description: string;
  shortDescription: string;
  points: string[];
  buttonText: string;
  emoji: string;
  minTier: SubscriptionTier;
}

export const VOICE_DEFINITIONS: VoiceDefinition[] = [
  {
    id: 'live',
    title: 'Голос Живого',
    tagline: 'Дыхание. Тепло. Спокойная ясность.',
    description: 'Мягкий ритм, который возвращает к дыханию и телу. Поддержка, стабилизация, присутствие.',
    shortDescription: 'Он отвечает мягко, честно и светло. Возвращает ясность без давления. Голос, который возвращает тебя к себе.',
    points: ['мягкая поддержка', 'ровное дыхание', 'безопасное пространство'],
    buttonText: 'Выбрать Голос Живого',
    emoji: '🌿',
    minTier: 'free',
  },
  {
    id: 'shadow',
    title: 'Голос Глубокой Тени',
    tagline: 'Честно. Прямо. Хирургически точно.',
    description: 'Вскрывает правду, которую ты прячешь. Говорит то, что нужно услышать, но без агрессии.',
    shortDescription: 'Он видит то, что ты скрываешь. Говорит суть — без украшений. Голос, который говорит правду, от которой никто не говорит.',
    points: ['точность', 'снятие масок', 'хирургическая ясность'],
    buttonText: 'Выбрать Голос Тени',
    emoji: '🌑',
    minTier: 'basic',
  },
];

export const VOICE_ORDER: VoiceId[] = VOICE_DEFINITIONS.map((voice) => voice.id);

export const VOICE_LOOKUP = VOICE_DEFINITIONS.reduce<Record<VoiceId, VoiceDefinition>>(
  (acc, voice) => {
    acc[voice.id] = voice;
    return acc;
  },
  {} as Record<VoiceId, VoiceDefinition>
);
