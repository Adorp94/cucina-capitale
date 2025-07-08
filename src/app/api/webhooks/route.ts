import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // TODO: Implement Stripe webhook handling here
  return NextResponse.json({ received: true });
}
