import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Video() {
    const navigate = useNavigate();
    const [cameras, setCameras] = useState([]);
    const [aiAlarms, setAiAlarms] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('cameras');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await fetch('/api/video');
            const data = await response.json();
            setCameras(data.cameras);
            setAiAlarms(data.aiAlarms || []);
            setStats(data.stats);
        } catch (error) {
            console.error('Failed to fetch video data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">视频监控系统</h1>
                <button
                    onClick={() => navigate('/')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <i className="fas fa-chart-line"></i>
                    进入数字座舱
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-video text-3xl text-blue-600"></i>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">摄像头总数</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{stats.total || 0} 个</dd>
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
                                        <dt className="text-sm font-medium text-gray-500 truncate">在线</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{stats.online || 0} 个</dd>
                                    </dl>
                                </div>
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
                                        <dt className="text-sm font-medium text-gray-500 truncate">离线</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{stats.offline || 0} 个</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-bell text-3xl text-orange-600"></i>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">今日告警</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{stats.alerts || 0} 次</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-8 bg-white shadow rounded-lg mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex">
                            <button 
                                onClick={() => setActiveTab('cameras')}
                                className={`py-4 px-6 text-sm font-medium ${
                                    activeTab === 'cameras' 
                                    ? 'border-b-2 border-blue-500 text-blue-600' 
                                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                监控画面
                            </button>
                            <button 
                                onClick={() => setActiveTab('ai')}
                                className={`py-4 px-6 text-sm font-medium ${
                                    activeTab === 'ai' 
                                    ? 'border-b-2 border-blue-500 text-blue-600' 
                                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                AI报警信息
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Camera Grid */}
                {activeTab === 'cameras' && (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {loading ? (
                            <div className="col-span-full text-center py-12 text-gray-500">加载中...</div>
                        ) : cameras.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-gray-500">暂无监控数据</div>
                        ) : (
                            cameras.map((camera) => (
                                <div key={camera.id} className="bg-white shadow rounded-lg overflow-hidden">
                                    <div className="aspect-video bg-gray-900 flex items-center justify-center">
                                        <i className="fas fa-video text-gray-600 text-4xl"></i>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-medium text-gray-900">{camera.name}</h3>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                camera.status === '在线' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {camera.status}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500">{camera.location}</p>
                                        <div className="mt-2 flex items-center text-xs text-gray-400">
                                            <i className="fas fa-clock mr-1"></i>
                                            <span>最后在线: {camera.lastOnline}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* AI Alarm List */}
                {activeTab === 'ai' && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">AI报警记录</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">位置</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">原因</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-4 text-center text-gray-500">加载中...</td>
                                        </tr>
                                    ) : aiAlarms.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-4 text-center text-gray-500">暂无数据</td>
                                        </tr>
                                    ) : (
                                        aiAlarms.map((alarm) => (
                                            <tr key={alarm.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{alarm.location}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alarm.type}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{alarm.reason}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alarm.time}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        alarm.status === '已处理' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                                    }`}>
                                                        {alarm.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-900">
                                                    <button className="mr-3">查看</button>
                                                    <button>处理</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
        </div>
    );
}
