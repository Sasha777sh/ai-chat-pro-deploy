import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Обрабатываем событие подписки
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const customerEmail = session.customer_email;

    if (userId) {
      // Обновляем профиль по user_id
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_tier: 'pro',
          subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 дней
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating profile:', error);
      }
    } else if (customerEmail) {
      // Fallback: обновляем по email
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_tier: 'pro',
          subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('email', customerEmail);

      if (error) {
        console.error('Error updating profile:', error);
      }
    }
  }

  return NextResponse.json({ received: true });
}

