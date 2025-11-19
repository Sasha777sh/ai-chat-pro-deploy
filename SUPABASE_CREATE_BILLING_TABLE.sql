-- ============================================
-- Быстрое создание таблицы billing_subscriptions
-- ============================================
-- Выполни этот SQL в Supabase SQL Editor
-- Если таблица уже есть - ничего не сломается (IF NOT EXISTS)
-- ============================================

-- Создание таблицы billing_subscriptions
CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('basic', 'plus', 'pro')),
  status TEXT NOT NULL DEFAULT 'inactive',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  yookassa_payment_id TEXT,
  crypto_payment_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Уникальный индекс на user_id (один пользователь = одна активная подписка)
CREATE UNIQUE INDEX IF NOT EXISTS billing_subscriptions_user_id_idx
ON public.billing_subscriptions(user_id);

-- Включаем Row Level Security (RLS)
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если есть (безопасно)
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.billing_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.billing_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.billing_subscriptions;

-- Политики RLS: пользователи видят только свои подписки
CREATE POLICY "Users can view own subscriptions"
  ON public.billing_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON public.billing_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON public.billing_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS set_billing_subscription_updated_at ON public.billing_subscriptions;
CREATE TRIGGER set_billing_subscription_updated_at
  BEFORE UPDATE ON public.billing_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- ГОТОВО!
-- ============================================
-- Проверь результат:
-- 1. Открой Table Editor
-- 2. Найди таблицу billing_subscriptions
-- 3. Проверь структуру (должны быть все колонки)
-- ============================================

