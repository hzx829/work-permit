import React, { useState, useEffect } from 'react';
import { downloadRegulationDocument, loadRegulations, uploadRegulationDocument } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function Regulation() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('law');
    const [uploading, setUploading] = useState(false);
    const [notice, setNotice] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const result = await loadRegulations();
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

    const categoryName = { law: '法律法规', regulation: '规章制度', procedure: '操作规程' }[activeTab];

    const handleUpload = async (event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = '';
        if (!files.length) return;
        setUploading(true);
        setNotice('');
        try {
            for (const file of files) await uploadRegulationDocument(activeTab, file);
            await fetchData();
            setNotice(`已上传 ${files.length} 个文件，并同步到法律法规库和数字驾驶舱。`);
        } catch (error) {
            setNotice(error.message || '上传失败，请重试');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (item) => {
        if (!item.uploaded) return;
        try {
            await downloadRegulationDocument(item.documentId, item.name);
        } catch (error) {
            setNotice(error.message || '下载失败，请重试');
        }
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

            <div className="mb-6 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="font-bold text-gray-800"><i className="fas fa-cloud-upload-alt mr-2 text-blue-600" />上传标准文件</h3>
                        <p className="mt-1 text-sm text-gray-500">当前上传到“{categoryName}”；上传后会同步显示在本页资料库和数字驾驶舱。</p>
                    </div>
                    <label className={`inline-flex min-w-44 cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-5 py-3 font-medium text-white shadow hover:bg-blue-700 ${uploading ? 'pointer-events-none opacity-60' : ''}`}>
                        <i className={`fas ${uploading ? 'fa-spinner fa-spin' : 'fa-upload'} mr-2`} />
                        {uploading ? '正在上传...' : '选择并上传文件'}
                        <input type="file" className="hidden" multiple accept="image/*,.doc,.docx,.pdf" onChange={handleUpload} disabled={uploading} />
                    </label>
                </div>
                {notice && <div className={`mt-3 rounded px-3 py-2 text-sm ${notice.includes('失败') || notice.includes('错误') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{notice}</div>}
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
                                            {item.uploaded ? <button onClick={() => handleDownload(item)}>下载</button> : <span className="text-gray-400">系统资料</span>}
                                        </td>
                                    </tr>
                                ))}
                                {getCurrentList().length === 0 && <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-400">暂无资料</td></tr>}
                            </tbody>
                        </table>
                    </div>
            </div>
        </div>
    );
}
