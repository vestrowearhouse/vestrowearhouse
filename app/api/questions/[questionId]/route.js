/**
 * PATCH /api/questions/[questionId]  — add reply, vote helpful
 * DELETE /api/questions/[questionId] — user delete own question
 */
import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import { Question } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    await connectMongo();
    const { questionId } = params;
    const body = await request.json();
    const { action, userId, reply } = body;

    const question = await Question.findById(questionId);
    if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

    // ── action: helpful ──────────────────────────────────────────────────────
    if (action === 'helpful') {
      if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
      const alreadyVoted = question.helpfulVoters.includes(userId);
      if (alreadyVoted) {
        question.helpfulVoters.pull(userId);
        question.helpfulCount = Math.max(0, question.helpfulCount - 1);
      } else {
        question.helpfulVoters.push(userId);
        question.helpfulCount += 1;
      }
      await question.save();
      return NextResponse.json({ success: true, helpfulCount: question.helpfulCount, voted: !alreadyVoted });
    }

    // ── action: reply ────────────────────────────────────────────────────────
    if (action === 'reply') {
      if (!reply?.body) return NextResponse.json({ error: 'reply.body required' }, { status: 400 });
      question.replies.push({
        body: reply.body,
        author: reply.author || 'Shop',
        role: reply.role || 'vendor',
        authorId: reply.authorId,
      });
      if (reply.role === 'vendor' || reply.role === 'admin') {
        question.status = 'answered';
      }
      await question.save();
      return NextResponse.json({ success: true, question });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('PATCH question error:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectMongo();
    const { questionId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const question = await Question.findById(questionId);
    if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

    if (userId && question.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await question.deleteOne();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE question error:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
