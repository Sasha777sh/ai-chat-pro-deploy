# 🚀 Инструкция по деплою AI Chat Pro

## 📋 Подготовка к деплою

### 1. GitHub репозиторий

```bash
cd /Users/sanecek/tema/ai-chat-pro
git init
git add .
git commit -m "Initial commit: AI Chat Pro with all payment methods"
# Создай репозиторий на GitHub и подключи:
# git remote add origin https://github.com/yourusername/ai-chat-pro.git
# git push -u origin main
```

### 2. Vercel деплой

1. Иди на https://vercel.com
2. Нажми **"Add New Project"**
3. Импортируй репозиторий из GitHub
4. Настрой проект:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (или оставь пустым)
   - **Build Command:** `npm run build` (по умолчанию)
   - **Output Directory:** `.next` (по умолчанию)

### 3. Переменные окружения в Vercel

Добавь в **Settings → Environment Variables**:

#### Обязательные:
```
NEXT_PUBLIC_SUPABASE_URL=https://jgnnrdrqzcwnhuuvhlfo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=твой_anon_key
SUPABASE_SERVICE_ROLE_KEY=твой_service_role_key
OPENAI_API_KEY=твой_openai_key
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

#### Stripe (опционально):
```
STRIPE_SECRET_KEY=sk_live_твой_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_твой_webhook_secret
```

#### ЮKassa (опционально):
```
YK_SHOP_ID=твой_shop_id
YK_SECRET_KEY=твой_secret_key
```

#### Криптоплатежи (опционально):
```
CRYPTO_IPN_SECRET=твой_ipn_secret
```

### 4. Webhook URLs

После деплоя настрой webhook'и:

#### Stripe:
1. Иди в Stripe Dashboard → Developers → Webhooks
2. Добавь endpoint: `https://your-project.vercel.app/api/stripe/webhook`
3. Выбери события: `checkout.session.completed`
4. Скопируй **Signing secret** → добавь в Vercel как `STRIPE_WEBHOOK_SECRET`

#### ЮKassa:
1. Иди в ЮKassa Dashboard → Настройки → Уведомления
2. Добавь URL: `https://your-project.vercel.app/api/yookassa/webhook`
3. Выбери события: `payment.succeeded`

#### Криптоплатежи:
1. В настройках криптоплатежной системы (NOWPayments, CoinGate и т.д.)
2. Добавь IPN URL: `https://your-project.vercel.app/api/crypto/ipn`
3. Укажи секрет в `CRYPTO_IPN_SECRET`

### 5. Деплой

1. Нажми **Deploy** в Vercel
2. Дождись завершения (2-3 минуты)
3. Открой задеплоенный сайт

## ✅ Проверка после деплоя

1. ✅ Лендинг открывается
2. ✅ Регистрация работает
3. ✅ Вход работает
4. ✅ Чат с ИИ работает
5. ✅ Личный кабинет показывает тариф
6. ✅ Кнопки оплаты работают (если настроены)

## 🔧 Локальный тест перед деплоем

```bash
cd /Users/sanecek/tema/ai-chat-pro
npm run build
npm start
```

Проверь что всё работает на http://localhost:3000

## 📝 Примечания

- **Миграции БД** должны быть уже запущены в Supabase
- **Email подтверждение** в Supabase можно отключить для тестирования (Settings → Auth → Email Auth)
- **Stripe** используй test ключи для разработки (`sk_test_...`)
- **ЮKassa** используй тестовый режим для разработки

## 🎯 Готово!

После деплоя сайт будет доступен по адресу `https://your-project.vercel.app`

