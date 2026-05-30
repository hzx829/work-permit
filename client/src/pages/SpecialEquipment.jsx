import React, { useState, useEffect } from 'react';
import { authFetch } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function SpecialEquipment() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('equipment');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await authFetch('/api/special-equipment');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Failed to fetch special equipment data:', error);
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
                    <h2 className="text-2xl font-bold text-gray-800">特种设备管理</h2>
                    <p className="text-gray-500">特种设备台账、检验记录及人员资质管理。</p>
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
                            设备台账
                        </button>
                        <button
                            onClick={() => setActiveTab('personnel')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === 'personnel' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            人员资质
                        </button>
                    </div>

                    {/* Equipment Tab */}
                    {activeTab === 'equipment' && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设备编号</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设备名称</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设备类型</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">使用位置</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">检验日期</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">下次检验</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {data?.equipment?.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.type}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.location}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.lastInspection}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.nextInspection}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    item.status === '正常' ? 'bg-green-100 text-green-800' :
                                                    item.status === '即将到期' ? 'bg-yellow-100 text-yellow-800' :
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

                    {/* Personnel Tab */}
                    {activeTab === 'personnel' && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">部门</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">证书类型</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">证书编号</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发证日期</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">有效期至</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {data?.personnel?.map((person, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{person.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.department}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.certType}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.certNumber}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.issueDate}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.expiryDate}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    person.status === '有效' ? 'bg-green-100 text-green-800' :
                                                    person.status === '即将过期' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {person.status}
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
