import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Risk() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await fetch('/api/risk');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Failed to fetch risk data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-gray-500">加载中...</div>
        </div>;
    }

    const getRiskColor = (level) => {
        const colors = {
            '重大风险': 'bg-red-100 text-red-800 border-red-300',
            '较大风险': 'bg-orange-100 text-orange-800 border-orange-300',
            '一般风险': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            '低风险': 'bg-blue-100 text-blue-800 border-blue-300'
        };
        return colors[level] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">风险管理系统</h1>
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        返回数字座舱
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                {/* Risk Stats */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
                    {data?.stats?.map((stat, idx) => (
                        <div key={idx} className={`overflow-hidden shadow rounded-lg border-l-4 ${
                            stat.level === '重大风险' ? 'border-red-600 bg-red-50' :
                            stat.level === '较大风险' ? 'border-orange-600 bg-orange-50' :
                            stat.level === '一般风险' ? 'border-yellow-600 bg-yellow-50' :
                            'border-blue-600 bg-blue-50'
                        }`}>
                            <div className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">{stat.level}</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-1">{stat.count}</p>
                                    </div>
                                    <div className="text-2xl opacity-50">
                                        <i className="fas fa-exclamation-triangle"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Risk List */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">风险清单</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">风险名称</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">位置</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类别</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">等级</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">管控措施</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">责任人</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data?.riskList?.map((risk) => (
                                    <tr key={risk.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{risk.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{risk.location}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{risk.category}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRiskColor(risk.level)}`}>
                                                {risk.level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{risk.control}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{risk.responsible}</td>
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
