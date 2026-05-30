import React, { useState, useEffect } from 'react';
import { authFetch } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function Comprehensive() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('personnel');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await authFetch('/api/comprehensive');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Failed to fetch comprehensive data:', error);
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
            {/* Header Section */}
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">总体分析</h2>
                    <p className="text-gray-500">全厂安全生产运行态势概览。</p>
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
                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">在厂人数</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">{data?.stats?.personnel || 0}</h3>
                                <p className="text-xs text-gray-400 mt-1">人</p>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-500 rounded-lg">
                                <i className="fas fa-users text-2xl"></i>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">设备运行总数</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">{data?.stats?.equipment || 0}</h3>
                                <p className="text-xs text-gray-400 mt-1">台</p>
                            </div>
                            <div className="p-3 bg-cyan-50 text-cyan-500 rounded-lg">
                                <i className="fas fa-cogs text-2xl"></i>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">危险化学品总量</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">{data?.stats?.chemicals || 0}</h3>
                                <p className="text-xs text-gray-400 mt-1">吨</p>
                            </div>
                            <div className="p-3 bg-purple-50 text-purple-500 rounded-lg">
                                <i className="fas fa-flask text-2xl"></i>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">安全态势指数</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">{data?.stats?.safetyIndex || 0}%</h3>
                                <p className="text-xs text-green-500 mt-1">运行良好</p>
                            </div>
                            <div className="p-3 bg-green-50 text-green-500 rounded-lg">
                                <i className="fas fa-shield-alt text-2xl"></i>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex">
                            <button
                                onClick={() => setActiveTab('personnel')}
                                className={`py-4 px-6 text-sm font-medium transition-colors ${
                                    activeTab === 'personnel'
                                        ? 'border-b-2 border-blue-500 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                人员概况
                            </button>
                            <button
                                onClick={() => setActiveTab('equipment')}
                                className={`py-4 px-6 text-sm font-medium transition-colors ${
                                    activeTab === 'equipment'
                                        ? 'border-b-2 border-blue-500 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                设备状态
                            </button>
                            <button
                                onClick={() => setActiveTab('chemicals')}
                                className={`py-4 px-6 text-sm font-medium transition-colors ${
                                    activeTab === 'chemicals'
                                        ? 'border-b-2 border-blue-500 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                化学品库存
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'personnel' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {data?.personnelByDept?.map((dept, idx) => (
                                    <div key={idx} className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all">
                                        <h4 className="font-semibold text-gray-900 mb-3">{dept.name}</h4>
                                        <p className="text-3xl font-bold text-blue-600 mb-2">{dept.count} <span className="text-lg text-gray-500">人</span></p>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">在岗率</span>
                                            <span className="text-green-600 font-semibold">{dept.onDutyRate}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'equipment' && (
                            <div className="text-center py-12 text-gray-400">
                                <i className="fas fa-cogs text-5xl mb-4"></i>
                                <p>设备状态数据开发中...</p>
                            </div>
                        )}

                        {activeTab === 'chemicals' && (
                            <div className="text-center py-12 text-gray-400">
                                <i className="fas fa-flask text-5xl mb-4"></i>
                                <p>化学品库存数据开发中...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
