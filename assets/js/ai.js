// Gemini AI API Client (aman: tanpa API key di frontend)
async function fetchGeminiResponse(chatHistory) {
  const timeoutMs = (typeof CONFIG !== 'undefined' && typeof CONFIG.REQUEST_TIMEOUT_MS === 'number')
    ? CONFIG.REQUEST_TIMEOUT_MS
    : 25000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs); // Timeout default 25 detik

  try {
    const rawEndpoint = (typeof CONFIG !== 'undefined' && typeof CONFIG.AI_CHAT_ENDPOINT === 'string')
      ? CONFIG.AI_CHAT_ENDPOINT.trim()
      : '';

    // Gunakan '/api/chat' jika CONFIG kosong atau mengarah ke endpoint eksternal lama
    const endpoint = (!rawEndpoint || rawEndpoint.startsWith('http'))
      ? '/api/chat'
      : rawEndpoint;

    const cleanHistory = (Array.isArray(chatHistory) ? chatHistory : [])
      .filter(msg => msg && typeof msg.text === 'string' && msg.text.trim() !== '')
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        text: msg.text.trim()
      }));

    if (cleanHistory.length === 0) {
      throw new Error('Pesan chat tidak boleh kosong.');
    }

    const contents = cleanHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    const systemInstructionText = (typeof CONFIG !== 'undefined' && typeof CONFIG.SYSTEM_INSTRUCTION === 'string')
      ? CONFIG.SYSTEM_INSTRUCTION.trim()
      : '';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        messages: cleanHistory,
        contents,
        systemInstruction: systemInstructionText
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      let errDetail = `HTTP ${response.status}`;
      const rawErrorText = await response.text().catch(() => '');

      if (rawErrorText) {
        try {
          const errData = JSON.parse(rawErrorText);
          const msg = errData?.error || errData?.message;
          if (msg) {
            errDetail += `: ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`;
          } else {
            errDetail += `: ${rawErrorText.slice(0, 200)}`;
          }
        } catch (_) {
          errDetail += `: ${rawErrorText.slice(0, 200)}`;
        }
      }

      throw new Error(`Gagal terhubung ke server Gemini AI (${errDetail}).`);
    }

    const data = await response.json();

    const replyText =
      data?.reply ||
      data?.text ||
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      '';

    if (!replyText || !replyText.trim()) {
      throw new Error('Balasan AI kosong.');
    }

    return replyText.trim();
  } catch (err) {
    if (err?.name === 'AbortError') {
      const timeoutErr = new Error('Waktu tunggu respons Gemini AI habis (timeout).');
      console.error('Gemini API Error:', timeoutErr);
      throw timeoutErr;
    }
    console.error('Gemini API Error:', err);
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
