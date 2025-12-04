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

    const getRiskColor = (level) => {
        const colors = {
            '重大风险': 'bg-red-100 text-red-800 border-red-300',
            '较大风险': 'bg-orange-100 text-orange-800 border-orange-300',
            '一般风险': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            '低风险': 'bg-blue-100 text-blue-800 border-blue-300'
        };
        return colors[level] || 'bg-gray-100 text-gray-800 border-gray-300';
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
            {/* Header Section */}
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">风险分析</h2>
                    <p className="text-gray-500">全厂风险点分布及管控情况。</p>
                </div>
                <button 
                    onClick={() => navigate('/')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <i className="fas fa-chart-line"></i>
                    进入数字驾驶舱
                </button>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto">
                {/* Risk Stats Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    {data?.stats?.map((stat, idx) => (
                        <div
                            key={idx}
                            className={`rounded-xl p-6 shadow-sm border-l-4 hover:shadow-md transition-all bg-white ${
                                stat.level === '重大风险' ? 'border-red-600' :
                                stat.level === '较大风险' ? 'border-orange-600' :
                                stat.level === '一般风险' ? 'border-yellow-600' :
                                'border-blue-600'
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">{stat.level}</p>
                                    <h3 className="text-4xl font-bold text-gray-900 mt-2">{stat.count}</h3>
                                    <p className="text-xs text-gray-400 mt-1">个风险点</p>
                                </div>
                                <div className={`p-3 rounded-lg ${
                                    stat.level === '重大风险' ? 'bg-red-50 text-red-500' :
                                    stat.level === '较大风险' ? 'bg-orange-50 text-orange-500' :
                                    stat.level === '一般风险' ? 'bg-yellow-50 text-yellow-500' :
                                    'bg-blue-50 text-blue-500'
                                }`}>
                                    <i className="fas fa-exclamation-triangle text-2xl"></i>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Risk List Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800">风险清单</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-gray-500 text-sm uppercase font-medium">
                                <tr>
                                    <th className="px-6 py-4">风险名称</th>
                                    <th className="px-6 py-4">位置</th>
                                    <th className="px-6 py-4">类别</th>
                                    <th className="px-6 py-4">等级</th>
                                    <th className="px-6 py-4">管控措施</th>
                                    <th className="px-6 py-4">责任人</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                {data?.riskList?.map((risk) => (
                                    <tr key={risk.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{risk.name}</td>
                                        <td className="px-6 py-4">{risk.location}</td>
                                        <td className="px-6 py-4">{risk.category}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRiskColor(risk.level)}`}>
                                                {risk.level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{risk.control}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                    {risk.responsible ? risk.responsible.charAt(0) : '?'}
                                                </div>
                                                <span>{risk.responsible}</span>
                                            </div>
                                        </td>
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

