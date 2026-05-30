import React, { useState, useEffect } from 'react';
import { authFetch } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function Regulation() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('law');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await authFetch('/api/regulation');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Failed to fetch regulation data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-gray-500">加载中...</div>
        </div>;
    }

    const getCurrentList = () => {
        if (activeTab === 'law') return data?.laws || [];
        if (activeTab === 'regulation') return data?.regulations || [];
        return data?.procedures || [];
    };

    return (
        <div className="flex-1 overflow-auto p-6">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">安全生产标准化</h2>
                    <p className="text-gray-500">法律法规、规章制度及操作规程管理。</p>
                </div>
                <button 
                    onClick={() => navigate('/')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <i className="fas fa-chart-line"></i>
                    进入数字驾驶舱
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-balance-scale text-3xl text-blue-600"></i>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">法律法规</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{data?.stats?.laws || 0} 部</dd>
                                        <dd className="text-xs text-gray-500 mt-1">现行: {data?.stats?.lawsActive || 0} 部</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-file-alt text-3xl text-green-600"></i>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">规章制度</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{data?.stats?.regulations || 0} 项</dd>
                                        <dd className="text-xs text-gray-500 mt-1">现行: {data?.stats?.regulationsActive || 0} 项</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-tasks text-3xl text-purple-600"></i>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">操作规程</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{data?.stats?.procedures || 0} 个</dd>
                                        <dd className="text-xs text-gray-500 mt-1">现行: {data?.stats?.proceduresActive || 0} 个</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs and List */}
                <div className="bg-white shadow rounded-lg">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex">
                            <button 
                                onClick={() => setActiveTab('law')}
                                className={`py-4 px-6 text-sm font-medium ${
                                    activeTab === 'law' 
                                    ? 'border-b-2 border-blue-500 text-blue-600' 
                                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                法律法规
                            </button>
                            <button 
                                onClick={() => setActiveTab('regulation')}
                                className={`py-4 px-6 text-sm font-medium ${
                                    activeTab === 'regulation' 
                                    ? 'border-b-2 border-blue-500 text-blue-600' 
                                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                规章制度
                            </button>
                            <button 
                                onClick={() => setActiveTab('procedure')}
                                className={`py-4 px-6 text-sm font-medium ${
                                    activeTab === 'procedure' 
                                    ? 'border-b-2 border-blue-500 text-blue-600' 
                                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                操作规程
                            </button>
                        </nav>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">编号</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发布日期</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">实施日期</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {getCurrentList().map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{item.code}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.publishDate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.effectiveDate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                item.status === '现行' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-900">
                                            <button className="mr-3">查看</button>
                                            <button>下载</button>
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
