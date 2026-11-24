document.addEventListener('alpine:init', () => {
  Alpine.data('appData', () => ({
    // States
    currentRole: 'student', // 'student' | 'counselor'
    activeTab: 'ai-chat',   // 'ai-chat' | 'booking'
    counselorStatus: LocalStore.get('curhat_counselor_status', 'Online'),
    userInput: '',
    isAiThinking: false,
    isSubmittingBooking: false,
    showSosModal: false,

    // Auth Mahasiswa (Nama + Password & Register -> Kembali ke Login)
    studentUser: LocalStore.get('curhat_student_user', null),
    registeredStudents: LocalStore.get('curhat_registered_students', []),
    authModal: {
      isOpen: false,
      mode: 'login', // 'login' | 'register'
      loginForm: {
        name: '',
        password: ''
      },
      registerForm: {
        name: '',
        email: '',
        faculty: '',
        password: ''
      }
    },

    toast: {
      show: false,
      message: '',
      type: 'success'
    },

    bookingForm: {
      name: '',
      contact: '',
      date: '',
      time: '',
      topic: ''
    },

    chatMessages: LocalStore.get('curhat_chat_history', [
      { role: 'model', text: 'Halooo! 👋 Selamat datang di CurhatDeck. Ada hal yang lagi mengganggu pikiran atau bikin overthinking hari ini? Tumpahin aja di sini, aku siap dengerin 100%!' }
    ]),

    bookings: LocalStore.get('curhat_bookings', [
      { id: 1, name: 'Rian (Teknik)', contact: '08123456789', date: '2026-11-25', time: '14:00 WIB', topic: 'Cemas prospek kerja setelah lulus', status: 'Pending' }
    ]),

    init() {
      this.$watch('chatMessages', val => LocalStore.set('curhat_chat_history', val));
      this.$watch('bookings', val => LocalStore.set('curhat_bookings', val));
      this.$watch('counselorStatus', val => LocalStore.set('curhat_counselor_status', val));
      this.$watch('studentUser', val => {
        LocalStore.set('curhat_student_user', val);
        if (val) {
          if (!this.bookingForm.name) {
            this.bookingForm.name = val.faculty ? `${val.name} (${val.faculty})` : val.name;
          }
          if (!this.bookingForm.contact && val.email) {
            this.bookingForm.contact = val.email;
          }
        }
      });
      this.$watch('registeredStudents', val => LocalStore.set('curhat_registered_students', val));

      this.$nextTick(() => {
        if (window.lucide) lucide.createIcons();
      });
    },

    openAuthModal(mode = 'login') {
      this.authModal.mode = mode;
      this.authModal.isOpen = true;
      this.$nextTick(() => {
        if (window.lucide) lucide.createIcons();
      });
    },

    closeAuthModal() {
      this.authModal.isOpen = false;
    },

    registerStudent() {
      const name = this.authModal.registerForm.name.trim();
      const email = this.authModal.registerForm.email.trim();
      const faculty = this.authModal.registerForm.faculty.trim();
      const password = this.authModal.registerForm.password;

      if (!name || !password) {
        this.showToast("Nama dan password wajib diisi!", "error");
        return;
      }

      const existingIdx = this.registeredStudents.findIndex(
        s => s.name.toLowerCase() === name.toLowerCase()
      );

      const studentAccount = {
        name,
        email,
        faculty,
        password,
        registeredAt: new Date().toISOString()
      };

      if (existingIdx !== -1) {
        this.registeredStudents[existingIdx] = studentAccount;
      } else {
        this.registeredStudents.unshift(studentAccount);
      }

      // Reset form register dan arahkan kembali ke form Login
      this.authModal.registerForm = { name: '', email: '', faculty: '', password: '' };
      this.authModal.loginForm.name = name;
      this.authModal.loginForm.password = '';
      this.authModal.mode = 'login';

      this.showToast("Registrasi berhasil! Silakan login dengan nama & password kamu.");
      this.$nextTick(() => lucide.createIcons());
    },

    loginStudent() {
      const nameInput = this.authModal.loginForm.name.trim().toLowerCase();
      const passwordInput = this.authModal.loginForm.password;

      if (!nameInput || !passwordInput) {
        this.showToast("Masukkan nama dan password terlebih dahulu!", "error");
        return;
      }

      const matched = this.registeredStudents.find(
        s => s.name.toLowerCase() === nameInput && s.password === passwordInput
      );

      if (!matched) {
        this.showToast("Nama atau password salah / belum terdaftar!", "error");
        return;
      }

      this.currentRole = 'student';
      this.studentUser = {
        name: matched.name,
        email: matched.email || '',
        faculty: matched.faculty || '',
        loggedInAt: new Date().toISOString()
      };

      this.authModal.loginForm = { name: '', password: '' };
      this.authModal.isOpen = false;
      this.showToast(`Login berhasil! Selamat datang, ${matched.name}`);
      this.$nextTick(() => lucide.createIcons());
    },

    logoutStudent() {
      this.studentUser = null;
      this.showToast("Kamu telah keluar dari akun mahasiswa.");
      this.$nextTick(() => lucide.createIcons());
    },

    showToast(message, type = 'success') {
      this.toast = { show: true, message, type };
      setTimeout(() => { this.toast.show = false; }, 3000);
    },

    toggleRoleModal() {
      if (this.currentRole === 'student') {
        const password = prompt("Masukkan kata sandi Konselor (Default: admin123):");
        if (password === 'admin123') {
          this.currentRole = 'counselor';
          this.showToast("Login Konselor Berhasil!");
        } else if (password !== null) {
          this.showToast("Password salah!", "error");
        }
      } else {
        this.currentRole = 'student';
        this.showToast("Kembali ke Mode Mahasiswa");
      }
      this.$nextTick(() => lucide.createIcons());
    },

    setCounselorStatus(status) {
      this.counselorStatus = status;
      this.showToast(`Status konselor diubah jadi ${status}`);
    },

    async sendChatMessage() {
      if (!this.userInput.trim() || this.isAiThinking) return;

      const userText = this.userInput.trim();
      this.chatMessages.push({ role: 'user', text: userText });
      this.userInput = '';
      this.isAiThinking = true;

      this.scrollToBottom();

      try {
        const aiReply = await fetchGeminiResponse(this.chatMessages);
        this.chatMessages.push({ role: 'model', text: aiReply });
      } catch (error) {
        this.chatMessages.push({
          role: 'model',
          text: 'Duh, koneksi aku lagi sedikit masalah nih 🥺 Coba kirim ulang pesanmu ya!'
        });
      } finally {
        this.isAiThinking = false;
        this.scrollToBottom();
      }
    },

    sendQuickPrompt(text) {
      this.userInput = text;
      this.sendChatMessage();
    },

    clearChat() {
      if (confirm("Yakin ingin menghapus semua riwayat chat AI?")) {
        this.chatMessages = [
          { role: 'model', text: 'Chat berhasil dibersihkan! Ada hal lain yang mau kamu ceritain?' }
        ];
        this.showToast("Riwayat chat dibersihkan.");
      }
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const win = document.getElementById('chatWindow');
        if (win) win.scrollTop = win.scrollHeight;
      });
    },

    async submitBooking() {
      if (this.isSubmittingBooking) return;
      this.isSubmittingBooking = true;

      const newBooking = {
        id: Date.now(),
        name: this.bookingForm.name.trim(),
        contact: this.bookingForm.contact.trim(),
        date: this.bookingForm.date,
        time: this.bookingForm.time.trim(),
        topic: this.bookingForm.topic.trim(),
        studentEmail: this.studentUser?.email || '',
        status: 'Pending',
        source: 'curhatdeck',
        submittedAt: new Date().toISOString()
      };

      this.bookings.unshift(newBooking);
      this.bookingForm = { name: '', contact: '', date: '', time: '', topic: '' };

      const webhookUrl = (typeof CONFIG !== 'undefined' && CONFIG.BOOKING_WEBHOOK_URL)
        ? CONFIG.BOOKING_WEBHOOK_URL.trim()
        : '';

      if (!webhookUrl || webhookUrl.includes('DOMAIN_N8N_KAMU')) {
        this.isSubmittingBooking = false;
        this.showToast("Booking tersimpan lokal (URL webhook n8n belum diatur).", "error");
        return;
      }

      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(newBooking)
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        this.showToast("Permintaan booking terkirim & notifikasi email diproses!");
      } catch (err) {
        console.error("Webhook booking error:", err);
        this.showToast("Booking tersimpan, tapi gagal mengirim notif ke n8n.", "error");
      } finally {
        this.isSubmittingBooking = false;
      }
    },

    updateBookingStatus(id, newStatus) {
      const idx = this.bookings.findIndex(b => b.id === id);
      if (idx !== -1) {
        this.bookings[idx].status = newStatus;
        this.showToast(`Status booking diperbarui ke ${newStatus}`);
      }
    },

    deleteBooking(id) {
      if (confirm("Hapus antrean booking ini?")) {
        this.bookings = this.bookings.filter(b => b.id !== id);
        this.showToast("Booking berhasil dihapus.");
      }
    }
  }));
});
