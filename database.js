const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

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

        // Uploaded laws, regulations and operating procedures are shared by the
        // management center and the digital cockpit.
        db.run(`CREATE TABLE IF NOT EXISTS regulation_documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            name TEXT NOT NULL,
            mime_type TEXT,
            size INTEGER DEFAULT 0,
            content BLOB NOT NULL,
            uploaded_by INTEGER,
            uploaded_by_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        db.run('CREATE INDEX IF NOT EXISTS idx_regulation_documents_category_created ON regulation_documents(category, created_at)');

        // Create Camera URLs table for AI monitoring jump links
        db.run(`CREATE TABLE IF NOT EXISTS camera_urls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            camera_id INTEGER UNIQUE,
            camera_name TEXT,
            location TEXT,
            jump_url TEXT,
            description TEXT,
            status TEXT DEFAULT '在线',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Migration: add location and status columns if not exist
        db.run("ALTER TABLE camera_urls ADD COLUMN location TEXT", (err) => {});
        db.run("ALTER TABLE camera_urls ADD COLUMN status TEXT DEFAULT '在线'", (err) => {});

        // Emergency-response records are kept independently from work permits so
        // cockpit alarms can be resumed and audited after a page refresh.
        db.run(`CREATE TABLE IF NOT EXISTS emergency_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alarm_key TEXT,
            title TEXT NOT NULL DEFAULT '突发险情',
            incident_type TEXT,
            location TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            stage TEXT NOT NULL DEFAULT 'verification',
            response_level TEXT,
            selected_plan TEXT,
            rescue_mode TEXT,
            alarm_decision TEXT,
            rejection_reason TEXT,
            merged_into_id INTEGER,
            watch_data TEXT,
            gas_data TEXT,
            available_plans TEXT,
            state_data TEXT,
            timeline TEXT,
            created_by INTEGER,
            created_by_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        db.run('CREATE INDEX IF NOT EXISTS idx_emergency_events_status ON emergency_events(status, updated_at)');
        db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_emergency_events_alarm_key ON emergency_events(alarm_key) WHERE alarm_key IS NOT NULL');

        db.run(`CREATE TABLE IF NOT EXISTS emergency_gas_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT,
            device_name TEXT,
            location TEXT,
            readings TEXT NOT NULL,
            measured_at TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        db.run('CREATE INDEX IF NOT EXISTS idx_emergency_gas_readings_created ON emergency_gas_readings(created_at)');

        db.run(`CREATE TABLE IF NOT EXISTS emergency_attachments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER NOT NULL,
            kind TEXT NOT NULL,
            filename TEXT NOT NULL,
            mime_type TEXT,
            size INTEGER DEFAULT 0,
            content BLOB NOT NULL,
            uploaded_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(event_id) REFERENCES emergency_events(id)
        )`);
        db.run('CREATE INDEX IF NOT EXISTS idx_emergency_attachments_event ON emergency_attachments(event_id, created_at)');

        // Temporary accident-simulation switch used to exercise the complete
        // cockpit -> emergency-response flow without connected field hardware.
        db.run(`CREATE TABLE IF NOT EXISTS emergency_simulation_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            active INTEGER NOT NULL DEFAULT 0,
            activated_at TEXT,
            updated_by INTEGER,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        db.run(`INSERT OR IGNORE INTO emergency_simulation_state (id, active) VALUES (1, 0)`);

        // Seed Users if empty
        db.get("SELECT count(*) as count FROM users", (err, row) => {
            if (row.count === 0) {
                const stmt = db.prepare("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)");
                stmt.run("worker", bcrypt.hashSync("Schy123456#", 10), "worker", "张三 (作业员)");
                stmt.run("safety", bcrypt.hashSync("Schy123456#", 10), "safety", "其他人员");
                stmt.finalize();
                console.log("Seeded initial users with hashed passwords.");
            } else {
                // Migrate existing plaintext passwords to bcrypt hashes.
                // bcryptjs may emit $2a$ hashes, so treat common bcrypt prefixes as already hashed.
                db.each(
                    "SELECT id, password FROM users WHERE password NOT LIKE '$2a$%' AND password NOT LIKE '$2b$%' AND password NOT LIKE '$2y$%'",
                    [],
                    (err, row) => {
                        if (!err && row) {
                            const hashed = bcrypt.hashSync(row.password, 10);
                            db.run("UPDATE users SET password = ? WHERE id = ?", [hashed, row.id], (updateErr) => {
                                if (!updateErr) console.log(`Migrated password hash for user id=${row.id}`);
                            });
                        }
                    }
                );
            }
        });
    });
}

module.exports = db;
