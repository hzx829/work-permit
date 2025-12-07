import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Hazard() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await fetch('/api/hazard');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Failed to fetch hazard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-gray-500">加载中...</div>
        </div>;
    }

    return (
        <div className="flex-1 overflow-auto p-6">
            {/* Header Section */}
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">隐患闭环整改</h2>
                    <p className="text-gray-500">隐患自动生成、闭环管理及整改追踪（来源：日常检查 + AI监控）。</p>
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
                {/* Stats */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-search text-3xl text-blue-600"></i>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">检查总数</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{data?.stats?.inspectionTotal || 0}</dd>
                                    </dl>
                                </div>
                            </div>
                            <div className="mt-2">
                                <div className="text-sm text-green-600">检查率: {data?.stats?.inspectionRate || 0}%</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-exclamation-circle text-3xl text-red-600"></i>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">隐患总数</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{data?.stats?.hazardTotal || 0}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-tools text-3xl text-orange-600"></i>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">待整改</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{data?.stats?.pending || 0}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-check-circle text-3xl text-green-600"></i>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">已完成</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{data?.stats?.completed || 0}</dd>
                                    </dl>
                                </div>
                            </div>
                            <div className="mt-2">
                                <div className="text-sm text-green-600">整改率: {data?.stats?.completionRate || 0}%</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hazard List */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">隐患清单</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">来源</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">隐患描述</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">位置</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发现时间</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">等级</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">闭环状态</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">责任人</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">整改期限</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data?.hazardList?.map((hazard) => (
                                    <tr key={hazard.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                hazard.source === '日常检查' ? 'bg-blue-100 text-blue-800' :
                                                hazard.source === 'AI监控' ? 'bg-purple-100 text-purple-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {hazard.source || '日常检查'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{hazard.description}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{hazard.location}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{hazard.foundTime}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                hazard.level === '重大' ? 'bg-red-100 text-red-800' :
                                                hazard.level === '较大' ? 'bg-orange-100 text-orange-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {hazard.level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                hazard.status === '已闭环' ? 'bg-green-100 text-green-800' :
                                                hazard.status === '整改中' ? 'bg-blue-100 text-blue-800' :
                                                hazard.status === '待分配' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {hazard.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{hazard.responsible}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{hazard.deadline}</td>
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

