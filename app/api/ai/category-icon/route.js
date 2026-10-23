import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { categoryName } = await request.json();

    if (!categoryName) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is missing' }, { status: 500 });
    }

    const prompt = `Generate an appropriate emoji and a minimal inline SVG icon for an e-commerce category named "${categoryName}".

The SVG should be:
- 24x24 viewBox
- clean and minimal
- Use styling that fits a modern e-commerce site (use standard SVG attributes like fill="none", stroke="currentColor", stroke-width="2", stroke-linecap="round", stroke-linejoin="round"). 

Output the result strictly as a valid JSON object with the following structure:
{
  "emoji": "📱",
  "customCode": "<svg ...>...</svg>"
}
No markdown formatting, no backticks, just the raw JSON object.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Gemini error:', data);
      throw new Error('Failed to generate from Gemini');
    }

    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) {
      throw new Error('Empty response from AI');
    }

    // Clean up potential markdown formatting that Gemini sometimes adds despite instructions
    const cleanedText = textResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();

    try {
      const result = JSON.parse(cleanedText);
      return NextResponse.json(result);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', textResponse);
      throw new Error('Invalid JSON format returned from AI');
    }
  } catch (error) {
    console.error('AI Icon Generator error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
