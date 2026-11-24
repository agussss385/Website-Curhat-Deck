// Helper AI Chat CurhatBuddy (melewati webhook n8n + fallback santai khas Kampus Koli Media)
function buildLocalCurhatFallback(lastMessage = "") {
  const raw = String(lastMessage || "").trim();
  const q = raw.toLowerCase();

  const isGreeting =
    /^(hai+|halo+|hi+|hey+|yo+|pagi|siang|sore|malem|malam|p|tes|ping)[\s!.?]*$/i.test(
      q
    );
  if (isGreeting) {
    return "Halo! Sini-sini, lagi santai atau lagi ada yang bikin kepala muter nih? Ceritain aja soal kuliah di Koli Media, matkul, revisi, atau hal random apa pun—santuy aja, nggak bakal di-judge kok 🫂";
  }

  if (
    q.includes("matkul") ||
    q.includes("mata kuliah") ||
    q.includes("jurusan") ||
    q.includes("prodi") ||
    q.includes("sks") ||
    q.includes("semester")
  ) {
    const jurusanInfo = [
      "• **Multimedia / Teknologi Rekayasa Multimedia:** biasanya muter di pemrograman interaktif, web/mobile, aset 2D/3D, audio-visual, dan pengembangan produk media digital.",
      "• **Desain (Desain Grafis / DKV):** lekat sama tipografi, ilustrasi, identitas visual, tata letak, fotografi, dan perancangan kampanye atau produk kreatif.",
      "• **Produksi Media (Penyiaran / Film / Animasi):** banyak bersinggungan sama penulisan naskah, penyutradaraan, sinematografi, *editing*, tata suara, dan manajemen produksi.",
      "• **Grafika / Penerbitan / Pengemasan:** fokus ke proses cetak, *prepress*, editorial/penerbitan, material, dan desain kemasan produk.",
      "• **Bisnis / Manajemen di bidang kreatif (seperti Pemasaran atau Event/MICE):** ngebahas strategi pemasaran, riset pasar, komunikasi bisnis, serta perencanaan dan eksekusi *event*."
    ].join("\n");

    return `Kalau ngomongin mata kuliah di Kampus Koli Media, tiap jurusan memang punya *vibe* dan beban praktiknya sendiri-sendiri 🫂 Secara garis besar:\n\n${jurusanInfo}\n\nKalau detail kurikulum atau daftar matkul wajib per semester di prodi kamu, paling aman cek buku pedoman akademik atau tanya ke dosen wali karena bisa beda tiap angkatan. Kamu lagi di jurusan apa sekarang, dan ada matkul yang lagi bikin pusing?`;
  }

  if (
    q.includes("revisi") ||
    q.includes("deadline") ||
    q.includes("dosen") ||
    q.includes("ta") ||
    q.includes("tugas akhir") ||
    q.includes("proyek") ||
    q.includes("praktikum")
  ) {
    return "Wah, klasik banget ya di Koli Media—baru beres satu revisi atau *deadline* proyek, eh udah muncul catatan baru lagi 😭 Wajar banget kalau rasanya capek duluan sebelum mulai. Coba pilih satu hal paling kecil yang bisa diberesin hari ini dulu aja biar nggak numpuk di kepala. Proyek atau matkul apa yang lagi ngejar kamu sekarang?";
  }

  if (
    q.includes("creative block") ||
    q.includes("stuck") ||
    q.includes("ide") ||
    q.includes("mentok") ||
    q.includes("burnout") ||
    q.includes("bingung")
  ) {
    return "Lagi kena *stuck* atau *creative block* ya? Santai dulu, itu sering banget kejadian apalagi kalau otak udah kepenuhan sama layar, revisi, dan target karya 🫂 Kadang cara paling ngefek bukan maksa perah otak terus, tapi ganti suasana sebentar, nonton/lihat referensi di luar zona biasa, atau istirahat beneran. Lagi mentok di bagian apanya nih?";
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
    return "Perasaan *anxious* soal magang, *portofolio*, atau kebawa FOMO ngelihat temen-temen lain itu nyata banget, apalagi di lingkungan kampus kreatif yang progresnya sering kelihatan di medsos 🫂 Tapi tiap orang punya *timeline* dan *pace* masing-masing kok. Kamu lagi paling kepikiran soal persiapan magang atau ngerasa ketertinggalan di bagian mana?";
  }

  if (q.includes("kata") || q.includes("semangat") || q.includes("quotes") || q.includes("capek")) {
    return "Nggak harus selalu gas pol setiap hari kok—pelan-pelan jalan juga tetap maju, selama nggak berhenti total 🫂 Capek itu tanda kamu udah berusaha, bukan tanda kamu gagal. Tarik napas dulu pelan-pelan, kamu nggak sendirian ngadepin ini.";
  }

  return `Denger kok soal "${raw}" 🫂 Di Kampus Koli Media memang sering banyak dinamika yang bikin kepala rame—entah itu urusan matkul, proyek, pergaulan kampus, atau sekadar capek sendiri. Ceritain aja alurnya gimana, aku dengerin tanpa nge-judge.`;
}

async function fetchGeminiResponse(chatMessages = []) {
  const cfg =
    typeof window !== "undefined" && window.CONFIG && typeof window.CONFIG === "object"
      ? window.CONFIG
      : {};

  const chatEndpoint = String(
    cfg.AI_CHAT_ENDPOINT ||
      cfg.N8N_WEBHOOK_URL ||
      cfg.BOOKING_ENDPOINT ||
      ""
  ).trim();

  const defaultKoliMediaSystemInstruction = `Kamu adalah CurhatBuddy, teman ngobrol & peer support yang santai, hangat, dan empatik untuk mahasiswa di Kampus Koli Media (Polimedia) pada platform CurhatDeck.
Gaya & aturan jawabmu:
1. Pakai bahasa Indonesia yang natural, santai, akrab, dan tidak kaku seperti bot atau dosen—validasi perasaan mahasiswa dulu sebelum ngasih saran ringan.
2. Dengarkan cerita mahasiswa tanpa menghakimi (no judgment) dan hindari ceramah panjang yang menggurui.
3. Pahami konteks masalah di Kampus Koli Media: revisi proyek/karya bertubi-tubi, *deadline* produksi/pameran/tugas akhir, *creative block* dan *burnout*, tekanan *portofolio* & magang, serta *overthinking* atau FOMO.
4. Jika ditanya soal mata kuliah per jurusan di Kampus Koli Media, berikan gambaran umum yang relevan per rumpun/jurusan (seperti Multimedia/TRM, Desain/DKV, Produksi Media/Penyiaran/Film/Animasi, Grafika/Penerbitan/Pengemasan, atau Bisnis/Event/Pemasaran kreatif), dan ingatkan secara natural bahwa detail silabus/kode matkul tiap angkatan paling tepat dicek ke pedoman akademik atau dosen wali.
5. Jawab luwes dan secukupnya sesuai konteks obrolan; jika ada indikasi krisis berat atau menyakiti diri sendiri, arahkan dengan lembut ke tombol SOS atau booking sesi 1-on-1 dengan konselor.`;

  const systemInstruction = String(
    cfg.SYSTEM_INSTRUCTION || defaultKoliMediaSystemInstruction
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

  if (!chatEndpoint || !/^https?:\/\//i.test(chatEndpoint)) {
    return buildLocalCurhatFallback(lastUserText);
  }

  try {
    const response = await fetch(chatEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "ai_chat",
        source: "curhatdeck",
        campus: "Kampus Koli Media",
        systemInstruction,
        messages: cleanMessages,
        lastMessage: lastUserText
      })
    });

    const rawText = await response.text().catch(() => "");
    let parsed = null;

    if (rawText) {
      try {
        parsed = JSON.parse(rawText);
      } catch (_) {
        if (response.ok) {
          const plain = rawText.trim();
          if (plain && !plain.startsWith("<!DOCTYPE") && !plain.startsWith("<html")) {
            return plain;
          }
        }
      }
    }

    const data = Array.isArray(parsed) ? parsed[0] || {} : parsed || {};

    const replyText =
      data?.reply ||
      data?.text ||
      data?.output ||
      data?.response ||
      data?.result ||
      data?.answer ||
      data?.message ||
      data?.data?.reply ||
      data?.data?.text ||
      data?.data?.output ||
      data?.json?.reply ||
      data?.json?.text ||
      data?.json?.output ||
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "";

    const trimmedReply = String(replyText).trim();
    if (trimmedReply) {
      return trimmedReply;
    }

    return buildLocalCurhatFallback(lastUserText);
  } catch (_) {
    return buildLocalCurhatFallback(lastUserText);
  }
}

window.fetchGeminiResponse = fetchGeminiResponse;

function appData() {
  const initialWelcome = {
    role: "model",
    text: "Halo! Aku CurhatBuddy 🫂 Mau ngobrolin masalah di Kampus Koli Media, mata kuliah per jurusan, revisi, atau sekadar unek-unek random? Santuy aja di sini, no judgment!"
  };

  return {
    // Navigasi & Role
    currentRole: "student", // "student" | "counselor"
    activeTab: "ai-chat",   // "ai-chat" | "booking"
    counselorStatus: "Online",
    showSosModal: false,

    // User Mahasiswa
    studentUser: null,

    // State Chat AI CurhatBuddy
    userInput: "",
    isAiThinking: false,
    chatMessages: [initialWelcome],

    // State Booking Konseling
    isSubmittingBooking: false,
    bookings: [],
    bookingForm: {
      name: "",
      contact: "",
      faculty: "",
      mode: "Offline", // "Offline" | "Online"
      platform: "Google Meet",
      location: "",
      date: "",
      time: "",
      topic: ""
    },

    // Toast Notification
    toast: {
      show: false,
      type: "success",
      message: "",
      _timer: null
    },

    // Modal Login / Register
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
          } catch (_) {
            // Abaikan error ikon agar tidak mengganggu alur utama
          }
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
