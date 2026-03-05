import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/services';

export const dynamic = 'force-dynamic';

const intakeSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').or(z.literal('')).default(''),
  phone: z.string().default(''),
  preferredContact: z.enum(['email', 'phone', 'text', 'any']).default('any'),
  source: z.string().default(''),
  clientType: z.enum(['rental', 'buyer', 'seller', 'investor', 'multi']).default('rental'),
  rentalPrefs: z.record(z.unknown()).optional(),
  buyerPrefs: z.record(z.unknown()).optional(),
  currentAddress: z.string().default(''),
  currentLeaseExpiration: z.string().optional(),
  reasonForMoving: z.string().default(''),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  notes: z.string().default(''),
});

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = intakeSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const client = await createClient(parsed.data);
    return NextResponse.json({ success: true, data: client });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create client';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
