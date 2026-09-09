import { useState, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { createPermit } from '../../utils/api';

// 表单组件懒加载
const HotWorkPermitForm = lazy(() => import('../../components/HotWorkPermitForm'));
const ConfinedSpacePermitForm = lazy(() => import('../../components/ConfinedSpacePermitForm'));
const BlindPlatePermitForm = lazy(() => import('../../components/BlindPlatePermitForm'));
const HeightWorkPermitForm = lazy(() => import('../../components/HeightWorkPermitForm'));
const LiftingPermitForm = lazy(() => import('../../components/LiftingPermitForm'));
const TemporaryElectricityPermitForm = lazy(() => import('../../components/TemporaryElectricityPermitForm'));
const GroundBreakingPermitForm = lazy(() => import('../../components/GroundBreakingPermitForm'));
const RoadBreakingPermitForm = lazy(() => import('../../components/RoadBreakingPermitForm'));

// 表单加载占位符
const FormLoading = () => (
    <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-500">正在加载表单...</span>
        </div>
    </div>
);

const SAFETY_MEASURES_DB = {
    '动火作业': ['清理作业现场易燃物', '配备合格的消防器材', '动火点周围30米内无排放可燃气体', '作业人员持有特种作业证'],
    '受限空间作业': ['实行"先通风、再检测、后作业"', '保持出入口畅通', '配备应急救援设备', '专人监护'],
    '高处作业': ['佩戴安全带并高挂低用', '设置安全网', '作业平台稳固', '恶劣天气禁止作业'],
    '吊装作业': ['吊装工具合格', '设置警戒区', '专人指挥', '持证上岗'],
    '断路作业': ['制定交通组织方案', '设置交通警示标志', '夜间设置警示灯', '专人指挥']
};

export default function Create() {
    const [searchParams] = useSearchParams();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        work_type: searchParams.get('type') || '',
        applicant: user?.full_name || '',
        supervisor: '',
        guardian: '',
        start_time: '',
        end_time: '',
        content: '',
        safety_measures: [],
        // Hot Work specific fields
        applicant_unit: '',
        apply_time: '',
        work_location: '',
        work_level: '',
        work_method: '',
        worker_cert: '',
        work_unit: '',
        gas_analysis: [],
        related_permits: '',
        risk_identification: '',
        safety_measures_list: [],
        // Confined Space specific fields
        original_media: '',
        workers: '',
        jsa_files: [],
        work_plan_files: [],
        // Blind Plate specific fields
        blind_plate_work_type: '',
        equipment_pipeline_name: '',
        pipeline_media: '',
        pipeline_temp: '',
        pipeline_pressure: '',
        blind_plate_material: '',
        blind_plate_spec: '',
        blind_plate_number: '',
        blind_plate_map: '',
        preparer: '',
        // Height Work specific fields
        work_height: '',
        // Lifting Permit specific fields
        rigging_name: '',
        lifting_content: '',
        lifting_workers: '',
        rigger: '',
        commander: '',
        lifting_weight: '',
        // Temporary Electricity specific fields
        power_source: '',
        work_voltage: '',
        equipment_power: '',
        electricity_user: '',
        supervisor_cert: '',
        gas_analysis_time: '',
        gas_analysis_point: '',
        gas_analysis_result: '',
        gas_analyst: '',
        safety_discloser: '',
        safety_disclosee: '',
        supervisor_opinion: '',
        supervisor_sign: '',
        supervisor_sign_date: '',
        unit_opinion: '',
        unit_sign: '',
        unit_sign_date: '',
        power_dept_opinion: '',
        power_dept_sign: '',
        power_dept_sign_date: '',
        completion_acceptance: '',
        completion_sign: '',
        completion_sign_date: '',
        // Ground Breaking specific fields
        work_scope_content: '',
        prepare_time: '',
        other_safety_measures: '',
        measure_preparer: '',
        relevant_dept_opinion: '',
        relevant_dept_sign: '',
        relevant_dept_sign_date: '',
        approval_dept_opinion: '',
        approval_dept_sign: '',
        approval_dept_sign_date: '',
        // Road Breaking specific fields
        road_break_reason: '',
        related_unit: '',
        sketch_and_desc: '',
        sketch_sign: '',
        sketch_sign_time: '',
        safety_dept_opinion: '',
        safety_dept_sign: '',
        safety_dept_sign_date: ''
    });

    const handleCustomChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 检查作业人员签字
        if (!formData.worker_sign) {
            alert('请先完成作业人员签字确认');
            return;
        }

        const start = new Date(formData.start_time);
        const end = new Date(formData.end_time);
        if (end <= start) {
            alert('计划结束时间必须晚于开始时间');
            return;
        }

        const data = {
            ...formData,
            type: formData.work_type,
            applicant_id: user?.id || 0,
            applicant_name: formData.applicant,
            start_time: formData.start_time,
            end_time: formData.end_time,
            content: formData.content,
            safety_measures: formData.safety_measures,
            signatures: {}
        };

        try {
            const result = await createPermit(data);
            if (result.success) {
                alert('作业票申请提交成功！');
                navigate('/work-permit/list');
            } else {
                alert('提交失败: ' + (result.error || '未知错误'));
            }
        } catch (error) {
            console.error('提交失败:', error);
            alert('提交失败：' + (error.message || '请检查网络连接'));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'work_type') {
            const measures = SAFETY_MEASURES_DB[value] || ['遵守通用安全操作规程', '穿戴劳动防护用品'];
            setFormData(prev => ({ 
                ...prev, 
                [name]: value, 
                safety_measures: measures,
                safety_measures_list: [], // Reset for specific forms
                gas_analysis: [] // Reset for specific forms
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const toggleSafetyMeasure = (measure) => {
        setFormData(prev => ({
            ...prev,
            safety_measures: prev.safety_measures.includes(measure)
                ? prev.safety_measures.filter(m => m !== measure)
                : [...prev.safety_measures, measure]
        }));
    };

    return (
        <>
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Link to="/work-permit" className="text-gray-500 hover:text-blue-600 transition-colors">
                        <i className="fas fa-arrow-left text-xl"></i>
                    </Link>
                    <h1 className="text-xl font-bold text-gray-800">新建作业票</h1>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">{user?.full_name}</span>
                    <button onClick={logout} className="text-sm text-red-500 hover:underline">
                        退出
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-6xl mx-auto w-full">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Suspense fallback={<FormLoading />}>
                            {formData.work_type === '动火作业' ? (
                                <HotWorkPermitForm data={formData} onChange={handleCustomChange} />
                            ) : formData.work_type === '受限空间作业' ? (
                                <ConfinedSpacePermitForm data={formData} onChange={handleCustomChange} isCreating={true} />
                            ) : formData.work_type === '盲板抽堵作业' ? (
                                <BlindPlatePermitForm data={formData} onChange={handleCustomChange} />
                            ) : formData.work_type === '高处作业' ? (
                                <HeightWorkPermitForm data={formData} onChange={handleCustomChange} />
                            ) : formData.work_type === '吊装作业' ? (
                                <LiftingPermitForm data={formData} onChange={handleCustomChange} />
                            ) : formData.work_type === '临时用电作业' ? (
                                <TemporaryElectricityPermitForm data={formData} onChange={handleCustomChange} />
                            ) : formData.work_type === '动土作业' ? (
                                <GroundBreakingPermitForm data={formData} onChange={handleCustomChange} />
                            ) : formData.work_type === '断路作业' ? (
                                <RoadBreakingPermitForm data={formData} onChange={handleCustomChange} />
                            ) : (
                            <>
                                {/* Basic Info Card */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h2 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-blue-500 pl-3">基础信息</h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                作业类型 <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="work_type"
                                                value={formData.work_type}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50"
                                            >
                                                <option value="">请选择作业类型</option>
                                                <option value="动火作业">动火作业</option>
                                                <option value="受限空间作业">受限空间作业</option>
                                                <option value="盲板抽堵作业">盲板抽堵作业</option>
                                                <option value="高处作业">高处作业</option>
                                                <option value="吊装作业">吊装作业</option>
                                                <option value="临时用电作业">临时用电作业</option>
                                                <option value="动土作业">动土作业</option>
                                                <option value="断路作业">断路作业</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">作业票编号</label>
                                            <input
                                                type="text"
                                                readOnly
                                                className="w-full rounded-lg border-gray-300 border p-2.5 bg-gray-100 text-gray-500 cursor-not-allowed"
                                                value="自动生成"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Personnel & Time */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h2 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-blue-500 pl-3">人员与时间</h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                作业申请人 <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative group">
                                                <input
                                                    type="text"
                                                    name="applicant"
                                                    value={formData.applicant}
                                                    onChange={handleChange}
                                                    required
                                                    className={`w-full rounded-lg border p-2.5 outline-none transition-all duration-200 ${
                                                        formData.applicant 
                                                        ? 'border-green-500 bg-green-50 text-green-700 font-medium focus:ring-2 focus:ring-green-200' 
                                                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                                    }`}
                                                    placeholder="请输入申请人姓名"
                                                />
                                                
                                                {formData.applicant && (
                                                    <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute bottom-full left-0 mb-3 w-[36rem] bg-gray-800 text-white text_base rounded-xl shadow-xl p-6 z-50 transition-all duration-200 pointer-events-none transform origin-bottom">
                                                        <div className="space-y-5">
                                                            <div>
                                                                <h4 className="font-bold text-blue-200 text-lg mb-3 border-b border-gray-600 pb-2">培训考核教育纪录</h4>
                                                                <ul className="space-y-2 text-gray-300">
                                                                    <li className="flex items-start gap-3">
                                                                        <i className="fas fa-check text-green-400 mt-1"></i>
                                                                        <span>2024年度安全生产教育培训 (合格)</span>
                                                                    </li>
                                                                    <li className="flex items-start gap-3">
                                                                        <i className="fas fa-check text-green-400 mt-1"></i>
                                                                        <span>入场三级安全教育 (通过)</span>
                                                                    </li>
                                                                </ul>
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-blue-200 text-lg mb-3 border-b border-gray-600 pb-2">考核合格记录</h4>
                                                                <ul className="space-y-2 text-gray-300">
                                                                    <li className="flex items-start gap-3">
                                                                        <i className="fas fa-certificate text-yellow-400 mt-1"></i>
                                                                        <span>特殊作业监护人资格证 (有效)</span>
                                                                    </li>
                                                                    <li className="flex items-start gap-3">
                                                                        <i className="fas fa-certificate text-yellow-400 mt-1"></i>
                                                                        <span>安全管理人员资格证 (有效)</span>
                                                                    </li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                        <div className="absolute left-6 top-full -mt-[1px] border-[12px] border-transparent border-t-gray-800"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text_sm font-medium text-gray-700 mb-2">
                                                作业负责人 <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="supervisor"
                                                value={formData.supervisor}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text_sm font-medium text-gray-700 mb-2">
                                                监护人 <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="guardian"
                                                value={formData.guardian}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                计划开始时间 <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="datetime-local"
                                                name="start_time"
                                                value={formData.start_time}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                计划结束时间 <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="datetime-local"
                                                name="end_time"
                                                value={formData.end_time}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Content & Safety */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h2 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-blue-500 pl-3">作业内容与安全措施</h2>
                                    
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            作业内容描述 <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            name="content"
                                            value={formData.content}
                                            onChange={handleChange}
                                            rows="4"
                                            required
                                            className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            placeholder="请详细描述作业内容、涉及设备及工艺条件..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            安全措施确认 <span className="text-red-500">*</span>
                                        </label>
                                        <div className="space-y-2 border border-gray-200 rounded-lg p-4 bg-gray-50">
                                            {formData.work_type && (SAFETY_MEASURES_DB[formData.work_type] || ['遵守通用安全操作规程', '穿戴劳动防护用品']).map((measure, index) => (
                                                <div key={index} className="flex items-start gap-2 p-2 hover:bg-blue-50 rounded transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.safety_measures.includes(measure)}
                                                        onChange={() => toggleSafetyMeasure(measure)}
                                                        className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-700">{measure}</span>
                                                </div>
                                            ))}
                                            {!formData.work_type && (
                                                <p className="text-gray-400 text-sm italic text-center py-4">
                                                    请先选择作业类型...
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                        </Suspense>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 pt-4 pb-8">
                            {!formData.worker_sign && (
                                <p className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded">
                                    <i className="fas fa-info-circle mr-1"></i>
                                    请先在上方完成作业人员签字确认后再提交申请
                                </p>
                            )}
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors w-1/3"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    disabled={!formData.worker_sign}
                                    className="px-6 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all w-2/3 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    <span>提交申请</span>
                                    <i className="fas fa-paper-plane ml-2"></i>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
}
