const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');
const { getWatchSnapshot } = require('./services/watchPlatform');

const app = express();

app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// JWT 密钥：生产环境必须通过环境变量 JWT_SECRET 设置固定值，否则重启后 Token 失效
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET not set in production! Tokens will be invalidated on every restart.');
}
const JWT_SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(64).toString('hex');

// 认证中间件
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: '未授权，请先登录' });
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ success: false, message: '登录已过期，请重新登录' });
        }
        req.user = decoded;
        next();
    });
}

function sendInternalError(res, context, err) {
    console.error(context, err);
    if (res.headersSent) return;

    const payload = {
        success: false,
        message: '服务器内部错误，请稍后重试'
    };

    if (process.env.NODE_ENV !== 'production') {
        payload.error = err?.message || String(err);
    }

    res.status(500).json(payload);
}

// 对所有 /api/* 路由启用认证，仅放行 /api/login
app.use('/api', (req, res, next) => {
    if (req.path === '/login') return next();
    authenticateToken(req, res, next);
});
// 开发环境使用3000端口（配合vite proxy），生产环境HTTP使用80端口，HTTPS使用443端口
const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 80 : 3000);
const HTTPS_PORT = process.env.HTTPS_PORT || 443;

// 在生产环境下提供静态文件
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/dist')));
}

// --- Auth Routes ---

app.post('/api/login', (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
        return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        try {
            if (err) return sendInternalError(res, 'Login user query failed:', err);
            if (!row || !row.password) {
                return res.status(401).json({ success: false, message: '用户名或密码错误' });
            }

            bcrypt.compare(String(password), row.password, (compareErr, match) => {
                try {
                    if (compareErr || !match) {
                        if (compareErr) console.error('Password compare failed:', compareErr);
                        return res.status(401).json({ success: false, message: '用户名或密码错误' });
                    }
                    const user = { id: row.id, username: row.username, role: row.role, full_name: row.full_name };
                    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
                    res.json({ success: true, user, token });
                } catch (compareHandlerErr) {
                    sendInternalError(res, 'Login compare handler failed:', compareHandlerErr);
                }
            });
        } catch (loginErr) {
            sendInternalError(res, 'Login route failed:', loginErr);
        }
    });
});

// --- External Data Routes ---

// Smart watch data relay. Vendor credentials stay on the server and are read
// from WATCH_PLATFORM_USERNAME / WATCH_PLATFORM_PASSWORD environment variables.
app.get('/api/watches/latest', async (req, res) => {
    try {
        const snapshot = await getWatchSnapshot();
        res.set('Cache-Control', 'no-store');
        res.json(snapshot);
    } catch (error) {
        console.error('Watch platform sync failed:', error.message);
        res.status(502).json({
            success: false,
            message: '手表数据暂时无法同步，请稍后重试',
        });
    }
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
            { id: 1, source: 'AI监控', description: '反应釜温度传感器故障', location: '化工2#车间', foundTime: '2024-12-01', level: '重大', status: '整改中', responsible: '张三', deadline: '2024-12-05' },
            { id: 2, source: '日常检查', description: '消防栓压力不足', location: '化工1#车间', foundTime: '2024-12-02', level: '较大', status: '已闭环', responsible: '李四', deadline: '2024-12-04' },
            { id: 3, source: '日常检查', description: '安全警示标识缺失', location: '化工3#车间', foundTime: '2024-12-02', level: '一般', status: '待分配', responsible: '王五', deadline: '2024-12-06' },
            { id: 4, source: 'AI监控', description: '设备防护罩损坏', location: '生产车间A', foundTime: '2024-12-03', level: '较大', status: '整改中', responsible: '赵六', deadline: '2024-12-05' },
            { id: 5, source: '日常检查', description: '照明设施不足', location: '仓库区', foundTime: '2024-12-03', level: '一般', status: '已闭环', responsible: '钱七', deadline: '2024-12-04' },
            { id: 6, source: 'AI监控', description: '应急通道杂物堆放', location: '化工2#车间', foundTime: '2024-12-04', level: '一般', status: '待分配', responsible: '孙八', deadline: '2024-12-05' },
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
    // Get camera URLs from database
    db.all('SELECT * FROM camera_urls', [], (err, urlRows) => {
        const urlMap = {};
        const customCameras = [];
        const defaultCameraIds = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        if (!err && urlRows) {
            urlRows.forEach(row => {
                urlMap[row.camera_id] = {
                    jump_url: row.jump_url,
                    camera_name: row.camera_name,
                    location: row.location,
                    status: row.status
                };
                // 如果是自定义添加的摄像头（不在默认列表中），添加到customCameras
                if (!defaultCameraIds.includes(row.camera_id)) {
                    customCameras.push({
                        id: row.camera_id,
                        name: row.camera_name || `摄像头-${row.camera_id}`,
                        location: row.location || '未设置',
                        status: row.status || '在线',
                        lastOnline: new Date().toISOString().replace('T', ' ').substring(0, 19),
                        jumpUrl: row.jump_url,
                        isCustom: true
                    });
                }
            });
        }
        
        const defaultCameras = [
            { id: 1, name: '化工1#车间-入口', location: '化工1#车间', status: '在线', lastOnline: '2024-12-04 10:30:00' },
            { id: 2, name: '化工1#车间-操作区', location: '化工1#车间', status: '在线', lastOnline: '2024-12-04 10:30:00' },
            { id: 3, name: '化工2#车间-入口', location: '化工2#车间', status: '在线', lastOnline: '2024-12-04 10:30:00' },
            { id: 4, name: '化工2#车间-储罐区', location: '化工2#车间', status: '离线', lastOnline: '2024-12-03 15:20:00' },
            { id: 5, name: '化工3#车间-入口', location: '化工3#车间', status: '在线', lastOnline: '2024-12-04 10:30:00' },
            { id: 6, name: '公用工程-冷却塔', location: '公用工程', status: '在线', lastOnline: '2024-12-04 10:30:00' },
            { id: 7, name: '动力站-锅炉房', location: '动力站', status: '在线', lastOnline: '2024-12-04 10:30:00' },
            { id: 8, name: '仓库-危化品区', location: '仓库', status: '在线', lastOnline: '2024-12-04 10:30:00' },
            { id: 9, name: '大门-进出口', location: '厂区大门', status: '在线', lastOnline: '2024-12-04 10:30:00' },
        ].map(camera => {
            const config = urlMap[camera.id];
            return {
                ...camera,
                // 如果有配置，可以覆盖默认的name和location
                name: config?.camera_name || camera.name,
                location: config?.location || camera.location,
                status: config?.status || camera.status,
                jumpUrl: config?.jump_url || null,
                isCustom: false
            };
        });
        
        // 合并自定义摄像头和默认摄像头，新添加的排在前面
        const cameras = [...customCameras, ...defaultCameras];

        const mockData = {
            stats: {
                total: 156,
                online: 152,
                offline: 4,
                alerts: 23
            },
            cameras,
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
});

// Occupational Health Mock API
app.get('/api/occupational-health', (req, res) => {
    const mockData = {
        stats: [
            { label: '在岗人数', value: 1326, unit: '人', bgColor: 'bg-blue-50', textColor: 'text-blue-500', icon: 'fas fa-users' },
            { label: '健康档案', value: 1326, unit: '份', bgColor: 'bg-green-50', textColor: 'text-green-500', icon: 'fas fa-file-medical' },
            { label: '本月体检', value: 89, unit: '人', bgColor: 'bg-purple-50', textColor: 'text-purple-500', icon: 'fas fa-stethoscope' },
            { label: '异常跟踪', value: 12, unit: '人', bgColor: 'bg-orange-50', textColor: 'text-orange-500', icon: 'fas fa-exclamation-triangle' },
        ],
        healthRecords: [
            { name: '张三', department: '生产部', checkDate: '2024-11-15', checkType: '年度体检', result: '正常', nextCheck: '2025-11-15' },
            { name: '李四', department: '技术部', checkDate: '2024-11-18', checkType: '职业病检查', result: '正常', nextCheck: '2025-05-18' },
            { name: '王五', department: '安全部', checkDate: '2024-11-20', checkType: '年度体检', result: '异常', nextCheck: '2024-12-20' },
            { name: '赵六', department: '维修部', checkDate: '2024-11-22', checkType: '噪声接触检查', result: '正常', nextCheck: '2025-05-22' },
            { name: '钱七', department: '质检部', checkDate: '2024-11-25', checkType: '年度体检', result: '正常', nextCheck: '2025-11-25' },
        ],
        riskFactors: [
            { position: '化工操作工', hazard: '有毒气体', exposedCount: 156, protection: '防毒面具、通风设施', monitorCycle: '每月' },
            { position: '焊接工', hazard: '电焊烟尘', exposedCount: 45, protection: '防尘口罩、通风', monitorCycle: '每月' },
            { position: '噪声岗位', hazard: '噪声', exposedCount: 234, protection: '耳塞、隔音房', monitorCycle: '每季度' },
            { position: '高温岗位', hazard: '高温', exposedCount: 78, protection: '降温设施、防暑用品', monitorCycle: '每月' },
        ]
    };
    res.json(mockData);
});

// Daily Inspection Mock API
app.get('/api/daily-inspection', (req, res) => {
    const mockData = {
        stats: [
            { label: '本月检查', value: 128, unit: '次', bgColor: 'bg-blue-50', textColor: 'text-blue-500', icon: 'fas fa-clipboard-check' },
            { label: '发现问题', value: 45, unit: '个', bgColor: 'bg-orange-50', textColor: 'text-orange-500', icon: 'fas fa-exclamation-circle' },
            { label: '待检查', value: 12, unit: '项', bgColor: 'bg-yellow-50', textColor: 'text-yellow-500', icon: 'fas fa-clock' },
            { label: '完成率', value: 89, unit: '%', bgColor: 'bg-green-50', textColor: 'text-green-500', icon: 'fas fa-check-circle' },
        ],
        inspections: [
            { id: 'CHK-2024-001', type: '日常巡检', area: '化工1#车间', inspector: '张三', planDate: '2024-12-06', status: '待检查', issuesFound: 0 },
            { id: 'CHK-2024-002', type: '专项检查', area: '化工2#车间', inspector: '李四', planDate: '2024-12-05', status: '已完成', issuesFound: 3 },
            { id: 'CHK-2024-003', type: '日常巡检', area: '化工3#车间', inspector: '王五', planDate: '2024-12-06', status: '待检查', issuesFound: 0 },
            { id: 'CHK-2024-004', type: '综合检查', area: '动力站', inspector: '赵六', planDate: '2024-12-04', status: '已完成', issuesFound: 2 },
            { id: 'CHK-2024-005', type: '日常巡检', area: '仓库区', inspector: '钱七', planDate: '2024-12-05', status: '已完成', issuesFound: 1 },
        ]
    };
    res.json(mockData);
});

// Emergency Management Mock API
app.get('/api/emergency', (req, res) => {
    const mockData = {
        stats: [
            { label: '应急预案', value: 15, unit: '个', bgColor: 'bg-blue-50', textColor: 'text-blue-500', icon: 'fas fa-file-alt' },
            { label: '年度演练', value: 28, unit: '次', bgColor: 'bg-green-50', textColor: 'text-green-500', icon: 'fas fa-users' },
            { label: '应急事件', value: 3, unit: '起', bgColor: 'bg-orange-50', textColor: 'text-orange-500', icon: 'fas fa-exclamation-triangle' },
            { label: '处置率', value: 100, unit: '%', bgColor: 'bg-purple-50', textColor: 'text-purple-500', icon: 'fas fa-check-circle' },
        ],
        plans: [
            { name: '火灾应急预案', type: '综合预案', createDate: '2023-01-15', responsible: '张三', status: '有效' },
            { name: '危化品泄漏应急预案', type: '专项预案', createDate: '2023-02-20', responsible: '李四', status: '有效' },
            { name: '触电事故应急预案', type: '专项预案', createDate: '2023-03-10', responsible: '王五', status: '有效' },
            { name: '高处坠落应急预案', type: '专项预案', createDate: '2023-04-05', responsible: '赵六', status: '有效' },
        ],
        drills: [
            { name: '消防应急演练', type: '综合演练', date: '2024-11-15', participants: 156, effect: '良好' },
            { name: '危化品泄漏演练', type: '专项演练', date: '2024-10-20', participants: 45, effect: '良好' },
            { name: '触电救援演练', type: '桌面演练', date: '2024-09-10', participants: 23, effect: '一般' },
        ],
        events: [
            { id: 'EM-2024-001', type: '设备故障', time: '2024-11-28 14:30', level: '一般', status: '已处置', responsible: '张三' },
            { id: 'EM-2024-002', type: '人员受伤', time: '2024-10-15 10:20', level: '较大', status: '已处置', responsible: '李四' },
            { id: 'EM-2024-003', type: '物料泄漏', time: '2024-09-05 16:45', level: '一般', status: '已处置', responsible: '王五' },
        ]
    };
    res.json(mockData);
});

// Accident Investigation Mock API
app.get('/api/accident-investigation', (req, res) => {
    const mockData = {
        stats: [
            { label: '事故总数', value: 8, unit: '起', bgColor: 'bg-red-50', textColor: 'text-red-500', icon: 'fas fa-exclamation-circle' },
            { label: '轻微事故', value: 5, unit: '起', bgColor: 'bg-yellow-50', textColor: 'text-yellow-500', icon: 'fas fa-info-circle' },
            { label: '一般事故', value: 3, unit: '起', bgColor: 'bg-orange-50', textColor: 'text-orange-500', icon: 'fas fa-exclamation-triangle' },
            { label: '结案率', value: 87.5, unit: '%', bgColor: 'bg-green-50', textColor: 'text-green-500', icon: 'fas fa-check-circle' },
        ],
        accidents: [
            { id: 'ACC-2024-001', type: '机械伤害', time: '2024-11-28 14:30', level: '轻微事故', injuries: 1, loss: '2000元', status: '已结案' },
            { id: 'ACC-2024-002', type: '物体打击', time: '2024-10-15 10:20', level: '一般事故', injuries: 1, loss: '5000元', status: '已结案' },
            { id: 'ACC-2024-003', type: '高处坠落', time: '2024-09-05 16:45', level: '一般事故', injuries: 1, loss: '8000元', status: '调查中' },
            { id: 'ACC-2024-004', type: '触电', time: '2024-08-22 09:15', level: '轻微事故', injuries: 1, loss: '1500元', status: '已结案' },
            { id: 'ACC-2024-005', type: '烫伤', time: '2024-07-10 13:40', level: '轻微事故', injuries: 1, loss: '1000元', status: '已结案' },
        ]
    };
    res.json(mockData);
});

// Special Equipment Mock API
app.get('/api/special-equipment', (req, res) => {
    const mockData = {
        stats: [
            { label: '特种设备', value: 156, unit: '台', bgColor: 'bg-blue-50', textColor: 'text-blue-500', icon: 'fas fa-cogs' },
            { label: '正常运行', value: 148, unit: '台', bgColor: 'bg-green-50', textColor: 'text-green-500', icon: 'fas fa-check-circle' },
            { label: '持证人员', value: 234, unit: '人', bgColor: 'bg-purple-50', textColor: 'text-purple-500', icon: 'fas fa-id-card' },
            { label: '即将到期', value: 8, unit: '台', bgColor: 'bg-orange-50', textColor: 'text-orange-500', icon: 'fas fa-clock' },
        ],
        equipment: [
            { id: 'SE-001', name: '压力容器A1', type: '压力容器', location: '化工1#车间', lastInspection: '2024-06-15', nextInspection: '2025-06-15', status: '正常' },
            { id: 'SE-002', name: '起重机B2', type: '起重机械', location: '化工2#车间', lastInspection: '2024-05-20', nextInspection: '2025-05-20', status: '正常' },
            { id: 'SE-003', name: '电梯C3', type: '电梯', location: '办公楼', lastInspection: '2024-11-10', nextInspection: '2025-11-10', status: '正常' },
            { id: 'SE-004', name: '锅炉D4', type: '锅炉', lastInspection: '2024-01-15', nextInspection: '2025-01-15', status: '即将到期' },
            { id: 'SE-005', name: '压力管道E5', type: '压力管道', location: '化工3#车间', lastInspection: '2024-08-20', nextInspection: '2025-08-20', status: '正常' },
        ],
        personnel: [
            { name: '张三', department: '生产部', certType: '压力容器操作证', certNumber: 'PC-2023-001', issueDate: '2023-01-15', expiryDate: '2027-01-15', status: '有效' },
            { name: '李四', department: '技术部', certType: '起重机操作证', certNumber: 'CR-2023-002', issueDate: '2023-02-20', expiryDate: '2027-02-20', status: '有效' },
            { name: '王五', department: '维修部', certType: '电工证', certNumber: 'EL-2023-003', issueDate: '2023-03-10', expiryDate: '2025-03-10', status: '即将过期' },
            { name: '赵六', department: '动力站', certType: '锅炉操作证', certNumber: 'BO-2023-004', issueDate: '2023-04-05', expiryDate: '2027-04-05', status: '有效' },
        ]
    };
    res.json(mockData);
});

// Safety Assessment Mock API
app.get('/api/safety-assessment', (req, res) => {
    const mockData = {
        stats: [
            { label: '考核部门', value: 12, unit: '个', bgColor: 'bg-blue-50', textColor: 'text-blue-500', icon: 'fas fa-building' },
            { label: '考核人员', value: 1326, unit: '人', bgColor: 'bg-green-50', textColor: 'text-green-500', icon: 'fas fa-users' },
            { label: '平均分', value: 87.5, unit: '分', bgColor: 'bg-purple-50', textColor: 'text-purple-500', icon: 'fas fa-chart-line' },
            { label: '优秀率', value: 45, unit: '%', bgColor: 'bg-orange-50', textColor: 'text-orange-500', icon: 'fas fa-trophy' },
        ],
        departments: [
            { name: '生产部', period: '2024年11月', baseScore: 100, deduction: 5, bonus: 3, finalScore: 98, grade: '优秀' },
            { name: '技术部', period: '2024年11月', baseScore: 100, deduction: 8, bonus: 2, finalScore: 94, grade: '优秀' },
            { name: '安全部', period: '2024年11月', baseScore: 100, deduction: 2, bonus: 5, finalScore: 103, grade: '优秀' },
            { name: '维修部', period: '2024年11月', baseScore: 100, deduction: 12, bonus: 1, finalScore: 89, grade: '良好' },
            { name: '质检部', period: '2024年11月', baseScore: 100, deduction: 15, bonus: 0, finalScore: 85, grade: '良好' },
        ],
        individuals: [
            { name: '张三', department: '生产部', position: '班长', period: '2024年11月', violations: 0, trainingRate: 100, score: 95 },
            { name: '李四', department: '技术部', position: '技术员', period: '2024年11月', violations: 1, trainingRate: 95, score: 88 },
            { name: '王五', department: '安全部', position: '安全员', period: '2024年11月', violations: 0, trainingRate: 100, score: 98 },
            { name: '赵六', department: '维修部', position: '维修工', period: '2024年11月', violations: 2, trainingRate: 85, score: 78 },
            { name: '钱七', department: '质检部', position: '质检员', period: '2024年11月', violations: 1, trainingRate: 90, score: 82 },
        ]
    };
    res.json(mockData);
});

// Safety Officer Mock API
app.get('/api/safety-officer', (req, res) => {
    const mockData = {
        stats: [
            { label: '安全员总数', value: 45, unit: '人', bgColor: 'bg-blue-50', textColor: 'text-blue-500', icon: 'fas fa-user-shield' },
            { label: '在岗人数', value: 42, unit: '人', bgColor: 'bg-green-50', textColor: 'text-green-500', icon: 'fas fa-check-circle' },
            { label: '本月检查', value: 156, unit: '次', bgColor: 'bg-purple-50', textColor: 'text-purple-500', icon: 'fas fa-clipboard-check' },
            { label: '发现问题', value: 89, unit: '个', bgColor: 'bg-orange-50', textColor: 'text-orange-500', icon: 'fas fa-exclamation-triangle' },
        ],
        officers: [
            { name: '张三', employeeId: 'EMP-001', department: '生产部', certNumber: 'SO-2023-001', certExpiry: '2027-01-15', phone: '13800138001', status: '在岗' },
            { name: '李四', employeeId: 'EMP-002', department: '技术部', certNumber: 'SO-2023-002', certExpiry: '2027-02-20', phone: '13800138002', status: '在岗' },
            { name: '王五', employeeId: 'EMP-003', department: '安全部', certNumber: 'SO-2023-003', certExpiry: '2027-03-10', phone: '13800138003', status: '在岗' },
            { name: '赵六', employeeId: 'EMP-004', department: '维修部', certNumber: 'SO-2023-004', certExpiry: '2027-04-05', phone: '13800138004', status: '休假' },
        ],
        workRecords: [
            { date: '2024-12-05', officer: '张三', workType: '日常巡检', content: '化工1#车间安全检查', issuesFound: 3, status: '已处理' },
            { date: '2024-12-05', officer: '李四', workType: '专项检查', content: '消防设施检查', issuesFound: 2, status: '处理中' },
            { date: '2024-12-04', officer: '王五', workType: '隐患排查', content: '化工2#车间隐患排查', issuesFound: 5, status: '已处理' },
            { date: '2024-12-04', officer: '张三', workType: '安全培训', content: '新员工安全教育', issuesFound: 0, status: '已完成' },
        ]
    };
    res.json(mockData);
});

// Safety Review Mock API
app.get('/api/safety-review', (req, res) => {
    const mockData = {
        stats: [
            { label: '年度评审', value: 4, unit: '次', bgColor: 'bg-blue-50', textColor: 'text-blue-500', icon: 'fas fa-clipboard-list' },
            { label: '发现问题', value: 45, unit: '个', bgColor: 'bg-orange-50', textColor: 'text-orange-500', icon: 'fas fa-exclamation-circle' },
            { label: '改进措施', value: 45, unit: '项', bgColor: 'bg-purple-50', textColor: 'text-purple-500', icon: 'fas fa-tasks' },
            { label: '完成率', value: 89, unit: '%', bgColor: 'bg-green-50', textColor: 'text-green-500', icon: 'fas fa-check-circle' },
        ],
        reviews: [
            { id: 'REV-2024-001', type: '管理评审', date: '2024-11-15', leader: '张三', issuesFound: 12, status: '已完成' },
            { id: 'REV-2024-002', type: '专项评审', date: '2024-09-20', leader: '李四', issuesFound: 8, status: '整改中' },
            { id: 'REV-2024-003', type: '内部审核', date: '2024-07-10', leader: '王五', issuesFound: 15, status: '已完成' },
            { id: 'REV-2024-004', type: '外部审核', date: '2024-05-05', leader: '赵六', issuesFound: 10, status: '已完成' },
        ],
        improvements: [
            { id: 'IMP-001', reviewId: 'REV-2024-001', issue: '安全培训记录不完整', action: '建立培训档案系统', department: '安全部', deadline: '2024-12-15', status: '进行中' },
            { id: 'IMP-002', reviewId: 'REV-2024-001', issue: '应急预案未及时更新', action: '修订应急预案', department: '安全部', deadline: '2024-12-10', status: '已完成' },
            { id: 'IMP-003', reviewId: 'REV-2024-002', issue: '隐患排查覆盖不全', action: '制定隐患排查清单', department: '生产部', deadline: '2024-12-20', status: '进行中' },
            { id: 'IMP-004', reviewId: 'REV-2024-002', issue: '安全投入不足', action: '增加安全预算', department: '财务部', deadline: '2025-01-01', status: '未开始' },
        ]
    };
    res.json(mockData);
});

// Fire Safety Mock API
app.get('/api/fire-safety', (req, res) => {
    const mockData = {
        stats: [
            { label: '消防设施', value: 456, unit: '个', bgColor: 'bg-blue-50', textColor: 'text-blue-500', icon: 'fas fa-fire-extinguisher' },
            { label: '正常设施', value: 448, unit: '个', bgColor: 'bg-green-50', textColor: 'text-green-500', icon: 'fas fa-check-circle' },
            { label: '年度演练', value: 12, unit: '次', bgColor: 'bg-purple-50', textColor: 'text-purple-500', icon: 'fas fa-users' },
            { label: '待检查', value: 8, unit: '个', bgColor: 'bg-orange-50', textColor: 'text-orange-500', icon: 'fas fa-clock' },
        ],
        equipment: [
            { id: 'FE-001', type: '灭火器', location: '化工1#车间', installDate: '2023-01-15', lastCheck: '2024-11-15', nextCheck: '2024-12-15', status: '正常' },
            { id: 'FE-002', type: '消火栓', location: '化工2#车间', installDate: '2023-02-20', lastCheck: '2024-11-20', nextCheck: '2024-12-20', status: '正常' },
            { id: 'FE-003', type: '自动喷淋', location: '化工3#车间', installDate: '2023-03-10', lastCheck: '2024-10-10', nextCheck: '2024-12-10', status: '待检查' },
            { id: 'FE-004', type: '烟感报警器', location: '仓库区', installDate: '2023-04-05', lastCheck: '2024-11-05', nextCheck: '2024-12-05', status: '正常' },
            { id: 'FE-005', type: '应急照明', location: '办公楼', installDate: '2023-05-15', lastCheck: '2024-09-15', nextCheck: '2024-12-15', status: '待检查' },
        ],
        inspections: [
            { date: '2024-12-01', type: '日常检查', area: '化工1#车间', inspector: '张三', issuesFound: 2, status: '已整改' },
            { date: '2024-11-25', type: '专项检查', area: '化工2#车间', inspector: '李四', issuesFound: 1, status: '已整改' },
            { date: '2024-11-20', type: '日常检查', area: '仓库区', inspector: '王五', issuesFound: 3, status: '整改中' },
            { date: '2024-11-15', type: '综合检查', area: '全厂区', inspector: '赵六', issuesFound: 5, status: '已整改' },
        ],
        drills: [
            { date: '2024-11-15', topic: '消防应急疏散演练', participants: 156, department: '安全部', duration: '2小时', effect: '优秀' },
            { date: '2024-09-20', topic: '灭火器使用培训', participants: 89, department: '安全部', duration: '1小时', effect: '良好' },
            { date: '2024-07-10', topic: '火灾报警系统测试', participants: 45, department: '技术部', duration: '1.5小时', effect: '良好' },
        ]
    };
    res.json(mockData);
});

// --- Work Permit Routes ---

// Get all permits (with optional filtering)
app.get('/api/work-permits', (req, res) => {
    const { status, search, page = 1, pageSize = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    
    // Select fields without extra_data for list view to improve performance
    let sql = "SELECT id, permit_number, status, type, applicant_id, applicant_name, department, location, start_time, end_time, content, safety_measures, signatures, created_at FROM work_permits WHERE 1=1";
    let countSql = "SELECT COUNT(*) as total FROM work_permits WHERE 1=1";
    const params = [];
    const countParams = [];

    if (status && status !== '全部') {
        if (status === '作业进行中') {
            sql += " AND status IN (?, ?)";
            countSql += " AND status IN (?, ?)";
            params.push('作业进行中', '作业中');
            countParams.push('作业进行中', '作业中');
        } else if (status === '作业已完成') {
            sql += " AND status IN (?, ?)";
            countSql += " AND status IN (?, ?)";
            params.push('作业已完成', '已完工');
            countParams.push('作业已完成', '已完工');
        } else {
            sql += " AND status = ?";
            countSql += " AND status = ?";
            params.push(status);
            countParams.push(status);
        }
    }

    if (search) {
        sql += " AND (permit_number LIKE ? OR applicant_name LIKE ? OR content LIKE ?)";
        countSql += " AND (permit_number LIKE ? OR applicant_name LIKE ? OR content LIKE ?)";
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam);
        countParams.push(searchParam, searchParam, searchParam);
    }

    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    // Get total count
    db.get(countSql, countParams, (err, countRow) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        
        // Get paginated data
        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
            // Parse JSON fields
            const permits = rows.map(row => ({
                ...row,
                safety_measures: row.safety_measures ? JSON.parse(row.safety_measures) : [],
                signatures: row.signatures ? JSON.parse(row.signatures) : {}
            }));
            res.json({
                data: permits,
                total: countRow.total,
                page: parseInt(page),
                pageSize: limit,
                totalPages: Math.ceil(countRow.total / limit)
            });
        });
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
            let extra = {};
            try {
                extra = JSON.parse(row.extra_data || '{}');
            } catch (e) {}
            res.json({ ...row, ...extra });
        } else {
            res.status(404).json({ error: "Work permit not found" });
        }
    });
});

// Create new permit
app.post('/api/work-permits', (req, res) => {
    try {
        const {
            type, applicant_id, applicant_name, department, location,
            start_time, end_time, content, safety_measures, signatures,
            ...otherFields
        } = req.body || {};

        if (!type || !applicant_name || !start_time || !end_time) {
            return res.status(400).json({
                success: false,
                message: '作业类型、申请人、开始时间和结束时间不能为空'
            });
        }

        // Generate a simple permit number: WP-YYYYMMDD-XXXX
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const permit_number = `WP-${dateStr}-${randomSuffix}`;
        const status = '待审批';

        const sql = `INSERT INTO work_permits (
            permit_number, status, type, applicant_id, applicant_name,
            department, location, start_time, end_time, content,
            safety_measures, signatures, extra_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const params = [
            permit_number, status, type, applicant_id || 0, applicant_name,
            department || '', location || '', start_time, end_time, content || '',
            JSON.stringify(Array.isArray(safety_measures) ? safety_measures : []),
            JSON.stringify(signatures && typeof signatures === 'object' ? signatures : {}),
            JSON.stringify(otherFields || {})
        ];

        db.run(sql, params, function(err) {
            if (err) {
                sendInternalError(res, 'Create work permit failed:', err);
                return;
            }
            res.json({
                success: true,
                id: this.lastID,
                permit_number: permit_number
            });
        });
    } catch (createErr) {
        sendInternalError(res, 'Create work permit route failed:', createErr);
    }
});

// Update status (Approve, Start, Complete, Reject)
const updateStatusHandler = (req, res) => {
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
};

// Support both PUT and POST methods for compatibility with different proxy configurations
app.put('/api/work-permits/:id/status', updateStatusHandler);
app.post('/api/work-permits/:id/status', updateStatusHandler);

// Update permit extra data (for signatures, images, etc.)
// Support both PUT and POST methods for compatibility with different proxy configurations
const updateExtraDataHandler = (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // First get existing extra_data
    db.get('SELECT extra_data FROM work_permits WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Permit not found' });
            return;
        }

        let existingData = {};
        try {
            existingData = JSON.parse(row.extra_data || '{}');
        } catch (e) {}

        // Merge updates with existing data
        const newData = { ...existingData, ...updates };

        db.run('UPDATE work_permits SET extra_data = ? WHERE id = ?', 
            [JSON.stringify(newData), id], 
            function(err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ success: true, data: newData });
            }
        );
    });
};

app.put('/api/work-permits/:id/extra', updateExtraDataHandler);
app.post('/api/work-permits/:id/extra', updateExtraDataHandler);

// ========== Camera URL Configuration APIs ==========

// Get all camera URL configs
app.get('/api/camera-urls', (req, res) => {
    db.all('SELECT * FROM camera_urls ORDER BY camera_id', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows || []);
    });
});

// Get single camera URL config
app.get('/api/camera-urls/:cameraId', (req, res) => {
    const { cameraId } = req.params;
    db.get('SELECT * FROM camera_urls WHERE camera_id = ?', [cameraId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(row || null);
    });
});

// Create or update camera URL config
app.post('/api/camera-urls', (req, res) => {
    const { camera_id, camera_name, location, jump_url, description, status } = req.body;
    
    if (!jump_url) {
        res.status(400).json({ error: 'jump_url is required' });
        return;
    }

    // 如果提供了camera_id，则更新；否则自动生成新ID
    if (camera_id) {
        const sql = `INSERT INTO camera_urls (camera_id, camera_name, location, jump_url, description, status, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
                     ON CONFLICT(camera_id) DO UPDATE SET
                     camera_name = excluded.camera_name,
                     location = excluded.location,
                     jump_url = excluded.jump_url,
                     description = excluded.description,
                     status = excluded.status,
                     updated_at = datetime('now')`;
        
        db.run(sql, [camera_id, camera_name, location || '', jump_url, description, status || '在线'], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ success: true, camera_id: camera_id });
        });
    } else {
        // 自动生成ID：获取当前最大ID，从100开始（避免与默认摄像头1-9冲突）
        db.get('SELECT MAX(camera_id) as maxId FROM camera_urls', [], (err, row) => {
            const newId = Math.max((row?.maxId || 0) + 1, 100);
            
            const sql = `INSERT INTO camera_urls (camera_id, camera_name, location, jump_url, description, status, updated_at)
                         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`;
            
            db.run(sql, [newId, camera_name, location || '', jump_url, description, status || '在线'], function(err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ success: true, camera_id: newId });
            });
        });
    }
});

// Delete camera URL config
app.delete('/api/camera-urls/:cameraId', (req, res) => {
    const { cameraId } = req.params;
    db.run('DELETE FROM camera_urls WHERE camera_id = ?', [cameraId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, deleted: this.changes > 0 });
    });
});

// 在生产环境下，所有其他请求返回index.html（支持前端路由）
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client/dist/index.html'));
    });
}

// 全局错误处理中间件
app.use((err, req, res, next) => {
    console.error('未捕获的错误:', err);
    if (res.headersSent) return next(err);

    const status = err.status || err.statusCode || 500;
    let message = '服务器内部错误，请稍后重试';

    if (status === 400 && err.type === 'entity.parse.failed') {
        message = '请求数据格式错误，请刷新后重试';
    } else if (status === 413) {
        message = '提交数据过大，请减少图片或签名数据后重试';
    }

    const payload = { success: false, message };
    if (process.env.NODE_ENV !== 'production') {
        payload.error = err.message;
    }

    res.status(status).json(payload);
});

// 启动服务器：生产环境优先启动 HTTPS，开发环境固定使用 HTTP 便于本地联调
const sslCert = process.env.SSL_CERT || path.join(__dirname, 'ssl', 'STAR_sccc_edu_cn_integrated.crt');
const sslKey  = process.env.SSL_KEY  || path.join(__dirname, 'ssl', 'STAR_sccc_edu_cn.key');

const shouldUseHttpsInProd = process.env.NODE_ENV === 'production' && fs.existsSync(sslCert) && fs.existsSync(sslKey);

if (shouldUseHttpsInProd) {
    try {
        const httpsOptions = {
            cert: fs.readFileSync(sslCert),
            key:  fs.readFileSync(sslKey),
        };

        // HTTPS 主服务
        https.createServer(httpsOptions, app).listen(HTTPS_PORT, '0.0.0.0', () => {
            console.log(`HTTPS Server running on https://0.0.0.0:${HTTPS_PORT}`);
        });

        // HTTP → HTTPS 重定向
        http.createServer((req, res) => {
            const host = req.headers.host ? req.headers.host.replace(/:\d+$/, '') : '';
            const redirectUrl = `https://${host}:${HTTPS_PORT}${req.url}`;
            res.writeHead(301, { Location: redirectUrl });
            res.end();
        }).listen(PORT, '0.0.0.0', () => {
            console.log(`HTTP redirect running on http://0.0.0.0:${PORT} → https`);
        });
    } catch (e) {
        console.error('SSL 证书加载失败，回退到 HTTP 模式:', e.message);
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on http://0.0.0.0:${PORT}`);
        });
    }
} else {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on http://0.0.0.0:${PORT}`);
    });
}
