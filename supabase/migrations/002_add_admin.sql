-- Добавляем поле role в profiles для админ-доступа
DO $$ 
BEGIN
  -- Добавляем role если нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
END $$;

-- Создаём функцию для проверки админа
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Комментарии
COMMENT ON COLUMN public.profiles.role IS 'Роль пользователя: user или admin';

