import { NextResponse } from 'next/server';
import { checkAdminAccess, ROLES } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const auth = await checkAdminAccess([ROLES.SUPER_ADMIN, ROLES.EDITOR]);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const { image, price, notes, categories } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    // Extract mime type and clean base64 data
    let mimeType = 'image/jpeg';
    let cleanData = image;

    if (image.startsWith('data:')) {
      const matches = image.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        cleanData = matches[2];
      } else {
        const parts = image.split(',');
        cleanData = parts[1] || image;
      }
    }

    // Prepare list of categories for Gemini matching
    const catList = Array.isArray(categories) 
      ? categories.map(c => ({ id: c.id, name: c.name })).slice(0, 50)
      : [];

    const promptText = `You are an expert e-commerce catalog manager for Stellar Mart BD, an online retail store in Bangladesh.
Analyze the provided product photo carefully.

User Instructions / Price:
- User specified selling price: ${price ? `${price} BDT` : 'Not explicitly set (estimate realistic BDT retail price)'}
- User extra notes: "${notes || 'None'}"

Available Store Categories:
${JSON.stringify(catList)}

Your task:
1. Identify the exact product shown in the image.
2. Provide a professional, SEO-friendly English product title ("name").
3. Provide an accurate, natural-sounding Bengali (Bangla) translation of the product title ("nameBn").
4. Select the best matching category ID or exact category name from the provided Store Categories list ("category"). If none match, give the most relevant standard category name.
5. If user provided a price (${price || 'none'}), use that exact number for "sellingPrice". If a price tag/sticker is visible in the photo, extract that price. Otherwise estimate a reasonable market price in BDT.
6. Set "regularPrice" (typically 15% to 25% higher than selling price to display a discount strike-through price).
7. If a brand name is visible on the product or packaging, output it in "brand", otherwise leave empty string "".
8. Write a concise 1-2 sentence highlight for "shortDescription".
9. Generate 4-6 relevant comma-separated English search keywords for "tags".

Output strictly valid JSON with this exact schema:
{
  "name": "Product Name in English",
  "nameBn": "প্রোডাক্টের বাংলা নাম",
  "category": "category ID or name",
  "sellingPrice": 650,
  "regularPrice": 800,
  "brand": "",
  "shortDescription": "Concise key feature highlight.",
  "tags": "tag1, tag2, tag3"
}`;

    // Call Gemini 2.5 Flash (with fallback to gemini-1.5-flash)
    let geminiResponse;
    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash'];

    for (const model of modelsToTry) {
      try {
        geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: cleanData
                  }
                },
                { text: promptText }
              ]
            }],
            generationConfig: {
              temperature: 0.3,
              responseMimeType: 'application/json'
            }
          })
        });

        if (geminiResponse.ok) break;
      } catch (e) {
        console.warn(`Gemini model ${model} failed, trying next:`, e);
      }
    }

    if (!geminiResponse || !geminiResponse.ok) {
      const errText = geminiResponse ? await geminiResponse.text() : 'No response';
      console.error('Gemini vision API error:', errText);
      return NextResponse.json({ error: 'AI analysis failed. Please verify the image or try again.' }, { status: 500 });
    }

    const data = await geminiResponse.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    let parsed;
    try {
      let cleanJson = generatedText.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json/m, '').replace(/```$/m, '').trim();
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```/m, '').replace(/```$/m, '').trim();
      }
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('JSON parse error from AI response:', generatedText);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Ensure price numbers
    const parsedSelling = parseFloat(price || parsed.sellingPrice) || 0;
    const parsedRegular = parseFloat(parsed.regularPrice) || Math.round(parsedSelling * 1.2) || parsedSelling;

    // Resolve category to ID if matching name was returned
    let matchedCategoryId = parsed.category || '';
    if (catList.length > 0) {
      const found = catList.find(c => 
        c.id === parsed.category || 
        c.name.toLowerCase() === String(parsed.category).toLowerCase() ||
        String(parsed.category).toLowerCase().includes(c.name.toLowerCase())
      );
      if (found) {
        matchedCategoryId = found.id;
      }
    }

    return NextResponse.json({
      success: true,
      product: {
        name: parsed.name || 'New Product',
        nameBn: parsed.nameBn || '',
        category: matchedCategoryId,
        sellingPrice: parsedSelling,
        regularPrice: parsedRegular,
        brand: parsed.brand || '',
        shortDescription: parsed.shortDescription || '',
        tags: parsed.tags || ''
      }
    });
  } catch (error) {
    console.error('AI Product Analysis error:', error);
    return NextResponse.json({ error: 'Internal server error during AI analysis: ' + error.message }, { status: 500 });
  }
}
