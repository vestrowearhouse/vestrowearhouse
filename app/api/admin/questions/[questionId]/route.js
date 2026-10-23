/**
 * PATCH  /api/admin/questions/[questionId] — answer/reject/reply
 * DELETE /api/admin/questions/[questionId] — permanently delete
 */
import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import connectMongo from '@/lib/mongodb';
import { Question } from '@/lib/models';

export const dynamic = 'force-dynamic';

// ── PATCH ────────────────────────────────────────────────────────────────────
export async function PATCH(request, { params }) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectMongo();
    const { questionId } = params;
    const body = await request.json();
    const { status, reply } = body;

    const question = await Question.findById(questionId);
    if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

    if (status) question.status = status;

    if (reply?.body) {
      // Replace existing admin reply or add new one
      const existingIdx = question.replies.findIndex(r => r.role === 'admin');
      if (existingIdx >= 0) {
        question.replies[existingIdx].body = reply.body;
        question.replies[existingIdx].createdAt = new Date();
      } else {
        question.replies.push({
          body: reply.body,
          author: reply.author || 'StellarMart Admin',
          role: 'admin',
          authorId: reply.authorId || 'admin',
        });
      }
      // Auto-mark as answered when admin replies
      if (!status) question.status = 'answered';
    }

    await question.save();
    return NextResponse.json({ success: true, question });
  } catch (error) {
    console.error('PATCH admin question error:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

// ── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    if (!(await verifyAdminToken(request))) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectMongo();
    const { questionId } = params;

    const deleted = await Question.findByIdAndDelete(questionId);
    if (!deleted) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE admin question error:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
