const db = require('./database');

// Mock数据生成器
const permitTypes = [
    '动火作业', '临时用电作业', '受限空间作业', '高处作业', 
    '盲板抽堵作业', '动土作业', '吊装作业', '断路作业'
];

const departments = [
    '化工1#车间', '化工2#车间', '化工3#车间', '仓储部', 
    '设备维修部', '电气部', '工程部', '安全部'
];

const locations = [
    '1号反应釜区', '2号反应釜区', '原料罐区', '成品罐区',
    '循环水站', '锅炉房', '配电室', '装置区A段',
    '装置区B段', '污水处理站', '消防泵房', '办公楼外围'
];

const statuses = ['已完成', '已完成', '已完成', '进行中', '进行中', '待审批'];

const names = [
    '张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十',
    '陈明', '刘强', '黄伟', '杨军', '朱磊', '徐洋', '何勇', '马超',
    '冯涛', '秦华', '许鹏', '袁杰'
];

const contents = {
    '动火作业': ['管道焊接', '设备切割', '电焊作业', '气割作业'],
    '临时用电作业': ['临时照明安装', '设备用电接线', '配电箱临时用电', '临时动力用电'],
    '受限空间作业': ['反应釜清理', '储罐内部检修', '地下管廊维修', '污水池清理'],
    '高处作业': ['设备顶部检修', '管道安装', '平台检修', '支架焊接'],
    '盲板抽堵作业': ['管道盲板拆除', '管道盲板安装', '设备盲板更换', '管线盲板抽堵'],
    '动土作业': ['管道埋设', '基础开挖', '电缆沟开挖', '设备基础施工'],
    '吊装作业': ['设备吊装', '钢结构吊装', '大型部件吊装', '材料吊运'],
    '断路作业': ['道路挖掘', '管线穿越', '临时道路封闭', '路面切割']
};

const safetyMeasures = {
    '动火作业': ['动火区域清理', '配备灭火器', '设置监护人', '办理动火证', '检测可燃气体浓度'],
    '临时用电作业': ['检查绝缘', '漏电保护器', '接地保护', '专人监护', '雨天停止作业'],
    '受限空间作业': ['通风换气', '气体检测', '佩戴呼吸器', '安全绳连接', '设专人监护'],
    '高处作业': ['系安全带', '设置安全网', '检查脚手架', '佩戴安全帽', '工具防坠落'],
    '盲板抽堵作业': ['确认介质排空', '降温降压', '检测有害气体', '穿戴防护用品', '设置警戒'],
    '动土作业': ['探明地下管线', '设置警示标志', '支护措施', '排水措施', '防止塌方'],
    '吊装作业': ['检查吊具', '计算吊装重量', '设置警戒区', '专人指挥', '检查吊车性能'],
    '断路作业': ['设置警示标志', '交通疏导', '防护栏设置', '夜间照明', '及时恢复路面']
};

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePermitNumber(date) {
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `WP-${dateStr}-${randomSuffix}`;
}

function getRandomDate(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(getRandomInt(8, 17), getRandomInt(0, 59), 0, 0);
    return date.toISOString().slice(0, 16).replace('T', ' ');
}

function generateMockPermits(count) {
    const permits = [];
    
    for (let i = 0; i < count; i++) {
        const type = getRandomElement(permitTypes);
        const daysAgo = getRandomInt(0, 60);
        const status = getRandomElement(statuses);
        const startTime = getRandomDate(daysAgo);
        const startDate = new Date(startTime);
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + getRandomInt(2, 8));
        const endTime = endDate.toISOString().slice(0, 16).replace('T', ' ');
        
        const permit = {
            permit_number: generatePermitNumber(startDate),
            status: status,
            type: type,
            applicant_id: getRandomInt(1, 100),
            applicant_name: getRandomElement(names),
            department: getRandomElement(departments),
            location: getRandomElement(locations),
            start_time: startTime,
            end_time: endTime,
            content: getRandomElement(contents[type]),
            safety_measures: JSON.stringify(
                safetyMeasures[type].slice(0, getRandomInt(3, 5))
            ),
            signatures: JSON.stringify({
                applicant: getRandomElement(names),
                safety_officer: '李四',
                approver: status !== '待审批' ? '王经理' : null,
                approved_at: status !== '待审批' ? getRandomDate(daysAgo - 1) : null
            }),
            extra_data: JSON.stringify({})
        };
        
        permits.push(permit);
    }
    
    return permits;
}

// 主函数
async function seedDatabase() {
    console.log('开始生成作业票mock数据...');
    
    // 先检查是否已有数据
    db.get('SELECT COUNT(*) as count FROM work_permits', (err, row) => {
        if (err) {
            console.error('查询数据失败:', err);
            return;
        }
        
        const existingCount = row.count;
        console.log(`数据库中已有 ${existingCount} 条作业票记录`);
        console.log('将追加50条新的mock数据...');
        
        // 生成50条mock数据
        const mockPermits = generateMockPermits(50);
        
        const sql = `INSERT INTO work_permits (
            permit_number, status, type, applicant_id, applicant_name, 
            department, location, start_time, end_time, content, 
            safety_measures, signatures, extra_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const stmt = db.prepare(sql);
        
        let successCount = 0;
        let errorCount = 0;
        
        mockPermits.forEach((permit, index) => {
            stmt.run([
                permit.permit_number,
                permit.status,
                permit.type,
                permit.applicant_id,
                permit.applicant_name,
                permit.department,
                permit.location,
                permit.start_time,
                permit.end_time,
                permit.content,
                permit.safety_measures,
                permit.signatures,
                permit.extra_data
            ], (err) => {
                if (err) {
                    console.error(`插入第 ${index + 1} 条数据失败:`, err.message);
                    errorCount++;
                } else {
                    successCount++;
                }
                
                // 所有数据处理完成
                if (successCount + errorCount === mockPermits.length) {
                    stmt.finalize();
                    console.log(`\n数据生成完成！`);
                    console.log(`成功: ${successCount} 条`);
                    console.log(`失败: ${errorCount} 条`);
                    
                    // 验证插入的数据
                    db.all('SELECT type, COUNT(*) as count FROM work_permits GROUP BY type', (err, rows) => {
                        if (!err) {
                            console.log('\n各类型作业票统计:');
                            rows.forEach(row => {
                                console.log(`  ${row.type}: ${row.count} 条`);
                            });
                        }
                        db.close();
                    });
                }
            });
        });
    });
}

// 运行脚本
seedDatabase();
