// Gemini AI API Client
async function fetchGeminiResponse(chatHistory) {
  try {
    // API Key otomatis diambil dari environment runtime/window.GEMINI_API_KEY
    const apiKey = window.GEMINI_API_KEY || "AQ.Ab8RN6LyWbMZlL6gEQAqghLNT-sAm6sSG29Mxjtj0JQsvl9Epw";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const contents = chatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          parts: [{ text: CONFIG.SYSTEM_INSTRUCTION }]
        }
      })
    });

    if (!response.ok) {
      throw new Error("Gagal terhubung ke server Gemini AI.");
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error("Gemini API Error:", err);
    throw err;
  }
}