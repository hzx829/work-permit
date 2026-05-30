import React, { useState, useEffect } from 'react';
import { authFetch } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function Training() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await authFetch('/api/training');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Failed to fetch training data:', error);
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
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">培训管理系统</h1>
                <button
                    onClick={() => navigate('/')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <i className="fas fa-chart-line"></i>
                    进入数字座舱
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-graduation-cap text-3xl text-blue-600"></i>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">培训总人次</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{data?.stats?.totalTrainees || 0}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-desktop text-3xl text-green-600"></i>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">线上培训</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{data?.stats?.onlineTrainees || 0}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-chalkboard-teacher text-3xl text-purple-600"></i>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">线下培训</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{data?.stats?.offlineTrainees || 0}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-chart-line text-3xl text-orange-600"></i>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">完成率</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{data?.stats?.completionRate || 0}%</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Training Courses */}
                <div className="bg-white shadow rounded-lg mb-8">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">培训课程</h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {data?.courses?.map((course) => (
                                <div key={course.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-gray-900">{course.name}</h4>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                            course.type === '线上' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                                        }`}>
                                            {course.type}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-3">{course.description}</p>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">学时: {course.hours}h</span>
                                        <span className="text-blue-600">已学: {course.completed}人</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Training Records */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">培训记录</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">课程名称</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">培训方式</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">培训时间</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成绩</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data?.records?.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{record.course}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.time}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{record.score}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                record.status === '合格' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
            </div>
        </div>
    );
}
