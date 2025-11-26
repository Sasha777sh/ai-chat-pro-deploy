/**
 * Language Router для EDEM
 * Автоматическое определение языка и маршрутизация ответов
 */

export type SupportedLanguage = 'ru' | 'en' | 'vi' | 'es' | 'pt' | 'fr' | 'de' | 'ko' | 'ja' | 'zh';

export interface LanguageDetection {
    language: SupportedLanguage;
    confidence: number;
    detected: boolean;
}

/**
 * Определяет язык сообщения пользователя
 */
export function detectLanguage(message: string): LanguageDetection {
    const text = message.trim().toLowerCase();

    // Если сообщение слишком короткое, используем язык по умолчанию
    if (text.length < 3) {
        return {
            language: 'ru',
            confidence: 0.5,
            detected: false,
        };
    }

    // Паттерны для определения языка
    const patterns: Record<SupportedLanguage, RegExp[]> = {
        ru: [
            /[а-яё]/,
            /\b(как|что|где|когда|почему|это|этот|эта|этот|быть|был|была|было|были)\b/,
            /\b(привет|здравствуй|спасибо|пожалуйста|да|нет)\b/,
        ],
        en: [
            /[a-z]/,
            /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/,
            /\b(hello|hi|thanks|please|yes|no|what|where|when|why|how)\b/,
        ],
        vi: [
            /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/,
            /\b(tôi|bạn|đó|này|đây|và|hoặc|nhưng|trong|trên|với|bởi)\b/,
            /\b(xin chào|cảm ơn|vui lòng|có|không|gì|ở đâu|khi nào|tại sao)\b/,
        ],
        es: [
            /[áéíóúñü]/,
            /\b(el|la|los|las|y|o|pero|en|de|con|por|para)\b/,
            /\b(hola|gracias|por favor|sí|no|qué|dónde|cuándo|por qué|cómo)\b/,
        ],
        pt: [
            /[áàâãéêíóôõúüç]/,
            /\b(o|a|os|as|e|ou|mas|em|de|com|por|para)\b/,
            /\b(olá|obrigado|por favor|sim|não|o que|onde|quando|por quê|como)\b/,
        ],
        fr: [
            /[àâäéèêëïîôùûüÿç]/,
            /\b(le|la|les|et|ou|mais|dans|de|avec|par|pour)\b/,
            /\b(bonjour|merci|s'il vous plaît|oui|non|quoi|où|quand|pourquoi|comment)\b/,
        ],
        de: [
            /[äöüß]/,
            /\b(der|die|das|und|oder|aber|in|von|mit|durch|für)\b/,
            /\b(hallo|danke|bitte|ja|nein|was|wo|wann|warum|wie)\b/,
        ],
        ko: [
            /[가-힣]/,
            /\b(안녕|감사|부탁|예|아니|무엇|어디|언제|왜|어떻게)\b/,
        ],
        ja: [
            /[ひらがなカタカナ漢字]/,
            /\b(こんにちは|ありがとう|お願い|はい|いいえ|何|どこ|いつ|なぜ|どのように)\b/,
        ],
        zh: [
            /[一-龯]/,
            /\b(你好|谢谢|请|是|不|什么|哪里|什么时候|为什么|如何)\b/,
        ],
    };

    const scores: Record<SupportedLanguage, number> = {
        ru: 0,
        en: 0,
        vi: 0,
        es: 0,
        pt: 0,
        fr: 0,
        de: 0,
        ko: 0,
        ja: 0,
        zh: 0,
    };

    // Подсчитываем совпадения для каждого языка
    for (const [lang, langPatterns] of Object.entries(patterns)) {
        for (const pattern of langPatterns) {
            if (pattern.test(text)) {
                scores[lang as SupportedLanguage] += 1;
            }
        }
    }

    // Находим язык с максимальным счётом
    let maxScore = 0;
    let detectedLang: SupportedLanguage = 'ru';

    for (const [lang, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            detectedLang = lang as SupportedLanguage;
        }
    }

    // Если нет совпадений, используем язык по умолчанию
    if (maxScore === 0) {
        return {
            language: 'ru',
            confidence: 0.3,
            detected: false,
        };
    }

    // Вычисляем уверенность (нормализуем по количеству паттернов)
    const totalPatterns = patterns[detectedLang].length;
    const confidence = Math.min(maxScore / totalPatterns, 1);

    return {
        language: detectedLang,
        confidence,
        detected: confidence > 0.3,
    };
}

/**
 * Получает язык из браузера пользователя
 */
export function getBrowserLanguage(): SupportedLanguage {
    if (typeof window === 'undefined') {
        return 'ru';
    }

    const browserLang = navigator.language.toLowerCase();

    // Маппинг языков браузера на поддерживаемые
    const langMap: Record<string, SupportedLanguage> = {
        'ru': 'ru',
        'en': 'en',
        'vi': 'vi',
        'es': 'es',
        'pt': 'pt',
        'fr': 'fr',
        'de': 'de',
        'ko': 'ko',
        'ja': 'ja',
        'zh': 'zh',
        'zh-cn': 'zh',
        'zh-tw': 'zh',
    };

    // Проверяем точное совпадение
    if (langMap[browserLang]) {
        return langMap[browserLang];
    }

    // Проверяем префикс (например, 'en-us' -> 'en')
    const prefix = browserLang.split('-')[0];
    if (langMap[prefix]) {
        return langMap[prefix];
    }

    return 'ru'; // По умолчанию русский
}

/**
 * Получает название языка на русском
 */
export function getLanguageName(lang: SupportedLanguage): string {
    const names: Record<SupportedLanguage, string> = {
        ru: 'Русский',
        en: 'English',
        vi: 'Tiếng Việt',
        es: 'Español',
        pt: 'Português',
        fr: 'Français',
        de: 'Deutsch',
        ko: '한국어',
        ja: '日本語',
        zh: '中文',
    };

    return names[lang] || 'Русский';
}

/**
 * Получает название языка на самом языке
 */
export function getLanguageNativeName(lang: SupportedLanguage): string {
    const names: Record<SupportedLanguage, string> = {
        ru: 'Русский',
        en: 'English',
        vi: 'Tiếng Việt',
        es: 'Español',
        pt: 'Português',
        fr: 'Français',
        de: 'Deutsch',
        ko: '한국어',
        ja: '日本語',
        zh: '中文',
    };

    return names[lang] || 'Русский';
}

