// Gemini AI API Client (memanggil webhook n8n)
async function fetchGeminiResponse(chatHistory) {
  const timeoutMs =
    typeof CONFIG !== 'undefined' && typeof CONFIG.REQUEST_TIMEOUT_MS === 'number'
      ? CONFIG.REQUEST_TIMEOUT_MS
      : 25000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const rawEndpoint =
      typeof CONFIG !== 'undefined' && (CONFIG.AI_CHAT_ENDPOINT || CONFIG.N8N_WEBHOOK_URL)
        ? String(CONFIG.AI_CHAT_ENDPOINT || CONFIG.N8N_WEBHOOK_URL).trim()
        : '';

    const endpoint = rawEndpoint || '/api/chat';

    const cleanHistory = (Array.isArray(chatHistory) ? chatHistory : [])
      .filter((msg) => msg && typeof msg.text === 'string' && msg.text.trim() !== '')
      .map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        text: msg.text.trim()
      }));

    if (cleanHistory.length === 0) {
      throw new Error('Pesan chat tidak boleh kosong.');
    }

    const contents = cleanHistory.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    const systemInstructionText =
      typeof CONFIG !== 'undefined' && typeof CONFIG.SYSTEM_INSTRUCTION === 'string'
        ? CONFIG.SYSTEM_INSTRUCTION.trim()
        : '';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        action: 'chat',
        messages: cleanHistory,
        contents,
        systemInstruction: systemInstructionText
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const rawErrorText = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}: ${rawErrorText.slice(0, 200)}`);
    }

    const data = await response.json();
    const replyText =
      data?.reply ||
      data?.text ||
      data?.output ||
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      '';

    if (!replyText || !replyText.trim()) {
      throw new Error('Balasan AI kosong.');
    }

    return replyText.trim();
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Waktu tunggu respons AI habis (timeout).');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
