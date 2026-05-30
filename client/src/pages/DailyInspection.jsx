import React, { useState, useEffect } from 'react';
import { authFetch } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function DailyInspection() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await authFetch('/api/daily-inspection');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Failed to fetch inspection data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <i className="fas fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
                    <div className="text-gray-500">加载中...</div>
                </div>
            </div>
        );
    }

    const filteredInspections = data?.inspections?.filter(item => {
        if (activeTab === 'pending') return item.status === '待检查';
        if (activeTab === 'completed') return item.status === '已完成';
        return true;
    });

    return (
        <div className="flex-1 overflow-auto p-6">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">日常安全检查</h2>
                    <p className="text-gray-500">定期安全检查计划与执行记录管理。</p>
                </div>
                <button 
                    onClick={() => navigate('/')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <i className="fas fa-chart-line"></i>
                    进入数字驾驶舱
                </button>
            </div>

            <div className="max-w-7xl mx-auto">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    {data?.stats?.map((stat, idx) => (
                        <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                                    <h3 className="text-4xl font-bold text-gray-900 mt-2">{stat.value}</h3>
                                    <p className="text-xs text-gray-400 mt-1">{stat.unit}</p>
                                </div>
                                <div className={`p-3 rounded-lg ${stat.bgColor} ${stat.textColor}`}>
                                    <i className={`${stat.icon} text-2xl`}></i>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Inspection List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-800">检查任务</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    activeTab === 'all' 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                全部
                            </button>
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    activeTab === 'pending' 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                待检查
                            </button>
                            <button
                                onClick={() => setActiveTab('completed')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    activeTab === 'completed' 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                已完成
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">检查编号</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">检查类型</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">检查区域</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">检查人员</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">计划日期</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发现问题</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredInspections?.map((inspection, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inspection.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inspection.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inspection.area}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inspection.inspector}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inspection.planDate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                inspection.status === '已完成' ? 'bg-green-100 text-green-800' :
                                                inspection.status === '待检查' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {inspection.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inspection.issuesFound || 0}个</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
