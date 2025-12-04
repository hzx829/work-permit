import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Comprehensive() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await fetch('/api/comprehensive');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Failed to fetch comprehensive data:', error);
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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">综合管理系统</h1>
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        返回数字座舱
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-users text-3xl text-blue-600"></i>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">在厂人数</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{data?.stats?.personnel || 0} 人</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-cogs text-3xl text-cyan-600"></i>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">设备运行总数</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{data?.stats?.equipment || 0} 台</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-flask text-3xl text-purple-600"></i>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">危险化学品总量</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{data?.stats?.chemicals || 0} 吨</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-shield-alt text-3xl text-green-600"></i>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">安全态势指数</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{data?.stats?.safetyIndex || 0}%</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-8 bg-white shadow rounded-lg">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex">
                            <button className="border-b-2 border-blue-500 py-4 px-6 text-sm font-medium text-blue-600">
                                人员概况
                            </button>
                            <button className="border-transparent py-4 px-6 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                                设备状态
                            </button>
                            <button className="border-transparent py-4 px-6 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                                化学品库存
                            </button>
                        </nav>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-3 gap-6">
                            {data?.personnelByDept?.map((dept, idx) => (
                                <div key={idx} className="border rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-2">{dept.name}</h4>
                                    <p className="text-2xl font-bold text-blue-600">{dept.count} 人</p>
                                    <p className="text-sm text-gray-500 mt-1">在岗率: {dept.onDutyRate}%</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
