import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
    try {
        // Получаем токен из заголовков
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
        }

        const { amount, currency, paymentUrl } = await request.json();

        // Сохраняем информацию о платеже для отслеживания
        const orderId = crypto.randomUUID();

        // Здесь должна быть интеграция с криптоплатежами (например, NOWPayments, CoinGate)
        // Для примера возвращаем URL для оплаты

        return NextResponse.json({
            orderId,
            paymentUrl: paymentUrl || `https://crypto-payment-gateway.com/pay?order=${orderId}&amount=${amount}&currency=${currency}`,
            message: 'Используйте предоставленный URL для оплаты криптовалютой',
        });
    } catch (error: any) {
        console.error('Crypto checkout error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

