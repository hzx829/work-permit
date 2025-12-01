const express = require('express');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images

// 在生产环境下提供静态文件
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/dist')));
}

// --- Auth Routes ---

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (row) {
            res.json({
                success: true,
                user: {
                    id: row.id,
                    username: row.username,
                    role: row.role,
                    full_name: row.full_name
                }
            });
        } else {
            res.status(401).json({ success: false, message: "用户名或密码错误" });
        }
    });
});

// --- Work Permit Routes ---

// Get all permits (with optional filtering)
app.get('/api/work-permits', (req, res) => {
    const { status, search } = req.query;
    let sql = "SELECT * FROM work_permits WHERE 1=1";
    const params = [];

    if (status && status !== '全部') {
        sql += " AND status = ?";
        params.push(status);
    }

    if (search) {
        sql += " AND (permit_number LIKE ? OR applicant_name LIKE ? OR content LIKE ?)";
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam);
    }

    sql += " ORDER BY created_at DESC";

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get single permit
app.get('/api/work-permits/:id', (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM work_permits WHERE id = ?", [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ error: "Work permit not found" });
        }
    });
});

// Create new permit
app.post('/api/work-permits', (req, res) => {
    const {
        type, applicant_id, applicant_name, department, location,
        start_time, end_time, content, safety_measures, signatures
    } = req.body;

    // Generate a simple permit number: WP-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const permit_number = `WP-${dateStr}-${randomSuffix}`;
    const status = '待审批';

    const sql = `INSERT INTO work_permits (
        permit_number, status, type, applicant_id, applicant_name, 
        department, location, start_time, end_time, content, 
        safety_measures, signatures
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
        permit_number, status, type, applicant_id, applicant_name,
        department, location, start_time, end_time, content,
        JSON.stringify(safety_measures), JSON.stringify(signatures || {})
    ];

    db.run(sql, params, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            success: true,
            id: this.lastID,
            permit_number: permit_number
        });
    });
});

// Update status (Approve, Start, Complete, Reject)
app.put('/api/work-permits/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, signatures } = req.body; // signatures might be updated during approval

    let sql = "UPDATE work_permits SET status = ?";
    const params = [status];

    if (signatures) {
        sql += ", signatures = ?";
        params.push(JSON.stringify(signatures));
    }

    sql += " WHERE id = ?";
    params.push(id);

    db.run(sql, params, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
});

// 在生产环境下，所有其他请求返回index.html（支持前端路由）
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client/dist/index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
