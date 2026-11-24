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
      faculty: "",
      mode: "Offline", // "Offline" | "Online"
      platform: "Google Meet",
      location: "",
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

        if (this.studentUser?.faculty && !this.bookingForm.faculty) {
          this.bookingForm.faculty = this.studentUser.faculty;
        }

        this.$watch("chatMessages", (val) => {
          LocalStore.set(LocalStore.KEYS.CHAT_MESSAGES, val);
        });
        this.$watch("bookings", (val) => {
          LocalStore.set(LocalStore.KEYS.BOOKINGS, val);
        });
        this.$watch("studentUser", (val) => {
          if (val) {
            LocalStore.set(LocalStore.KEYS.STUDENT_USER, val);
            if (val.faculty && !this.bookingForm.faculty) {
              this.bookingForm.faculty = val.faculty;
            }
          } else {
            LocalStore.remove(LocalStore.KEYS.STUDENT_USER);
          }
          this.refreshIcons();
        });
        this.$watch("counselorStatus", (val) => {
          LocalStore.set(LocalStore.KEYS.COUNSELOR_STATUS, val);
        });
      }

      this.refreshIcons();
      this.scrollChatToBottom();
    },

    ensureStudentLoggedIn(featureLabel = "fitur ini") {
      if (this.studentUser) {
        return true;
      }
      this.showToast(`Silakan login terlebih dahulu untuk memakai ${featureLabel}.`, "error");
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
      this.showToast(`Selamat datang, ${name}! Chat AI & jadwal booking sudah terbuka.`);
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
      this.showToast(`Akun ${name} berhasil didaftarkan! Silakan login untuk melanjutkan.`);
      this.refreshIcons();
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
      if (!this.ensureStudentLoggedIn("Chat AI CurhatBuddy")) return;

      this.chatMessages = [initialWelcome];
      if (window.LocalStore) {
        LocalStore.remove(LocalStore.KEYS.CHAT_MESSAGES);
      }
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

    getWebhookEndpoint() {
      return typeof CONFIG !== "undefined" &&
        (CONFIG.BOOKING_ENDPOINT ||
          CONFIG.BOOKING_WEBHOOK_URL ||
          CONFIG.N8N_WEBHOOK_URL)
        ? String(
            CONFIG.BOOKING_ENDPOINT ||
              CONFIG.BOOKING_WEBHOOK_URL ||
              CONFIG.N8N_WEBHOOK_URL
          ).trim()
        : "";
    },

    hasValidWebhookEndpoint(endpoint) {
      return (
        Boolean(endpoint) &&
        !endpoint.includes("DOMAIN_N8N_KAMU") &&
        !endpoint.includes("<URL-HTTPS-N8N-KAMU>")
      );
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
      const time = (this.bookingForm?.time || "").trim();
      const topic = (this.bookingForm?.topic || "").trim();

      if (!name || (!date && !time)) {
        this.showToast("Lengkapi nama dan jadwal sesi terlebih dahulu!", "error");
        return;
      }

      this.isSubmittingBooking = true;

      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
      const phoneDigits = contact.replace(/\D/g, "");
      const isWa = !isEmail && phoneDigits.length >= 8;

      const contactType = isEmail && isWa
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

      const timestampId = Date.now();
      const bookingId = String(timestampId);
      const schedule = `${date}${date && time ? " " : ""}${time ? `(${time} WIB)` : ""}`.trim();

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
        faculty,
        major: faculty,
        mode,
        platform,
        meetingLink: "",
        location,
        date,
        time,
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

      target.mode = "Online";
      target.platform = "Google Meet";
      target.location = "Online (Google Meet)";
      target.meetingLink = (link || "").trim();
      this.bookings = [...this.bookings];

      this.showToast(
        target.meetingLink
          ? "Link Google Meet disimpan."
          : "Link Google Meet dikosongkan."
      );

      if (notifyWebhook && target.meetingLink) {
        this.sendBookingUpdateToWebhook(target, "meeting_link_updated");
      }
    },

    async sendBookingUpdateToWebhook(bookingItem, actionType = "booking_updated") {
      const endpoint = this.getWebhookEndpoint();
      if (!this.hasValidWebhookEndpoint(endpoint)) {
        return;
      }

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...bookingItem,
            action: actionType,
            updatedAt: new Date().toISOString()
          })
        });

        if (res.ok) {
          this.showToast("Detail sesi & link Google Meet terkirim ke server.");
        }
      } catch (err) {
        console.error("Webhook update error:", err);
      }
    },

    updateBookingStatus(id, newStatus) {
      const target = this.bookings.find((b) => b.id === id || b.bookingId === id);
      if (target) {
        target.status = newStatus;
        this.bookings = [...this.bookings];
        this.showToast(`Status booking diubah menjadi ${newStatus}`);
      }
    },

    deleteBooking(id) {
      this.bookings = this.bookings.filter((b) => b.id !== id && b.bookingId !== id);
      this.showToast("Data booking dihapus.");
    }
  };
}

window.appData = appData;
