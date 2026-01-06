const sqlite3 = require('sqlite3').verbose();

const backupFile = 'work_permits.db.backup_20260106_110245';
const currentFile = 'work_permits.db';

console.log(`开始从 ${backupFile} 迁移数据...`);

// 打开备份数据库
const backupDb = new sqlite3.Database(backupFile, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('打开备份数据库失败:', err.message);
        process.exit(1);
    }
});

// 打开当前数据库
const currentDb = new sqlite3.Database(currentFile, (err) => {
    if (err) {
        console.error('打开当前数据库失败:', err.message);
        process.exit(1);
    }
});

// 迁移作业票数据
backupDb.all("SELECT * FROM work_permits", [], (err, rows) => {
    if (err) {
        console.error('读取作业票数据失败:', err.message);
        backupDb.close();
        currentDb.close();
        return;
    }

    if (rows.length === 0) {
        console.log('备份中没有作业票数据');
        backupDb.close();
        currentDb.close();
        return;
    }

    console.log(`找到 ${rows.length} 条作业票数据`);

    const stmt = currentDb.prepare(`
        INSERT INTO work_permits (
            id, permit_number, status, type, applicant_id, applicant_name, 
            department, location, start_time, end_time, content, 
            safety_measures, signatures, extra_data, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let migratedCount = 0;
    rows.forEach((row) => {
        stmt.run(
            row.id, row.permit_number, row.status, row.type, 
            row.applicant_id, row.applicant_name, row.department, 
            row.location, row.start_time, row.end_time, row.content, 
            row.safety_measures, row.signatures, row.extra_data, row.created_at,
            (err) => {
                if (err) {
                    console.error(`迁移作业票 ${row.permit_number} 失败:`, err.message);
                } else {
                    migratedCount++;
                }
            }
        );
    });

    stmt.finalize(() => {
        console.log(`✅ 成功迁移 ${migratedCount} 条作业票数据`);
        
        // 迁移摄像头数据
        backupDb.all("SELECT * FROM camera_urls", [], (err, cameraRows) => {
            if (err) {
                console.log('备份中没有摄像头数据表或读取失败');
                backupDb.close();
                currentDb.close();
                return;
            }

            if (cameraRows.length === 0) {
                console.log('备份中没有摄像头数据');
                backupDb.close();
                currentDb.close();
                return;
            }

            console.log(`找到 ${cameraRows.length} 条摄像头数据`);

            const cameraStmt = currentDb.prepare(`
                INSERT INTO camera_urls (
                    id, camera_id, camera_name, location, jump_url, 
                    description, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            let cameraMigratedCount = 0;
            cameraRows.forEach((row) => {
                cameraStmt.run(
                    row.id, row.camera_id, row.camera_name, row.location,
                    row.jump_url, row.description, row.status, 
                    row.created_at, row.updated_at,
                    (err) => {
                        if (err) {
                            console.error(`迁移摄像头 ${row.camera_id} 失败:`, err.message);
                        } else {
                            cameraMigratedCount++;
                        }
                    }
                );
            });

            cameraStmt.finalize(() => {
                console.log(`✅ 成功迁移 ${cameraMigratedCount} 条摄像头数据`);
                backupDb.close();
                currentDb.close();
                console.log('\n数据迁移完成！');
            });
        });
    });
});
