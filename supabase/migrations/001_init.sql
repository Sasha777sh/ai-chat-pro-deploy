-- Безопасная миграция - сохраняет существующие данные
-- Создание/обновление таблицы profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Добавляем новые поля если таблица уже существует
DO $$ 
BEGIN
  -- Добавляем subscription_tier если нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'subscription_tier') THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free';
  END IF;
  
  -- Добавляем subscription_expires_at если нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'subscription_expires_at') THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_expires_at TIMESTAMPTZ;
  END IF;
  
  -- Обновляем subscription на subscription_tier если есть старое поле
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'subscription')
     AND EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'subscription_tier') THEN
    UPDATE public.profiles 
    SET subscription_tier = CASE 
      WHEN subscription = 'free' THEN 'free'
      WHEN subscription = 'pro' THEN 'pro'
      ELSE 'free'
    END
    WHERE subscription_tier IS NULL OR subscription_tier = 'free';
  END IF;
END $$;

-- Добавляем constraint если нет
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_subscription_tier_check'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_subscription_tier_check 
    CHECK (subscription_tier IN ('free', 'pro'));
  END IF;
END $$;

-- Создание таблицы chat_sessions
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Новый разговор',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Создание таблицы chat_messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'ai')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если есть (для пересоздания)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can view own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can create own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can read own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON public.sessions;

-- Политики для profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Политики для chat_sessions
CREATE POLICY "Users can view own sessions"
  ON public.chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON public.chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.chat_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Политики для chat_messages
CREATE POLICY "Users can view own messages"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- Функция для автоматического создания профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, subscription_tier)
  VALUES (NEW.id, NEW.email, 'free')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для автоматического создания профиля
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
