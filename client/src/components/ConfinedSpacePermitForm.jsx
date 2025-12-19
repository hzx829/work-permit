import React from 'react';
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
        {...props}
        readOnly={readOnly}
        disabled={readOnly}
        className={`w-full bg-gray-50 border border-gray-200 rounded px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-400 disabled:cursor-not-allowed ${className}`}
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

// 图片查看模态框组件
const ImageViewerModal = ({ images, isOpen, onClose, initialIndex = 0 }) => {
    const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

    React.useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex, isOpen]);

    if (!isOpen || !images || images.length === 0) return null;

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
            <div className="relative max-w-4xl max-h-[90vh] w-full mx-4" onClick={(e) => e.stopPropagation()}>
                {/* 关闭按钮 */}
                <button 
                    onClick={onClose}
                    className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                {/* 图片显示 */}
                <div className="bg-white rounded-lg overflow-hidden">
                    <img 
                        src={images[currentIndex]} 
                        alt={`安全交底图片 ${currentIndex + 1}`}
                        className="w-full h-auto max-h-[80vh] object-contain"
                    />
                </div>
                
                {/* 导航按钮 */}
                {images.length > 1 && (
                    <>
                        <button 
                            onClick={handlePrev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button 
                            onClick={handleNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        
                        {/* 图片计数 */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                            {currentIndex + 1} / {images.length}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default function ConfinedSpacePermitForm({ data, onChange, readOnly = false, userRole = '', status = '' }) {
    const [isDetecting, setIsDetecting] = React.useState(false);
    const [hasStartedDetection, setHasStartedDetection] = React.useState(false);
    const [blindPlateData, setBlindPlateData] = React.useState(null);
    const [loadingBlindPlate, setLoadingBlindPlate] = React.useState(false);
    const [imageViewerOpen, setImageViewerOpen] = React.useState(false);
    const [imageViewerIndex, setImageViewerIndex] = React.useState(0);
    
    // 判断当前用户是否可以签审批人的字（只有safety角色且状态为待审批）
    const canApprove = userRole === 'safety' && status === '待审批';
    // 判断是否可以签安全交底（已批准状态，作业人可签）
    const canSafetyBriefing = userRole === 'worker' && status === '已批准';
    // 判断是否可以签完工（作业中状态，作业人可签）
    const canComplete = userRole === 'worker' && status === '作业中';

    // 模拟盲板作业信息关联
    React.useEffect(() => {
        if (!blindPlateData) {
            if (readOnly) {
                const randomId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                const permitNumber = `MB-${new Date().getFullYear()}${new Date().getMonth() + 1}${new Date().getDate()}-${randomId}`;
                setBlindPlateData({
                    progress: "堵盲板作业已完成",
                    completionTime: new Date().toLocaleString(),
                    workers: "赵六",
                    reviewers: "王五",
                    permitNumber: permitNumber
                });
            } else if (data.supervisor && data.workers) {
                setLoadingBlindPlate(true);
                const timer = setTimeout(() => {
                    const randomId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                    const permitNumber = `MB-${new Date().getFullYear()}${new Date().getMonth() + 1}${new Date().getDate()}-${randomId}`;
                    
                    setBlindPlateData({
                        progress: "堵盲板作业已完成",
                        completionTime: new Date().toLocaleString(),
                        workers: "赵六",
                        reviewers: "王五",
                        permitNumber: permitNumber
                    });
                    setLoadingBlindPlate(false);
                }, 5000);
                return () => {
                    clearTimeout(timer);
                    setLoadingBlindPlate(false);
                };
            }
        }
    }, [data.supervisor, data.workers, readOnly, blindPlateData]);

    // 模拟后台检测加载过程 - 仅在作业内容填写后才开始检测
    React.useEffect(() => {
        // 如果是只读模式（审批/查看），直接显示结果
        if (readOnly) {
            setIsDetecting(false);
            setHasStartedDetection(true);
            return;
        }
        
        // 如果作业内容已填写且尚未开始检测，则开始检测
        if (data.content && data.content.trim() && !hasStartedDetection) {
            setIsDetecting(true);
            setHasStartedDetection(true);
            const timer = setTimeout(() => {
                setIsDetecting(false);
            }, 10000); // 10秒后显示检测结果
            return () => clearTimeout(timer);
        }
    }, [data.content, hasStartedDetection, readOnly]);

    const handleChange = (e) => {
        if (readOnly) return;
        const { name, value, type, checked } = e.target;
        onChange(name, type === 'checkbox' ? checked : value);
    };

    const handleMeasureChange = (index, field, value) => {
        if (readOnly) return;
        const newMeasures = [...(data.safety_measures_list || [])];
        if (!newMeasures[index]) newMeasures[index] = {};
        newMeasures[index][field] = value;
        
        // 当选择“是”时，自动勾选前面的复选框
        if (field === 'applicable' && value === 'yes') {
            newMeasures[index].checked = true;
        }
        
        onChange('safety_measures_list', newMeasures);
    };

    const handleGasAnalysisChange = (field, value) => {
        if (readOnly) return;
        onChange(field, value);
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
                    <FormField label="作业申请单位">
                        <Input 
                            type="text" 
                            name="applicant_unit"
                            value={data.applicant_unit || ''}
                            onChange={handleChange}
                            placeholder="请输入单位"
                            readOnly={readOnly}
                        />
                    </FormField>
                    <FormField label="作业申请时间">
                        <Input 
                            type="datetime-local" 
                            name="apply_time"
                            value={data.apply_time || ''}
                            onChange={handleChange}
                            readOnly={readOnly}
                        />
                    </FormField>
                    <FormField label="受限空间名称">
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
                    <FormField label="作业内容" className="md:col-span-2">
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
                                                <div className="text-base font-bold text-gray-800">通风时长检测</div>
                                                <div className="text-sm text-gray-600">实时监测：已通风 <span className="font-bold text-blue-600">35</span> 分钟</div>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-300 flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            符合要求 (≥30分钟)
                                        </div>
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
                    <FormField label="作业单位">
                        <Input 
                            type="text" 
                            name="work_unit"
                            value={data.work_unit || ''}
                            onChange={handleChange}
                            placeholder="请输入作业单位"
                            readOnly={readOnly}
                        />
                    </FormField>
                    <FormField label="作业开始时间">
                        <Input 
                            type="datetime-local" 
                            name="work_start_time"
                            value={data.work_start_time || ''}
                            onChange={handleChange}
                            readOnly={readOnly}
                        />
                    </FormField>
                    <FormField label="作业结束时间">
                        <Input 
                            type="datetime-local" 
                            name="work_end_time"
                            value={data.work_end_time || ''}
                            onChange={handleChange}
                            readOnly={readOnly}
                        />
                    </FormField>
                    <FormField label="作业负责人">
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
                    <FormField label="作业人">
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
                    <FormField label="监护人">
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
                    {/* 关联的其他特殊作业及安全作业票编号 - 仅在审批时显示 */}
                    {readOnly && (
                    <FormField label="关联的其他特殊作业及安全作业票编号" className="md:col-span-2">
                        {/* 盲板抽堵作业关联信息展示 */}
                        {(loadingBlindPlate || blindPlateData) ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-fadeIn">
                                {loadingBlindPlate ? (
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-sm">正在关联盲板抽堵作业信息...</span>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
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
                                                <span className="font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">{blindPlateData.progress}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 w-24">完成时间：</span>
                                                <span className="font-medium text-gray-800">{blindPlateData.completionTime}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 w-24">作业人员：</span>
                                                <span className="font-medium text-gray-800">{blindPlateData.workers}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 w-24">票证编号：</span>
                                                <span className="font-medium text-gray-800">{blindPlateData.permitNumber}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 w-24">审核人员：</span>
                                                <span className="font-medium text-gray-800">{blindPlateData.reviewers}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-400 italic py-2">
                                待系统自动关联相关作业信息...
                            </div>
                        )}
                    </FormField>
                    )}
                    <FormField label="风险辨识结果" className="md:col-span-2">
                        <Input 
                            type="text" 
                            name="risk_identification"
                            value={data.risk_identification || ''}
                            onChange={handleChange}
                            readOnly={readOnly}
                        />
                    </FormField>
                </div>
            </div>

            {/* Gas Analysis - 仅在审批时显示 */}
            {readOnly && (
            <div className="mb-8">
                <h2 className="text-base font-bold text-blue-600 mb-6">气体分析</h2>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <FormField label="有毒有害气体名称">
                            <Input 
                                type="text" 
                                name="gas_toxic_name"
                                value={data.gas_toxic_name || ''}
                                onChange={handleChange}
                                placeholder="如: H2S, 苯"
                            />
                        </FormField>
                        <FormField label="可燃气体名称">
                            <Input 
                                type="text" 
                                name="gas_comb_name"
                                value={data.gas_comb_name || ''}
                                onChange={handleChange}
                                placeholder="如: 甲烷"
                            />
                        </FormField>
                        <FormField label="氧气含量(体积分数)">
                            <Input value="19.5% ~ 21%" disabled className="bg-gray-100" />
                        </FormField>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <FormField label="有毒有害气体合格标准">
                            <Input 
                                type="text" 
                                name="gas_toxic_std"
                                value={data.gas_toxic_std || ''}
                                onChange={handleChange}
                            />
                        </FormField>
                        <FormField label="可燃气体合格标准">
                            <Input 
                                type="text" 
                                name="gas_comb_std"
                                value={data.gas_comb_std || ''}
                                onChange={handleChange}
                            />
                        </FormField>
                    </div>
                    <div className="border-t border-gray-200 pt-6 mt-2">
                         <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            <FormField label="有毒有害气体分析数据">
                                <Input 
                                    type="text" 
                                    name="gas_toxic_result"
                                    value={data.gas_toxic_result || ''}
                                    onChange={handleChange}
                                />
                            </FormField>
                            <FormField label="可燃气体分析数据">
                                <Input 
                                    type="text" 
                                    name="gas_comb_result"
                                    value={data.gas_comb_result || ''}
                                    onChange={handleChange}
                                />
                            </FormField>
                            <FormField label="氧气分析数据">
                                <Input 
                                    type="text" 
                                    name="gas_oxygen_result"
                                    value={data.gas_oxygen_result || ''}
                                    onChange={handleChange}
                                />
                            </FormField>
                            <FormField label="取样分析时间">
                                <Input 
                                    type="text" 
                                    name="gas_time"
                                    value={data.gas_time || ''}
                                    onChange={handleChange}
                                    placeholder="月 日 时 分"
                                />
                            </FormField>
                             <FormField label="分析部位">
                                <Input 
                                    type="text" 
                                    name="gas_location"
                                    value={data.gas_location || ''}
                                    onChange={handleChange}
                                />
                            </FormField>
                             <FormField label="分析人">
                                <Input 
                                    type="text" 
                                    name="gas_analyst"
                                    value={data.gas_analyst || ''}
                                    onChange={handleChange}
                                />
                            </FormField>
                         </div>
                    </div>
                </div>
            </div>
            )}

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

            {/* Safety Measures */}
            <div>
                <h2 className="text-base font-bold text-blue-600 mb-4">安全措施预判定</h2>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-6 py-3 grid grid-cols-12 gap-4 border-b border-gray-200">
                        <div className="col-span-1 flex justify-center"><input type="checkbox" disabled className="rounded border-gray-300" /></div>
                        <div className="col-span-1 text-sm font-medium text-gray-500">序号</div>
                        <div className="col-span-8 text-sm font-medium text-gray-500">措施内容</div>
                        <div className="col-span-2 text-center text-sm font-medium text-gray-500">是否涉及</div>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {(data.safety_measures_list || []).map((measure, idx) => (
                            <div key={measure.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-blue-50/30 transition-colors group">
                                <div className="col-span-1 flex justify-center">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                                        disabled={readOnly} 
                                        checked={measure.checked || false}
                                        onChange={(e) => handleMeasureChange(idx, 'checked', e.target.checked)}
                                    />
                                </div>
                                <div className="col-span-1 text-sm text-gray-500">{measure.id}</div>
                                <div className="col-span-8 text-sm text-gray-700 leading-relaxed">
                                    {measure.content}
                                    {measure.id === 15 && (
                                        <input 
                                            type="text" 
                                            value={measure.extraContent || ''}
                                            onChange={(e) => handleMeasureChange(idx, 'extraContent', e.target.value)}
                                            readOnly={readOnly}
                                            disabled={readOnly}
                                            className="ml-2 border-b border-gray-300 outline-none focus:border-blue-500 bg-transparent"
                                            placeholder="请输入"
                                        />
                                    )}
                                </div>
                                <div className="col-span-2 flex justify-center gap-4">
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${measure.applicable === 'yes' ? 'border-blue-500' : 'border-gray-300'}`}>
                                            {measure.applicable === 'yes' && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                                        </div>
                                        <input type="radio" name={`applicable-${idx}`} value="yes" checked={measure.applicable === 'yes'} onChange={() => handleMeasureChange(idx, 'applicable', 'yes')} disabled={readOnly} className="hidden" />
                                        <span className="text-xs text-gray-600">是</span>
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${measure.applicable === 'no' ? 'border-blue-500' : 'border-gray-300'}`}>
                                            {measure.applicable === 'no' && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                                        </div>
                                        <input type="radio" name={`applicable-${idx}`} value="no" checked={measure.applicable === 'no'} onChange={() => handleMeasureChange(idx, 'applicable', 'no')} disabled={readOnly} className="hidden" />
                                        <span className="text-xs text-gray-600">否</span>
                                    </label>
                                </div>

                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Signatures and Approvals Section */}
            <div className="mt-8">
                <h2 className="text-base font-bold text-blue-600 mb-6">
                    {!readOnly ? '作业人员签字' : '签字流程'}
                </h2>
                
                <div className="space-y-6">
                    {/* 作业人员签字确认 - 新建时可编辑 */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-medium text-gray-700">作业人员签字确认</span>
                            {data.worker_sign && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">已签字</span>}
                        </div>
                        <FormField label="">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                <div className="md:col-span-6">
                                    <Input 
                                        type="text" 
                                        name="worker_confirm"
                                        value={data.worker_confirm || ''}
                                        onChange={handleChange}
                                        placeholder="本人已了解作业风险及安全措施"
                                        readOnly={readOnly}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <div className="h-24">
                                        <SignaturePad 
                                            value={data.worker_sign}
                                            onChange={(val) => onChange('worker_sign', val)}
                                            disabled={readOnly}
                                            className="w-full h-full"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="datetime-local" 
                                        name="worker_sign_time"
                                        value={data.worker_sign_time || ''}
                                        onChange={handleChange}
                                        readOnly={readOnly}
                                    />
                                </div>
                            </div>
                        </FormField>
                    </div>

                    {/* 审批人签字 - 只要是readOnly就显示，待审批状态时safety角色可编辑 */}
                    {readOnly && (
                    <div className={`p-4 rounded-lg border ${canApprove ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-medium text-gray-700">审批人签字</span>
                            {data.approver_sign && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">已签字</span>}
                            {canApprove && !data.approver_sign && <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">待签字</span>}
                            {!canApprove && !data.approver_sign && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">未签字</span>}
                        </div>
                        <FormField label="">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                <div className="md:col-span-6">
                                    <Input 
                                        type="text" 
                                        name="approver_opinion"
                                        value={data.approver_opinion || ''}
                                        onChange={handleChange}
                                        placeholder="同意作业"
                                        readOnly={!canApprove}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <div className="h-24">
                                        <SignaturePad 
                                            value={data.approver_sign}
                                            onChange={(val) => onChange('approver_sign', val)}
                                            disabled={!canApprove}
                                            className="w-full h-full"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="datetime-local" 
                                        name="approver_sign_time"
                                        value={data.approver_sign_time || ''}
                                        onChange={handleChange}
                                        readOnly={!canApprove}
                                    />
                                </div>
                            </div>
                        </FormField>
                    </div>
                    )}

                    {/* 安全交底签字 - 审批通过后显示，已批准状态时作业人可编辑 */}
                    {readOnly && status !== '待审批' && status !== '已驳回' && (
                    <div className={`p-4 rounded-lg border ${canSafetyBriefing ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-medium text-gray-700">安全交底签字</span>
                            {data.safety_briefing_sign && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">已签字</span>}
                            {canSafetyBriefing && !data.safety_briefing_sign && <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">待签字</span>}
                            {!canSafetyBriefing && !data.safety_briefing_sign && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">未签字</span>}
                        </div>
                        <FormField label="">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                <div className="md:col-span-6">
                                    <Input 
                                        type="text" 
                                        name="safety_briefing_confirm"
                                        value={data.safety_briefing_confirm || ''}
                                        onChange={handleChange}
                                        placeholder="已接受安全交底，了解作业风险和安全措施"
                                        readOnly={!canSafetyBriefing}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <div className="h-24">
                                        <SignaturePad 
                                            value={data.safety_briefing_sign}
                                            onChange={(val) => onChange('safety_briefing_sign', val)}
                                            disabled={!canSafetyBriefing}
                                            className="w-full h-full"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="datetime-local" 
                                        name="safety_briefing_time"
                                        value={data.safety_briefing_time || ''}
                                        onChange={handleChange}
                                        readOnly={!canSafetyBriefing}
                                    />
                                </div>
                            </div>
                        </FormField>
                        
                        {/* 安全交底图片上传/查看 */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm font-medium text-gray-700">现场照片</span>
                                {data.safety_briefing_images && data.safety_briefing_images.length > 0 && (
                                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                        {data.safety_briefing_images.length} 张
                                    </span>
                                )}
                            </div>
                            
                            {/* 图片预览区域 */}
                            {data.safety_briefing_images && data.safety_briefing_images.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {data.safety_briefing_images.map((img, idx) => (
                                        <div 
                                            key={idx} 
                                            className="relative group cursor-pointer"
                                            onClick={() => {
                                                setImageViewerIndex(idx);
                                                setImageViewerOpen(true);
                                            }}
                                        >
                                            <img 
                                                src={img} 
                                                alt={`安全交底图片 ${idx + 1}`}
                                                className="w-20 h-20 object-cover rounded border border-gray-200 hover:border-blue-400 transition-colors"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center">
                                                <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                </svg>
                                            </div>
                                            {/* 删除按钮 - 仅在可编辑时显示 */}
                                            {canSafetyBriefing && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const newImages = data.safety_briefing_images.filter((_, i) => i !== idx);
                                                        onChange('safety_briefing_images', newImages);
                                                    }}
                                                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {/* 上传按钮 - 仅在可编辑时显示 */}
                            {canSafetyBriefing && (
                                <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm text-gray-600">上传现场照片</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files);
                                            if (files.length === 0) return;
                                            
                                            // 转换为 base64
                                            Promise.all(files.map(file => {
                                                return new Promise((resolve) => {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => resolve(reader.result);
                                                    reader.readAsDataURL(file);
                                                });
                                            })).then(base64Images => {
                                                const currentImages = data.safety_briefing_images || [];
                                                onChange('safety_briefing_images', [...currentImages, ...base64Images]);
                                            });
                                            
                                            // 清空 input 以便重复选择同一文件
                                            e.target.value = '';
                                        }}
                                    />
                                </label>
                            )}
                            
                            {/* 无图片时的提示 */}
                            {(!data.safety_briefing_images || data.safety_briefing_images.length === 0) && !canSafetyBriefing && (
                                <p className="text-sm text-gray-400 italic">暂无现场照片</p>
                            )}
                        </div>
                    </div>
                    )}

                    {/* 完工验收签字 - 作业中或已完工时显示，作业中状态时作业人可编辑 */}
                    {readOnly && (status === '作业中' || status === '已完工') && (
                    <div className={`p-4 rounded-lg border ${canComplete ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-medium text-gray-700">完工验收签字</span>
                            {data.completion_sign && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">已签字</span>}
                            {canComplete && !data.completion_sign && <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">待签字</span>}
                            {!canComplete && !data.completion_sign && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">未签字</span>}
                        </div>
                        <FormField label="">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                <div className="md:col-span-6">
                                    <Input 
                                        type="text" 
                                        name="completion_confirm"
                                        value={data.completion_confirm || ''}
                                        onChange={handleChange}
                                        placeholder="作业已完成，人员已撤离，现场已清理"
                                        readOnly={!canComplete}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <div className="h-24">
                                        <SignaturePad 
                                            value={data.completion_sign}
                                            onChange={(val) => onChange('completion_sign', val)}
                                            disabled={!canComplete}
                                            className="w-full h-full"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="datetime-local" 
                                        name="completion_time"
                                        value={data.completion_time || ''}
                                        onChange={handleChange}
                                        readOnly={!canComplete}
                                    />
                                </div>
                            </div>
                        </FormField>
                    </div>
                    )}
                </div>
            </div>
        </div>
        
        {/* 图片查看模态框 */}
        <ImageViewerModal 
            images={data.safety_briefing_images || []}
            isOpen={imageViewerOpen}
            onClose={() => setImageViewerOpen(false)}
            initialIndex={imageViewerIndex}
        />
    </>
    );
}
