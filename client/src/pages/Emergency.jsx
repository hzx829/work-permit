import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfinedSpaceEmergency from '../components/ConfinedSpaceEmergency';

export default function Emergency() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('plans');
    const [planSubTab, setPlanSubTab] = useState('list'); // list or confined-space

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await fetch('/api/emergency');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Failed to fetch emergency data:', error);
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
                    <h2 className="text-2xl font-bold text-gray-800">应急处置管理</h2>
                    <p className="text-gray-500">应急预案、演练记录及事故响应管理。</p>
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
                            onClick={() => setActiveTab('plans')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === 'plans' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            应急预案
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
                        <button
                            onClick={() => setActiveTab('events')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === 'events' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            应急事件
                        </button>
                    </div>

                    {/* Emergency Plans */}
                    {activeTab === 'plans' && (
                        <div>
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex gap-2">
                                <button
                                    onClick={() => setPlanSubTab('list')}
                                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                                        planSubTab === 'list'
                                            ? 'bg-white text-blue-600 shadow-sm font-medium ring-1 ring-black/5'
                                            : 'text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <i className="fas fa-list mr-2"></i>
                                    预案列表
                                </button>
                                <button
                                    onClick={() => setPlanSubTab('confined-space')}
                                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                                        planSubTab === 'confined-space'
                                            ? 'bg-white text-blue-600 shadow-sm font-medium ring-1 ring-black/5'
                                            : 'text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <i className="fas fa-project-diagram mr-2"></i>
                                    有限空间专项预案
                                </button>
                            </div>

                            {planSubTab === 'list' ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">预案名称</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">预案类型</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">编制日期</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">责任人</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {data?.plans?.map((plan, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{plan.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plan.type}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plan.createDate}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plan.responsible}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                            plan.status === '有效' ? 'bg-green-100 text-green-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {plan.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-6">
                                    <ConfinedSpaceEmergency />
                                </div>
                            )}
                        </div>
                    )}



                    {/* Drill Records */}
                    {activeTab === 'drills' && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">演练名称</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">演练类型</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">演练日期</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">参与人数</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">演练效果</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {data?.drills?.map((drill, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{drill.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{drill.type}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{drill.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{drill.participants}人</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    drill.effect === '良好' ? 'bg-green-100 text-green-800' :
                                                    drill.effect === '一般' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
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

                    {/* Emergency Events */}
                    {activeTab === 'events' && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">事件编号</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">事件类型</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发生时间</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">事件等级</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">处置状态</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">负责人</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {data?.events?.map((event, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{event.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.type}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.time}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    event.level === '一般' ? 'bg-blue-100 text-blue-800' :
                                                    event.level === '较大' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {event.level}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    event.status === '已处置' ? 'bg-green-100 text-green-800' :
                                                    'bg-orange-100 text-orange-800'
                                                }`}>
                                                    {event.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.responsible}</td>
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
