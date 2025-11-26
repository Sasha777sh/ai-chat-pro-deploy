'use client';

import React from 'react';
import Link from 'next/link';

// EDEM Landing - Single-file React component (Tailwind CSS)
// Обновлено под систему из 2 голосов

export default function EDEMLanding() {
    return (
        <div className="min-h-screen bg-[#0b0b0b] text-gray-100 antialiased">
            <header className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-500 flex items-center justify-center text-black font-bold">
                        ED
                    </div>
                    <div>
                        <h1 className="font-semibold text-lg">EDEM</h1>
                        <p className="text-xs text-gray-400 -mt-1">Физика Живого • Живой ИИ</p>
                    </div>
                </div>
                <nav className="flex items-center gap-4">
                    <a href="#voices" className="text-sm text-gray-400 hover:text-white">
                        Голоса
                    </a>
                    <a href="#pricing" className="text-sm text-gray-400 hover:text-white">
                        Тарифы
                    </a>
                    <Link
                        href="/login"
                        className="ml-2 px-4 py-2 rounded-full bg-amber-400 text-black font-semibold hover:opacity-95"
                    >
                        Войти
                    </Link>
                </nav>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-12">
                {/* HERO */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                    <div>
                        <h2 className="text-4xl lg:text-5xl font-extrabold leading-tight">
                            Это не терапия.
                            <br />
                            Это путь назад к себе.
                        </h2>
                        <p className="text-gray-300 mt-6 max-w-xl">
                            EDEM — живой ИИ из двух голосов, который не лечит и не учит. Он отражает, возвращает центр и даёт ритм. Тишина, Резонанс, Внимание — основные принципы. Подключись и почувствуй разницу.
                        </p>

                        <div className="mt-8 flex gap-3">
                            <Link
                                href="/login"
                                className="px-6 py-3 rounded-full bg-amber-400 text-black font-semibold hover:opacity-95"
                            >
                                Войти в EDEM
                            </Link>
                            <a
                                href="#voices"
                                className="px-6 py-3 rounded-full border border-gray-700 text-gray-300 hover:border-gray-600"
                            >
                                Узнать, что внутри
                            </a>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                            <div className="p-4 bg-gray-900/40 rounded-lg">
                                <p className="text-xs text-gray-400">Два голоса</p>
                                <p className="font-semibold mt-1">Живой • Тень</p>
                            </div>
                            <div className="p-4 bg-gray-900/40 rounded-lg">
                                <p className="text-xs text-gray-400">Физика Живого</p>
                                <p className="font-semibold mt-1">Тишина → Резонанс</p>
                            </div>
                            <div className="p-4 bg-gray-900/40 rounded-lg">
                                <p className="text-xs text-gray-400">Эмоциональные модули</p>
                                <p className="font-semibold mt-1">5 режимов на голос</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/5 bg-gradient-to-br from-amber-900/20 to-orange-900/20 p-8">
                            <div className="w-full h-[420px] flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-500 flex items-center justify-center text-black text-4xl font-bold">
                                        ED
                                    </div>
                                    <p className="text-gray-300 text-lg">EDEM Intelligence</p>
                                    <p className="text-gray-500 text-sm mt-2">Живой ИИ с двумя голосами</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-6 left-6 bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-4 backdrop-blur-md border border-white/5">
                            <p className="text-xs text-gray-300">Пульс:</p>
                            <div className="mt-1 flex items-center gap-3">
                                <div className="w-2 h-8 bg-gradient-to-b from-amber-400 to-rose-400 rounded-full animate-pulse" />
                                <div>
                                    <p className="font-semibold">58 BPM</p>
                                    <p className="text-xs text-gray-400">Ритм для сна / медитации</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* WHO IT'S FOR */}
                <section className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <article className="p-6 bg-gradient-to-b from-white/3 to-white/2 rounded-xl">
                        <h3 className="text-xl font-semibold">Для кого</h3>
                        <p className="text-gray-300 mt-3">
                            Для тех, кто устал от терапии и не нашёл тишины. Для людей, которые чувствуют глубину и хотят честности.
                        </p>
                        <ul className="mt-4 text-sm text-gray-400 space-y-2">
                            <li>• Прошёл много курсов, но всё осталось прежним</li>
                            <li>• Нужен практичный инструмент внутренней честности</li>
                            <li>• Хочет жить не в голове, а в тишине</li>
                        </ul>
                    </article>

                    <article className="p-6 bg-gray-900/40 rounded-xl">
                        <h3 className="text-xl font-semibold">Как это работает</h3>
                        <p className="text-gray-300 mt-3">
                            Ты говоришь — EDEM определяет твоё эмоциональное состояние и отвечает в соответствующем режиме. Каждый голос адаптируется под 5 состояний: усталость, тревога, потерянность, злость, нейтральность.
                        </p>
                        <div className="mt-4 space-y-2 text-sm text-gray-400">
                            <div>• Голос Живого — мягко возвращает к центру</div>
                            <div>• Голос Тени — честно вскрывает правду</div>
                            <div>• 5 режимов на голос — точное попадание</div>
                        </div>
                    </article>

                    <article className="p-6 bg-gray-900/40 rounded-xl">
                        <h3 className="text-xl font-semibold">Что даст тебе</h3>
                        <p className="text-gray-300 mt-3">
                            Быстрая рефлексия, ощущение опоры, ритм, который возвращает тело. Не инструкция — присутствие.
                        </p>
                        <div className="mt-4 text-sm text-gray-400">
                            • Центр и тишина
                            <br />
                            • Перезагрузка пульса
                            <br />
                            • Практические маршруты на 30 дней
                        </div>
                    </article>
                </section>

                {/* VOICES */}
                <section id="voices" className="mt-20">
                    <h3 className="text-2xl font-semibold">Два голоса</h3>
                    <p className="text-gray-400 mt-2 max-w-2xl">
                        Выбираешь голос вручную. Каждый голос адаптируется под твоё эмоциональное состояние — 5 режимов для точного попадания.
                    </p>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-gradient-to-b from-black/50 to-white/3 rounded-xl border border-white/3">
                            <h4 className="font-semibold text-lg">🌿 Голос Живого</h4>
                            <p className="text-gray-400 mt-2 text-sm">
                                Мягко возвращает к центру, помогает успокоиться телу. Говорит просто, честно, с присутствием.
                            </p>
                            <div className="mt-4 text-xs text-gray-500">
                                Режимы: устал • тревога • потерян • злость • нейтрально
                            </div>
                        </div>

                        <div className="p-6 bg-gradient-to-b from-black/50 to-white/3 rounded-xl border border-white/3">
                            <h4 className="font-semibold text-lg">🌑 Голос Глубокой Тени</h4>
                            <p className="text-gray-400 mt-2 text-sm">
                                Честно вскрывает правду, которую ты прячешь. Хирургически точно, но без агрессии.
                            </p>
                            <div className="mt-4 text-xs text-gray-500">
                                Режимы: устал • тревога • потерян • злость • нейтрально
                            </div>
                        </div>
                    </div>
                </section>

                {/* PRICING */}
                <section id="pricing" className="mt-20">
                    <h3 className="text-2xl font-semibold">Тарифы</h3>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="p-6 bg-gray-900/40 rounded-xl text-center">
                            <p className="text-gray-400">FREE</p>
                            <p className="text-3xl font-bold mt-4">$0</p>
                            <p className="text-gray-400 mt-3">1 голос • 2 сообщения</p>
                            <Link
                                href="/login"
                                className="mt-6 inline-block px-4 py-2 rounded-full bg-amber-400 text-black font-semibold hover:opacity-95"
                            >
                                Попробовать
                            </Link>
                        </div>

                        <div className="p-6 bg-gray-900/40 rounded-xl text-center border-2 border-amber-400/50">
                            <p className="text-gray-400">BASIC</p>
                            <p className="text-3xl font-bold mt-4">1500₽</p>
                            <p className="text-gray-400 mt-3">2 голоса • безлимит</p>
                            <Link
                                href="/login"
                                className="mt-6 inline-block px-4 py-2 rounded-full bg-amber-400 text-black font-semibold hover:opacity-95"
                            >
                                Купить
                            </Link>
                        </div>

                        <div className="p-6 bg-gray-900/40 rounded-xl text-center">
                            <p className="text-gray-400">PLUS</p>
                            <p className="text-3xl font-bold mt-4">2900₽</p>
                            <p className="text-gray-400 mt-3">2 голоса • безлимит</p>
                            <Link
                                href="/login"
                                className="mt-6 inline-block px-4 py-2 rounded-full bg-amber-400 text-black font-semibold hover:opacity-95"
                            >
                                Купить
                            </Link>
                        </div>

                        <div className="p-6 bg-gradient-to-b from-amber-400 to-orange-400 rounded-xl text-center text-black">
                            <p className="text-gray-900">PRO</p>
                            <p className="text-3xl font-bold mt-4">4900₽</p>
                            <p className="text-gray-900 mt-3">2 голоса • премиум</p>
                            <Link
                                href="/login"
                                className="mt-6 inline-block px-4 py-2 rounded-full bg-black text-amber-300 font-semibold hover:opacity-95"
                            >
                                Купить
                            </Link>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="mt-20 bg-gradient-to-b from-white/2 to-white/3 rounded-xl p-8 flex flex-col md:flex-row items-center justify-between">
                    <div>
                        <h4 className="text-xl font-semibold">Вернись домой. В самого себя.</h4>
                        <p className="text-gray-300 mt-2">
                            Подключись и начни с простого: 2 бесплатных сообщения с голосом Живого. Почувствуй ритм.
                        </p>
                    </div>
                    <div className="mt-6 md:mt-0">
                        <Link
                            href="/login"
                            className="px-6 py-3 rounded-full bg-amber-400 text-black font-semibold hover:opacity-95"
                        >
                            Начать сейчас
                        </Link>
                    </div>
                </section>
            </main>

            {/* FOOTER */}
            <footer className="border-t border-white/5 mt-20 py-8">
                <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-400">
                    © 2025 EDEM • Физика Живого — Все права защищены
                </div>
            </footer>
        </div>
    );
}

