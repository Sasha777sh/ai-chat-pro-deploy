import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const IPN_SECRET = process.env.CRYPTO_IPN_SECRET || '';

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('x-ipn-signature');

        // Проверяем подпись webhook'а
        if (!signature || !IPN_SECRET) {
            console.error('IPN: Missing signature or secret');
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
        }

        // Валидируем подпись
        const expectedSignature = crypto
            .createHmac('sha256', IPN_SECRET)
            .update(body)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('IPN: Invalid signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // Парсим данные
        const data = JSON.parse(body);
        console.log('IPN received:', data);

        // Проверяем статус платежа
        if (data.status === 'completed' || data.status === 'confirmed') {
            await processSuccessfulPayment(data);
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error: any) {
        console.error('IPN error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

async function processSuccessfulPayment(data: any) {
    try {
        const { order_id, customer_email, userId } = data;

        // Находим пользователя
        let user;
        if (userId) {
            const { data: userData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            user = userData;
        } else if (customer_email) {
            const { data: userData } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', customer_email)
                .single();
            user = userData;
        }

        if (!user) {
            console.error('IPN: User not found for payment:', { order_id, customer_email });
            return;
        }

        // Обновляем профиль пользователя
        const { error } = await supabase
            .from('profiles')
            .update({
                subscription_tier: 'pro',
                subscription_expires_at: new Date(
                    Date.now() + 30 * 24 * 60 * 60 * 1000
                ).toISOString(), // +30 дней
            })
            .eq('id', user.id);

        if (error) {
            console.error('IPN: Subscription update error:', error);
            return;
        }

        console.log('IPN: Payment processed successfully for user:', user.id);
    } catch (error) {
        console.error('IPN: Error processing payment:', error);
    }
}

