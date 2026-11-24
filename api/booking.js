export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const counselorEmail = process.env.COUNSELOR_EMAIL;
  const fromEmail = process.env.FROM_EMAIL || 'CurhatDeck <onboarding@resend.dev>';

  if (!resendApiKey || !counselorEmail) {
    return res.status(500).json({
      error: 'RESEND_API_KEY atau COUNSELOR_EMAIL belum diatur di Environment Variables Vercel.'
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    const nama = String(body.nama || body.name || 'Anonim').trim();
    const kontak = String(body.kontak || body.contact || '-').trim();
    const tanggal = String(body.tanggal || body.date || '-').trim();
    const jam = String(body.jam || body.time || '-').trim();
    const cerita = String(body.cerita || body.notes || body.description || '-').trim();

    if (!nama || (!tanggal && !jam)) {
      return res.status(400).json({ error: 'Data booking belum lengkap.' });
    }

    const emailText = [
      'Ada permintaan sesi konseling baru dari CurhatDeck:',
      '',
      `Nama / Inisial : ${nama}`,
      `Kontak         : ${kontak}`,
      `Tanggal        : ${tanggal}`,
      `Jam Sesi       : ${jam}`,
      `Gambaran       : ${cerita}`
    ].join('\n');

    const mailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [counselorEmail],
        subject: `Booking Konsul Baru: ${nama} (${tanggal} ${jam})`,
        text: emailText
      })
    });

    const mailResult = await mailResponse.json().catch(() => ({}));

    if (!mailResponse.ok) {
      return res.status(mailResponse.status).json({
        error: mailResult?.message || 'Gagal mengirim email notifikasi ke konselor.'
      });
    }

    return res.status(200).json({
      ok: true,
      id: mailResult?.id || null,
      message: 'Booking berhasil dikirim dan notifikasi email telah terkirim.'
    });
  } catch (err) {
    console.error('Error di /api/booking:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan internal saat memproses booking.' });
  }
}
