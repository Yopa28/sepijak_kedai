// ============================================
// Feedback Controller
// Kedai Sepijak Backend
// ============================================
const { query } = require('../config/database');

// helper baca angka aman
const toInt = (v, d = 0) => {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? d : n;
};

// POST /api/feedback
exports.createFeedback = async (req, res) => {
  try {
    const b = req.body || {};

    console.log('Received payload:', b); // Tambahkan log ini

    const role = b.role?.trim();
    const employee_name = b.employee_name?.trim();
    const contact = b.contact ?? null;
    const date_of_visit = b.date_of_visit ?? null;
    const time_of_visit = b.time_of_visit ?? null;

    // Ambil nilai rating individual
    const rating_sikap_pelayan = toInt(b.rating_sikap_pelayan, null);
    const rating_waktu_pesanan = toInt(b.rating_waktu_pesanan, null);
    const rating_rasa_menu = toInt(b.rating_rasa_menu, null);
    const rating_kebersihan = toInt(b.rating_kebersihan, null);

    const message = b.message?.trim() || null;
    const voluntary_consent = Boolean(b.voluntary_consent);
    const category = b.category ?? null;
    const latitude = b.latitude ?? null;
    const longitude = b.longitude ?? null;

    // Validasi minimal
    if (!role || !employee_name || !voluntary_consent) {
      return res.status(400).json({
        success: false,
        message: 'role, employee_name, and voluntary_consent are required'
      });
    }

    // Validasi nilai rating (harus 1-5 atau null)
    const ratings = [rating_sikap_pelayan, rating_waktu_pesanan, rating_rasa_menu, rating_kebersihan];
    for (const rating of ratings) {
      if (rating !== null && (rating < 1 || rating > 5)) {
        return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5, or null.' });
      }
    }

    const sql = `
      INSERT INTO feedback
        (role, employee_name, contact, date_of_visit, time_of_visit,
         rating_sikap_pelayan, rating_waktu_pesanan, rating_rasa_menu, rating_kebersihan,
         message, voluntary_consent, category, latitude, longitude,
         ip_address, user_agent, status)
      VALUES (?, ?, ?, ?, ?,
              ?, ?, ?, ?,
              ?, ?, ?, ?, ?,
              ?, ?, 'pending')
    `;
    const params = [
      role, employee_name, contact, date_of_visit, time_of_visit,
      rating_sikap_pelayan, rating_waktu_pesanan, rating_rasa_menu, rating_kebersihan,
      message, voluntary_consent, category, latitude, longitude,
      (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0],
      req.headers['user-agent'] || ''
    ];

    console.log('SQL Query:', sql); // Tambahkan log ini
    console.log('Params:', params); // Tambahkan log ini

    const result = await query(sql, params);

    // Ambil data yang baru dibuat
    const [created] = await query(`SELECT * FROM feedback WHERE id = ?`, [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: created
    });
  } catch (err) {
    console.error('createFeedback error:', err); // Ini akan muncul di terminal
    return res.status(500).json({ success: false, message: 'Gagal menyimpan feedback: ' + err.message });
  }
};

// GET /api/feedback?rating=&waiter_id=&category=&date=&q=&page=&per_page=
exports.listFeedback = async (req, res) => {
  try {
    const rows = await query(`
      SELECT * FROM feedback
      ORDER BY id DESC
      LIMIT 10
    `);

    return res.json({
      success: true,
      data: rows,
      meta: {
        total: rows.length,
        page: 1,
        per_page: 10,
        total_pages: 1
      }
    });
  } catch (err) {
    console.error('listFeedback error:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil feedback' });
  }
};

// GET /api/feedback/:id
exports.getFeedbackById = async (req, res) => {
  try {
    const id = toInt(req.params.id, 0);
    if (!id) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const rows = await query(`SELECT * FROM feedback WHERE id = ?`, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Feedback tidak ditemukan' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('getFeedbackById error:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail feedback' });
  }
};