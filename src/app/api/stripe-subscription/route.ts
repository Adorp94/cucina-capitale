import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Use actual Stripe price IDs
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

    // 2. Create a subscription with two items
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        { price: BASE_PRICE_ID, quantity: 1 },
        { price: PER_USER_PRICE_ID, quantity: userCount },
      ],
      payment_behavior: 'default_incomplete', // Use Stripe Checkout or Payment Intents for payment
      expand: ['latest_invoice.payment_intent'],
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Stripe error' }, { status: 500 });
  }
} 