import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loadPermits, formatDate, getStatusColor } from '../utils/api';

export default function List() {
    const [permits, setPermits] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    useEffect(() => {
        fetchPermits();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const fetchPermits = async () => {
        setLoading(true);
        try {
            const data = await loadPermits('', search);
            setPermits(data);
            setLoading(false);
        } catch (error) {
            console.error('Error loading permits:', error);
            setLoading(false);
        }
    };

    let searchTimeout = null;
    const handleSearchChange = (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            setSearch(e.target.value.trim());
        }, 500);
    };

    return (
        <>
            {/* Mobile Header */}
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 md:hidden">
                <h1 className="text-lg font-bold text-gray-800">作业票列表</h1>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">{user?.full_name}</span>
                    <button onClick={logout} className="text-sm text-red-500 hover:underline">
                        退出
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">所有作业票</h2>
                    
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                            <input
                                type="text"
                                onChange={handleSearchChange}
                                placeholder="搜索编号、类型或申请人..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <Link
                            to="/create"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center whitespace-nowrap"
                        >
                            <i className="fas fa-plus mr-2"></i>新建
                        </Link>
                    </div>
                </div>

                {/* Table Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-gray-500 text-sm uppercase font-medium">
                                <tr>
                                    <th className="px-6 py-4">作业编号</th>
                                    <th className="px-6 py-4">作业类型</th>
                                    <th className="px-6 py-4">申请单位/部门</th>
                                    <th className="px-6 py-4">申请人</th>
                                    <th className="px-6 py-4">申请时间</th>
                                    <th className="px-6 py-4">状态</th>
                                    <th className="px-6 py-4 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                                            <i className="fas fa-spinner fa-spin mr-2"></i>正在加载数据...
                                        </td>
                                    </tr>
                                ) : permits.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                                            未找到匹配的记录
                                        </td>
                                    </tr>
                                ) : (
                                    permits.map(permit => (
                                        <tr
                                            key={permit.id}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/detail/${permit.id}`)}
                                        >
                                            <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                                {permit.permit_number || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-gray-800">{permit.type}</span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-700">{permit.department || '-'}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                        {permit.applicant_name ? permit.applicant_name.charAt(0) : '?'}
                                                    </div>
                                                    <span>{permit.applicant_name || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{formatDate(permit.created_at)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(permit.status)}`}>
                                                    {permit.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-full transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/detail/${permit.id}`);
                                                    }}
                                                >
                                                    <i className="fas fa-chevron-right"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
