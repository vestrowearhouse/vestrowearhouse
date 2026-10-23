import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // A simulated AI engine that parses intent from the natural language query
    const lowerQuery = query.toLowerCase();
    
    let suggestedFilters = {
      category: '',
      minPrice: '',
      maxPrice: '',
      tags: [],
    };

    let aiResponse = '';

    // Simulate intent extraction
    if (lowerQuery.includes('cheap') || lowerQuery.includes('affordable') || lowerQuery.includes('under 500')) {
      suggestedFilters.maxPrice = '500';
    } else if (lowerQuery.includes('under 1000')) {
      suggestedFilters.maxPrice = '1000';
    } else if (lowerQuery.includes('under 2000')) {
      suggestedFilters.maxPrice = '2000';
    } else if (lowerQuery.includes('under 5000')) {
      suggestedFilters.maxPrice = '5000';
    } else if (lowerQuery.includes('expensive') || lowerQuery.includes('premium')) {
      suggestedFilters.minPrice = '5000';
    }

    if (lowerQuery.includes('phone') || lowerQuery.includes('smartphone') || lowerQuery.includes('mobile')) {
      suggestedFilters.category = 'smartphones'; // Assuming slug
      aiResponse = "I found some great smartphones for you.";
    } else if (lowerQuery.includes('jacket') || lowerQuery.includes('winter') || lowerQuery.includes('hoodie')) {
      suggestedFilters.category = 'clothing';
      aiResponse = "Looking for something warm? Here are some winter clothing options.";
    } else if (lowerQuery.includes('shoe') || lowerQuery.includes('sneaker') || lowerQuery.includes('boot')) {
      suggestedFilters.category = 'shoes';
      aiResponse = "Check out these footwear options.";
    } else if (lowerQuery.includes('laptop') || lowerQuery.includes('computer')) {
      suggestedFilters.category = 'laptops';
      aiResponse = "Here are some laptops that match your criteria.";
    } else if (lowerQuery.includes('camera')) {
      suggestedFilters.tags.push('camera');
      if (!aiResponse) aiResponse = "I've filtered the results to show products with great cameras.";
    } else if (lowerQuery.includes('gaming')) {
      suggestedFilters.tags.push('gaming');
      if (!aiResponse) aiResponse = "Ready to play? Here are some gaming products.";
    }

    // Default response if no specific category matched
    if (!aiResponse) {
      aiResponse = "I've analyzed your search and applied the best filters to help you find what you need!";
    }
    
    // Add price mention to response if applicable
    if (suggestedFilters.maxPrice) {
      aiResponse += ` I've also restricted the price to under ৳${suggestedFilters.maxPrice}.`;
    }

    return NextResponse.json({
      intent: {
        filters: suggestedFilters,
        message: aiResponse,
        confidence: 0.85
      }
    });

  } catch (error) {
    console.error('Semantic Search AI Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
