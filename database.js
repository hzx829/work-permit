const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 支持通过环境变量配置数据库路径（用于Docker部署）
const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'work_permits.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Create Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT,
            full_name TEXT
        )`);

        // Create Work Permits table
        db.run(`CREATE TABLE IF NOT EXISTS work_permits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            permit_number TEXT UNIQUE,
            status TEXT,
            type TEXT,
            applicant_id INTEGER,
            applicant_name TEXT,
            department TEXT,
            location TEXT,
            start_time TEXT,
            end_time TEXT,
            content TEXT,
            safety_measures TEXT,
            signatures TEXT, -- JSON string for signatures
            extra_data TEXT, -- JSON string for specific permit data
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Try to add extra_data column if it doesn't exist (migration for existing DB)
        db.run("ALTER TABLE work_permits ADD COLUMN extra_data TEXT", (err) => {
            // Ignore error if column already exists
        });

        // Seed Users if empty
        db.get("SELECT count(*) as count FROM users", (err, row) => {
            if (row.count === 0) {
                const stmt = db.prepare("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)");
                stmt.run("worker", "123", "worker", "张三 (作业员)");
                stmt.run("safety", "123", "safety", "李四 (安全员)");
                stmt.finalize();
                console.log("Seeded initial users: worker/123, safety/123");
            }
        });
    });
}

module.exports = db;
