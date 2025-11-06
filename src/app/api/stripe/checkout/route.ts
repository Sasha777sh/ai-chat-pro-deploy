import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'rub',
            product_data: {
              name: 'AI Chat Pro - Подписка',
              description: 'Безлимитный доступ к ИИ-чату',
            },
            recurring: {
              interval: 'month',
            },
            unit_amount: 99000, // 990₽ в копейках
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: user.email || undefined,
      metadata: {
        user_id: user.id,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

