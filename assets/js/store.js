// Storage Helper Utility untuk CurhatDeck
const LocalStore = {
  // Key names terpusat
  KEYS: {
    CHAT_MESSAGES: 'curhatdeck_chat_history',
    BOOKINGS: 'curhatdeck_bookings',
    STUDENT_USER: 'curhatdeck_student_user',
    COUNSELOR_STATUS: 'curhatdeck_counselor_status'
  },

  get(key, defaultValue) {
    try {
      const data = localStorage.getItem(key);
      return data !== null ? JSON.parse(data) : defaultValue;
    } catch (err) {
      console.warn(`[LocalStore] Gagal membaca key "${key}":`, err);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn(`[LocalStore] Gagal menyimpan key "${key}":`, err);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn(`[LocalStore] Gagal menghapus key "${key}":`, err);
    }
  },

  clearAll() {
    try {
      Object.values(this.KEYS).forEach((key) => localStorage.removeItem(key));
    } catch (err) {
      console.warn('[LocalStore] Gagal membersihkan storage:', err);
    }
  }
};

// Ekspos ke window agar bisa diakses global oleh app.js
window.LocalStore = LocalStore;
