import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-black mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            AI Chat Pro
          </h1>
          <p className="text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Современный чат с искусственным интеллектом. Память, контекст, платные функции.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg"
            >
              Начать бесплатно
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all"
            >
              Войти
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
            <h3 className="text-2xl font-bold mb-4">💬 Умный чат</h3>
            <p className="text-gray-300">
              Чат с ИИ на основе GPT-4. Понимает контекст и помнит историю разговора.
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
            <h3 className="text-2xl font-bold mb-4">🧠 Память</h3>
            <p className="text-gray-300">
              ИИ помнит все ваши разговоры. Каждый диалог сохраняется и используется в контексте.
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
            <h3 className="text-2xl font-bold mb-4">⚡ Быстро</h3>
            <p className="text-gray-300">
              Мгновенные ответы. Современные технологии для максимальной скорости.
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-8">Тарифы</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
              <h3 className="text-2xl font-bold mb-4">Бесплатно</h3>
              <p className="text-4xl font-black mb-4">0₽</p>
              <ul className="text-left space-y-2 mb-6">
                <li>✅ 10 сообщений в день</li>
                <li>✅ Базовая память</li>
                <li>❌ Нет истории</li>
              </ul>
              <Link
                href="/signup"
                className="block px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-center"
              >
                Начать
              </Link>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 border-2 border-blue-400">
              <h3 className="text-2xl font-bold mb-4">Pro</h3>
              <p className="text-4xl font-black mb-4">990₽<span className="text-lg">/мес</span></p>
              <ul className="text-left space-y-2 mb-6">
                <li>✅ Безлимит сообщений</li>
                <li>✅ Полная память</li>
                <li>✅ История всех чатов</li>
                <li>✅ Приоритетная поддержка</li>
              </ul>
              <Link
                href="/signup?plan=pro"
                className="block px-6 py-3 bg-white text-blue-600 hover:bg-gray-100 rounded-lg text-center font-semibold"
              >
                Купить Pro
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


