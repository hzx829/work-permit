import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPermit, formatDate, getStatusColor } from '../utils/api';

export default function Detail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [permit, setPermit] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPermit = async () => {
            try {
                const data = await getPermit(id);
                setPermit(data);
                setLoading(false);
            } catch (error) {
                console.error('Error loading permit:', error);
                alert('作业票不存在');
                navigate('/list');
            }
        };

        fetchPermit();
    }, [id, navigate]);

    if (loading || !permit) {
        return (
            <div className="h-screen flex items-center justify-center">
                <i className="fas fa-spinner fa-spin text-4xl text-blue-500"></i>
            </div>
        );
    }

    const safetyMeasures = JSON.parse(permit.safety_measures || '[]');

    return (
        <>
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Link to="/list" className="text-gray-500 hover:text-blue-600 transition-colors">
                        <i className="fas fa-arrow-left text-xl"></i>
                    </Link>
                    <h1 className="text-xl font-bold text-gray-800">作业票详情</h1>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm font-mono hidden md:inline-block">
                        {permit.permit_number}
                    </span>
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
                <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Content Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
                            <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center opacity-50 pointer-events-none">
                                <i className="fas fa-file-contract text-6xl text-blue-200 ml-4 mt-4"></i>
                            </div>

                            <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">基础信息</h2>
                            <div className="grid grid-cols-2 gap-y-4 text-sm">
                                <div>
                                    <span className="text-gray-500 block mb-1">作业类型</span>
                                    <span className="font-medium text-gray-900 text-lg">{permit.type}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block mb-1">作业编号</span>
                                    <span className="font-mono text-gray-700">{permit.permit_number}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block mb-1">申请单位/部门</span>
                                    <span className="text-gray-900">{permit.department}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block mb-1">作业地点</span>
                                    <span className="text-gray-900">{permit.location}</span>
                                </div>
                            </div>
                        </div>

                        {/* Time */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">时间安排</h2>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex-1">
                                    <span className="text-gray-500 block mb-1">计划开始时间</span>
                                    <span className="text-gray-900 font-mono">{formatDate(permit.start_time)}</span>
                                </div>
                                <i className="fas fa-arrow-right text-gray-300"></i>
                                <div className="flex-1 text-right">
                                    <span className="text-gray-500 block mb-1">计划结束时间</span>
                                    <span className="text-gray-900 font-mono">{formatDate(permit.end_time)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">作业内容</h2>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{permit.content}</p>
                        </div>

                        {/* Safety Measures */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">安全措施</h2>
                            <ul className="space-y-2">
                                {safetyMeasures.map((measure, index) => (
                                    <li key={index} className="flex items-start gap-2 text-gray-700">
                                        <i className="fas fa-check-circle text-green-500 mt-1"></i>
                                        <span>{measure}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Right: Status & Actions */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">当前状态</h3>
                            <span className={`inline-block px-4 py-2 rounded-lg text-lg font-semibold ${getStatusColor(permit.status)}`}>
                                {permit.status}
                            </span>
                        </div>

                        {/* Applicant Info */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-sm font-medium text-gray-500 mb-4">申请人信息</h3>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-xs text-gray-500">申请人</span>
                                    <p className="font-medium text-gray-900">{permit.applicant_name}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500">申请时间</span>
                                    <p className="text-sm text-gray-700">{formatDate(permit.created_at)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-sm font-medium text-gray-500 mb-4">操作</h3>
                            <button
                                onClick={() => window.print()}
                                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-2"
                            >
                                <i className="fas fa-print mr-2"></i>
                                打印
                            </button>
                            <Link
                                to="/list"
                                className="block w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center"
                            >
                                返回列表
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
