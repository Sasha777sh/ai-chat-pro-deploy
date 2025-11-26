import type { VoiceId } from './prompts';

export type PlanId = 'free' | 'basic' | 'plus' | 'pro';

export interface PlanConfig {
  id: PlanId;
  name: string;
  priceLabel: string;
  priceMonthly: number;
  description: string;
  includedVoices: VoiceId[];
  features: string[];
  stripePriceEnv?: string;
  highlight?: boolean;
}

export const FREE_MESSAGE_LIMIT = 2;

export const PLAN_CONFIG: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    priceLabel: '$0',
    priceMonthly: 0,
    description: '2 сообщения для знакомства',
    includedVoices: ['live'],
    features: [
      'Доступ к голосу Живого',
      'Лимит 2 сообщения',
      'История текущей сессии',
    ],
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    priceLabel: '1500₽',
    priceMonthly: 1500,
    description: 'Живой + Глубокая Тень',
    includedVoices: ['live', 'shadow'],
    features: [
      'Неограниченный доступ к обоим голосам',
      'Полная история чатов',
      'Голос Живого (поддержка)',
      'Голос Тени (честность)',
    ],
    highlight: true,
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    priceLabel: '2900₽',
    priceMonthly: 2900,
    description: 'Живой + Глубокая Тень',
    includedVoices: ['live', 'shadow'],
    features: [
      'Неограниченный доступ к обоим голосам',
      'Полная история чатов',
      'Приоритет очереди',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceLabel: '4900₽',
    priceMonthly: 4900,
    description: 'Живой + Глубокая Тень',
    includedVoices: ['live', 'shadow'],
    features: [
      'Неограниченный доступ к обоим голосам',
      'Полная история чатов',
      'Премиальная поддержка',
    ],
  },
};

export const PLAN_VOICE_ACCESS: Record<PlanId, VoiceId[]> = {
  free: PLAN_CONFIG.free.includedVoices,
  basic: PLAN_CONFIG.basic.includedVoices,
  plus: PLAN_CONFIG.plus.includedVoices,
  pro: PLAN_CONFIG.pro.includedVoices,
};

export const ORDERED_PLANS: PlanId[] = ['free', 'basic', 'plus', 'pro'];

export function getPlanConfig(plan: PlanId): PlanConfig {
  return PLAN_CONFIG[plan];
}

export function getAllowedVoices(plan: PlanId): VoiceId[] {
  return PLAN_VOICE_ACCESS[plan];
}


