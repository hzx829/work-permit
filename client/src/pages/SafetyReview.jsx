import React, { useState, useEffect } from 'react';
import { authFetch } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function SafetyReview() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await authFetch('/api/safety-review');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Failed to fetch safety review data:', error);
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
                    <h2 className="text-2xl font-bold text-gray-800">安全评审管理</h2>
                    <p className="text-gray-500">安全管理体系评审及改进措施管理。</p>
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

                {/* Review List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800">评审记录</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">评审编号</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">评审类型</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">评审日期</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">评审组长</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发现问题</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data?.reviews?.map((review, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{review.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{review.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{review.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{review.leader}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{review.issuesFound}个</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                review.status === '已完成' ? 'bg-green-100 text-green-800' :
                                                review.status === '整改中' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                                {review.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Improvement Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800">改进措施</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">措施编号</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联评审</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">问题描述</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">改进措施</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">责任部门</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">完成期限</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data?.improvements?.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.reviewId}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{item.issue}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{item.action}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.department}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.deadline}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                item.status === '已完成' ? 'bg-green-100 text-green-800' :
                                                item.status === '进行中' ? 'bg-blue-100 text-blue-800' :
                                                item.status === '逾期' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {item.status}
                                            </span>
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
