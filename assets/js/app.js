function appData() {
  return {
    // State utama & UI
    currentRole: "student",
    counselorStatus: "Online",
    showSosModal: false,
    activeTab: "chat",
    isSubmittingBooking: false,
    isSendingChat: false,
    studentUser: null,
    bookings: [],

    // State Chat AI CurhatBuddy
    chatInput: "",
    chatMessages: [
      {
        id: 1,
        sender: "ai",
        text: "Halo! Aku CurhatBuddy 🫂 Ada unek-unek soal kuliah, revisi, deadline, atau hal lain yang lagi bikin kepikiran? Cerita aja di sini, no judgment ya!"
      }
    ],

    // Form Booking Konseling
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

    toggleRole() {
      this.currentRole = this.currentRole === "student" ? "counselor" : "student";
      this.showToast(
        this.currentRole === "counselor"
          ? "Beralih ke Mode Konselor"
          : "Beralih ke Mode Mahasiswa"
      );
    },

    openAuthModal(mode = "login") {
      this.authModal.mode = mode;
      this.authModal.isOpen = true;
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
      this.authModal.isOpen = false;
      this.showToast("Akun mahasiswa berhasil didaftarkan!");
    },

    async sendChatMessage() {
      if (this.isSendingChat) return;

      const text = (this.chatInput || "").trim();
      if (!text) return;

      this.chatMessages.push({
        id: Date.now(),
        sender: "user",
        text
      });
      this.chatInput = "";
      this.isSendingChat = true;

      const endpoint =
        typeof CONFIG !== "undefined" &&
        (CONFIG.AI_CHAT_ENDPOINT || CONFIG.N8N_WEBHOOK_URL)
          ? String(CONFIG.AI_CHAT_ENDPOINT || CONFIG.N8N_WEBHOOK_URL).trim()
          : "";

      if (
        !endpoint ||
        endpoint.includes("DOMAIN_N8N_KAMU") ||
        endpoint.includes("<URL-HTTPS-N8N-KAMU>")
      ) {
        this.isSendingChat = false;
        this.showToast("Endpoint AI chat belum dikonfigurasi di config.js.", "error");
        return;
      }

      try {
        const controller = new AbortController();
        const timeoutMs =
          typeof CONFIG !== "undefined" && CONFIG.REQUEST_TIMEOUT_MS
            ? Number(CONFIG.REQUEST_TIMEOUT_MS)
            : 25000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            action: "chat",
            message: text,
            systemInstruction:
              typeof CONFIG !== "undefined" && CONFIG.SYSTEM_INSTRUCTION
                ? CONFIG.SYSTEM_INSTRUCTION
                : "",
            studentName: this.studentUser?.name || "Mahasiswa Anonim",
            source: "curhatdeck"
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.ok === false) {
          throw new Error(data?.error || `HTTP ${res.status}`);
        }

        const replyText =
          data?.reply ||
          data?.message ||
          data?.output ||
          "Maaf, respons dari CurhatBuddy sedang kosong. Coba kirim ulang ya!";

        this.chatMessages.push({
          id: Date.now() + 1,
          sender: "ai",
          text: String(replyText)
        });
      } catch (err) {
        console.error("Chat error:", err);
        this.showToast("Gagal terhubung ke CurhatBuddy. Coba lagi sebentar ya.", "error");
      } finally {
        this.isSendingChat = false;
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
    }
  };
}

window.appData = appData;
