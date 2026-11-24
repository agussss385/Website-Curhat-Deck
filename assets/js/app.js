// Ganti dengan URL Production Webhook n8n milikmu
const N8N_WEBHOOK_URL = "https://born-stem-loads-jacket.trycloudflare.com/webhook/curhatdeck-router";
const STORAGE_KEY = "curhatdeck_counseling_items_v1";

let items = readItems();

const tabStudent = document.getElementById("tab-student");
const tabCounselor = document.getElementById("tab-counselor");
const panelStudent = document.getElementById("panel-student");
const panelCounselor = document.getElementById("panel-counselor");

const bookingForm = document.getElementById("student-booking-form");
const modeInput = document.getElementById("input-mode");
const locationInput = document.getElementById("input-location");
const counselorList = document.getElementById("counselor-list");
const studentAlert = document.getElementById("student-alert");
const counselorAlert = document.getElementById("counselor-alert");

tabStudent.addEventListener("click", () => {
  tabStudent.classList.add("active");
  tabCounselor.classList.remove("active");
  panelStudent.classList.remove("hidden");
  panelCounselor.classList.add("hidden");
});

tabCounselor.addEventListener("click", () => {
  tabCounselor.classList.add("active");
  tabStudent.classList.remove("active");
  panelCounselor.classList.remove("hidden");
  panelStudent.classList.add("hidden");
  renderCounselorList();
});

modeInput.addEventListener("change", () => {
  if (modeInput.value === "Online") {
    locationInput.value = "Online (Google Meet)";
  } else if (locationInput.value === "Online (Google Meet)") {
    locationInput.value = "Ruang Konseling";
  }
});

bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const bookingId = String(Date.now());
  const name = document.getElementById("input-name").value.trim();
  const email = document.getElementById("input-email").value.trim();
  const faculty = document.getElementById("input-faculty").value.trim();
  const mode = modeInput.value === "Online" ? "Online" : "Offline";
  const date = document.getElementById("input-date").value.trim();
  const cleanTime = document
    .getElementById("input-time")
    .value.trim()
    .replace(/\s*WIB\s*/gi, "")
    .trim();
  const location =
    locationInput.value.trim() ||
    (mode === "Online" ? "Online (Google Meet)" : "Ruang Konseling");
  const topic = document.getElementById("input-topic").value.trim();

  const schedule =
    `${date}${date && cleanTime ? " " : ""}${
      cleanTime ? `(${cleanTime} WIB)` : ""
    }`.trim() || "-";

  const entry = {
    action: "booking_created",
    bookingId,
    name,
    contact: email,
    targetEmail: email,
    faculty,
    mode,
    date,
    time: cleanTime,
    schedule,
    location,
    meetingLink: "",
    topic,
    status: "Pending"
  };

  items.unshift(entry);
  writeItems();
  renderCounselorList();
  bookingForm.reset();
  locationInput.value = "Online (Google Meet)";

  try {
    await postToWebhook(entry);
    showAlert(
      studentAlert,
      `Booking #${bookingId} berhasil dikirim. Menunggu konfirmasi & link dari konselor.`,
      "success"
    );
  } catch (err) {
    showAlert(
      studentAlert,
      `Booking #${bookingId} tersimpan, tetapi gagal mengirim ke webhook: ${err.message}`,
      "error"
    );
  }
});

function renderCounselorList() {
  if (!items.length) {
    counselorList.innerHTML =
      '<div class="empty-state">Belum ada booking masuk. Silakan buat booking dari tab Mahasiswa.</div>';
    return;
  }

  counselorList.innerHTML = items
    .map((item) => {
      const approved = String(item.status).toLowerCase() === "disetujui";
      const badgeClass = approved ? "status-approved" : "status-pending";
      const modeVal = item.mode === "Online" ? "Online" : "Offline";

      return `
        <article class="booking-card" data-booking-id="${escapeAttr(item.bookingId)}">
          <div class="booking-top">
            <span class="booking-id">#${escapeHtml(item.bookingId)}</span>
            <span class="status-pill ${badgeClass}">${escapeHtml(item.status || "Pending")}</span>
          </div>

          <div class="booking-meta">
            <div><strong>Nama:</strong> ${escapeHtml(item.name)}</div>
            <div><strong>Email:</strong> ${escapeHtml(item.targetEmail || item.contact || "-")}</div>
            <div><strong>Jurusan / Prodi:</strong> ${escapeHtml(item.faculty)}</div>
            <div><strong>Mode:</strong> ${escapeHtml(modeVal)}</div>
            <div><strong>Jadwal:</strong> ${escapeHtml(item.schedule)}</div>
            <div>
              <strong>Link Meet:</strong>
              ${
                item.meetingLink
                  ? `<a href="${escapeAttr(item.meetingLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.meetingLink)}</a>`
                  : "<em>Belum diisi</em>"
              }
            </div>
          </div>

          <div class="booking-topic"><strong>Topik:</strong> ${escapeHtml(item.topic)}</div>

          <div class="meet-bar">
            <select class="row-mode-select" data-id="${escapeAttr(item.bookingId)}">
              <option value="Online" ${modeVal === "Online" ? "selected" : ""}>Online</option>
              <option value="Offline" ${modeVal === "Offline" ? "selected" : ""}>Offline</option>
            </select>

            <input
              type="url"
              class="row-meet-input"
              data-id="${escapeAttr(item.bookingId)}"
              placeholder="Tempel link Google Meet di sini (https://meet.google.com/...)"
              value="${escapeAttr(item.meetingLink || "")}"
            />

            <button
              type="button"
              class="btn-save-send"
              data-id="${escapeAttr(item.bookingId)}"
            >
              Simpan & Kirim
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

counselorList.addEventListener("click", async (event) => {
  const btn = event.target.closest(".btn-save-send");
  if (!btn) return;

  const bookingId = btn.getAttribute("data-id");
  const modeSelect = counselorList.querySelector(
    `.row-mode-select[data-id="${CSS.escape(bookingId)}"]`
  );
  const meetInput = counselorList.querySelector(
    `.row-meet-input[data-id="${CSS.escape(bookingId)}"]`
  );

  const selectedMode = modeSelect ? modeSelect.value : "Online";
  const meetingLink = meetInput ? meetInput.value.trim() : "";

  if (selectedMode === "Online" && !meetingLink) {
    showAlert(
      counselorAlert,
      "Tempelkan link Google Meet terlebih dahulu sebelum menekan Simpan & Kirim.",
      "error"
    );
    return;
  }

  const target = items.find((row) => String(row.bookingId) === String(bookingId));
  if (!target) return;

  target.mode = selectedMode === "Online" ? "Online" : "Offline";
  target.meetingLink = selectedMode === "Online" ? meetingLink : "";
  target.location =
    selectedMode === "Online"
      ? "Online (Google Meet)"
      : target.location && target.location !== "Online (Google Meet)"
      ? target.location
      : "Ruang Konseling";
  target.status = "Disetujui";
  target.action = "meeting_link_updated";

  writeItems();
  renderCounselorList();

  const payload = {
    action: target.action,
    bookingId: target.bookingId,
    name: target.name,
    contact: target.contact,
    targetEmail: target.targetEmail || target.contact,
    faculty: target.faculty,
    mode: target.mode,
    meetingLink: target.meetingLink,
    location: target.location,
    date: target.date || "",
    time: target.time || "",
    schedule: target.schedule,
    topic: target.topic,
    status: target.status
  };

  const activeBtn = counselorList.querySelector(
    `.btn-save-send[data-id="${CSS.escape(bookingId)}"]`
  );
  if (activeBtn) activeBtn.disabled = true;

  try {
    await postToWebhook(payload);
    showAlert(
      counselorAlert,
      `Booking #${bookingId} disetujui dan data link Google Meet terkirim ke n8n.`,
      "success"
    );
  } catch (err) {
    showAlert(
      counselorAlert,
      `Data tersimpan di browser, namun pengiriman ke n8n gagal: ${err.message}`,
      "error"
    );
  } finally {
    if (activeBtn) activeBtn.disabled = false;
  }
});

async function postToWebhook(payload) {
  if (!N8N_WEBHOOK_URL || N8N_WEBHOOK_URL.includes("https://born-stem-loads-jacket.trycloudflare.com/webhook/curhatdeck-router")) {
    throw new Error("N8N_WEBHOOK_URL di app.js belum diganti.");
  }

  const res = await fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`Status HTTP ${res.status}`);
  }
}

function readItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function writeItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function showAlert(el, message, type) {
  el.textContent = message;
  el.className = type === "success" ? "alert show-success" : "alert show-error";
}

function escapeHtml(val) {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(val) {
  return escapeHtml(val);
}

renderCounselorList();
