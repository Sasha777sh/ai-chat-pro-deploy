import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const API_URL = 'https://api.yookassa.ru/v3/payments';

function idemKey() {
    return crypto.randomBytes(16).toString('hex');
}

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

        const { plan } = await request.json(); // 'month'
        const amount = '990.00'; // 990₽
        const description = 'AI Chat Pro - Подписка на месяц';

        const payload = {
            amount: {
                value: amount,
                currency: 'RUB',
            },
            capture: true,
            confirmation: {
                type: 'redirect',
                return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?success=true`,
            },
            description,
            metadata: {
                userId: user.id,
                plan: 'month',
            },
        };

        const auth = Buffer.from(
            `${process.env.YK_SHOP_ID}:${process.env.YK_SECRET_KEY}`
        ).toString('base64');

        const res = await fetch(API_URL, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/json',
                'Idempotence-Key': idemKey(),
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error('YooKassa API error:', err);
            return NextResponse.json({ error: 'Ошибка создания платежа' }, { status: 500 });
        }

        const data = await res.json();
        return NextResponse.json({
            url: data.confirmation?.confirmation_url,
            paymentId: data.id,
        });
    } catch (error: any) {
        console.error('YooKassa checkout error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

