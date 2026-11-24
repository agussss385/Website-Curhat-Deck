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
      : messages
          .filter(msg => msg && typeof msg.text === 'string' && msg.text.trim() !== '')
          .map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text.trim() }]
          }));

    if (contents.length === 0) {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
    }

    const model = 'gemini-3.8-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const payload = {
      contents,
      ...(typeof systemInstruction === 'string' && systemInstruction.trim()
        ? { systemInstruction: { parts: [{ text: systemInstruction.trim() }] } }
        : {})
    };

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const rawText = await geminiRes.text();
    let geminiData = {};
    if (rawText) {
      try {
        geminiData = JSON.parse(rawText);
      } catch (_) {
        geminiData = {};
      }
    }

    if (!geminiRes.ok) {
      return res.status(geminiRes.status).json({
        error: geminiData?.error?.message || `Permintaan ke Gemini API gagal (HTTP ${geminiRes.status})`
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
