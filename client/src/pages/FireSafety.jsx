import React, { useState, useEffect } from 'react';
import { authFetch } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function FireSafety() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('equipment');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await authFetch('/api/fire-safety');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Failed to fetch fire safety data:', error);
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

    return (
        <div className="flex-1 overflow-auto p-6">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">消防安全管理</h2>
                    <p className="text-gray-500">消防设施设备、检查记录及应急演练管理。</p>
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

                {/* Tab Navigation */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex gap-4">
                        <button
                            onClick={() => setActiveTab('equipment')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === 'equipment' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            消防设施
                        </button>
                        <button
                            onClick={() => setActiveTab('inspections')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === 'inspections' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            检查记录
                        </button>
                        <button
                            onClick={() => setActiveTab('drills')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === 'drills' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            演练记录
                        </button>
                    </div>

                    {/* Fire Equipment Tab */}
                    {activeTab === 'equipment' && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设备编号</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设备类型</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">安装位置</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">安装日期</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">上次检查</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">下次检查</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {data?.equipment?.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.type}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.location}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.installDate}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.lastCheck}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.nextCheck}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    item.status === '正常' ? 'bg-green-100 text-green-800' :
                                                    item.status === '待检查' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Inspection Records Tab */}
                    {activeTab === 'inspections' && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">检查日期</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">检查类型</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">检查区域</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">检查人员</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发现问题</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">整改状态</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {data?.inspections?.map((inspection, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inspection.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inspection.type}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inspection.area}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inspection.inspector}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inspection.issuesFound}个</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    inspection.status === '已整改' ? 'bg-green-100 text-green-800' :
                                                    inspection.status === '整改中' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {inspection.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Fire Drills Tab */}
                    {activeTab === 'drills' && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">演练日期</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">演练主题</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">参与人数</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">组织部门</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">演练时长</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">演练效果</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {data?.drills?.map((drill, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{drill.date}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{drill.topic}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{drill.participants}人</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{drill.department}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{drill.duration}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    drill.effect === '优秀' ? 'bg-green-100 text-green-800' :
                                                    drill.effect === '良好' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {drill.effect}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
