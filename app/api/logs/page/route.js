/**
 * POST /api/logs/page  — track page view
 * GET  /api/logs/page  — admin: get page analytics from MongoDB
 */
import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import connectMongo from '@/lib/mongodb';
import { PageLog } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await connectMongo();
    const body = await request.json();
    const { path, referrer, userId, sessionId, device, browser, os, country, duration, exitPage } = body;

    if (!path) return NextResponse.json({ error: 'path is required' }, { status: 400 });

    // Extract IP from header (works on Vercel)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    await PageLog.create({ path, referrer, userId, sessionId, ip, device, browser, os, country, duration, exitPage: exitPage || false });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Page log error:', error);
    return NextResponse.json({ error: 'Failed to log page view' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectMongo();
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const days = parseInt(searchParams.get('days') || '7');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(500, parseInt(searchParams.get('limit') || '100'));
    const skip = (page - 1) * limit;

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const filter = { createdAt: { $gte: since } };
    if (path) filter.path = { $regex: path, $options: 'i' };

    const [logs, total, topPages] = await Promise.all([
      PageLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      PageLog.countDocuments(filter),
      // Aggregate top pages
      PageLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$path', views: { $sum: 1 }, uniqueUsers: { $addToSet: '$userId' } } },
        { $project: { path: '$_id', views: 1, uniqueVisitors: { $size: '$uniqueUsers' } } },
        { $sort: { views: -1 } },
        { $limit: 20 },
      ]),
    ]);

    return NextResponse.json({ logs, total, page, limit, topPages });
  } catch (error) {
    console.error('GET page logs error:', error);
    return NextResponse.json({ logs: [], total: 0 }, { status: 500 });
  }
}
