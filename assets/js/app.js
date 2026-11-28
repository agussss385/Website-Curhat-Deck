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

  const pickRandom = (arr) =>
    arr[Math.floor(Math.random() * arr.length)];

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

  const freshCandidates = [
    `Oh gitu, soal ${raw} ya. Lagi bikin apa nih sebenernya?`,
    `Wah, ${raw} gimana tuh ceritanya? Santai aja jelasinnya.`,
    `Menarik sih ${raw}—bagian mana yang lagi bikin kamu kepikiran?`,
    `Oke, nangkap. Lagi ngerjain ${raw} buat apa nih, tugas kampus atau proyekan sendiri?`,
    `Dengerin kok. Ceritain aja pelan-pelan soal ${raw}, lagi aman nggak?`
  ];

  const nonRepeating = freshCandidates.filter(
    (c) => !recentModelTexts.some((prev) => prev.includes(c.slice(0, 22).toLowerCase()))
  );

  return pickRandom(nonRepeating.length ? nonRepeating : freshCandidates);
}

function extractGeminiReplyText(payload) {
  if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (!trimmed || trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
      return "";
    }
    return trimmed;
  }

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
    item.data?.response,
    item.json?.reply,
    item.json?.text,
    item.json?.output,
    item.content?.parts?.[0]?.text,
    item.message?.content,
    item.candidates?.[0]?.content?.parts?.[0]?.text
  ];

  for (const val of candidates) {
    if (typeof val === "string" && val.trim()) {
      return val.trim();
    }
  }
  return "";
}

const DEFAULT_WEBHOOK_URL =
  "http://localhost:5678/webhook/curhatdeck-router";

async function fetchGeminiResponse(chatMessages = []) {
  const FALLBACK_WEBHOOK_URL = DEFAULT_WEBHOOK_URL;

  const cfg =
    typeof window !== "undefined" && window.CONFIG && typeof window.CONFIG === "object"
      ? window.CONFIG
      : typeof CONFIG !== "undefined" && typeof CONFIG === "object"
        ? CONFIG
        : {};

  const rawEndpoint = String(
    cfg.AI_CHAT_ENDPOINT ||
      cfg.N8N_WEBHOOK_URL ||
      cfg.WEBHOOK_URL ||
      cfg.BOOKING_ENDPOINT ||
      FALLBACK_WEBHOOK_URL ||
      ""
  )
    .replace(/\s+/g, "")
    .trim();

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
        const plain = extractGeminiReplyText(rawText);
        if (plain) {
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

const STUDENT_ACCOUNTS_STORAGE_KEY = "curhatdeck_student_accounts_v1";
const STUDENT_SESSION_STORAGE_KEY = "curhatdeck_student_session_v1";
const COUNSELOR_ACCOUNTS_STORAGE_KEY = "curhatdeck_counselor_accounts_v1";
const COUNSELOR_SESSION_STORAGE_KEY = "curhatdeck_counselor_session_v1";

function loadStudentAccounts() {
  try {
    const raw = localStorage.getItem(STUDENT_ACCOUNTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function saveStudentAccounts(accounts) {
  try {
    localStorage.setItem(
      STUDENT_ACCOUNTS_STORAGE_KEY,
      JSON.stringify(Array.isArray(accounts) ? accounts : [])
    );
  } catch (_) {}
}

function loadActiveStudentSession() {
  try {
    const raw = localStorage.getItem(STUDENT_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.name) {
      return parsed;
    }
  } catch (_) {}
  return null;
}

function saveActiveStudentSession(session) {
  try {
    if (session) {
      localStorage.setItem(
        STUDENT_SESSION_STORAGE_KEY,
        JSON.stringify(session)
      );
    } else {
      localStorage.removeItem(STUDENT_SESSION_STORAGE_KEY);
    }
  } catch (_) {}
}

function loadCounselorAccounts() {
  try {
    const raw = localStorage.getItem(COUNSELOR_ACCOUNTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function saveCounselorAccounts(accounts) {
  try {
    localStorage.setItem(
      COUNSELOR_ACCOUNTS_STORAGE_KEY,
      JSON.stringify(Array.isArray(accounts) ? accounts : [])
    );
  } catch (_) {}
}

function loadActiveCounselorSession() {
  try {
    const raw = localStorage.getItem(COUNSELOR_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.name) {
      return parsed;
    }
  } catch (_) {}
  return null;
}

function saveActiveCounselorSession(session) {
  try {
    if (session) {
      localStorage.setItem(
        COUNSELOR_SESSION_STORAGE_KEY,
        JSON.stringify(session)
      );
    } else {
      localStorage.removeItem(COUNSELOR_SESSION_STORAGE_KEY);
    }
  } catch (_) {}
}

function appData() {
  const initialWelcome = {
    role: "model",
    text: "Halo! Aku CurhatBuddy 🫂 Mau ngobrolin masalah di Polimedia, matkul per jurusan, tugas/revisi, atau apa aja yang lagi kepikiran? Santai aja di sini."
  };

  return {
    currentRole: "student",
    activeTab: "ai-chat",
    counselorStatus: "Online",
    counselorUser: null,
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
    counselorAuthModal: {
      isOpen: false,
      mode: "login",
      loginForm: {
        identifier: "",
        password: ""
      },
      registerForm: {
        name: "",
        email: "",
        specialty: "",
        code: "",
        password: ""
      }
    },

    // State Tambahan: Mikrofon, Maskot Responsif, Salin & Dashboard Konselor
    isListening: false,
    speechSupported:
      typeof window !== "undefined" &&
      Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    _recognition: null,
    isBuddyHovered: false,
    copiedMessageIndex: null,
    bookingFilterStatus: "Semua",
    bookingFilterMode: "Semua",
    bookingSearch: "",
    copiedBookingKey: "",

    get buddyBubbleText() {
      if (this.isListening) {
        return "Dengerin suara kamu nih... 🎙️";
      }
      if (this.isAiThinking) {
        return "Lagi nyusun jawaban buat kamu... ✨";
      }
      if (this.isBuddyHovered) {
        return this.studentUser
          ? `Siap nemenin ${this.studentUser.name} ngobrol!`
          : "Klik chat atau login dulu yuk!";
      }
      if (this.studentUser) {
        return `Halo ${this.studentUser.name}! CurhatBuddy siap`;
      }
      return "CurhatBuddy • Login dulu ya";
    },

    get bookingStats() {
      const list = Array.isArray(this.bookings) ? this.bookings : [];
      return {
        total: list.length,
        pending: list.filter((b) => (b.status || "Pending") === "Pending").length,
        approved: list.filter((b) => b.status === "Disetujui").length,
        done: list.filter((b) => b.status === "Selesai").length
      };
    },

    get filteredBookings() {
      const q = String(this.bookingSearch || "").trim().toLowerCase();
      return (Array.isArray(this.bookings) ? this.bookings : []).filter((b) => {
        const currentStatus = b.status || "Pending";
        const currentMode = b.mode || "Offline";

        const matchStatus =
          this.bookingFilterStatus === "Semua" ||
          currentStatus === this.bookingFilterStatus;

        const matchMode =
          this.bookingFilterMode === "Semua" ||
          currentMode === this.bookingFilterMode;

        const hay = [
          b.bookingId,
          b.id,
          b.name,
          b.faculty,
          b.major,
          b.contact,
          b.targetEmail,
          b.topic,
          b.meetingLink
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchSearch = !q || hay.includes(q);
        return matchStatus && matchMode && matchSearch;
      });
    },

    init() {
      const savedStudent = loadActiveStudentSession();
      if (savedStudent) {
        this.studentUser = savedStudent;
        if (savedStudent.faculty && !this.bookingForm.faculty) {
          this.bookingForm.faculty = savedStudent.faculty;
        }
      }

      const savedCounselor = loadActiveCounselorSession();
      if (savedCounselor) {
        this.counselorUser = savedCounselor;
      }

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

    openCounselorAuthModal(mode = "login") {
      this.counselorAuthModal.mode = mode === "register" ? "register" : "login";
      if (this.counselorUser && !this.counselorAuthModal.loginForm.identifier) {
        this.counselorAuthModal.loginForm.identifier =
          this.counselorUser.email || this.counselorUser.name || "";
      }
      this.counselorAuthModal.isOpen = true;
      this.refreshIcons();
    },

    closeCounselorAuthModal() {
      this.counselorAuthModal.isOpen = false;
      this.refreshIcons();
    },

    registerCounselor() {
      const name = (this.counselorAuthModal.registerForm.name || "").trim();
      const email = (this.counselorAuthModal.registerForm.email || "")
        .trim()
        .toLowerCase();
      const specialty = (
        this.counselorAuthModal.registerForm.specialty || ""
      ).trim();
      const code = (this.counselorAuthModal.registerForm.code || "").trim();
      const password = String(
        this.counselorAuthModal.registerForm.password || ""
      );

      if (!name) {
        this.showToast("Nama lengkap konselor wajib diisi!", "error");
        return;
      }

      if (!email || !this.isValidEmail(email)) {
        this.showToast("Masukkan email konselor yang valid!", "error");
        return;
      }

      if (!password || password.length < 4) {
        this.showToast("Password konselor minimal 4 karakter!", "error");
        return;
      }

      const accounts = loadCounselorAccounts();
      const existingIndex = accounts.findIndex(
        (acc) => String(acc.email || "").toLowerCase() === email
      );

      if (existingIndex >= 0) {
        this.showToast(
          "Email konselor sudah terdaftar. Silakan masuk di tab Masuk Konselor.",
          "error"
        );
        this.counselorAuthModal.loginForm.identifier = email;
        this.counselorAuthModal.mode = "login";
        this.refreshIcons();
        return;
      }

      const newAccount = {
        id: `cns-${Date.now()}`,
        name,
        email,
        specialty: specialty || "Konseling Mahasiswa Polimedia",
        code,
        password
      };

      accounts.unshift(newAccount);
      saveCounselorAccounts(accounts);

      this.counselorAuthModal.loginForm.identifier = email;
      this.counselorAuthModal.loginForm.password = "";
      this.counselorAuthModal.registerForm = {
        name: "",
        email: "",
        specialty: "",
        code: "",
        password: ""
      };
      this.counselorAuthModal.mode = "login";
      this.showToast(
        `Akun konselor ${name} berhasil didaftarkan! Silakan masuk.`
      );
      this.refreshIcons();
    },

    loginCounselor() {
      const identifier = (
        this.counselorAuthModal.loginForm.identifier || ""
      ).trim();
      const password = String(this.counselorAuthModal.loginForm.password || "");

      if (!identifier) {
        this.showToast("Masukkan email atau nama konselor terlebih dahulu!", "error");
        return;
      }

      const accounts = loadCounselorAccounts();
      const idLower = identifier.toLowerCase();

      const matched = accounts.find(
        (acc) =>
          String(acc.email || "").toLowerCase() === idLower ||
          String(acc.name || "").toLowerCase() === idLower
      );

      if (!matched) {
        this.showToast(
          "Akun konselor belum terdaftar! Silakan daftar dulu di tab Daftar Konselor.",
          "error"
        );
        return;
      }

      if (matched.password && password !== matched.password) {
        this.showToast("Password konselor tidak sesuai!", "error");
        return;
      }

      this.counselorUser = {
        id: matched.id,
        name: matched.name,
        email: matched.email,
        specialty: matched.specialty || "Konseling Mahasiswa Polimedia",
        code: matched.code || ""
      };

      saveActiveCounselorSession(this.counselorUser);
      this.currentRole = "counselor";
      this.counselorStatus = "Online";
      this.counselorAuthModal.loginForm.password = "";
      this.counselorAuthModal.isOpen = false;
      this.showToast(
        `Selamat datang, ${this.counselorUser.name}! Mode Konselor aktif.`
      );
      this.refreshIcons();
    },

    logoutCounselor() {
      this.counselorUser = null;
      saveActiveCounselorSession(null);
      if (this.currentRole === "counselor") {
        this.currentRole = "student";
      }
      this.showToast("Kamu telah keluar dari akun konselor.");
      this.refreshIcons();
    },

    toggleRoleModal() {
      if (this.currentRole === "counselor") {
        this.currentRole = "student";
        this.showToast("Beralih ke Mode Mahasiswa");
        this.refreshIcons();
        return;
      }

      if (!this.counselorUser) {
        this.openCounselorAuthModal("login");
        return;
      }

      this.currentRole = "counselor";
      this.showToast("Beralih ke Mode Konselor");
      this.refreshIcons();
    },

    openAuthModal(mode = "login") {
      this.authModal.mode = mode === "register" ? "register" : "login";
      this.authModal.isOpen = true;
      this.refreshIcons();
    },

    closeAuthModal() {
      this.authModal.isOpen = false;
    },

    loginStudent() {
      const nameInput = (this.authModal.loginForm.name || "").trim();
      const passwordInput = String(this.authModal.loginForm.password || "");

      if (!nameInput) {
        this.showToast("Masukkan nama kamu terlebih dahulu!", "error");
        return;
      }

      const accounts = loadStudentAccounts();
      const inputLower = nameInput.toLowerCase();

      const matched = accounts.find(
        (acc) =>
          String(acc.name || "").toLowerCase() === inputLower ||
          String(acc.email || "").toLowerCase() === inputLower
      );

      if (!matched) {
        this.showToast(
          "Akun belum terdaftar! Silakan daftar dulu di tab Daftar Akun.",
          "error"
        );
        return;
      }

      if (matched.password && passwordInput !== matched.password) {
        this.showToast("Password salah! Cek kembali password akun kamu.", "error");
        return;
      }

      this.studentUser = {
        id: matched.id,
        name: matched.name,
        email: matched.email,
        faculty: matched.faculty || ""
      };
      saveActiveStudentSession(this.studentUser);

      if (this.studentUser.faculty && !this.bookingForm.faculty) {
        this.bookingForm.faculty = this.studentUser.faculty;
      }

      this.authModal.loginForm.password = "";
      this.authModal.isOpen = false;
      this.showToast(
        `Selamat datang, ${this.studentUser.name}! Chat AI & jadwal booking sudah terbuka.`
      );
      this.refreshIcons();
    },

    registerStudent() {
      const name = (this.authModal.registerForm.name || "").trim();
      const email = (this.authModal.registerForm.email || "").trim().toLowerCase();
      const faculty = (this.authModal.registerForm.faculty || "").trim();
      const password = String(this.authModal.registerForm.password || "");

      if (!name) {
        this.showToast("Nama lengkap / panggilan wajib diisi!", "error");
        return;
      }

      if (!password || password.length < 4) {
        this.showToast("Buat password minimal 4 karakter saat mendaftar!", "error");
        return;
      }

      const accounts = loadStudentAccounts();
      const nameLower = name.toLowerCase();

      const existing = accounts.find(
        (acc) =>
          String(acc.name || "").toLowerCase() === nameLower ||
          (email && String(acc.email || "").toLowerCase() === email)
      );

      if (existing) {
        this.showToast(
          "Akun mahasiswa sudah terdaftar. Silakan masuk di tab Masuk.",
          "error"
        );
        this.authModal.loginForm.name = existing.name;
        this.authModal.mode = "login";
        this.refreshIcons();
        return;
      }

      const newStudentAccount = {
        id: `std-${Date.now()}`,
        name,
        email: email || `${nameLower.replace(/\s+/g, ".")}@polimedia.ac.id`,
        faculty,
        password
      };

      accounts.unshift(newStudentAccount);
      saveStudentAccounts(accounts);

      if (faculty) {
        this.bookingForm.faculty = faculty;
      }

      this.authModal.loginForm.name = name;
      this.authModal.loginForm.password = "";
      this.authModal.registerForm = {
        name: "",
        email: "",
        faculty: "",
        password: ""
      };
      this.authModal.mode = "login";
      this.showToast(
        `Akun mahasiswa "${name}" berhasil didaftarkan! Silakan masuk.`
      );
      this.refreshIcons();
    },

    logoutStudent() {
      this.studentUser = null;
      saveActiveStudentSession(null);
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

    toggleVoiceInput() {
      if (!this.ensureStudentLoggedIn("fitur suara mikrofon")) return;

      const SpeechRec =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRec) {
        this.showToast(
          "Browser ini belum mendukung Speech-to-Text. Coba pakai Chrome ya.",
          "error"
        );
        return;
      }

      if (this.isListening && this._recognition) {
        this._recognition.stop();
        return;
      }

      const recognition = new SpeechRec();
      recognition.lang = "id-ID";
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      const baseText = (this.userInput || "").trim();

      recognition.onstart = () => {
        this.isListening = true;
        this.showToast("Mikrofon aktif! Silakan mulai bicara...");
        this.refreshIcons();
      };

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        const spoken = transcript.trim();
        this.userInput = baseText ? `${baseText} ${spoken}` : spoken;
      };

      recognition.onerror = (event) => {
        this.isListening = false;
        this.refreshIcons();

        if (event.error === "not-allowed") {
          this.showToast(
            "Izin mikrofon ditolak. Aktifkan izin mic di pengaturan browser.",
            "error"
          );
        } else if (event.error === "no-speech") {
          this.showToast("Suara belum terdeteksi, coba bicara lagi ya.", "error");
        } else {
          this.showToast(`Gagal merekam suara (${event.error}).`, "error");
        }
      };

      recognition.onend = () => {
        this.isListening = false;
        this._recognition = null;
        this.refreshIcons();
      };

      this._recognition = recognition;

      try {
        recognition.start();
      } catch (_) {
        this.isListening = false;
        this._recognition = null;
        this.refreshIcons();
      }
    },

    async copyAiReply(text, index) {
      const cleanText = String(text || "").trim();
      if (!cleanText) return;

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(cleanText);
        } else {
          const temp = document.createElement("textarea");
          temp.value = cleanText;
          document.body.appendChild(temp);
          temp.select();
          document.execCommand("copy");
          document.body.removeChild(temp);
        }
        this.copiedMessageIndex = index;
        this.showToast("Balasan CurhatBuddy disalin ke clipboard!");
        setTimeout(() => {
          if (this.copiedMessageIndex === index) {
            this.copiedMessageIndex = null;
          }
        }, 1800);
      } catch (_) {
        this.showToast("Gagal menyalin teks balasan.", "error");
      }
    },

    async copyMeetingLink(link, key) {
      const cleanLink = String(link || "").trim();
      if (!cleanLink) {
        this.showToast("Belum ada link Google Meet untuk disalin.", "error");
        return;
      }

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(cleanLink);
        } else {
          const temp = document.createElement("textarea");
          temp.value = cleanLink;
          document.body.appendChild(temp);
          temp.select();
          document.execCommand("copy");
          document.body.removeChild(temp);
        }
        this.copiedBookingKey = key;
        this.showToast("Link Google Meet berhasil disalin!");
        setTimeout(() => {
          if (this.copiedBookingKey === key) {
            this.copiedBookingKey = "";
          }
        }, 1800);
      } catch (_) {
        this.showToast("Gagal menyalin link Google Meet.", "error");
      }
    },

    getWebhookEndpoint() {
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
        DEFAULT_WEBHOOK_URL ||
        "";

      return String(rawUrl).replace(/\s+/g, "").trim();
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

    resolveEffectiveEmail(bookingItem) {
      const candidates = [
        bookingItem?.targetEmail,
        this.isValidEmail(bookingItem?.contact) ? bookingItem.contact : "",
        bookingItem?.studentEmail,
        this.studentUser?.email
      ];

      for (const raw of candidates) {
        const cleaned = String(raw || "").trim();
        if (this.isValidEmail(cleaned)) {
          return cleaned;
        }
      }
      return "";
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

        const rawText = await res.text().catch(() => "");
        let data = {};
        if (rawText) {
          try {
            data = JSON.parse(rawText);
          } catch (_) {
            data = {};
          }
        }

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

      const effectiveEmail = this.resolveEffectiveEmail(bookingItem);

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...bookingItem,
            targetEmail: effectiveEmail,
            counselorName: this.counselorUser?.name || "",
            counselorEmail: this.counselorUser?.email || "",
            action: actionType,
            updatedAt: new Date().toISOString()
          })
        });

        const rawText = await res.text().catch(() => "");
        let data = {};
        if (rawText) {
          try {
            data = JSON.parse(rawText);
          } catch (_) {
            data = {};
          }
        }

        if (!res.ok || data?.ok === false) {
          throw new Error(data?.error || `HTTP ${res.status}`);
        }

        if (data?.meetingLink) {
          bookingItem.meetingLink = String(data.meetingLink).trim();
        }
        if (data?.status) {
          bookingItem.status = String(data.status).trim();
        }
        this.bookings = [...this.bookings];

        this.showToast(
          effectiveEmail
            ? `Data & status (${bookingItem.status}) dikirim ke ${effectiveEmail}`
            : `Status booking (${bookingItem.status}) diperbarui ke server.`
        );
      } catch (err) {
        console.error("Webhook update error:", err);
        this.showToast("Gagal mengirim pembaruan ke server n8n.", "error");
      }
    },

    updateBookingStatus(id, newStatus) {
      const target = this.bookings.find((b) => b.id === id || b.bookingId === id);
      if (!target) return;

      target.status = newStatus;
      this.bookings = [...this.bookings];
      this.showToast(`Status booking diubah menjadi ${newStatus}`);
      this.sendBookingUpdateToWebhook(target, "status_updated");
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
