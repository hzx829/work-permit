import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { loadPermits, formatDate, getStatusColor } from '../../utils/api';

export default function Dashboard() {
    const [permits, setPermits] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        approved: 0,
        active: 0,
        pending: 0,
        completed: 0,
        rejected: 0
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await loadPermits('', '');
                setPermits(data.slice(0, 5));

                setStats({
                    total: data.length || 0,
                    approved: data.filter(p => p.status === '已批准').length,
                    active: data.filter(p => p.status === '作业进行中' || p.status === '作业中').length,
                    pending: data.filter(p => p.status === '待审批').length,
                    completed: data.filter(p => p.status === '作业已完成' || p.status === '已完工').length,
                    rejected: data.filter(p => p.status === '已驳回').length
                });

                setLoading(false);
            } catch (error) {
                console.error('Error loading data:', error);
                setLoading(false);
            }
        };
        
        fetchData();
    }, []);

    const workTypes = [
        { type: '动火作业', icon: 'fa-fire', color: 'red' },
        { type: '受限空间作业', icon: 'fa-dungeon', color: 'indigo' },
        { type: '高处作业', icon: 'fa-arrow-up-from-bracket', color: 'blue' },
        { type: '吊装作业', icon: 'fa-truck-pickup', color: 'orange' },
        { type: '临时用电作业', icon: 'fa-bolt', color: 'yellow' },
        { type: '盲板抽堵作业', icon: 'fa-ban', color: 'gray' },
        { type: '动土作业', icon: 'fa-person-digging', color: 'amber' },
        { type: '断路作业', icon: 'fa-road-barrier', color: 'emerald' }
    ];

    return (
        <div className="flex-1 overflow-auto p-6">
            {/* Welcome Section */}
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">工作台概览</h2>
                    <p className="text-gray-500">欢迎回来，{user?.full_name}，今日安全生产无事故。</p>
                </div>
                <button 
                    onClick={() => navigate('/')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <i className="fas fa-chart-line"></i>
                    进入数字驾驶舱
                </button>
            </div>

            {/* Total Summary */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 mb-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-blue-100 text-sm mb-1">今日作业总数</p>
                        <h3 className="text-4xl font-bold">{stats.total}</h3>
                    </div>
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <i className="fas fa-clipboard-list text-3xl"></i>
                    </div>
                </div>
            </div>

            {/* Status Cards - Clickable */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <button
                    onClick={() => navigate('/work-permit/list?status=待审批')}
                    className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-yellow-200 transition-all text-left"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs md:text-sm text-gray-500 font-medium">待审批</p>
                            <h3 className="text-2xl md:text-3xl font-bold text-yellow-600 mt-1 md:mt-2">{stats.pending}</h3>
                        </div>
                        <div className="p-2 md:p-3 bg-yellow-50 text-yellow-500 rounded-lg">
                            <i className="fas fa-clock text-lg md:text-xl"></i>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => navigate('/work-permit/list?status=已批准')}
                    className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all text-left"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs md:text-sm text-gray-500 font-medium">已批准</p>
                            <h3 className="text-2xl md:text-3xl font-bold text-blue-600 mt-1 md:mt-2">{stats.approved}</h3>
                        </div>
                        <div className="p-2 md:p-3 bg-blue-50 text-blue-500 rounded-lg">
                            <i className="fas fa-check-circle text-lg md:text-xl"></i>
                        </div>
                    </div>
                </button>
                
                <button
                    onClick={() => navigate('/work-permit/list?status=作业进行中')}
                    className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition-all text-left"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs md:text-sm text-gray-500 font-medium">作业进行中</p>
                            <h3 className="text-2xl md:text-3xl font-bold text-green-600 mt-1 md:mt-2">{stats.active}</h3>
                        </div>
                        <div className="p-2 md:p-3 bg-green-50 text-green-500 rounded-lg">
                            <i className="fas fa-hammer text-lg md:text-xl"></i>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => navigate('/work-permit/list?status=作业已完成')}
                    className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all text-left"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs md:text-sm text-gray-500 font-medium">作业已完成</p>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-600 mt-1 md:mt-2">{stats.completed}</h3>
                        </div>
                        <div className="p-2 md:p-3 bg-gray-50 text-gray-500 rounded-lg">
                            <i className="fas fa-flag-checkered text-lg md:text-xl"></i>
                        </div>
                    </div>
                </button>
            </div>

            {/* Quick Actions */}
            <h3 className="text-lg font-bold text-gray-800 mb-4">快速发起申请</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {workTypes.map(({ type, icon, color }) => (
                    <Link
                        key={type}
                        to={`/work-permit/create?type=${encodeURIComponent(type)}`}
                        className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-${color}-200 transition-colors`}
                    >
                        <div className={`w-14 h-14 rounded-full bg-${color}-50 text-${color}-500 flex items-center justify-center mb-3 group-hover:bg-${color}-500 group-hover:text-white transition-colors`}>
                            <i className={`fas ${icon} text-2xl`}></i>
                        </div>
                        <h4 className={`font-semibold text-gray-700 group-hover:text-${color}-600`}>
                            {type.replace('作业', '')}
                        </h4>
                    </Link>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">近期作业申请</h3>
                    <Link to="/work-permit/list" className="text-blue-500 hover:text-blue-700 text-sm font-medium">
                        查看全部
                    </Link>
                </div>
                <div className="p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-gray-500 text-sm border-b border-gray-100">
                                    <th className="pb-3 font-medium">作业编号</th>
                                    <th className="pb-3 font-medium">类型</th>
                                    <th className="pb-3 font-medium">位置</th>
                                    <th className="pb-3 font-medium">申请人</th>
                                    <th className="pb-3 font-medium">时间</th>
                                    <th className="pb-3 font-medium">状态</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center text-gray-400">
                                            <i className="fas fa-spinner fa-spin mr-2"></i>正在加载数据...
                                        </td>
                                    </tr>
                                ) : permits.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center text-gray-400">
                                            暂无作业记录
                                        </td>
                                    </tr>
                                ) : (
                                    permits.map(permit => (
                                        <tr
                                            key={permit.id}
                                            className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/work-permit/detail/${permit.id}`)}
                                        >
                                            <td className="py-3 font-mono text-xs text-gray-500">
                                                {permit.permit_number || 'N/A'}
                                            </td>
                                            <td className="py-3">
                                                <span className="font-medium text-gray-800">{permit.type}</span>
                                            </td>
                                            <td className="py-3">{permit.location || '-'}</td>
                                            <td className="py-3">{permit.applicant_name || '-'}</td>
                                            <td className="py-3 text-xs text-gray-500">
                                                {formatDate(permit.created_at)}
                                            </td>
                                            <td className="py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(permit.status)}`}>
                                                    {permit.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
