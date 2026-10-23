/**
 * POST /api/logs/activity  — log admin/vendor action to MongoDB
 * GET  /api/logs/activity  — admin: fetch activity logs
 */
import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import connectMongo from '@/lib/mongodb';
import { ActivityLog } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await connectMongo();
    const body = await request.json();
    const { actorId, actorEmail, actorRole, action, resource, resourceId, details, ip, userAgent, level } = body;

    if (!action) return NextResponse.json({ error: 'action is required' }, { status: 400 });

    await ActivityLog.create({ actorId, actorEmail, actorRole, action, resource, resourceId, details, ip, userAgent, level: level || 'info' });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Activity log error:', error);
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectMongo();
    const { searchParams } = new URL(request.url);
    const actorId = searchParams.get('actorId');
    const action = searchParams.get('action');
    const level = searchParams.get('level');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'));
    const skip = (page - 1) * limit;

    const filter = {};
    if (actorId) filter.actorId = actorId;
    if (action) filter.action = { $regex: action, $options: 'i' };
    if (level) filter.level = level;

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ActivityLog.countDocuments(filter),
    ]);

    return NextResponse.json({ logs, total, page, limit });
  } catch (error) {
    console.error('GET activity logs error:', error);
    return NextResponse.json({ logs: [], total: 0 }, { status: 500 });
  }
}
