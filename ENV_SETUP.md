# 🔐 Настройка переменных окружения

Создай файл `.env.local` в корне проекта со следующим содержимым:

```bash
# Supabase (получи на https://supabase.com)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (получи на https://platform.openai.com)
OPENAI_API_KEY=sk-your_openai_key

# Stripe (опционально, для платежей)
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Как получить ключи:

1. **Supabase:**
   - Зарегистрируйся на https://supabase.com
   - Создай проект
   - Зайди в Settings → API
   - Скопируй URL и ключи

2. **OpenAI:**
   - Зарегистрируйся на https://platform.openai.com
   - Зайди в API Keys
   - Создай новый ключ

3. **Stripe:**
   - Зарегистрируйся на https://stripe.com
   - Зайди в Developers → API keys
   - Используй test ключи для разработки

## После настройки:

1. Запусти миграции БД в Supabase SQL Editor (файл `supabase/migrations/001_init.sql`)
2. Перезапусти dev сервер: `npm run dev`

