import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import SignaturePad from './SignaturePad';

const FormField = ({ label, required = false, children, className = "" }) => (
    <div className={`flex flex-col ${className}`}>
        <label className="text-sm font-medium text-gray-500 mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

const Input = ({ className = "", readOnly, ...props }) => (
    <input
        readOnly={readOnly}
        disabled={readOnly}
        className={`w-full bg-gray-50 border border-gray-200 rounded px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-400 disabled:cursor-not-allowed ${className}`}
        {...props}
    />
);

const PersonSelect = ({ value, onChange, name, options, unqualifiedOptions = [], readOnly, placeholder }) => (
    <div className="relative">
        <select
            name={name}
            value={value || ''}
            onChange={onChange}
            disabled={readOnly}
            className={`w-full bg-gray-50 border border-gray-200 rounded px-3 py-3 text-base font-medium text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none ${readOnly ? 'cursor-not-allowed' : 'cursor-pointer'} ${!value ? 'text-gray-400 font-normal' : ''}`}
        >
            <option value="" disabled hidden>{placeholder || "请选择"}</option>
            <optgroup label="合格人员" className="text-blue-600 font-bold text-sm">
                {options.map((opt) => (
                    <option key={opt} value={opt} className="text-gray-900 font-medium text-base">{opt}</option>
                ))}
            </optgroup>
            <optgroup label="不合格人员" className="text-red-500 font-bold text-sm">
                {unqualifiedOptions.map((opt, idx) => (
                    <option key={idx} value={`unqualified_${name}_${idx}`} disabled className="text-gray-400 font-normal text-base">{opt}</option>
                ))}
            </optgroup>
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
        </div>
    </div>
);

const RISK_OPTIONS = [
    '物体打击',
    '机械伤害',
    '触电',
    '淹溺',
    '灼烫',
    '火灾',
    '爆炸',
    '高处坠落',
    '坍塌',
    '中毒',
    '窒息'
];

export default function ConfinedSpacePermitForm({ data, onChange, readOnly = false, userRole = '', _status = '' }) {
    const [isDetecting, setIsDetecting] = React.useState(false);
    const [hasStartedDetection, setHasStartedDetection] = React.useState(false);
    const [relatedPermitLoading, setRelatedPermitLoading] = React.useState(false);
    const [relatedPermitInfo, setRelatedPermitInfo] = React.useState(null);
    const VENTILATION_REQUIREMENT_SECONDS = 30 * 60;
    const DEFAULT_VENTILATION_SECONDS = VENTILATION_REQUIREMENT_SECONDS + 60;
    const [ventilationSeconds, setVentilationSeconds] = React.useState(DEFAULT_VENTILATION_SECONDS);

    const { user } = useAuth();
    
    const getCurrentUserName = () => {
        if (!user) return '当前用户';
        return (
            user.full_name ||
            user.name ||
            user.username ||
            user.account ||
            '当前用户'
        );
    };

    const getNowDateTimeLocal = () => {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const year = now.getFullYear();
        const month = pad(now.getMonth() + 1);
        const day = pad(now.getDate());
        const hours = pad(now.getHours());
        const minutes = pad(now.getMinutes());
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    React.useEffect(() => {
        if (readOnly) return;
        if (data?.worker_sign_time) return;
        onChange('worker_sign_time', getNowDateTimeLocal());
    }, [readOnly, data?.worker_sign_time]);

    const createSignatureChangeHandler = ({
        signatureField,
        signerField,
        timeField,
        canEdit
    }) => {
        return (dataUrl) => {
            if (!canEdit) return;

            // 允许清除/重签
            if (dataUrl === '') {
                onChange(signatureField, '');
                onChange(signerField, '');
                onChange(timeField, '');
                return;
            }

            if (!dataUrl) return;
            onChange(signatureField, dataUrl);

            if (!data?.[signerField]) onChange(signerField, getCurrentUserName());
            if (!data?.[timeField]) onChange(timeField, getNowDateTimeLocal());
        };
    };

    const onWorkerSignatureChange = createSignatureChangeHandler({
        signatureField: 'worker_signature',
        signerField: 'worker_sign',
        timeField: 'worker_sign_time',
        canEdit: !readOnly
    });

    const formatVentilationDuration = (seconds) => {
        if (!seconds || seconds <= 0) {
            return '未开始计时';
        }
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
            return `${minutes} 分钟`;
        }
        const hours = Math.floor(minutes / 60);
        const restMinutes = minutes % 60;
        if (restMinutes === 0) {
            return `${hours} 小时`;
        }
        return `${hours} 小时 ${restMinutes} 分钟`;
    };

    const canQueryRelatedPermits = readOnly && userRole === 'safety';

    const parseRelatedPermitNumbers = (raw) => {
        if (!raw) return [];
        return String(raw)
            .split(/[\s,，、;；]+/g)
            .map((s) => s.trim())
            .filter(Boolean)
            .filter((value, index, arr) => arr.indexOf(value) === index);
    };

    React.useEffect(() => {
        if (relatedPermitInfo) return;
        if (!data.related_blind_plate_permit_number) return;
        setRelatedPermitInfo({
            progress: data.related_blind_plate_progress || '堵盲板作业已完成',
            completionTime: data.related_blind_plate_completion_time || new Date().toLocaleString(),
            workers: data.related_blind_plate_workers || '赵六',
            reviewers: data.related_blind_plate_reviewers || '王五',
            permitNumber: data.related_blind_plate_permit_number || ''
        });
    }, [
        relatedPermitInfo,
        data.related_blind_plate_permit_number,
        data.related_blind_plate_progress,
        data.related_blind_plate_completion_time,
        data.related_blind_plate_workers,
        data.related_blind_plate_reviewers
    ]);

    const contentReady = Boolean(data?.content && data.content.trim());

    React.useEffect(() => {
        if (readOnly) {
            setIsDetecting(false);
            setHasStartedDetection(true);
            return;
        }

        // 清空作业内容时，回到“等待填写”初始态
        if (!contentReady) {
            setIsDetecting(false);
            setHasStartedDetection(false);
            return;
        }

        // 只在“首次填写作业内容”时启动一次检测计时器
        if (!hasStartedDetection) {
            setIsDetecting(true);
            setHasStartedDetection(true);
        }
    }, [contentReady, hasStartedDetection, readOnly]);

    // 单独的 useEffect 处理检测计时器，只依赖 isDetecting 状态
    React.useEffect(() => {
        if (!isDetecting) return;
        
        const timer = setTimeout(() => {
            setIsDetecting(false);
        }, 25000);
        
        return () => clearTimeout(timer);
    }, [isDetecting]);

    React.useEffect(() => {
        if (!data.apply_time) {
            setVentilationSeconds(DEFAULT_VENTILATION_SECONDS);
            return;
        }
        const startTime = new Date(data.apply_time).getTime();
        if (!startTime || Number.isNaN(startTime)) {
            setVentilationSeconds(DEFAULT_VENTILATION_SECONDS);
            return;
        }
        const update = () => {
            const diff = Math.floor((Date.now() - startTime) / 1000);
            setVentilationSeconds(Math.max(diff > 0 ? diff : 0, DEFAULT_VENTILATION_SECONDS));
        };
        update();
        const intervalId = setInterval(update, 60000);
        return () => clearInterval(intervalId);
    }, [data.apply_time]);

    const handleChange = (e) => {
        if (readOnly) return;
        const { name, value, type, checked } = e.target;
        onChange(name, type === 'checkbox' ? checked : value);
    };

    const handleRelatedPermitAssociate = () => {
        if (readOnly) return;
        const numbers = parseRelatedPermitNumbers(data.related_permits);
        if (numbers.length === 0) {
            window.alert('请先输入要关联的作业票编号');
            return;
        }
        const confirmed = window.confirm('是否确认关联这些作业票编号？');
        if (!confirmed) return;
        const normalized = numbers.join('、');
        onChange('related_permits', normalized);
        // 为了在安全员详情界面展示一致的编号，固定用第一个编号作为展示编号
        onChange('related_blind_plate_permit_number', numbers[0]);
        // 清空旧的模拟详情（避免编号改变后仍显示旧信息）
        onChange('related_blind_plate_progress', '');
        onChange('related_blind_plate_completion_time', '');
        onChange('related_blind_plate_workers', '');
        onChange('related_blind_plate_reviewers', '');
        setRelatedPermitInfo(null);
    };

    const handleRelatedPermitQuery = async () => {
        if (!canQueryRelatedPermits) return;
        const numbers = parseRelatedPermitNumbers(data.related_permits);
        const permitNumber = (data.related_blind_plate_permit_number || numbers[0] || '').trim();
        if (!permitNumber) {
            setRelatedPermitInfo(null);
            return;
        }

        if (relatedPermitLoading) return;

        setRelatedPermitLoading(true);
        // 按你的要求：结果可随机/模拟，但编号必须与作业端输入一致
        setTimeout(() => {
            const result = {
                progress: '堵盲板作业已完成',
                completionTime: new Date().toLocaleString(),
                workers: '赵六',
                reviewers: '王五',
                permitNumber
            };
            setRelatedPermitInfo(result);
            onChange('related_blind_plate_permit_number', result.permitNumber);
            onChange('related_blind_plate_progress', result.progress);
            onChange('related_blind_plate_completion_time', result.completionTime);
            onChange('related_blind_plate_workers', result.workers);
            onChange('related_blind_plate_reviewers', result.reviewers);
            setRelatedPermitLoading(false);
        }, 5000);
    };

    // Initialize safety measures if empty and not readOnly
    React.useEffect(() => {
        if (!readOnly && (!data.safety_measures_list || data.safety_measures_list.length === 0)) {
            const initialMeasures = [
                { id: 1, content: '盛装过有毒、可燃物料的受限空间，所有与受限空间有联系的阀门、管线已加盲板 隔离，并落实盲板责任人，未采用水封或关闭阀门代替盲板', applicable: '', confirmer: '' },
                { id: 2, content: '盛装过有毒、可燃物料的受限空间，设备已经过置换、吹扫或蒸煮', applicable: '', confirmer: '' },
                { id: 3, content: '设备通风孔已打开进行自然通风，温度适宜人员作业；必要时采用强制通风或佩戴隔绝式呼吸防护装备，不应采用直接通入氧气或富氧空气的方法补充氧', applicable: '', confirmer: '' },
                { id: 4, content: '转动设备已切断电源，电源开关处已加锁并悬挂“禁止合闸”标志牌', applicable: '', confirmer: '' },
                { id: 5, content: '受限空间内部已具备进入作业条件，易燃易爆物料容器内作业，作业人员未采用非防爆工具，手持电动工具符合作业安全要求', applicable: '', confirmer: '' },
                { id: 6, content: '受限空间进出口通道畅通，无阻碍人员进出的障碍物', applicable: '', confirmer: '' },
                { id: 7, content: '盛装过可燃有毒液体、气体的受限空间，已分析其中的可燃、有毒有害气体和氧气 含量，且在安全范围内', applicable: '', confirmer: '' },
                { id: 8, content: '存在大量扬尘的设备已停止扬尘', applicable: '', confirmer: '' },
                { id: 9, content: '用于连续检测的移动式可燃、有毒气体、氧气检测仪已配备到位', applicable: '', confirmer: '' },
                { id: 10, content: '作业人员已佩戴必要的个体防护装备，清除受限空间内存在的危险因素', applicable: '', confirmer: '' },
                { id: 11, content: '已配备作业应急设施：消防器材（ ）、救生绳（ ）、气防装备（ ），盛有腐蚀性介 质的容器作业现场已配备应急冲洗水', applicable: '', confirmer: '' },
                { id: 12, content: '受限空间内作业已配备通信设备', applicable: '', confirmer: '' },
                { id: 13, content: '受限空间出入口四周已设立警戒区', applicable: '', confirmer: '' },
                { id: 14, content: '其他相关特殊作业已办理相应安全作业票', applicable: '', confirmer: '' },
                { id: 15, content: '其他安全措施：', applicable: '', confirmer: '' },
            ];
            onChange('safety_measures_list', initialMeasures);
        }
    }, []);

    return (
    <>
        <div className="w-full max-w-7xl mx-auto bg-white p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                    <h1 className="text-xl font-bold text-gray-800">受限空间安全作业票申请表</h1>
                </div>
                <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded border border-gray-200">
                    编号：{data.permit_code || '系统自动生成'}
                </div>
            </div>

            {/* Basic Information */}
            <div className="mb-8">
                <h2 className="text-base font-bold text-blue-600 mb-6">申请基本信息</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <FormField label="作业申请单位" required>
                        <Input 
                            type="text" 
                            name="applicant_unit"
                            value={data.applicant_unit || ''}
                            onChange={handleChange}
                            placeholder="请输入单位"
                            readOnly={readOnly}
                        />
                    </FormField>
                    <FormField label="作业申请时间" required>
                        <Input 
                            type="datetime-local" 
                            name="apply_time"
                            value={data.apply_time || ''}
                            onChange={handleChange}
                            readOnly={readOnly}
                        />
                    </FormField>
                    <FormField label="受限空间名称" required>
                        <Input 
                            type="text" 
                            name="confined_space_name"
                            value={data.confined_space_name || ''}
                            onChange={handleChange}
                            placeholder="请输入名称"
                            readOnly={readOnly}
                        />
                    </FormField>
                    <FormField label="受限空间原有介质名称">
                        <Input 
                            type="text" 
                            name="original_media_name"
                            value={data.original_media_name || ''}
                            onChange={handleChange}
                            placeholder="请输入介质名称"
                            readOnly={readOnly}
                        />
                    </FormField>
                    <FormField label="作业内容" className="md:col-span-2" required>
                        <Input 
                            type="text" 
                            name="content"
                            value={data.content || ''}
                            onChange={handleChange}
                            placeholder="请输入作业内容"
                            readOnly={readOnly}
                        />
                    </FormField>

                    <div className="md:col-span-2 mt-2 mb-4">
                        <h3 className="text-base font-bold text-blue-600 mb-3">现场安全条件确认</h3>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                            {!hasStartedDetection && !readOnly ? (
                                /* 等待填写作业内容 */
                                <div className="flex items-center justify-center gap-3 py-4">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-gray-500">请先填写「作业内容」后，系统将自动检测现场安全条件</span>
                                </div>
                            ) : isDetecting ? (
                                /* Loading 状态 */
                                <>
                                    <div className="flex items-center justify-between animate-pulse">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                                            <div className="space-y-2">
                                                <div className="h-4 bg-gray-200 rounded w-24"></div>
                                                <div className="h-3 bg-gray-200 rounded w-32"></div>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1.5 rounded-full bg-gray-200 w-20 h-7"></div>
                                    </div>
                                    <div className="border-t border-gray-200"></div>
                                    <div className="flex items-center justify-between animate-pulse">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                                            <div className="space-y-2">
                                                <div className="h-4 bg-gray-200 rounded w-24"></div>
                                                <div className="h-3 bg-gray-200 rounded w-40"></div>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1.5 rounded-full bg-gray-200 w-20 h-7"></div>
                                    </div>
                                    <div className="flex items-center justify-center gap-3 pt-4 pb-2">
                                        <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                        <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                        <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                                        <span className="text-lg font-bold text-blue-600 ml-2">正在检测现场条件...</span>
                                    </div>
                                </>
                            ) : (
                                /* 检测结果 */
                                <>
                                    {/* 通风时长检测 */}
                                    <div className="flex items-center justify-between animate-fadeIn">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div className="text-base font-bold text-gray-800">通风时长</div>
                                                <div className="text-sm text-gray-600">
                                                    实时监测：{formatVentilationDuration(ventilationSeconds)}
                                                </div>
                                            </div>
                                        </div>
                                        {ventilationSeconds >= 1800 && (
                                            <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-300 flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                符合要求 (≥30分钟)
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* 分隔线 */}
                                    <div className="border-t border-gray-200"></div>
                                    
                                    {/* 现场隔离检测 */}
                                    <div className="flex items-center justify-between animate-fadeIn">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div className="text-base font-bold text-gray-800">现场隔离措施</div>
                                                <div className="text-sm text-gray-600">检测状态：警戒区已设立</div>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-300 flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            已完成
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <FormField label="作业单位" required>
                        <Input 
                            type="text" 
                            name="work_unit"
                            value={data.work_unit || ''}
                            onChange={handleChange}
                            placeholder="请输入作业单位"
                            readOnly={readOnly}
                        />
                    </FormField>
                    <FormField label="作业负责人" required>
                        <PersonSelect 
                            name="supervisor"
                            value={data.supervisor}
                            onChange={handleChange}
                            options={['张三', '李四', '王五']}
                            unqualifiedOptions={['陈子涵 (未授权)', '刘浩宇 (证书过期)', '王梓萱 (培训不合格)']}
                            placeholder="请选择负责人"
                            readOnly={readOnly}
                        />
                    </FormField>
                    <FormField label="作业人" required>
                        <PersonSelect 
                            name="workers"
                            value={data.workers}
                            onChange={handleChange}
                            options={['赵六', '孙七', '周八']}
                            unqualifiedOptions={['张一鸣 (未授权)', '李思琪 (证书过期)', '赵雨桐 (体检不合格)']}
                            placeholder="请选择作业人"
                            readOnly={readOnly}
                        />
                    </FormField>
                    <FormField label="监护人" required>
                        <PersonSelect 
                            name="guardian"
                            value={data.guardian}
                            onChange={handleChange}
                            options={['吴九', '郑十', '陈十一']}
                            unqualifiedOptions={['孙嘉怡 (未授权)', '周宇轩 (证书过期)', '吴欣怡 (培训不合格)']}
                            placeholder="请选择监护人"
                            readOnly={readOnly}
                        />
                    </FormField>
                    <FormField label="关联的其他特殊作业及安全作业票编号" className="md:col-span-2">
                        {!readOnly ? (
                            // 作业人员端：只能“关联编号”，不提供查询、不展示详情
                            <div className="space-y-2">
                                <div className="flex flex-col md:flex-row md:items-center gap-3">
                                    <Input
                                        type="text"
                                        name="related_permits"
                                        value={data.related_permits || ''}
                                        onChange={handleChange}
                                        placeholder="请输入要关联的作业票编号（可用逗号/顿号分隔）"
                                        readOnly={false}
                                        className="md:flex-1"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRelatedPermitAssociate}
                                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-blue-500 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors md:w-40"
                                    >
                                        关联
                                    </button>
                                </div>
                                <div className="text-xs text-gray-400">
                                    作业人员端仅记录关联编号；关联票证详情由安全员在审批/查看界面查询。
                                </div>
                            </div>
                        ) : (
                            // 安全员端（查看/审批）：可查询并展示关联详情
                            <div className="space-y-3">
                                <div className="flex flex-col md:flex-row md:items-center gap-3">
                                    <Input
                                        type="text"
                                        name="related_permits"
                                        value={data.related_permits || ''}
                                        onChange={() => {}}
                                        placeholder="暂无关联作业票编号"
                                        readOnly={true}
                                        className="md:flex-1"
                                    />
                                    {canQueryRelatedPermits && (
                                        <button
                                            type="button"
                                            onClick={handleRelatedPermitQuery}
                                            disabled={relatedPermitLoading}
                                            className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-blue-500 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors md:w-40 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {relatedPermitLoading ? '查询中...' : '查询'}
                                        </button>
                                    )}
                                </div>

                                {relatedPermitLoading && (
                                    <div className="flex items-center gap-2 text-blue-600 text-sm">
                                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        <span>正在查询关联票证信息...</span>
                                    </div>
                                )}

                                {!relatedPermitLoading && canQueryRelatedPermits && relatedPermitInfo && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-fadeIn">
                                        <div className="flex items-center gap-2 mb-2">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="font-bold text-blue-800 text-sm">关联作业信息自动获取成功</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 w-24">作业类型：</span>
                                                <span className="font-medium text-gray-800">盲板抽堵作业</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 w-24">作业进度：</span>
                                                <span className="font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">{relatedPermitInfo.progress}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 w-24">完成时间：</span>
                                                <span className="font-medium text-gray-800">{relatedPermitInfo.completionTime}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 w-24">作业人员：</span>
                                                <span className="font-medium text-gray-800">{relatedPermitInfo.workers}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 w-24">票证编号：</span>
                                                <span className="font-medium text-gray-800">{relatedPermitInfo.permitNumber}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 w-24">审核人员：</span>
                                                <span className="font-medium text-gray-800">{relatedPermitInfo.reviewers}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!relatedPermitLoading && (!data.related_permits || !String(data.related_permits).trim()) && (
                                    <div className="text-sm text-gray-400 italic">
                                        暂无关联作业票编号
                                    </div>
                                )}
                                {!relatedPermitLoading && !!String(data.related_permits || '').trim() && canQueryRelatedPermits && !relatedPermitInfo && (
                                    <div className="text-sm text-gray-400 italic">
                                        已填写关联编号，点击“查询”查看关联详情
                                    </div>
                                )}
                                {!canQueryRelatedPermits && (
                                    <div className="text-sm text-gray-400 italic">
                                        仅安全员可查询关联票证详情
                                    </div>
                                )}
                            </div>
                        )}
                    </FormField>
                    <FormField label="风险辨识结果" className="md:col-span-2" required>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {RISK_OPTIONS.map((option) => {
                                const selected = (data.risk_identification || '').split('、').filter(Boolean);
                                const checked = selected.includes(option);
                                return (
                                    <label key={option} className="inline-flex items-center gap-2 text-xs md:text-sm">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                                            checked={checked}
                                            onChange={() => {
                                                if (readOnly) return;
                                                const current = (data.risk_identification || '').split('、').filter(Boolean);
                                                const next = checked
                                                    ? current.filter((item) => item !== option)
                                                    : [...current, option];
                                                onChange('risk_identification', next.join('、'));
                                            }}
                                        />
                                        <span className="text-gray-700">{option}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </FormField>
                </div>
            </div>

             {/* Time Range */}
             <div className="mb-8">
                <h2 className="text-base font-bold text-blue-600 mb-6">作业实施时间</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <FormField label="开始时间">
                        <Input 
                            type="datetime-local" 
                            name="start_time"
                            value={data.start_time || ''}
                            onChange={handleChange}
                        />
                    </FormField>
                    <FormField label="结束时间">
                        <Input 
                            type="datetime-local" 
                            name="end_time"
                            value={data.end_time || ''}
                            onChange={handleChange}
                        />
                    </FormField>
                </div>
            </div>

            {/* Signatures and Approvals Section */}
            <div className="mt-8">
                <h2 className="text-base font-bold text-blue-600 mb-6">
                    作业人员签字确认
                </h2>

                {/* 仅保留作业人员签字确认（其它流程签字已拆分到详情页模块中） */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium text-gray-700">作业人员签字确认</span>
                    </div>
                    <FormField label="">
                        <div className="flex justify-center">
                            <div className="w-full max-w-5xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start justify-items-center">
                                    <div className="w-full max-w-[380px]">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-sm text-gray-500 block mb-1">签名处：</div>
                                            <SignaturePad
                                                value={data.worker_signature || ''}
                                                onChange={onWorkerSignatureChange}
                                                disabled={readOnly}
                                                className="h-20"
                                            />
                                        </div>
                                    </div>
                                    <div className="w-full max-w-[320px]">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-sm text-gray-500 block mb-1">签字时间</div>
                                            <Input
                                                type="datetime-local"
                                                name="worker_sign_time"
                                                value={data.worker_sign_time || ''}
                                                onChange={handleChange}
                                                readOnly={readOnly}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FormField>
                </div>
            </div>
        </div>
    </>
    );
}
