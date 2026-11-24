// api.js — Letakkan di folder root proyek (sejajar dengan index.html dan app.js)

(function () {
  const DEFAULT_MODEL = "gemini-2.5-flash";

  function getRuntimeConfig() {
    if (typeof window !== "undefined" && window.CONFIG && typeof window.CONFIG === "object") {
      return window.CONFIG;
    }
    if (typeof CONFIG !== "undefined" && typeof CONFIG === "object") {
      return CONFIG;
    }
    return {};
  }

  function formatGeminiContents(chatMessages = []) {
    return (Array.isArray(chatMessages) ? chatMessages : [])
      .filter((msg) => msg && typeof msg.text === "string" && msg.text.trim() !== "")
      .map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text.trim() }]
      }));
  }

  function extractReplyText(data) {
    if (!data || typeof data !== "object") return "";

    // Format standar respons Gemini REST API
    const candidateText = data?.candidates?.[0]?.content?.parts
      ?.map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();

    if (candidateText) return candidateText;

    // Fallback jika endpoint mengembalikan format JSON kustom
    if (typeof data.reply === "string" && data.reply.trim()) return data.reply.trim();
    if (typeof data.text === "string" && data.text.trim()) return data.text.trim();
    if (typeof data.output === "string" && data.output.trim()) return data.output.trim();

    return "";
  }

  async function fetchGeminiResponse(chatMessages = []) {
    const cfg = getRuntimeConfig();

    const apiKey = String(
      cfg.GEMINI_API_KEY ||
        cfg.API_KEY ||
        cfg.geminiApiKey ||
        cfg.apiKey ||
        ""
    ).trim();

    const customChatEndpoint = String(
      cfg.AI_CHAT_ENDPOINT ||
        cfg.GEMINI_ENDPOINT ||
        cfg.aiChatEndpoint ||
        ""
    ).trim();

    const model = String(
      cfg.GEMINI_MODEL ||
        cfg.geminiModel ||
        DEFAULT_MODEL
    ).trim();

    const systemInstruction = String(
      cfg.SYSTEM_INSTRUCTION ||
        cfg.systemInstruction ||
        ""
    ).trim();

    const contents = formatGeminiContents(chatMessages);

    if (!contents.length) {
      throw new Error("Pesan chat kosong.");
    }

    // Jika memakai endpoint kustom/proxy sendiri
    if (customChatEndpoint) {
      const proxyRes = await fetch(customChatEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "ai_chat",
          model,
          systemInstruction,
          messages: chatMessages,
          contents
        })
      });

      const proxyData = await proxyRes.json().catch(() => ({}));
      if (!proxyRes.ok || proxyData?.ok === false) {
        throw new Error(proxyData?.error?.message || proxyData?.error || `HTTP ${proxyRes.status}`);
      }

      const proxyReply = extractReplyText(proxyData);
      if (!proxyReply) {
        throw new Error("Respon dari endpoint AI kosong.");
      }

      return proxyReply;
    }

    // Panggilan langsung ke Gemini API menggunakan API key dari CONFIG
    if (!apiKey) {
      throw new Error(
        "API key Gemini belum diisi di config.js (tambahkan GEMINI_API_KEY di window.CONFIG)."
      );
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const requestBody = {
      contents
    };

    if (systemInstruction) {
      requestBody.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error?.message || `Gagal menghubungi Gemini API (HTTP ${response.status})`);
    }

    const replyText = extractReplyText(data);
    if (!replyText) {
      throw new Error("CurhatBuddy tidak mengembalikan teks balasan.");
    }

    return replyText;
  }

  // Ekspos ke global scope agar bisa dipanggil oleh app.js
  if (typeof window !== "undefined") {
    window.fetchGeminiResponse = fetchGeminiResponse;
  }
})();
