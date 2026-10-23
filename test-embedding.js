const apiKey = 'AIzaSyCFzgHE-5SqwsgBAPd11zMG5CvFhJlntmM';

async function testEmbedding() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: { parts: [{ text: 'StellarMartBD e-commerce' }] },
      outputDimensionality: 768
    })
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('API Error:', data);
  } else {
    const values = data.embedding?.values;
    console.log('Embedding dimension:', values?.length);
    console.log('First 5 values:', values?.slice(0, 5));
  }
}

testEmbedding().catch(console.error);
