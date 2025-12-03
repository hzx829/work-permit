import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createPermit } from '../utils/api';

const SAFETY_MEASURES_DB = {
    '动火作业': ['清理作业现场易燃物', '配备合格的消防器材', '动火点周围30米内无排放可燃气体', '作业人员持有特种作业证'],
    '受限空间作业': ['实行"先通风、再检测、后作业"', '保持出入口畅通', '配备应急救援设备', '专人监护'],
    '高处作业': ['佩戴安全带并高挂低用', '设置安全网', '作业平台稳固', '恶劣天气禁止作业']
};

export default function Create() {
    const [searchParams] = useSearchParams();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    
    const [formData, setFormData] = useState({
        work_type: searchParams.get('type') || '',
        applicant: user?.full_name || '',
        supervisor: '',
        guardian: '',
        start_time: '',
        end_time: '',
        content: '',
        safety_measures: []
    });



    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        const ctx = canvas.getContext('2d');
        ctx.scale(ratio, ratio);
    }, []);

    const startDrawing = (e) => {
        setIsDrawing(true);
        setHasSignature(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const ctx = canvasRef.current?.getContext('2d');
        ctx?.beginPath();
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const start = new Date(formData.start_time);
        const end = new Date(formData.end_time);
        if (end <= start) {
            alert('计划结束时间必须晚于开始时间');
            return;
        }

        if (!hasSignature) {
            alert('请在签名区域签名');
            return;
        }

        const data = {
            type: formData.work_type,
            applicant_id: user?.id || 0,
            applicant_name: formData.applicant,
            start_time: formData.start_time,
            end_time: formData.end_time,
            content: formData.content,
            safety_measures: formData.safety_measures,
            signatures: {
                applicant: canvasRef.current.toDataURL()
            }
        };

        try {
            const result = await createPermit(data);
            if (result.success) {
                alert('作业票申请提交成功！');
                navigate('/list');
            } else {
                alert('提交失败: ' + (result.error || '未知错误'));
            }
        } catch (error) {
            console.error(error);
            alert('提交失败，请检查网络');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'work_type') {
            const measures = SAFETY_MEASURES_DB[value] || ['遵守通用安全操作规程', '穿戴劳动防护用品'];
            setFormData(prev => ({ ...prev, [name]: value, safety_measures: measures }));
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
                    <Link to="/" className="text-gray-500 hover:text-blue-600 transition-colors">
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
                <div className="max-w-4xl mx-auto w-full">
                    <form onSubmit={handleSubmit} className="space-y-6">
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
                                    <input
                                        type="text"
                                        name="applicant"
                                        value={formData.applicant}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
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

                        {/* Signature */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-blue-500 pl-3">申请人签名</h2>
                            <div className="border border-gray-300 rounded-lg bg-gray-50 relative">
                                <canvas
                                    ref={canvasRef}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseOut={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                    className="w-full h-40 cursor-crosshair touch-none"
                                />
                                <div className="absolute bottom-2 right-2">
                                    <button
                                        type="button"
                                        onClick={clearSignature}
                                        className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded"
                                    >
                                        清除
                                    </button>
                                </div>
                                {!hasSignature && (
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none text-gray-300 text-xl font-bold select-none">
                                        请在此区域手写签名
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4 pt-4 pb-8">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors w-1/3"
                            >
                                取消
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all w-2/3 flex justify-center items-center"
                            >
                                <span>提交申请</span>
                                <i className="fas fa-paper-plane ml-2"></i>
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
}
