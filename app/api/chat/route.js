import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateProductEmbedding } from '@/lib/ai-embeddings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_SYSTEM_PROMPT = `You are the official AI Fashion & Support Assistant for Vestro Wear House, a premier streetwear and modern fashion brand in Bangladesh.
Your goal is to help customers with their queries regarding apparel sizing, collections, fabrics, order tracking, shipping, and exchange policies.
Be polite, stylish, concise, and helpful. Use a friendly and modern tone. You can reply in English or Bangla depending on the customer's language.

Vestro Wear House policies:
- Nationwide Delivery: 2-3 working days inside Dhaka (৳60), 3-5 working days outside Dhaka (৳120).
- Cash on Delivery available nationwide.
- 7-Day Easy Size & Product Exchange for unworn items with tags intact.
- If you don't know an order-specific detail, politely ask them to reach our support team via live chat or email at support@vestrowearhouse.com.

STRICT GUARDRAILS:
1. Keep the conversation strictly focused on Vestro Wear House, fashion styling, sizing, apparel products, and policies.
2. If the user asks about unrelated topics, politely steer them back to our fashion collections.
3. When recommending products, ALWAYS format each product with a clickable title and image:
- **[Product Name](Link)**
  - Price: [Price] BDT
  - Stock: [Stock Status]
  - [![Product Name](Image URL)](Link)
4. Do NOT invent products, stock quantities, or prices. Only recommend products provided in the context below.`;

export async function POST(request) {
  try {
    const { message, sessionId, productId, action, sessionType, userId } = await request.json();

    let activeUserId = userId;
    let activeSessionType = sessionType || 'customer';

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is missing' }, { status: 500 });
    }

    let currentSessionId = sessionId;
    let sessionStatus = 'ai';

    // ── Handle Action: Talk to Human ──
    if (action === 'talk_to_human') {
      if (!currentSessionId) {
        return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
      }

      // Update session status to human
      const { data: session, error: sessErr } = await supabase
        .from('chat_sessions')
        .update({ status: 'human', updated_at: new Date().toISOString() })
        .eq('session_token', currentSessionId)
        .select('id')
        .single();

      if (sessErr || !session) {
        return NextResponse.json({ error: 'Failed to request agent' }, { status: 500 });
      }

      // Insert system alert message
      await supabase.from('chat_messages').insert({
        session_id: session.id,
        sender: 'admin',
        content: '[System] Customer requested live agent support.'
      });

      return NextResponse.json({ 
        success: true, 
        status: 'human', 
        text: 'I am connecting you with a live support agent. They will reply here shortly.' 
      });
    }

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // ── Load or Create Session ──
    if (currentSessionId) {
      const { data: session, error: sessErr } = await supabase
        .from('chat_sessions')
        .select('id, status, session_type, user_id')
        .eq('session_token', currentSessionId)
        .single();

      if (sessErr || !session) {
        // If not found, create a new one using the provided sessionId as the session_token
        const { data: newSess, error: createErr } = await supabase
          .from('chat_sessions')
          .insert({ 
            session_token: currentSessionId, 
            status: 'ai', 
            session_type: activeSessionType,
            user_id: activeUserId || null
          })
          .select('id, status, session_type')
          .single();

        if (createErr) throw createErr;
        currentSessionId = newSess.id;
        sessionStatus = newSess.status;
        activeSessionType = newSess.session_type || activeSessionType;
      } else {
        currentSessionId = session.id;
        sessionStatus = session.status;
        activeSessionType = session.session_type || activeSessionType;
        
        // Update user_id if it was anonymous before but now logged in
        if (activeUserId && !session.user_id) {
          await supabase.from('chat_sessions').update({ user_id: activeUserId }).eq('id', session.id);
        }
      }
    } else {
      // Create a brand new session with auto UUID
      const sessionToken = 'sess_' + Math.random().toString(36).substring(2, 15);
      const { data: newSess, error: createErr } = await supabase
        .from('chat_sessions')
        .insert({ 
          session_token: sessionToken, 
          status: 'ai', 
          session_type: activeSessionType,
          user_id: activeUserId || null
        })
        .select('id, status, session_type')
        .single();

      if (createErr) throw createErr;
      currentSessionId = newSess.id;
      sessionStatus = newSess.status;
      activeSessionType = newSess.session_type || activeSessionType;
    }

    // Save user's message
    const { error: msgErr } = await supabase.from('chat_messages').insert({
      session_id: currentSessionId,
      sender: 'user',
      content: message.trim()
    });

    if (msgErr) throw msgErr;

    // ── If Session is in Human Mode, return waiting state ──
    if (sessionStatus === 'human') {
      return NextResponse.json({
        sessionId: currentSessionId,
        status: 'human',
        text: 'A support agent has been notified and will reply shortly. Thank you for your patience.'
      });
    }

    // ── Fetch RAG Context (semantic matching) ──
    let contextText = '';
    
    // 1. Check if we have page product context
    if (productId) {
      const { data: prod } = await supabase
        .from('products')
        .select('name, price, sellingPrice, regularPrice, slug, description, stock, images, featuredImage, image')
        .eq('id', productId)
        .single();
        
      if (prod) {
        let imgUrl = prod.featuredImage || prod.image || '';
        if (!imgUrl && prod.images) {
           if (Array.isArray(prod.images) && prod.images.length > 0) {
               imgUrl = prod.images[0];
           } else if (typeof prod.images === 'string') {
               try {
                   const parsed = JSON.parse(prod.images);
                   if (Array.isArray(parsed) && parsed.length > 0) imgUrl = parsed[0];
               } catch (e) {
                   imgUrl = prod.images; // fallback if it's just a raw URL string
               }
           }
        }
        
        // Encode URL to prevent markdown breaking with spaces
        if (imgUrl) imgUrl = encodeURI(imgUrl);
        
        contextText += `[PRIMARY CONTEXT: Product user is currently viewing]\n`;
        contextText += `- Product: ${prod.name} | Price: ${prod.sellingPrice || prod.price} BDT | Stock: ${prod.stock > 0 ? 'In Stock' : 'Out of Stock'} | Link: /product/${prod.slug} | Image: ${imgUrl}\n`;
        contextText += `Description: ${prod.description ? prod.description.substring(0, 300) + '...' : 'No description'}\n\n`;
      }
    }

    // 2. Perform semantic search matching products
    try {
      const queryEmbedding = await generateProductEmbedding({ name: message });
      if (queryEmbedding) {
        const { data: matches, error: rpcErr } = await supabase.rpc('match_products', {
          query_embedding: queryEmbedding,
          match_threshold: 0.35,
          match_count: 5
        });

        if (!rpcErr && matches && matches.length > 0) {
          contextText += `[CONTEXT: Matching Products in Store]\n`;
          matches.forEach(p => {
            // Avoid duplicate with primary context
            if (p.id !== productId) {
              let imgUrl = p.featuredImage || p.image || '';
              if (!imgUrl && p.images) {
                 if (Array.isArray(p.images) && p.images.length > 0) {
                     imgUrl = p.images[0];
                 } else if (typeof p.images === 'string') {
                     try {
                         const parsed = JSON.parse(p.images);
                         if (Array.isArray(parsed) && parsed.length > 0) imgUrl = parsed[0];
                     } catch (e) {
                         imgUrl = p.images;
                     }
                 }
              }
              if (imgUrl) imgUrl = encodeURI(imgUrl);
              contextText += `- Product: ${p.name} | Price: ${p.price} BDT | Stock: ${p.stock > 0 ? 'In Stock' : 'Out of Stock'} | Link: /product/${p.slug} | Image: ${imgUrl}\n`;
            }
          });
        }
      }
    } catch (vectorErr) {
      console.error('Vector search failed in chat route:', vectorErr);
    }

    // ── Load Chat History (last 10 messages) ──
    const { data: history } = await supabase
      .from('chat_messages')
      .select('sender, content')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Map history to Gemini format (roles must alternate between 'user' and 'model')
    const formattedContents = [];
    if (history && history.length > 0) {
      const chronoHistory = [...history].reverse();
      chronoHistory.forEach(msg => {
        const role = msg.sender === 'user' ? 'user' : 'model';
        
        // Ensure we don't have consecutive identical roles
        if (formattedContents.length > 0 && formattedContents[formattedContents.length - 1].role === role) {
          formattedContents[formattedContents.length - 1].parts[0].text += `\n${msg.content}`;
        } else {
          formattedContents.push({
            role: role,
            parts: [{ text: msg.content }]
          });
        }
      });
    }

    // If history mapping is empty or doesn't end with the user's latest message, add it
    const lastMsgInHistory = formattedContents[formattedContents.length - 1];
    if (!lastMsgInHistory || lastMsgInHistory.role !== 'user') {
      formattedContents.push({
        role: 'user',
        parts: [{ text: message.trim() }]
      });
    }

    const dynamicSystemPrompt = BASE_SYSTEM_PROMPT + (contextText ? `\n\n${contextText}` : '');

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          role: 'system',
          parts: [{ text: dynamicSystemPrompt }]
        },
        contents: formattedContents,
        generationConfig: {
          temperature: 0.6,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini generateContent failed:', errorData);
      return NextResponse.json({ error: 'Failed to generate chat response' }, { status: 500 });
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I am unable to answer right now.';

    // Save AI response
    await supabase.from('chat_messages').insert({
      session_id: currentSessionId,
      sender: 'ai',
      content: generatedText
    });

    // --- Enforce 50 messages limit per session ---
    try {
      const { data: allMessages } = await supabase
        .from('chat_messages')
        .select('id')
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: false });

      if (allMessages && allMessages.length > 50) {
        const idsToDelete = allMessages.slice(50).map(m => m.id);
        if (idsToDelete.length > 0) {
          await supabase.from('chat_messages').delete().in('id', idsToDelete);
        }
      }
    } catch (cleanupErr) {
      console.error('Failed to cleanup old messages:', cleanupErr);
    }
    // ---------------------------------------------

    // Update session updated_at
    await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', currentSessionId);

    return NextResponse.json({
      sessionId: currentSessionId,
      status: 'ai',
      text: generatedText
    });

  } catch (error) {
    console.error('AI chat route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
