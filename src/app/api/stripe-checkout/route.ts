import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const BASE_PRICE_ID = 'price_1REKRjFrtyVJ3k1EIuF9dPzq'; // $65/month
const PER_USER_PRICE_ID = 'price_1REKSJFrtyVJ3k1ExaXxjuBY'; // $9/user/month

export async function POST(req: NextRequest) {
  try {
    // Initialize Stripe inside the function to avoid build-time issues
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
    const body = await req.json();
    const { companyName, companyAdminEmail, userCount } = body;

    if (!companyName || !companyAdminEmail || typeof userCount !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create a Stripe customer (in production, check if already exists and store customerId in your DB)
    const customer = await stripe.customers.create({
      name: companyName,
      email: companyAdminEmail,
      metadata: { platform: companyName },
    });

    // 2. Create a Stripe Checkout Session for a subscription
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customer.id,
      line_items: [
        { price: BASE_PRICE_ID, quantity: 1 },
        { price: PER_USER_PRICE_ID, quantity: userCount },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=cancel`,
      metadata: { companyName, companyAdminEmail },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Stripe error' }, { status: 500 });
  }
} 