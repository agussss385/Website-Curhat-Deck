export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY belum diatur di server' });
  }

  try {
    const { messages = [], contents: rawContents, systemInstruction = '' } = req.body || {};

    const contents = Array.isArray(rawContents) && rawContents.length > 0
      ? rawContents
      : messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));

    const model = 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const payload = {
      contents,
      ...(systemInstruction
        ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
        : {})
    };

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      return res.status(geminiRes.status).json({
        error: geminiData?.error?.message || 'Permintaan ke Gemini API gagal'
      });
    }

    const reply =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Maaf, aku belum bisa merangkai balasan sekarang.';

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Server /api/chat error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server AI' });
  }
}
