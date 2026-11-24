const MODEL_NAME = 'gemini-3.8-flash';
const MAX_RETRIES = 2;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeContents(body) {
  if (Array.isArray(body?.contents) && body.contents.length > 0) {
    return body.contents;
  }

  if (Array.isArray(body?.messages)) {
    return body.messages
      .filter((item) => item && typeof item.text === 'string' && item.text.trim() !== '')
      .map((item) => ({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text: item.text.trim() }]
      }));
  }

  return [];
}

function extractReplyText(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('')
    .trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY belum diatur di Environment Variables Vercel.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const contents = normalizeContents(body);

    if (contents.length === 0) {
      return res.status(400).json({ error: 'Pesan chat tidak boleh kosong.' });
    }

    const systemText = typeof body.systemInstruction === 'string' && body.systemInstruction.trim()
      ? body.systemInstruction.trim()
      : 'Kamu adalah CurhatBuddy, teman curhat yang empatik, suportif, ramah, dan tidak menghakimi.';

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const payload = {
      contents,
      systemInstruction: {
        parts: [{ text: systemText }]
      }
    };

    let lastStatus = 500;
    let lastErrorText = 'Gagal menghubungi Gemini API.';

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const reply = extractReplyText(data) || 'Maaf, aku belum bisa menyusun balasan saat ini. Coba ulangi ya!';
        return res.status(200).json({ reply });
      }

      lastStatus = response.status;
      lastErrorText = data?.error?.message || `Gemini API error (${response.status})`;

      const isTransient = response.status === 503 || response.status === 429 || response.status >= 500;
      if (!isTransient || attempt === MAX_RETRIES) {
        break;
      }

      await sleep(700 * (attempt + 1));
    }

    return res.status(lastStatus).json({ error: lastErrorText });
  } catch (err) {
    console.error('Error di /api/chat:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan internal pada server chat.' });
  }
}
