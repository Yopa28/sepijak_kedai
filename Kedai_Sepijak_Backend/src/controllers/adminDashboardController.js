// ============================================
// Admin Dashboard Controller (FIXED & SAFE)
// Kedai Sepijak Backend
// ============================================

const { query } = require("../config/database");

// Helper: cek apakah tabel ada
async function tableExists(tableName) {
  try {
    const [row] = await query(
      `SELECT COUNT(*) AS count 
       FROM information_schema.tables 
       WHERE table_schema = DATABASE() AND table_name = ?`,
      [tableName]
    );
    return row?.count > 0;
  } catch (e) {
    return false;
  }
}

// Helper: cek apakah kolom ada di tabel
async function columnExists(tableName, columnName) {
  try {
    const [row] = await query(
      `SELECT COUNT(*) AS count 
       FROM information_schema.columns 
       WHERE table_schema = DATABASE() 
         AND table_name = ? 
         AND column_name = ?`,
      [tableName, columnName]
    );
    return row?.count > 0;
  } catch (e) {
    return false;
  }
}

// GET /api/dashboard/stats
exports.getStatistics = async (req, res) => {
  try {
    // =============== FEEDBACK ===============
    let feedbackStats = [{ 
      total_feedback: 0, today_feedback: 0, week_feedback: 0, 
      month_feedback: 0, average_rating: 0, today_average_rating: 0 
    }];

    if (await tableExists('feedback')) {
      try {
        const rows = await query(`
          SELECT
            COUNT(*) as total_feedback,
            SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_feedback,
            SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as week_feedback,
            SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as month_feedback,
            AVG(rating) as average_rating,
            AVG(CASE WHEN DATE(created_at) = CURDATE() THEN rating ELSE NULL END) as today_average_rating
          FROM feedback
        `);
        if (rows?.length > 0) feedbackStats = rows;
      } catch (e) {
        console.warn("⚠️ Feedback stats query failed:", e.message);
      }
    }

    // =============== WAITERS ===============
    let totalWaiters = 0;
    let activeWaiters = 0;

    if (await tableExists('waiters')) {
      try {
        const [wc] = await query(`SELECT COUNT(*) AS total FROM waiters`);
        totalWaiters = Number(wc?.total || 0);

        if (await columnExists('waiters', 'is_active')) {
          const [row] = await query(
            `SELECT SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS count FROM waiters`
          );
          activeWaiters = Number(row?.count || 0);
        } else if (await columnExists('waiters', 'status')) {
          const [row] = await query(
            `SELECT SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS count FROM waiters`
          );
          activeWaiters = Number(row?.count || 0);
        } else {
          activeWaiters = totalWaiters; // fallback: semua aktif
        }
      } catch (e) {
        console.warn("⚠️ Waiters stats query failed:", e.message);
      }
    }

    // =============== POLLS & VOTES ===============
    let pollsStats = { total_polls: 0, active_polls: 0 };
    let votesStats = { total_votes: 0, today_votes: 0 };

    if (await tableExists('polls')) {
      try {
        const [p] = await query(`
          SELECT 
            COUNT(*) AS total_polls,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_polls
          FROM polls
        `);
        if (p) pollsStats = p;
      } catch (e) {
        console.warn("⚠️ Polls stats failed:", e.message);
      }
    }

    if (await tableExists('poll_votes')) {
      try {
        // Cek apakah ada kolom 'created_at' di poll_votes
        const hasCreatedAt = await columnExists('poll_votes', 'created_at');
        const dateColumn = hasCreatedAt ? 'created_at' : 'submitted_at'; // sesuaikan jika nama kolom berbeda

        const [v] = await query(`
          SELECT 
            COUNT(*) AS total_votes,
            SUM(CASE WHEN DATE(${dateColumn}) = CURDATE() THEN 1 ELSE 0 END) AS today_votes
          FROM poll_votes
        `);
        if (v) votesStats = v;
      } catch (e) {
        console.warn("⚠️ Votes stats failed:", e.message);
      }
    }

    // =============== VOUCHERS ===============
    let vouchersStats = { total_vouchers: 0, available_vouchers: 0, used_vouchers: 0 };
    if (await tableExists('vouchers')) {
      try {
        const [v] = await query(`
          SELECT 
            COUNT(*) AS total_vouchers,
            SUM(CASE WHEN is_used = 0 AND (expiry_date IS NULL OR expiry_date > NOW()) THEN 1 ELSE 0 END) AS available_vouchers,
            SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) AS used_vouchers
          FROM vouchers
        `);
        if (v) vouchersStats = v;
      } catch (e) {
        console.warn("⚠️ Vouchers stats failed:", e.message);
      }
    }

    // =============== GROWTH & TREND ===============
    let feedbackGrowth = 0;
    try {
      const [thisWeek] = await query(
        `SELECT COUNT(*) AS count FROM feedback WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
      );
      const [lastWeek] = await query(
        `SELECT COUNT(*) AS count FROM feedback WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`
      );
      const thisCount = Number(thisWeek?.count || 0);
      const lastCount = Number(lastWeek?.count || 0);
      feedbackGrowth = lastCount > 0 ? parseFloat((((thisCount - lastCount) / lastCount) * 100).toFixed(1)) : 0;
    } catch (e) {
      console.warn("⚠️ Feedback growth calc failed:", e.message);
    }

    let ratingTrend = "stable";
    try {
      const [todayRow] = await query(
        `SELECT AVG(rating) AS avg FROM feedback WHERE DATE(created_at) = CURDATE()`
      );
      const [yesterdayRow] = await query(
        `SELECT AVG(rating) AS avg FROM feedback WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`
      );
      const todayAvg = Number(todayRow?.avg || 0);
      const yesterdayAvg = Number(yesterdayRow?.avg || 0);
      if (todayAvg > yesterdayAvg + 0.2) ratingTrend = "up";
      else if (todayAvg < yesterdayAvg - 0.2) ratingTrend = "down";
    } catch (e) {
      console.warn("⚠️ Rating trend calc failed:", e.message);
    }

    // =============== RESPONSE (DIPERBAIKI: PASTIKAN NUMBER) ===============
    const stats = {
      total_feedback: Number(feedbackStats[0]?.total_feedback || 0),
      today_feedback: Number(feedbackStats[0]?.today_feedback || 0),
      week_feedback: Number(feedbackStats[0]?.week_feedback || 0),
      month_feedback: Number(feedbackStats[0]?.month_feedback || 0),
      average_rating: Number(feedbackStats[0]?.average_rating || 0).toFixed(2),
      today_average_rating: Number(feedbackStats[0]?.today_average_rating || 0).toFixed(2),
      feedback_growth: feedbackGrowth,
      rating_trend: ratingTrend,

      total_waiters: totalWaiters,
      active_waiters: activeWaiters,

      total_polls: Number(pollsStats.total_polls || 0),
      active_polls: Number(pollsStats.active_polls || 0),

      total_votes: Number(votesStats.total_votes || 0),
      today_votes: Number(votesStats.today_votes || 0),

      total_vouchers: Number(vouchersStats.total_vouchers || 0),
      available_vouchers: Number(vouchersStats.available_vouchers || 0),
      used_vouchers: Number(vouchersStats.used_vouchers || 0),
    };

    res.json({ success: true, data: { statistics: stats } });

  } catch (error) {
    console.error("❌ FATAL ERROR in getStatistics:", error);
    res.status(500).json({ 
      success: false, 
      message: "Gagal mengambil statistik dashboard",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// GET /api/dashboard/recent-feedback
exports.getRecentFeedback = async (req, res) => {
  try {
    if (!(await tableExists('feedback'))) {
      return res.json({ success: true, data: [] });
    }

    const limit = parseInt(req.query.limit) || 10;
    const rows = await query(
      `
      SELECT
        f.id,
        f.customer_name,
        f.rating,
        f.message AS comment,
        f.category,
        f.created_at,
        w.name AS waiter_name
      FROM feedback f
      LEFT JOIN waiters w ON f.waiter_id = w.id
      ORDER BY f.created_at DESC
      LIMIT ?
      `,
      [limit]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("getRecentFeedback error:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil feedback terbaru" });
  }
};

// GET /api/dashboard/active-polls
exports.getActivePolls = async (req, res) => {
  try {
    if (!(await tableExists('polls'))) {
      return res.json({ success: true, data: [] });
    }

    const rows = await query(`
      SELECT
        p.id,
        p.question,
        p.is_active,
        p.created_at,
        COUNT(pv.id) AS total_votes
      FROM polls p
      LEFT JOIN poll_votes pv ON p.id = pv.poll_id
      WHERE p.is_active = 1
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("getActivePolls error:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil polling aktif" });
  }
};

// GET /api/dashboard/top-waiters
exports.getTopWaiters = async (req, res) => {
  try {
    if (!(await tableExists('waiters'))) {
      return res.json({ success: true, data: [] });
    }

    const limit = parseInt(req.query.limit) || 10;
    const rows = await query(
      `
      SELECT
        w.id,
        w.name,
        (w.status = 'active') AS is_active,
        COUNT(f.id) AS feedback_count,
        COALESCE(AVG(f.rating), 0) AS average_rating
      FROM waiters w
      LEFT JOIN feedback f ON w.id = f.waiter_id
      WHERE w.status = 'active'
      GROUP BY w.id, w.name, w.status
      ORDER BY average_rating DESC, feedback_count DESC
      LIMIT ?
      `,
      [limit]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("getTopWaiters error:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil data waiter terbaik" });
  }
};

// GET /api/dashboard/feedback-trend
exports.getFeedbackTrend = async (req, res) => {
  try {
    if (!(await tableExists('feedback'))) {
      return res.json({ success: true, data: [] });
    }

    const days = parseInt(req.query.days) || 7;
    const rows = await query(
      `
      SELECT
        DATE(created_at) AS date,
        COUNT(*) AS count,
        COALESCE(AVG(rating), 0) AS average_rating,
        SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) AS positive_count,
        SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) AS negative_count
      FROM feedback
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
      `,
      [days]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("getFeedbackTrend error:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil trend feedback" });
  }
};

// GET /api/dashboard/feedback-by-category
exports.getFeedbackByCategory = async (req, res) => {
  try {
    if (!(await tableExists('feedback'))) {
      return res.json({ success: true, data: [] });
    }

    const days = parseInt(req.query.days) || 30;
    const rows = await query(
      `
      SELECT
        COALESCE(category, 'Umum') AS category,
        COUNT(*) AS count,
        COALESCE(AVG(rating), 0) AS average_rating
      FROM feedback
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY category
      ORDER BY count DESC
      `,
      [days]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("getFeedbackByCategory error:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil feedback per kategori" });
  }
};