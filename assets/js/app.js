// Helper AI Chat CurhatBuddy (webhook n8n + fallback santai anak Polimedia)
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

function appData() {
  const initialWelcome = {
    role: "model",
    text: "Halo! Aku CurhatBuddy 🫂 Mau ngobrolin masalah di Polimedia, matkul per jurusan, tugas/revisi, atau apa aja yang lagi kepikiran? Santai aja di sini."
  };

  return {
    currentRole: "student",
    activeTab: "ai-chat",
    counselorStatus: "Online",
    showSosModal: false,
    studentUser: null,
    userInput: "",
    isAiThinking: false,
    chatMessages: [initialWelcome],
    isSubmittingBooking: false,
    bookings: [],
    bookingForm: {
      name: "",
      contact: "",
      faculty: "",
      mode: "Offline",
      platform: "Google Meet",
      location: "",
      date: "",
      time: "",
      topic: ""
    },
    toast: {
      show: false,
      type: "success",
      message: "",
      _timer: null
    },
    authModal: {
      isOpen: false,
      mode: "login",
      loginForm: {
        name: "",
        password: ""
      },
      registerForm: {
        name: "",
        email: "",
        faculty: "",
        password: ""
      }
    },

    init() {
      this.refreshIcons();
      this.scrollChatToBottom();
    },

    ensureStudentLoggedIn(featureLabel = "fitur ini") {
      if (this.studentUser) {
        return true;
      }
      this.showToast(
        `Silakan login terlebih dahulu untuk memakai ${featureLabel}.`,
        "error"
      );
      this.openAuthModal("login");
      return false;
    },

    showToast(message, type = "success") {
      this.toast.message = message;
      this.toast.type = type;
      this.toast.show = true;

      if (this.toast._timer) {
        clearTimeout(this.toast._timer);
      }

      this.toast._timer = setTimeout(() => {
        this.toast.show = false;
      }, 3500);
    },

    refreshIcons() {
      this.$nextTick(() => {
        if (window.lucide && typeof window.lucide.createIcons === "function") {
          try {
            window.lucide.createIcons();
          } catch (_) {}
        }
      });
    },

    scrollChatToBottom() {
      this.$nextTick(() => {
        const win = document.getElementById("chatWindow");
        if (win) {
          win.scrollTop = win.scrollHeight;
        }
      });
    },

    toggleRoleModal() {
      this.currentRole = this.currentRole === "student" ? "counselor" : "student";
      this.showToast(
        this.currentRole === "counselor"
          ? "Beralih ke Mode Konselor"
          : "Beralih ke Mode Mahasiswa"
      );
      this.refreshIcons();
    },

    openAuthModal(mode = "login") {
      this.authModal.mode = mode;
      this.authModal.isOpen = true;
      this.refreshIcons();
    },

    closeAuthModal() {
      this.authModal.isOpen = false;
    },

    loginStudent() {
      const name = (this.authModal.loginForm.name || "").trim();
      if (!name) {
        this.showToast("Masukkan nama kamu terlebih dahulu!", "error");
        return;
      }

      const registeredFaculty = (this.authModal.registerForm.faculty || "").trim();
      const registeredEmail = (this.authModal.registerForm.email || "").trim();

      this.studentUser = {
        name,
        email:
          registeredEmail ||
          `${name.toLowerCase().replace(/\s+/g, ".")}@polimedia.ac.id`,
        faculty: registeredFaculty || this.studentUser?.faculty || ""
      };

      if (this.studentUser.faculty && !this.bookingForm.faculty) {
        this.bookingForm.faculty = this.studentUser.faculty;
      }

      this.authModal.loginForm.password = "";
      this.authModal.isOpen = false;
      this.showToast(
        `Selamat datang, ${name}! Chat AI & jadwal booking sudah terbuka.`
      );
      this.refreshIcons();
    },

    registerStudent() {
      const name = (this.authModal.registerForm.name || "").trim();
      const email = (this.authModal.registerForm.email || "").trim();
      const faculty = (this.authModal.registerForm.faculty || "").trim();

      if (!name) {
        this.showToast("Nama lengkap wajib diisi!", "error");
        return;
      }

      this.authModal.loginForm.name = name;
      if (email) {
        this.authModal.registerForm.email = email;
      }
      if (faculty) {
        this.bookingForm.faculty = faculty;
      }
      this.authModal.registerForm = {
        name: "",
        email: "",
        faculty: "",
        password: ""
      };
      this.authModal.mode = "login";
      this.showToast(
        `Akun ${name} berhasil didaftarkan! Silakan login untuk melanjutkan.`
      );
      this.refreshIcons();
    },

    logoutStudent() {
      this.studentUser = null;
      this.showToast("Kamu telah keluar dari akun mahasiswa.");
      this.refreshIcons();
    },

    clearChat() {
      if (!this.ensureStudentLoggedIn("Chat AI CurhatBuddy")) return;

      this.chatMessages = [initialWelcome];
      this.showToast("Riwayat chat dibersihkan.");
      this.scrollChatToBottom();
      this.refreshIcons();
    },

    async sendQuickPrompt(promptText) {
      if (!this.ensureStudentLoggedIn("Chat AI CurhatBuddy")) return;

      this.activeTab = "ai-chat";
      this.userInput = promptText;
      this.refreshIcons();
      await this.sendChatMessage();
    },

    async sendChatMessage() {
      if (!this.ensureStudentLoggedIn("Chat AI CurhatBuddy")) return;
      if (this.isAiThinking) return;

      const text = (this.userInput || "").trim();
      if (!text) return;

      this.chatMessages.push({
        role: "user",
        text
      });
      this.userInput = "";
      this.isAiThinking = true;
      this.scrollChatToBottom();

      try {
        const replyText = await fetchGeminiResponse(this.chatMessages);

        this.chatMessages.push({
          role: "model",
          text: replyText
        });
        this.scrollChatToBottom();
      } finally {
        this.isAiThinking = false;
        this.refreshIcons();
      }
    },

    getWebhookEndpoint() {
      const FALLBACK_WEBHOOK_URL =
        "https://born-stem-loads-jacket.trycloudflare.com/webhook/curhatdeck-router";

      const cfg =
        typeof window !== "undefined" && window.CONFIG
          ? window.CONFIG
          : typeof CONFIG !== "undefined"
            ? CONFIG
            : {};

      const rawUrl =
        cfg.BOOKING_ENDPOINT ||
        cfg.BOOKING_WEBHOOK_URL ||
        cfg.N8N_WEBHOOK_URL ||
        cfg.WEBHOOK_URL ||
        cfg.bookingEndpoint ||
        cfg.bookingWebhookUrl ||
        cfg.n8nWebhookUrl ||
        FALLBACK_WEBHOOK_URL ||
        "";

      return String(rawUrl).trim();
    },

    hasValidWebhookEndpoint(endpoint) {
      const url = String(endpoint || "").trim();
      if (!url) return false;
      if (!/^https?:\/\//i.test(url)) return false;
      if (url.includes("<URL-HTTPS-N8N-KAMU>")) return false;
      if (url.includes("YOUR_N8N_WEBHOOK")) return false;
      if (url === "https://URL-WEBHOOK-N8N-KAMU") return false;
      return true;
    },

    isValidEmail(val) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val || "").trim());
    },

    async submitBooking() {
      if (!this.ensureStudentLoggedIn("jadwal booking konseling")) return;
      if (this.isSubmittingBooking) return;

      const name = (this.bookingForm?.name || "").trim();
      const contact = (this.bookingForm?.contact || "").trim();
      const faculty = (
        this.bookingForm?.faculty ||
        this.studentUser?.faculty ||
        "-"
      ).trim();
      const mode = this.bookingForm?.mode === "Online" ? "Online" : "Offline";
      const platform = mode === "Online" ? "Google Meet" : "";
      const rawLocation = (this.bookingForm?.location || "").trim();
      const date = this.bookingForm?.date || "";
      const cleanTime = String(this.bookingForm?.time || "")
        .replace(/\s*WIB\s*/gi, "")
        .trim();
      const topic = (this.bookingForm?.topic || "").trim();

      if (!name || (!date && !cleanTime)) {
        this.showToast("Lengkapi nama dan jadwal sesi terlebih dahulu!", "error");
        return;
      }

      this.isSubmittingBooking = true;

      const isEmail = this.isValidEmail(contact);
      const phoneDigits = contact.replace(/\D/g, "");
      const isWa = !isEmail && phoneDigits.length >= 8;

      const contactType =
        isEmail && isWa
          ? "email_wa"
          : isEmail
            ? "email"
            : isWa
              ? "wa"
              : "none";

      let notifText = "notifikasi diproses";
      if (isEmail && isWa) {
        notifText = "notifikasi email & WA diproses";
      } else if (isEmail) {
        notifText = "notifikasi email diproses";
      } else if (isWa) {
        notifText = "notifikasi WA diproses";
      }

      const targetEmail = isEmail
        ? contact
        : (this.studentUser?.email || "").trim();

      const timestampId = Date.now();
      const bookingId = String(timestampId);
      const schedule = `${date}${date && cleanTime ? " " : ""}${
        cleanTime ? `(${cleanTime} WIB)` : ""
      }`.trim();

      const location =
        mode === "Online"
          ? `Online (Google Meet)${rawLocation ? ` - ${rawLocation}` : ""}`
          : rawLocation || "Ruang Konseling";

      const newBooking = {
        id: timestampId,
        bookingId,
        action: "booking",
        name,
        contact,
        contactType,
        targetEmail,
        faculty,
        major: faculty,
        mode,
        platform,
        meetingLink: "",
        location,
        date,
        time: cleanTime ? `${cleanTime} WIB` : "",
        schedule,
        topic,
        studentEmail: this.studentUser?.email || "",
        status: "Pending",
        source: "curhatdeck",
        submittedAt: new Date().toISOString()
      };

      this.bookings.unshift(newBooking);
      this.bookingForm = {
        name: "",
        contact: "",
        faculty: this.studentUser?.faculty || "",
        mode: "Offline",
        platform: "Google Meet",
        location: "",
        date: "",
        time: "",
        topic: ""
      };

      const endpoint = this.getWebhookEndpoint();

      if (!this.hasValidWebhookEndpoint(endpoint)) {
        this.isSubmittingBooking = false;
        this.showToast(
          "Booking tersimpan di sesi aktif (endpoint booking belum diatur).",
          "error"
        );
        return;
      }

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(newBooking)
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || data?.ok === false) {
          throw new Error(data?.error || `HTTP ${res.status}`);
        }

        if (data?.meetingLink) {
          newBooking.meetingLink = String(data.meetingLink).trim();
        }
        if (data?.bookingId) {
          newBooking.bookingId = String(data.bookingId);
        }
        this.bookings = [...this.bookings];

        this.showToast(`Permintaan booking terkirim & ${notifText}!`);
      } catch (err) {
        console.error("Booking submit error:", err);
        this.showToast(
          "Booking tersimpan di sesi aktif, tapi gagal mengirim ke server.",
          "error"
        );
      } finally {
        this.isSubmittingBooking = false;
      }
    },

    setCounselorStatus(status) {
      this.counselorStatus = status;
      this.showToast(`Status konselor diubah menjadi ${status}`);
      this.refreshIcons();
    },

    updateBookingTargetEmail(id, email) {
      const target = this.bookings.find((b) => b.id === id || b.bookingId === id);
      if (!target) return;

      const cleaned = (email || "").trim();
      target.targetEmail = cleaned;
      this.bookings = [...this.bookings];
      this.showToast(
        cleaned
          ? `Email tujuan diubah ke ${cleaned}`
          : "Email tujuan dikosongkan."
      );
    },

    updateBookingMode(id, newMode) {
      const target = this.bookings.find((b) => b.id === id || b.bookingId === id);
      if (!target) return;

      const normalizedMode = newMode === "Online" ? "Online" : "Offline";
      target.mode = normalizedMode;
      target.platform = normalizedMode === "Online" ? "Google Meet" : "";

      if (normalizedMode === "Offline") {
        target.meetingLink = "";
        if (!target.location || target.location.startsWith("Online")) {
          target.location = "Ruang Konseling";
        }
      } else {
        target.location = "Online (Google Meet)";
      }

      this.bookings = [...this.bookings];
      this.showToast(`Mode booking diubah menjadi ${normalizedMode}.`);
    },

    updateMeetingLink(id, link, notifyWebhook = false) {
      const target = this.bookings.find((b) => b.id === id || b.bookingId === id);
      if (!target) return;

      const cleanedLink = (link || "").trim();
      target.mode = "Online";
      target.platform = "Google Meet";
      target.location = "Online (Google Meet)";
      target.meetingLink = cleanedLink;

      if (cleanedLink && target.status === "Pending") {
        target.status = "Disetujui";
      }

      this.bookings = [...this.bookings];

      this.showToast(
        cleanedLink
          ? "Link Google Meet disimpan & status menjadi Disetujui."
          : "Link Google Meet dikosongkan."
      );

      if (notifyWebhook) {
        this.sendBookingUpdateToWebhook(target, "meeting_link_updated");
      }
    },

    async sendBookingUpdateToWebhook(bookingItem, actionType = "booking_updated") {
      const endpoint = this.getWebhookEndpoint();
      if (!this.hasValidWebhookEndpoint(endpoint)) {
        this.showToast(
          "Perubahan tersimpan di sesi aktif (endpoint booking belum diatur).",
          "error"
        );
        return;
      }

      const effectiveEmail = (
        bookingItem.targetEmail ||
        (this.isValidEmail(bookingItem.contact) ? bookingItem.contact : "") ||
        bookingItem.studentEmail ||
        ""
      ).trim();

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...bookingItem,
            targetEmail: effectiveEmail,
            action: actionType,
            updatedAt: new Date().toISOString()
          })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.ok === false) {
          throw new Error(data?.error || `HTTP ${res.status}`);
        }

        this.showToast(
          effectiveEmail
            ? `Data & link Google Meet dikirim ke ${effectiveEmail}`
            : "Data booking diperbarui ke server."
        );
      } catch (err) {
        console.error("Webhook update error:", err);
        this.showToast("Gagal mengirim pembaruan ke server n8n.", "error");
      }
    },

    updateBookingStatus(id, newStatus) {
      const target = this.bookings.find((b) => b.id === id || b.bookingId === id);
      if (target) {
        target.status = newStatus;
        this.bookings = [...this.bookings];
        this.showToast(`Status booking diubah menjadi ${newStatus}`);
        this.sendBookingUpdateToWebhook(target, "status_updated");
      }
    },

    deleteBooking(id) {
      this.bookings = this.bookings.filter(
        (b) => b.id !== id && b.bookingId !== id
      );
      this.showToast("Data booking dihapus.");
    }
  };
}

window.appData = appData;
