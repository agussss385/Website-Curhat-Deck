async submitBooking() {
      if (this.isSubmittingBooking) return;

      const name = this.bookingForm.name.trim();
      const contact = this.bookingForm.contact.trim();
      const date = this.bookingForm.date;
      const time = this.bookingForm.time.trim();
      const topic = this.bookingForm.topic.trim();

      if (!name || (!date && !time)) {
        this.showToast("Lengkapi nama dan jadwal sesi terlebih dahulu!", "error");
        return;
      }

      this.isSubmittingBooking = true;

      const newBooking = {
        id: Date.now(),
        name,
        contact,
        date,
        time,
        topic,
        studentEmail: this.studentUser?.email || '',
        status: 'Pending',
        source: 'curhatdeck',
        submittedAt: new Date().toISOString()
      };

      this.bookings.unshift(newBooking);
      this.bookingForm = { name: '', contact: '', date: '', time: '', topic: '' };

      const endpoint = (typeof CONFIG !== 'undefined' && (CONFIG.BOOKING_ENDPOINT || CONFIG.BOOKING_WEBHOOK_URL))
        ? String(CONFIG.BOOKING_ENDPOINT || CONFIG.BOOKING_WEBHOOK_URL).trim()
        : '/api/booking';

      if (!endpoint || endpoint.includes('DOMAIN_N8N_KAMU')) {
        this.isSubmittingBooking = false;
        this.showToast("Booking tersimpan lokal (endpoint booking belum diatur).", "error");
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
        this.showToast("Booking tersimpan lokal, tapi gagal mengirim notifikasi ke server.", "error");
      } finally {
        this.isSubmittingBooking = false;
      }
    },
