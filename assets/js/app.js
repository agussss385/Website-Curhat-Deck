document.addEventListener('alpine:init', () => {
  function decodeJwtPayload(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (err) {
      console.error('Gagal decode token Google:', err);
      return null;
    }
  }

  Alpine.data('appData', () => ({
    // States
    currentRole: 'student', // 'student' | 'counselor'
    activeTab: 'ai-chat',   // 'ai-chat' | 'booking'
    counselorStatus: LocalStore.get('curhat_counselor_status', 'Online'),
    userInput: '',
    isAiThinking: false,
    isSubmittingBooking: false,
    showSosModal: false,

    // Auth Mahasiswa
    studentUser: LocalStore.get('curhat_student_user', null),
    registeredStudents: LocalStore.get('curhat_registered_students', []),
    authModal: {
      isOpen: false,
      mode: 'login', // 'login' | 'register'
      form: {
        name: '',
        email: '',
        faculty: '',
        nim: ''
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

      window.handleGoogleStudentCredential = (response) => {
        this.handleGoogleCredentialResponse(response);
      };

      this.$nextTick(() => {
        if (window.lucide) lucide.createIcons();
        this.initGoogleSignIn();
      });
    },

    initGoogleSignIn() {
      const clientId = (typeof CONFIG !== 'undefined' && CONFIG.GOOGLE_CLIENT_ID)
        ? CONFIG.GOOGLE_CLIENT_ID.trim()
        : '';

      if (!clientId || clientId.includes('YOUR_GOOGLE_OAUTH_CLIENT_ID')) return;
      if (!window.google || !window.google.accounts || !window.google.accounts.id) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => this.handleGoogleCredentialResponse(response)
      });

      const btnContainer = document.getElementById('googleSignInBtn');
      if (btnContainer) {
        btnContainer.innerHTML = '';
        window.google.accounts.id.renderButton(btnContainer, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          width: 280
        });
      }
    },

    handleGoogleCredentialResponse(response) {
      if (!response || !response.credential) {
        this.showToast("Login Google dibatalkan atau gagal.", "error");
        return;
      }

      const payload = decodeJwtPayload(response.credential);
      if (!payload || !payload.email) {
        this.showToast("Data akun Google tidak valid.", "error");
        return;
      }

      const existing = this.registeredStudents.find(
        s => s.email.toLowerCase() === payload.email.toLowerCase()
      );

      const studentProfile = {
        name: existing?.name || payload.name || 'Mahasiswa',
        email: payload.email,
        faculty: existing?.faculty || '',
        nim: existing?.nim || '',
        picture: payload.picture || '',
        provider: 'google',
        loggedInAt: new Date().toISOString()
      };

      if (!existing) {
        this.registeredStudents.unshift(studentProfile);
      }

      this.currentRole = 'student';
      this.studentUser = studentProfile;
      this.authModal.isOpen = false;
      this.showToast(`Login Google berhasil! Halo, ${studentProfile.name}`);
      this.$nextTick(() => lucide.createIcons());
    },

    openAuthModal(mode = 'login') {
      this.authModal.mode = mode;
      this.authModal.isOpen = true;
      this.$nextTick(() => {
        if (window.lucide) lucide.createIcons();
        this.initGoogleSignIn();
      });
    },

    closeAuthModal() {
      this.authModal.isOpen = false;
    },

    registerStudent() {
      const name = this.authModal.form.name.trim();
      const email = this.authModal.form.email.trim().toLowerCase();
      const faculty = this.authModal.form.faculty.trim();
      const nim = this.authModal.form.nim.trim();

      if (!name || !email) {
        this.showToast("Nama lengkap dan email wajib diisi!", "error");
        return;
      }

      const newStudent = {
        name,
        email,
        faculty,
        nim,
        picture: '',
        provider: 'register',
        registeredAt: new Date().toISOString()
      };

      const idx = this.registeredStudents.findIndex(s => s.email.toLowerCase() === email);
      if (idx !== -1) {
        this.registeredStudents[idx] = { ...this.registeredStudents[idx], ...newStudent };
      } else {
        this.registeredStudents.unshift(newStudent);
      }

      this.currentRole = 'student';
      this.studentUser = newStudent;
      this.authModal.form = { name: '', email: '', faculty: '', nim: '' };
      this.authModal.isOpen = false;

      this.showToast(`Registrasi mahasiswa berhasil! Selamat datang, ${name}`);
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
