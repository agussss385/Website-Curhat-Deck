// Gemini AI API Client (memanggil webhook n8n)
function resolveAiChatEndpoint() {
  if (typeof CONFIG === 'undefined' || !CONFIG) {
    return '';
  }

  const candidate =
    CONFIG.AI_CHAT_ENDPOINT ||
    CONFIG.CHAT_WEBHOOK_URL ||
    CONFIG.N8N_WEBHOOK_URL ||
    '';

  return String(candidate).trim();
}

function isPlaceholderOrInvalidEndpoint(endpoint) {
  if (!endpoint) return true;

  const placeholders = [
    'DOMAIN_N8N_KAMU',
    '<URL-HTTPS-N8N-KAMU>',
    '<url-tunnel-kamu>',
    'your-domain.com'
  ];

  if (placeholders.some((token) => endpoint.includes(token))) {
    return true;
  }

  // Jika halaman dibuka lewat HTTPS (seperti Vercel), endpoint HTTP/localhost tidak valid
  const isHttpsPage =
    typeof window !== 'undefined' &&
    window.location &&
    window.location.protocol === 'https:';

  if (isHttpsPage && /^http:\/\//i.test(endpoint)) {
    return true;
  }

  return false;
}

function extractReplyFromPayload(payload) {
  // Jika n8n mengembalikan array item (misalnya [{ reply: "..." }] atau [{ output: "..." }])
  const item = Array.isArray(payload) ? payload[0] : payload;
  if (!item || typeof item !== 'object') {
    return typeof payload === 'string' ? payload : '';
  }

  const candidate =
    item.reply ??
    item.text ??
    item.output ??
    item.message ??
    item.response ??
    item.data?.reply ??
    item.data?.output ??
    item.data?.text ??
    item.candidates?.[0]?.content?.parts?.[0]?.text ??
    '';

  return typeof candidate === 'string' ? candidate : '';
}

async function fetchGeminiResponse(chatHistory) {
  const timeoutMs =
    typeof CONFIG !== 'undefined' &&
    typeof CONFIG.REQUEST_TIMEOUT_MS === 'number' &&
    CONFIG.REQUEST_TIMEOUT_MS > 0
      ? CONFIG.REQUEST_TIMEOUT_MS
      : 25000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const endpoint = resolveAiChatEndpoint();

    if (isPlaceholderOrInvalidEndpoint(endpoint)) {
      throw new Error(
        'Endpoint AI chat belum diatur di config.js (pastikan memakai URL HTTPS n8n yang valid).'
      );
    }

    const cleanHistory = (Array.isArray(chatHistory) ? chatHistory : [])
      .filter(
        (msg) =>
          msg &&
          typeof msg.text === 'string' &&
          msg.text.trim() !== ''
      )
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
      throw new Error(
        `HTTP ${response.status}${rawErrorText ? `: ${rawErrorText.slice(0, 200)}` : ''}`
      );
    }

    const rawText = await response.text();
    let parsedData = {};
    try {
      parsedData = rawText ? JSON.parse(rawText) : {};
    } catch {
      parsedData = rawText;
    }

    const replyText = extractReplyFromPayload(parsedData).trim();
    if (!replyText) {
      throw new Error('Balasan AI kosong.');
    }

    return replyText;
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Waktu tunggu respons AI habis (timeout).');
    }
    if (err instanceof TypeError && /fetch/i.test(err.message || '')) {
      throw new Error(
        'Gagal terhubung ke server AI (cek tunnel HTTPS n8n, status workflow, atau CORS).'
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

window.fetchGeminiResponse = fetchGeminiResponse;
