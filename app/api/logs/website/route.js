/**
 * POST /api/logs/website  — write a server log entry
 * GET  /api/logs/website  — admin: fetch website/error logs
 */
import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import connectMongo from '@/lib/mongodb';
import { WebsiteLog } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await connectMongo();
    const body = await request.json();
    const { level, message, source, stack, requestId, userId, meta } = body;

    if (!message) return NextResponse.json({ error: 'message is required' }, { status: 400 });

    await WebsiteLog.create({ level: level || 'info', message, source, stack, requestId, userId, meta });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Website log error:', error);
    return NextResponse.json({ error: 'Failed to write log' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectMongo();
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const source = searchParams.get('source');
    const days = parseInt(searchParams.get('days') || '3');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(500, parseInt(searchParams.get('limit') || '100'));
    const skip = (page - 1) * limit;

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const filter = { createdAt: { $gte: since } };
    if (level) filter.level = level;
    if (source) filter.source = { $regex: source, $options: 'i' };

    const [logs, total] = await Promise.all([
      WebsiteLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      WebsiteLog.countDocuments(filter),
    ]);

    return NextResponse.json({ logs, total, page, limit });
  } catch (error) {
    console.error('GET website logs error:', error);
    return NextResponse.json({ logs: [], total: 0 }, { status: 500 });
  }
}
