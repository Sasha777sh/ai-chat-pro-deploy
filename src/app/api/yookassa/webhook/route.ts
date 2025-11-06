import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const evt = body.event as string;
        const obj = body.object || {};

        if (evt === 'payment.succeeded') {
            const userId = obj.metadata?.userId as string | undefined;
            const plan = obj.metadata?.plan as 'month' | undefined;

            if (userId) {
                const days = plan === 'month' ? 30 : 30; // По умолчанию месяц

                // Обновляем профиль пользователя
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        subscription_tier: 'pro',
                        subscription_expires_at: new Date(
                            Date.now() + days * 24 * 60 * 60 * 1000
                        ).toISOString(),
                    })
                    .eq('id', userId);

                if (error) {
                    console.error('YooKassa webhook error updating profile:', error);
                } else {
                    console.log(`YooKassa payment successful for user ${userId}, plan: ${plan}`);
                }
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('YooKassa webhook error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}

