import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { productName, shortDescription, tags } = await request.json();

    if (!productName) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is missing' }, { status: 500 });
    }

    const prompt = `You are an expert e-commerce copywriter. 
Write a highly converting, SEO-optimized product description for: "${productName}".
${shortDescription ? `Additional details to include: ${shortDescription}` : ''}
${tags ? `Keywords to focus on: ${tags}` : ''}

Please return the output in EXACTLY this JSON format, with no additional text or formatting:
{
  "description": "The full english description here in 2-3 paragraphs",
  "descriptionBn": "The translation of the description in natural-sounding Bengali (Bangla) here"
}`;

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
      return NextResponse.json({ error: 'Failed to generate descriptions from AI' }, { status: 500 });
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean up markdown block if Gemini included it
    let jsonStr = generatedText.trim();
    if (jsonStr.startsWith('\`\`\`json')) {
      jsonStr = jsonStr.replace(/^\`\`\`json/m, '');
      jsonStr = jsonStr.replace(/\`\`\`$/m, '');
    } else if (jsonStr.startsWith('\`\`\`')) {
      jsonStr = jsonStr.replace(/^\`\`\`/m, '');
      jsonStr = jsonStr.replace(/\`\`\`$/m, '');
    }

    let result;
    try {
      result = JSON.parse(jsonStr.trim());
    } catch (e) {
      console.error('Failed to parse AI JSON response:', jsonStr);
      return NextResponse.json({ error: 'AI returned malformed data' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI generate-description error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
