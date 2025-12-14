import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Video() {
    const navigate = useNavigate();
    const [cameras, setCameras] = useState([]);
    const [aiAlarms, setAiAlarms] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('cameras');
    
    // URL配置管理状态
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [configForm, setConfigForm] = useState({ camera_id: '', camera_name: '', location: '', jump_url: '', description: '', status: '在线' });
    const [cameraUrls, setCameraUrls] = useState([]);
    const [editingUrl, setEditingUrl] = useState(null);

    useEffect(() => {
        fetchData();
        fetchCameraUrls();
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

    const fetchCameraUrls = async () => {
        try {
            const response = await fetch('/api/camera-urls');
            const data = await response.json();
            setCameraUrls(data || []);
        } catch (error) {
            console.error('Failed to fetch camera URLs:', error);
        }
    };

    // 点击摄像头画面跳转
    const handleCameraClick = (camera) => {
        if (camera.jumpUrl) {
            window.open(camera.jumpUrl, '_blank');
        }
    };

    // 保存URL配置
    const handleSaveConfig = async () => {
        if (!configForm.jump_url || !configForm.camera_name) {
            alert('请填写摄像头名称和跳转地址');
            return;
        }
        
        try {
            const response = await fetch('/api/camera-urls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(configForm)
            });
            
            if (response.ok) {
                await fetchCameraUrls();
                await fetchData(); // 刷新摄像头数据
                setConfigForm({ camera_id: '', camera_name: '', location: '', jump_url: '', description: '', status: '在线' });
                setEditingUrl(null);
                setShowConfigModal(false);
            }
        } catch (error) {
            console.error('Failed to save camera URL:', error);
        }
    };

    // 删除URL配置
    const handleDeleteConfig = async (cameraId) => {
        if (!confirm('确定要删除此配置吗？')) return;
        
        try {
            const response = await fetch(`/api/camera-urls/${cameraId}`, { method: 'DELETE' });
            if (response.ok) {
                await fetchCameraUrls();
                await fetchData();
            }
        } catch (error) {
            console.error('Failed to delete camera URL:', error);
        }
    };

    // 编辑URL配置
    const handleEditConfig = (urlConfig) => {
        setConfigForm({
            camera_id: urlConfig.camera_id,
            camera_name: urlConfig.camera_name || '',
            location: urlConfig.location || '',
            jump_url: urlConfig.jump_url,
            description: urlConfig.description || '',
            status: urlConfig.status || '在线'
        });
        setEditingUrl(urlConfig.camera_id);
    };

    // 快速配置（从摄像头卡片）
    const handleQuickConfig = (camera) => {
        setConfigForm({
            camera_id: camera.id,
            camera_name: camera.name,
            location: camera.location || '',
            jump_url: camera.jumpUrl || '',
            description: '',
            status: camera.status || '在线'
        });
        setEditingUrl(camera.jumpUrl ? camera.id : null);
        setShowConfigModal(true);
    };

    return (
        <div className="flex-1 overflow-auto p-6">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">AI监控管理</h2>
                    <p className="text-gray-500">智能视频监控及AI违规行为识别管理。</p>
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
                            <button 
                                onClick={() => setActiveTab('config')}
                                className={`py-4 px-6 text-sm font-medium ${
                                    activeTab === 'config' 
                                    ? 'border-b-2 border-blue-500 text-blue-600' 
                                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <i className="fas fa-cog mr-1"></i>
                                链接配置
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
                                <div key={camera.id} className="bg-white shadow rounded-lg overflow-hidden group">
                                    <div 
                                        className={`aspect-video bg-gray-900 flex items-center justify-center relative ${camera.jumpUrl ? 'cursor-pointer hover:bg-gray-800' : ''}`}
                                        onClick={() => handleCameraClick(camera)}
                                    >
                                        <i className="fas fa-video text-gray-600 text-4xl z-10"></i>
                                        {camera.jumpUrl && (
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all z-20">
                                                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <i className="fas fa-external-link-alt mr-2"></i>点击查看
                                                </span>
                                            </div>
                                        )}
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
                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="flex items-center text-xs text-gray-400">
                                                <i className="fas fa-clock mr-1"></i>
                                                <span>最后在线: {camera.lastOnline}</span>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleQuickConfig(camera); }}
                                                className={`text-xs px-2 py-1 rounded ${camera.jumpUrl ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                title={camera.jumpUrl ? '编辑跳转链接' : '配置跳转链接'}
                                            >
                                                <i className={`fas ${camera.jumpUrl ? 'fa-link' : 'fa-cog'} mr-1`}></i>
                                                {camera.jumpUrl ? '已配置' : '配置'}
                                            </button>
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

                {/* URL配置管理 */}
                {activeTab === 'config' && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">摄像头跳转链接配置</h3>
                            <button 
                                onClick={() => { setShowConfigModal(true); setConfigForm({ camera_id: '', camera_name: '', jump_url: '', description: '' }); setEditingUrl(null); }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <i className="fas fa-plus"></i>
                                添加配置
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">摄像头ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">摄像头名称</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">跳转地址</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备注</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {cameraUrls.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-4 text-center text-gray-500">暂无配置，请点击"添加配置"或在监控画面中点击摄像头卡片的配置按钮</td>
                                        </tr>
                                    ) : (
                                        cameraUrls.map((urlConfig) => (
                                            <tr key={urlConfig.camera_id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{urlConfig.camera_id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{urlConfig.camera_name || '-'}</td>
                                                <td className="px-6 py-4 text-sm text-blue-600 max-w-xs truncate" title={urlConfig.jump_url}>
                                                    <a href={urlConfig.jump_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                        {urlConfig.jump_url}
                                                    </a>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{urlConfig.description || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <button 
                                                        onClick={() => { handleEditConfig(urlConfig); setShowConfigModal(true); }}
                                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                                    >
                                                        编辑
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteConfig(urlConfig.camera_id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        删除
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 配置弹窗 */}
                {showConfigModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {editingUrl ? '编辑摄像头配置' : '添加新摄像头'}
                                </h3>
                            </div>
                            <div className="px-6 py-4 space-y-4 max-h-96 overflow-y-auto">
                                {editingUrl !== null && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">摄像头ID</label>
                                        <input
                                            type="number"
                                            value={configForm.camera_id}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                                            disabled
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">摄像头名称 *</label>
                                    <input
                                        type="text"
                                        value={configForm.camera_name}
                                        onChange={(e) => setConfigForm({ ...configForm, camera_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="输入摄像头名称"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">位置</label>
                                    <input
                                        type="text"
                                        value={configForm.location}
                                        onChange={(e) => setConfigForm({ ...configForm, location: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="输入摄像头位置，如：化工1#车间"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                                    <select
                                        value={configForm.status}
                                        onChange={(e) => setConfigForm({ ...configForm, status: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="在线">在线</option>
                                        <option value="离线">离线</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">跳转地址 *</label>
                                    <input
                                        type="url"
                                        value={configForm.jump_url}
                                        onChange={(e) => setConfigForm({ ...configForm, jump_url: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="输入跳转URL，如 https://example.com/camera/1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                                    <textarea
                                        value={configForm.description}
                                        onChange={(e) => setConfigForm({ ...configForm, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="输入备注信息（可选）"
                                        rows={2}
                                    />
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    onClick={() => { setShowConfigModal(false); setConfigForm({ camera_id: '', camera_name: '', location: '', jump_url: '', description: '', status: '在线' }); setEditingUrl(null); }}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSaveConfig}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    保存
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}
