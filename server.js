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

// --- Mock Data Routes ---

// Comprehensive Management Mock API
app.get('/api/comprehensive', (req, res) => {
    const mockData = {
        stats: {
            personnel: 1326,
            equipment: 39223,
            chemicals: 34.81,
            safetyIndex: 92.13
        },
        personnelByDept: [
            { name: '生产部', count: 456, onDutyRate: 95 },
            { name: '技术部', count: 234, onDutyRate: 92 },
            { name: '安全部', count: 89, onDutyRate: 98 },
            { name: '维修部', count: 178, onDutyRate: 88 },
            { name: '质检部', count: 156, onDutyRate: 94 },
            { name: '后勤部', count: 213, onDutyRate: 90 },
        ]
    };
    res.json(mockData);
});

// Risk Management Mock API
app.get('/api/risk', (req, res) => {
    const mockData = {
        stats: [
            { level: '重大风险', count: 15 },
            { level: '较大风险', count: 55 },
            { level: '一般风险', count: 5 },
            { level: '低风险', count: 3 }
        ],
        riskList: [
            { id: 1, name: '高温反应釜超压', location: '化工2#车间', category: '设备类', level: '重大风险', control: '24小时监控+每2小时巡检', responsible: '张三' },
            { id: 2, name: '易燃物存储超标', location: '危化品仓库', category: '化学品类', level: '重大风险', control: '限量管理+温湿度监控', responsible: '李四' },
            { id: 3, name: '高处作业无防护', location: '化工1#车间', category: '作业类', level: '较大风险', control: '安全带+监护人', responsible: '王五' },
            { id: 4, name: '电气线路老化', location: '动力站', category: '设备类', level: '较大风险', control: '定期检查+更换计划', responsible: '赵六' },
            { id: 5, name: '消防通道堵塞', location: '化工3#车间', category: '环境类', level: '一般风险', control: '每日检查+整改', responsible: '钱七' },
            { id: 6, name: '防护用品过期', location: '综合仓库', category: '物资类', level: '一般风险', control: '定期盘点+及时更新', responsible: '孙八' },
        ]
    };
    res.json(mockData);
});

// Hazard Management Mock API
app.get('/api/hazard', (req, res) => {
    const mockData = {
        stats: {
            inspectionTotal: 5558,
            inspectionRate: 88.9,
            hazardTotal: 2632,
            pending: 289,
            completed: 2343,
            completionRate: 89.0
        },
        hazardList: [
            { id: 1, description: '反应釜温度传感器故障', location: '化工2#车间', foundTime: '2024-12-01', level: '重大', status: '整改中', responsible: '张三', deadline: '2024-12-05' },
            { id: 2, description: '消防栓压力不足', location: '化工1#车间', foundTime: '2024-12-02', level: '较大', status: '已完成', responsible: '李四', deadline: '2024-12-04' },
            { id: 3, description: '安全警示标识缺失', location: '化工3#车间', foundTime: '2024-12-02', level: '一般', status: '待整改', responsible: '王五', deadline: '2024-12-06' },
            { id: 4, description: '设备防护罩损坏', location: '生产车间A', foundTime: '2024-12-03', level: '较大', status: '整改中', responsible: '赵六', deadline: '2024-12-05' },
            { id: 5, description: '照明设施不足', location: '仓库区', foundTime: '2024-12-03', level: '一般', status: '已完成', responsible: '钱七', deadline: '2024-12-04' },
            { id: 6, description: '应急通道杂物堆放', location: '化工2#车间', foundTime: '2024-12-04', level: '一般', status: '待整改', responsible: '孙八', deadline: '2024-12-05' },
        ]
    };
    res.json(mockData);
});

// Equipment Monitoring Mock API (Updated with alarm info)
app.get('/api/equipment', (req, res) => {
    const mockData = {
        stats: {
            total: 39223,
            running: 38901,
            warning: 245,
            maintenance: 77
        },
        list: [
            { id: 1, name: '压缩机A1', code: 'EQ-001', location: '化工1#车间', type: '压缩机', status: '运行中', lastMaintenance: '2024-11-15' },
            { id: 2, name: '反应釜B2', code: 'EQ-002', location: '化工2#车间', type: '反应釜', status: '告警', lastMaintenance: '2024-11-20' },
            { id: 3, name: '输送泵C3', code: 'EQ-003', location: '化工1#车间', type: '泵', status: '运行中', lastMaintenance: '2024-11-10' },
            { id: 4, name: '冷却塔D4', code: 'EQ-004', location: '公用工程', type: '冷却塔', status: '运行中', lastMaintenance: '2024-11-25' },
            { id: 5, name: '锅炉E5', code: 'EQ-005', location: '动力站', type: '锅炉', status: '维护中', lastMaintenance: '2024-12-01' },
            { id: 6, name: '压缩机F6', code: 'EQ-006', location: '化工3#车间', type: '压缩机', status: '运行中', lastMaintenance: '2024-11-18' },
            { id: 7, name: '反应釜G7', code: 'EQ-007', location: '化工2#车间', type: '反应釜', status: '运行中', lastMaintenance: '2024-11-22' },
            { id: 8, name: '分离器H8', code: 'EQ-008', location: '化工1#车间', type: '分离器', status: '告警', lastMaintenance: '2024-11-12' },
        ],
        alarmList: [
            { id: 1, workshop: '化工2#车间', device: '压缩机', tag: 'C120038', type: '泄露', time: '2024-12-04 15:00:23', status: '处理中' },
            { id: 2, workshop: '化工1#车间', device: '反应釜', tag: 'R230156', type: '高温', time: '2024-12-04 14:35:12', status: '已处理' },
            { id: 3, workshop: '化工2#车间', device: '阀门', tag: 'V340267', type: '压力异常', time: '2024-12-04 14:22:45', status: '处理中' },
            { id: 4, workshop: '化工3#车间', device: '泵', tag: 'P450189', type: '振动异常', time: '2024-12-04 13:58:33', status: '已处理' },
            { id: 5, workshop: '动力站', device: '锅炉', tag: 'B560234', type: '水位低', time: '2024-12-04 13:42:18', status: '处理中' },
        ]
    };
    res.json(mockData);
});

// Training Management Mock API
app.get('/api/training', (req, res) => {
    const mockData = {
        stats: {
            totalTrainees: 2719,
            onlineTrainees: 1722,
            offlineTrainees: 997,
            completionRate: 92
        },
        courses: [
            { id: 1, name: '安全生产法律法规', type: '线上', description: '学习国家安全生产相关法律法规', hours: 8, completed: 856 },
            { id: 2, name: '危险化学品管理', type: '线上', description: '危化品存储、使用、运输规范', hours: 12, completed: 723 },
            { id: 3, name: '应急救援培训', type: '线下', description: '应急预案演练与救援技能', hours: 16, completed: 445 },
            { id: 4, name: '特种作业操作', type: '线下', description: '高处、电气、焊接等特种作业', hours: 24, completed: 334 },
            { id: 5, name: '职业健康防护', type: '线上', description: '职业病防护与健康管理', hours: 6, completed: 612 },
            { id: 6, name: '消防安全知识', type: '线下', description: '消防设施使用与火灾应对', hours: 8, completed: 549 },
        ],
        records: [
            { id: 1, name: '张三', course: '安全生产法律法规', type: '线上', time: '2024-11-15', score: 92, status: '合格' },
            { id: 2, name: '李四', course: '危险化学品管理', type: '线上', time: '2024-11-18', score: 88, status: '合格' },
            { id: 3, name: '王五', course: '应急救援培训', type: '线下', time: '2024-11-20', score: 95, status: '合格' },
            { id: 4, name: '赵六', course: '特种作业操作', type: '线下', time: '2024-11-22', score: 78, status: '合格' },
            { id: 5, name: '钱七', course: '职业健康防护', type: '线上', time: '2024-11-25', score: 56, status: '不合格' },
            { id: 6, name: '孙八', course: '消防安全知识', type: '线下', time: '2024-11-28', score: 90, status: '合格' },
        ]
    };
    res.json(mockData);
});

// Regulation Management Mock API
app.get('/api/regulation', (req, res) => {
    const mockData = {
        stats: {
            laws: 102,
            lawsActive: 91,
            regulations: 246,
            regulationsActive: 223,
            procedures: 224,
            proceduresActive: 214
        },
        laws: [
            { id: 1, name: '中华人民共和国安全生产法', code: 'LAW-001', publishDate: '2021-06-10', effectiveDate: '2021-09-01', status: '现行' },
            { id: 2, name: '危险化学品安全管理条例', code: 'LAW-002', publishDate: '2013-12-04', effectiveDate: '2013-12-07', status: '现行' },
            { id: 3, name: '生产安全事故应急条例', code: 'LAW-003', publishDate: '2019-02-17', effectiveDate: '2019-04-01', status: '现行' },
            { id: 4, name: '工伤保险条例', code: 'LAW-004', publishDate: '2010-12-20', effectiveDate: '2011-01-01', status: '现行' },
        ],
        regulations: [
            { id: 1, name: '安全生产责任制管理规定', code: 'REG-001', publishDate: '2023-01-15', effectiveDate: '2023-02-01', status: '现行' },
            { id: 2, name: '危险作业审批管理制度', code: 'REG-002', publishDate: '2023-02-20', effectiveDate: '2023-03-01', status: '现行' },
            { id: 3, name: '隐患排查治理制度', code: 'REG-003', publishDate: '2023-03-10', effectiveDate: '2023-04-01', status: '现行' },
            { id: 4, name: '应急预案管理制度', code: 'REG-004', publishDate: '2023-04-05', effectiveDate: '2023-05-01', status: '现行' },
        ],
        procedures: [
            { id: 1, name: '反应釜安全操作规程', code: 'PROC-001', publishDate: '2023-01-10', effectiveDate: '2023-02-01', status: '现行' },
            { id: 2, name: '压力容器操作规程', code: 'PROC-002', publishDate: '2023-02-15', effectiveDate: '2023-03-01', status: '现行' },
            { id: 3, name: '电气设备检修规程', code: 'PROC-003', publishDate: '2023-03-20', effectiveDate: '2023-04-01', status: '现行' },
            { id: 4, name: '高处作业安全规程', code: 'PROC-004', publishDate: '2023-04-10', effectiveDate: '2023-05-01', status: '现行' },
        ]
    };
    res.json(mockData);
});

// Video Monitoring Mock API (Updated with AI alarm info)
app.get('/api/video', (req, res) => {
    const mockData = {
        stats: {
            total: 156,
            online: 152,
            offline: 4,
            alerts: 23
        },
        cameras: [
            { id: 1, name: '化工1#车间-入口', location: '化工1#车间', status: '在线', lastOnline: '2024-12-04 10:30:00' },
            { id: 2, name: '化工1#车间-操作区', location: '化工1#车间', status: '在线', lastOnline: '2024-12-04 10:30:00' },
            { id: 3, name: '化工2#车间-入口', location: '化工2#车间', status: '在线', lastOnline: '2024-12-04 10:30:00' },
            { id: 4, name: '化工2#车间-储罐区', location: '化工2#车间', status: '离线', lastOnline: '2024-12-03 15:20:00' },
            { id: 5, name: '化工3#车间-入口', location: '化工3#车间', status: '在线', lastOnline: '2024-12-04 10:30:00' },
            { id: 6, name: '公用工程-冷却塔', location: '公用工程', status: '在线', lastOnline: '2024-12-04 10:30:00' },
            { id: 7, name: '动力站-锅炉房', location: '动力站', status: '在线', lastOnline: '2024-12-04 10:30:00' },
            { id: 8, name: '仓库-危化品区', location: '仓库', status: '在线', lastOnline: '2024-12-04 10:30:00' },
            { id: 9, name: '大门-进出口', location: '厂区大门', status: '在线', lastOnline: '2024-12-04 10:30:00' },
        ],
        aiAlarms: [
            { id: 1, location: '化工2#车间', type: '违规作业', reason: '未带安全帽', time: '2024-12-04 15:00:23', status: '处理中' },
            { id: 2, location: '化工1#车间', type: '人员闯入', reason: '无授权进入禁区', time: '2024-12-04 14:35:12', status: '已处理' },
            { id: 3, location: '化工3#车间', type: '违规作业', reason: '未穿防护服', time: '2024-12-04 14:22:45', status: '处理中' },
            { id: 4, location: '仓库区', type: '烟雾检测', reason: '疑似吸烟', time: '2024-12-04 13:58:33', status: '已处理' },
            { id: 5, location: '化工2#车间', type: '违规作业', reason: '未带防护面罩', time: '2024-12-04 13:42:18', status: '处理中' },
            { id: 6, location: '动力站', type: '人员倒地', reason: '疑似摔倒或晕倒', time: '2024-12-04 13:25:07', status: '已处理' },
        ]
    };
    res.json(mockData);
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
