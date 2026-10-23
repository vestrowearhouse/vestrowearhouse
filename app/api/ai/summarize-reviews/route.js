import { NextResponse } from 'next/server';

// ✅ SECURITY: Rate limit AI endpoint — Gemini API calls cost money and have usage limits
const AI_RATE = new Map(); // ip -> { count, resetAt }
const AI_RATE_LIMIT = 20;
const AI_RATE_WINDOW_MS = 60 * 1000; // 1 minute

function isAIRateLimited(ip) {
  const now = Date.now();
  if (AI_RATE.size > 80) {
    for (const [k, v] of AI_RATE.entries()) {
      if (now > v.resetAt) AI_RATE.delete(k);
    }
  }
  const record = AI_RATE.get(ip);
  if (!record || now > record.resetAt) {
    AI_RATE.set(ip, { count: 1, resetAt: now + AI_RATE_WINDOW_MS });
    return false;
  }
  if (record.count >= AI_RATE_LIMIT) return true;
  record.count += 1;
  return false;
}

export async function POST(request) {
  try {
    // ✅ Rate limit by IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
    if (isAIRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { reviews, productName } = await request.json();

    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json({ summary: 'No reviews available to summarize.' });
    }

    // ✅ SECURITY: Limit input size to prevent prompt injection with massive payloads
    if (reviews.length > 50) {
      return NextResponse.json({ error: 'Too many reviews. Maximum 50 allowed.' }, { status: 400 });
    }
    if (productName && productName.length > 200) {
      return NextResponse.json({ error: 'Product name too long.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is missing' }, { status: 500 });
    }

    // Concatenate reviews text — truncate each review to prevent prompt injection
    const reviewsText = reviews
      .map((r, i) => `${i + 1}. ${String(r.text || r.content || r.review || '').slice(0, 500)}`)
      .join('\n');

    const prompt = `You are an expert e-commerce product analyst.
Summarize the following customer reviews for the product "${productName || 'this product'}" into a brief, professional consensus.
The summary MUST be strictly a maximum of 2 sentences/lines. Focus on the main positive aspects and any common complaints.
Do not mention reviewer names. Return ONLY the plain summary text with no surrounding quotes or markdown.

Reviews:
${reviewsText}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.6,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API Error in summarize-reviews:', errorData);
      return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
    }

    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return NextResponse.json({ summary: summary.trim().replace(/^[\"']|[\"']$/g, '') });
  } catch (error) {
    console.error('AI summarize-reviews error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
