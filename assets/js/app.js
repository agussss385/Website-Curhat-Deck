function buildLocalCurhatFallback(lastMessage = "", chatHistory = []) {
  const raw = String(lastMessage || "").trim();
  const q = raw.toLowerCase();

  const recentModelTexts = (Array.isArray(chatHistory) ? chatHistory : [])
    .filter((m) => m && m.role === "model")
    .slice(-3)
    .map((m) => String(m.text || "").toLowerCase());

  const avoidRepeat = (candidates) =>
    candidates.find(
      (c) =>
        !recentModelTexts.some((prev) =>
          prev.includes(c.slice(0, 28).toLowerCase())
        )
    ) || candidates[0];

  if (/^(hai+|halo+|hi+|hey+|yo+|p|tes|ping)[\s!.?]*$/i.test(q)) {
    return avoidRepeat([
      "Halo! Gimana Polimedia hari ini, aman atau lagi bikin pala ngebul? 🫂",
      "Hai! Lagi santai nih apa lagi kejar-kejaran sama sesuatu di kampus?",
      "Yo, halo! Ada apa nih, lagi pengen ngobrolin apa?"
    ]);
  }

  if (
    /^(apa kabar|kabar gimana|gimana kabarnya|gimana kabar|how are you)[\s?!.]*$/i.test(
      q
    )
  ) {
    return avoidRepeat([
      "Aman sih, masih waras walau kadang ikut kebawa panik liat anak-anak ngebut tugas 😂 Kamu sendiri gimana, lagi aman?",
      "Baik kok! Lebih penting kamunya sih—lagi enteng atau lagi banyak beban nih?",
      "Santai aja di sini. Kabar kamu gimana, lagi banyak pikiran nggak?"
    ]);
  }

  if (
    q.includes("matkul") ||
    q.includes("mata kuliah") ||
    q.includes("jurusan") ||
    q.includes("prodi") ||
    q.includes("sks") ||
    q.includes("semester")
  ) {
    return avoidRepeat([
      "Di Polimedia tiap jurusan/prodi emang punya rasanya masing-masing—ada yang berkutat di coding/interaktif & aset digital kayak Multimedia/TRM, ada yang ngulik visual, tipografi, branding, layout, atau fotografi di desain/grafika, ada yang sibuk produksi konten/film/TV/radio/animasi, ada juga yang di ranah bisnis/pemasaran/event kreatif. Detail matkul per semesternya bisa beda tiap angkatan & kurikulum, jadi paling pas cek pedoman akademik atau dosen wali. Kamu lagi di prodi mana, ada matkul yang lagi bikin pusing?",
      "Kalau ngomongin matkul di Polimedia, biasanya berasa banget bedanya antara kelas teori sama praktik/studio/lab. Tergantung jurusan/prodi kamu—entah multimedia, desain, produksi media, grafika/penerbitan/pengemasan, atau manajemen/pemasaran/event—bebannya sering numpuk pas udah masuk praktik inti. Kamu sendiri lagi jalanin matkul apa?"
    ]);
  }

  if (
    q.includes("revisi") ||
    q.includes("deadline") ||
    q.includes("dosen") ||
    q.includes("ta") ||
    q.includes("tugas akhir") ||
    q.includes("proyek") ||
    q.includes("praktikum") ||
    q.includes("tugas") ||
    q.includes("susah")
  ) {
    return avoidRepeat([
      "Aduh, bagian paling bikin males itu pas udah ngerasa kelar eh malah muncul catatan baru atau *deadline* mepet 😭 Lagi kena tugas/revisi apaan sih?",
      "Wajar banget ngerasa capek duluan kalau tugas sama revisi dateng barengan. Bagian mana yang paling bikin kamu mumet sekarang?",
      "Emang suka gitu ya, satu beres satu nongol lagi. Lagi ngerjain apa nih?"
    ]);
  }

  if (
    q.includes("creative block") ||
    q.includes("stuck") ||
    q.includes("ide") ||
    q.includes("mentok") ||
    q.includes("burnout") ||
    q.includes("bingung") ||
    q.includes("cape") ||
    q.includes("capek")
  ) {
    return avoidRepeat([
      "Kalau otak udah mentok atau *burnout*, dipaksa mikir keras kadang malah makin buntu sih 🫂 Lagi ngerasa capek atau *stuck* di bagian mana?",
      "Lagi kerasa *stuck* ya? Kadang emang butuh diem bentar atau pindah haluan sebentar biar kepala nggak ngebul.",
      "Kerasa capek ya? Ceritain aja kenapa, nggak usah buru-buru nyari solusi dulu."
    ]);
  }

  if (
    q.includes("magang") ||
    q.includes("masa depan") ||
    q.includes("fomo") ||
    q.includes("anxious") ||
    q.includes("cemas") ||
    q.includes("portofolio") ||
    q.includes("karier") ||
    q.includes("karir")
  ) {
    return avoidRepeat([
      "Ngelihat orang lain keliatan udah siap atau progresnya ngebut emang gampang bikin kepikiran sendiri, padahal jalan tiap orang beda-beda. Lagi kepikiran soal magang atau apa nih?",
      "Urusan *portofolio*, magang, sama arah ke depan emang suka bikin *overthinking* diem-diem. Bagian mana yang paling bikin kamu nggak tenang?"
    ]);
  }

  return avoidRepeat([
    `Hmm, soal "${raw}" ya... ceritain aja gimana ceritanya, aku dengerin kok.`,
    `Oke, dengerin nih—maksudnya gimana tuh soal "${raw}"?`,
    `Lagi ngerasain gimana nih soal "${raw}"? Santai aja ceritanya.`
  ]);
}

function extractGeminiReplyText(payload) {
  const item = Array.isArray(payload) ? payload[0] : payload;
  if (!item || typeof item !== "object") return "";

  const candidates = [
    item.reply,
    item.text,
    item.output,
    item.response,
    item.result,
    item.answer,
    item.message,
    item.data?.reply,
    item.data?.text,
    item.data?.output,
    item.json?.reply,
    item.json?.text,
    item.json?.output,
    item.content?.parts?.[0]?.text,
    item.candidates?.[0]?.content?.parts?.[0]?.text
  ];

  for (const val of candidates) {
    if (typeof val === "string" && val.trim()) {
      return val.trim();
    }
  }
  return "";
}

async function fetchGeminiResponse(chatMessages = []) {
  const FALLBACK_WEBHOOK_URL =
    "https://born-stem-loads-jacket.trycloudflare.com/webhook/curhatdeck-router";

  const cfg =
    typeof window !== "undefined" && window.CONFIG && typeof window.CONFIG === "object"
      ? window.CONFIG
      : {};

  const rawEndpoint = String(
    cfg.AI_CHAT_ENDPOINT ||
      cfg.N8N_WEBHOOK_URL ||
      cfg.BOOKING_ENDPOINT ||
      FALLBACK_WEBHOOK_URL ||
      ""
  ).trim();

  const isPlaceholder =
    !rawEndpoint ||
    !/^https?:\/\//i.test(rawEndpoint) ||
    rawEndpoint.includes("<URL-HTTPS-N8N-KAMU>") ||
    rawEndpoint.includes("YOUR_N8N_WEBHOOK") ||
    rawEndpoint === "https://URL-WEBHOOK-N8N-KAMU";

  const defaultPolimediaSystemInstruction = `Kamu adalah CurhatBuddy di platform CurhatDeck, teman ngobrol santai untuk mahasiswa Polimedia (Politeknik Negeri Media Kreatif).

Cara ngobrol kamu:
- Ngobrol kayak temen se-kampus Polimedia yang santai, natural, hangat, dan nggak kaku.
- Variasikan pembukaan, pilihan kata, dan cara merespons tiap giliran agar terasa hidup dan nggak berulang.
- Jangan ngasih tips, poin-poin, atau cara penyelesaian 1-2-3 kecuali user memang minta saran/tips secara eksplisit. Cukup respon sewajarnya obrolan sehari-hari, validasi perasaannya, dan tanya atau tanggapi dengan santai.
- Jangan pakai template kaku kayak "Denger kok soal..." atau gaya bot customer service yang formal dan menggurui.
- Paham konteks Polimedia: tugas/praktikum/proyek/karya, revisi, deadline, tugas akhir, burnout/creative block, magang/portofolio, pergaulan kampus, dan permasalahan mahasiswa pada umumnya.
- Kalau ditanya soal mata kuliah per jurusan/prodi di Polimedia, jawab santai sesuai gambaran jurusan/prodi di Polimedia (seperti multimedia/TRM, desain/grafika/penerbitan/pengemasan, produksi media/film/TV/radio/animasi, atau bisnis/pemasaran/event kreatif) dan ingatkan secara natural bahwa detail kurikulum/matkul per semester tiap angkatan paling pas dicek ke pedoman akademik atau dosen wali.
- Kalau ada tanda krisis berat atau menyakiti diri sendiri, sarankan dengan lembut untuk cek tombol SOS atau booking sesi 1-on-1 dengan konselor.`;

  const systemInstruction = String(
    cfg.SYSTEM_INSTRUCTION || defaultPolimediaSystemInstruction
  ).trim();

  const cleanMessages = (Array.isArray(chatMessages) ? chatMessages : [])
    .filter((m) => m && typeof m.text === "string" && m.text.trim() !== "")
    .map((m) => ({
      role: m.role === "user" ? "user" : "model",
      text: m.text.trim()
    }));

  const lastUserText =
    [...cleanMessages].reverse().find((m) => m.role === "user")?.text ||
    cleanMessages[cleanMessages.length - 1]?.text ||
    "";

  if (isPlaceholder) {
    return buildLocalCurhatFallback(lastUserText, cleanMessages);
  }

  try {
    const response = await fetch(rawEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "ai_chat",
        source: "curhatdeck",
        campus: "Polimedia",
        systemInstruction,
        messages: cleanMessages,
        history: cleanMessages,
        lastMessage: lastUserText,
        message: lastUserText,
        prompt: lastUserText
      })
    });

    const rawText = await response.text().catch(() => "");

    if (!response.ok) {
      throw new Error(`Webhook HTTP ${response.status}: ${rawText.slice(0, 120)}`);
    }

    if (rawText) {
      try {
        const parsed = JSON.parse(rawText);
        const extracted = extractGeminiReplyText(parsed);
        if (extracted) {
          return extracted;
        }
      } catch (_) {
        const plain = rawText.trim();
        if (plain && !plain.startsWith("<!DOCTYPE") && !plain.startsWith("<html")) {
          return plain;
        }
      }
    }

    throw new Error("Respons webhook kosong atau field reply tidak ditemukan.");
  } catch (err) {
    console.warn("AI chat fallback triggered:", err);
    return buildLocalCurhatFallback(lastUserText, cleanMessages);
  }
}

window.fetchGeminiResponse = fetchGeminiResponse;
