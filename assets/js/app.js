// Ganti URL di bawah ini dengan URL Production Webhook n8n milikmu
const N8N_WEBHOOK_URL = "https://GANTI_DENGAN_WEBHOOK_N8N_KAMU";
const STORAGE_KEY = "curhatdeck_bookings_v1";

let bookings = loadBookings();

// Elemen DOM utama
const btnViewStudent = document.getElementById("btn-view-student");
const btnViewCounselor = document.getElementById("btn-view-counselor");
const studentSection = document.getElementById("student-section");
const counselorSection = document.getElementById("counselor-section");

const bookingForm = document.getElementById("booking-form");
const sessionModeSelect = document.getElementById("session-mode");
const sessionLocationInput = document.getElementById("session-location");
const counselorListEl = document.getElementById("counselor-booking-list");
const studentToast = document.getElementById("student-toast");
const counselorToast = document.getElementById("counselor-toast");

// Toggle tampilan Mahasiswa / Konselor
btnViewStudent.addEventListener("click", () => {
  btnViewStudent.classList.add("active");
  btnViewCounselor.classList.remove("active");
  studentSection.classList.remove("hidden");
  counselorSection.classList.add("hidden");
});

btnViewCounselor.addEventListener("click", () => {
  btnViewCounselor.classList.add("active");
  btnViewStudent.classList.remove("active");
  counselorSection.classList.remove("hidden");
  studentSection.classList.add("hidden");
  renderCounselorBookings();
});

// Sesuaikan label/nilai lokasi saat mode berubah di form mahasiswa
sessionModeSelect.addEventListener("change", () => {
  if (sessionModeSelect.value === "Online") {
    sessionLocationInput.value = "Online (Google Meet)";
  } else if (sessionLocationInput.value === "Online (Google Meet)") {
    sessionLocationInput.value = "Ruang Konseling";
  }
});

// Submit booking baru dari mahasiswa
bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const bookingId = String(Date.now());
  const name = document.getElementById("student-name").value.trim();
  const email = document.getElementById("student-email").value.trim();
  const faculty = document.getElementById("student-faculty").value.trim();
  const mode = sessionModeSelect.value === "Online" ? "Online" : "Offline";
  const date = document.getElementById("session-date").value.trim();
  const rawTime = document.getElementById("session-time").value.trim();
  const time = rawTime.replace(/\s*WIB\s*/gi, "").trim();
  const location =
    document.getElementById("session-location").value.trim() ||
    (mode === "Online" ? "Online (Google Meet)" : "Ruang Konseling");
  const topic = document.getElementById("session-topic").value.trim();

  const schedule =
    `${date}${date && time ? " " : ""}${time ? `(${time} WIB)` : ""}`.trim() || "-";

  const newBooking = {
    action: "booking_created",
    bookingId,
    name,
    contact: email,
    targetEmail: email,
    faculty,
    mode,
    date,
    time,
    schedule,
    location,
    meetingLink: "",
    topic,
    status: "Pending"
  };

  bookings.unshift(newBooking);
  saveBookings();
  renderCounselorBookings();
  bookingForm.reset();
  sessionLocationInput.value = "Online (Google Meet)";

  try {
    await sendToWebhook(newBooking);
    showToast(
      studentToast,
      `Booking #${bookingId} berhasil dibuat dan notifikasi awal dikirim.`,
      "success"
    );
  } catch (err) {
    showToast(
      studentToast,
      `Booking #${bookingId} tersimpan, namun gagal mengirim ke webhook: ${err.message}`,
      "error"
    );
  }
});

// Render daftar booking di Mode Konselor
function renderCounselorBookings() {
  if (!bookings.length) {
    counselorListEl.innerHTML = "<p>Belum ada booking yang masuk.</p>";
    return;
  }

  counselorListEl.innerHTML = bookings
    .map((item) => {
      const isApproved = String(item.status).toLowerCase() === "disetujui";
      const badgeClass = isApproved ? "badge-approved" : "badge-pending";
      const currentMode = item.mode === "Online" ? "Online" : "Offline";

      return `
        <div class="booking-item" data-id="${escapeHtml(item.bookingId)}">
          <div class="booking-header">
            <div>
              <strong>#${escapeHtml(item.bookingId)}</strong> — ${escapeHtml(item.name)}
              (${escapeHtml(item.faculty)})
            </div>
            <span class="badge ${badgeClass}">${escapeHtml(item.status || "Pending")}</span>
          </div>

          <div><strong>Email:</strong> ${escapeHtml(item.targetEmail || item.contact || "-")}</div>
          <div><strong>Mode:</strong> ${escapeHtml(currentMode)} | <strong>Jadwal:</strong> ${escapeHtml(item.schedule || "-")}</div>
          <div><strong>Topik:</strong> ${escapeHtml(item.topic || "-")}</div>
          <div>
            <strong>Link Google Meet saat ini:</strong>
            ${
              item.meetingLink
                ? `<a href="${escapeAttr(item.meetingLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.meetingLink)}</a>`
                : "<em>Belum diisi</em>"
            }
          </div>

          <div class="counselor-controls">
            <select class="counselor-mode-select" data-booking-id="${escapeAttr(item.bookingId)}">
              <option value="Online" ${currentMode === "Online" ? "selected" : ""}>Online</option>
              <option value="Offline" ${currentMode === "Offline" ? "selected" : ""}>Offline</option>
            </select>

            <input
              type="url"
              class="meet-link-input"
              data-booking-id="${escapeAttr(item.bookingId)}"
              placeholder="Tempel link Google Meet (https://meet.google.com/...)"
              value="${escapeAttr(item.meetingLink || "")}"
            />

            <button
              type="button"
              class="btn-save-send"
              data-booking-id="${escapeAttr(item.bookingId)}"
            >
              Simpan & Kirim
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

// Event delegation untuk tombol "Simpan & Kirim" di Mode Konselor
counselorListEl.addEventListener("click", async (e) => {
  const btn = e.target.closest(".btn-save-send");
  if (!btn) return;

  const bookingId = btn.getAttribute("data-booking-id");
  const modeSelect = counselorListEl.querySelector(
    `.counselor-mode-select[data-booking-id="${CSS.escape(bookingId)}"]`
  );
  const linkInput = counselorListEl.querySelector(
    `.meet-link-input[data-booking-id="${CSS.escape(bookingId)}"]`
  );

  const selectedMode = modeSelect ? modeSelect.value : "Online";
  const meetingLink = linkInput ? linkInput.value.trim() : "";

  if (selectedMode === "Online" && !meetingLink) {
    showToast(
      counselorToast,
      "Silakan tempelkan link Google Meet terlebih dahulu sebelum klik Simpan & Kirim.",
      "error"
    );
    return;
  }

  const targetBooking = bookings.find(
    (b) => String(b.bookingId) === String(bookingId)
  );
  if (!targetBooking) return;

  // Update data booking & ubah status menjadi "Disetujui"
  targetBooking.mode = selectedMode === "Online" ? "Online" : "Offline";
  targetBooking.meetingLink = selectedMode === "Online" ? meetingLink : "";
  targetBooking.location =
    selectedMode === "Online"
      ? "Online (Google Meet)"
      : targetBooking.location && targetBooking.location !== "Online (Google Meet)"
      ? targetBooking.location
      : "Ruang Konseling";
  targetBooking.status = "Disetujui";
  targetBooking.action = "meeting_link_updated";

  saveBookings();
  renderCounselorBookings();

  const payload = {
    action: targetBooking.action,
    bookingId: targetBooking.bookingId,
    name: targetBooking.name,
    contact: targetBooking.contact,
    targetEmail: targetBooking.targetEmail || targetBooking.contact,
    faculty: targetBooking.faculty,
    mode: targetBooking.mode,
    meetingLink: targetBooking.meetingLink,
    location: targetBooking.location,
    date: targetBooking.date || "",
    time: targetBooking.time || "",
    schedule: targetBooking.schedule,
    topic: targetBooking.topic,
    status: targetBooking.status
  };

  const activeBtn = counselorListEl.querySelector(
    `.btn-save-send[data-booking-id="${CSS.escape(bookingId)}"]`
  );
  if (activeBtn) activeBtn.disabled = true;

  try {
    await sendToWebhook(payload);
    showToast(
      counselorToast,
      `Booking #${bookingId} diperbarui menjadi "Disetujui" dan dikirim ke Gmail.`,
      "success"
    );
  } catch (err) {
    showToast(
      counselorToast,
      `Status tersimpan lokal, tapi pengiriman ke n8n gagal: ${err.message}`,
      "error"
    );
  } finally {
    if (activeBtn) activeBtn.disabled = false;
  }
});

async function sendToWebhook(payload) {
  if (!N8N_WEBHOOK_URL || N8N_WEBHOOK_URL.includes("https://born-stem-loads-jacket.trycloudflare.com/webhook/curhatdeck-router")) {
    throw new Error("URL Webhook n8n di app.js belum diisi.");
  }

  const response = await fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

function loadBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveBookings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

function showToast(el, message, type) {
  el.textContent = message;
  el.className = `toast ${type}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

// Render awal saat halaman dibuka
renderCounselorBookings();
