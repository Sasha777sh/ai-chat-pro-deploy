# 🔧 Исправление: Сайт защищён паролем

## Проблема

Сайт задеплоен, но защищён паролем Vercel (Deployment Protection).

## Решение

### Вариант 1: Отключить защиту (рекомендуется)

1. Иди в Vercel Dashboard: https://vercel.com/moytelefonmsk-6183s-projects/ai-chat-pro
2. Settings → Deployment Protection
3. Отключи "Password Protection" или "Vercel Authentication"
4. Сохрани

### Вариант 2: Получить production домен

1. Vercel Dashboard → Settings → Domains
2. Добавь домен (например, `ai-chat-pro.vercel.app`)
3. Или используй автоматический домен проекта

### Вариант 3: Получить bypass token

1. Vercel Dashboard → Settings → Deployment Protection
2. Скопируй bypass token
3. Используй URL: `https://ai-chat-fuzc2v4jb-moytelefonmsk-6183s-projects.vercel.app?x-vercel-protection-bypass=TOKEN`

---

## ✅ После отключения защиты

Сайт будет доступен по адресу:
**https://ai-chat-fuzc2v4jb-moytelefonmsk-6183s-projects.vercel.app**

Или добавь свой домен в настройках Vercel.

