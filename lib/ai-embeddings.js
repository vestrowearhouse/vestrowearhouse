import { createClient } from '@supabase/supabase-js';

// Simple function to generate vector embedding from product text
export async function generateProductEmbedding(product) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not defined in environment variables.');
    return null;
  }

  const name = product.name || '';
  const description = product.description || product.shortDescription || '';
  const category = product.category || '';
  const brand = product.brand || '';
  const tagsText = Array.isArray(product.tags) ? product.tags.join(', ') : '';

  // Construct structured text representation for embedding (truncated to 800 chars for speed)
  const textToEmbed = `Product: ${name}\nCategory: ${category}\nBrand: ${brand}\nTags: ${tagsText}\nDescription: ${description}`.slice(0, 800);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text: textToEmbed }] },
        outputDimensionality: 768
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.embedding?.values || null;
  } catch (error) {
    // Timeout or network error — gracefully return null without blocking
    return null;
  }
}

// Fetch product details, generate embedding, and update products table
export async function updateProductEmbedding(productId) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials missing for updateProductEmbedding.');
      return false;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch product details
    const { data: product, error } = await supabase
      .from('products')
      .select('id, name, description, shortDescription, category, brand, tags')
      .eq('id', productId)
      .single();

    if (error || !product) {
      console.error(`Error fetching product ${productId} for embedding:`, error?.message || 'Product not found');
      return false;
    }

    // Generate vector
    const embedding = await generateProductEmbedding(product);
    if (!embedding) {
      console.error(`Failed to generate embedding for product ${productId}`);
      return false;
    }

    // Save vector
    const { error: updateError } = await supabase
      .from('products')
      .update({ embedding })
      .eq('id', productId);

    if (updateError) {
      console.error(`Error saving embedding for product ${productId}:`, updateError.message);
      return false;
    }

    console.log(`✅ Embedding generated and saved for product ${productId} (${product.name})`);
    return true;
  } catch (error) {
    console.error(`Exception in updateProductEmbedding for product ${productId}:`, error);
    return false;
  }
}
