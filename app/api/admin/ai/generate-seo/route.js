import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { productName } = await request.json();

    if (!productName) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is missing' }, { status: 500 });
    }

    const prompt = `Generate 10 highly relevant SEO keywords/tags for an e-commerce product named "${productName}". 
    Return ONLY a comma-separated list of keywords. Do not include any other text, quotes, or formatting.`;

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
          temperature: 0.7,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      return NextResponse.json({ error: 'Failed to generate tags from AI' }, { status: 500 });
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean up the response to just be a comma separated string
    const tags = generatedText.trim().replace(/^"|"$/g, '').replace(/\n/g, '');

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('AI generate-seo error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
