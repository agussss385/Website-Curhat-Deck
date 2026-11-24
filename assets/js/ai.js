// Gemini AI API Client (aman: tanpa API key di frontend)
async function fetchGeminiResponse(chatHistory) {
  try {
    const endpoint = (typeof CONFIG !== 'undefined' && CONFIG.AI_CHAT_ENDPOINT)
      ? CONFIG.AI_CHAT_ENDPOINT.trim()
      : '/api/chat';

    const contents = (Array.isArray(chatHistory) ? chatHistory : []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const systemInstructionText = (typeof CONFIG !== 'undefined' && CONFIG.SYSTEM_INSTRUCTION)
      ? CONFIG.SYSTEM_INSTRUCTION
      : '';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: chatHistory,
        contents,
        systemInstruction: systemInstructionText
      })
    });

    if (!response.ok) {
      let errDetail = `HTTP ${response.status}`;
      try {
        const errData = await response.json();
        if (errData?.error) errDetail += `: ${errData.error}`;
      } catch (_) {
        // Abaikan jika body error bukan JSON
      }
      throw new Error(`Gagal terhubung ke server Gemini AI (${errDetail}).`);
    }

    const data = await response.json();

    // Mendukung format balasan umum: { reply }, { text }, atau struktur candidates Gemini
    const replyText =
      data?.reply ||
      data?.text ||
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      '';

    if (!replyText) {
      throw new Error('Balasan AI kosong.');
    }

    return replyText;
  } catch (err) {
    console.error('Gemini API Error:', err);
    throw err;
  }
}
