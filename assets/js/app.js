function appData() {
  const initialWelcome = {
    role: "model",
    text: "Halo! Aku CurhatBuddy 🫂 Ada unek-unek soal kuliah, revisi, deadline, atau hal lain yang lagi bikin kepikiran? Cerita aja di sini, no judgment ya!"
  };

  return {
    // Navigasi & Role (disesuaikan dengan index.html)
    currentRole: "student", // "student" | "counselor"
    activeTab: "ai-chat",   // "ai-chat" | "booking"
    counselorStatus: "Online",
    showSosModal: false,

    // User Mahasiswa
    studentUser: null,

    // State Chat AI CurhatBuddy (disesuaikan dengan index.html & ai.js)
    userInput: "",
    isAiThinking: false,
    chatMessages: [initialWelcome],

    // State Booking Konseling
    isSubmittingBooking: false,
    bookings: [],
    bookingForm: {
      name: "",
      contact: "",
      date: "",
      time: "",
      topic: ""
    },

    // Toast notification
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
      if (window.LocalStore) {
        const savedChat = LocalStore.get(LocalStore.KEYS.CHAT_MESSAGES, null);
        if (Array.isArray(savedChat) && savedChat.length > 0) {
          this.chatMessages = savedChat;
        }
        this.bookings = LocalStore.get(LocalStore.KEYS.BOOKINGS, []);
        this.studentUser = LocalStore.get(LocalStore.KEYS.STUDENT_USER, null);
        this.counselorStatus = LocalStore.get(
          LocalStore.KEYS.COUNSELOR_STATUS,
          "Online"
        );

        this.$watch("chatMessages", (val) => {
          LocalStore.set(LocalStore.KEYS.CHAT_MESSAGES, val);
        });
        this.$watch("bookings", (val) => {
          LocalStore.set(LocalStore.KEYS.BOOKINGS, val);
        });
        this.$watch("studentUser", (val) => {
          if (val) {
            LocalStore.set(LocalStore.KEYS.STUDENT_USER, val);
          } else {
            LocalStore.remove(LocalStore.KEYS.STUDENT_USER);
          }
        });
        this.$watch("counselorStatus", (val) => {
          LocalStore.set(LocalStore.KEYS.COUNSELOR_STATUS, val);
        });
      }

      this.refreshIcons();
      this.scrollChatToBottom();
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
          window.lucide.createIcons();
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

      this.studentUser = {
        name,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@polimedia.ac.id`
      };
      this.authModal.loginForm.password = "";
      this.authModal.isOpen = false;
      this.showToast(`Selamat datang, ${name}!`);
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

      this.studentUser = { name, email, faculty };
      this.authModal.registerForm = {
        name: "",
        email: "",
        faculty: "",
        password: ""
      };
      this.authModal.mode = "login";
      this.showToast("Akun mahasiswa berhasil didaftarkan! Silakan login.");
    },

    logoutStudent() {
      this.studentUser = null;
      if (window.LocalStore) {
        LocalStore.remove(LocalStore.KEYS.STUDENT_USER);
      }
      this.showToast("Kamu telah keluar dari akun mahasiswa.");
      this.refreshIcons();
    },

    clearChat() {
      this.chatMessages = [initialWelcome];
      if (window.LocalStore) {
        LocalStore.remove(LocalStore.KEYS.CHAT_MESSAGES);
      }
      this.showToast("Riwayat chat dibersihkan.");
      this.scrollChatToBottom();
      this.refreshIcons();
    },

    async sendQuickPrompt(promptText) {
      this.activeTab = "ai-chat";
      this.userInput = promptText;
      this.refreshIcons();
      await this.sendChatMessage();
    },

    async sendChatMessage() {
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
        if (typeof fetchGeminiResponse !== "function") {
          throw new Error("Klien AI (ai.js) belum termuat.");
        }

        const replyText = await fetchGeminiResponse(this.chatMessages);

        this.chatMessages.push({
          role: "model",
          text: replyText
        });
        this.scrollChatToBottom();
      } catch (err) {
        console.error("Chat error:", err);
        this.showToast(
          err?.message || "Gagal terhubung ke CurhatBuddy. Coba lagi sebentar ya.",
          "error"
        );
      } finally {
        this.isAiThinking = false;
        this.refreshIcons();
      }
    },

    async submitBooking() {
      if (this.isSubmittingBooking) return;

      const name = (this.bookingForm?.name || "").trim();
      const contact = (this.bookingForm?.contact || "").trim();
      const date = this.bookingForm?.date || "";
      const time = (this.bookingForm?.time || "").trim();
      const topic = (this.bookingForm?.topic || "").trim();

      if (!name || (!date && !time)) {
        this.showToast("Lengkapi nama dan jadwal sesi terlebih dahulu!", "error");
        return;
      }

      this.isSubmittingBooking = true;

      const newBooking = {
        id: Date.now(),
        action: "booking",
        name,
        contact,
        date,
        time,
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
        date: "",
        time: "",
        topic: ""
      };

      const endpoint =
        typeof CONFIG !== "undefined" &&
        (CONFIG.BOOKING_ENDPOINT ||
          CONFIG.BOOKING_WEBHOOK_URL ||
          CONFIG.N8N_WEBHOOK_URL)
          ? String(
              CONFIG.BOOKING_ENDPOINT ||
                CONFIG.BOOKING_WEBHOOK_URL ||
                CONFIG.N8N_WEBHOOK_URL
            ).trim()
          : "";

      if (
        !endpoint ||
        endpoint.includes("DOMAIN_N8N_KAMU") ||
        endpoint.includes("<URL-HTTPS-N8N-KAMU>")
      ) {
        this.isSubmittingBooking = false;
        this.showToast(
          "Booking tersimpan lokal (endpoint booking belum diatur).",
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

        this.showToast("Permintaan booking terkirim & notifikasi email diproses!");
      } catch (err) {
        console.error("Booking submit error:", err);
        this.showToast(
          "Booking tersimpan lokal, tapi gagal mengirim notifikasi ke server.",
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

    updateBookingStatus(id, newStatus) {
      const target = this.bookings.find((b) => b.id === id);
      if (target) {
        target.status = newStatus;
        this.showToast(`Status booking diubah menjadi ${newStatus}`);
      }
    },

    deleteBooking(id) {
      this.bookings = this.bookings.filter((b) => b.id !== id);
      this.showToast("Data booking dihapus.");
    }
  };
}

window.appData = appData;
