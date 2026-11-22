import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/service';
import { verifyWebJwt } from '@/lib/verify-jwt';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ ok: false, error: 'Missing authorization' }, { status: 401 });
    }

    const payload = await verifyWebJwt(token);
    if (!payload) {
      return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { to, type, data } = body;

    if (!to || !type) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
    }

    const result = await sendEmail({ to, type, data });

    if (!result.success) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    console.error('[email API] error:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}