import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { loadPermits, formatDate, getStatusColor } from '../../utils/api';

export default function List() {
    const [permits, setPermits] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0
    });
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [searchParams] = useSearchParams();
    const statusFilter = searchParams.get('status') || '';

    useEffect(() => {
        fetchPermits();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, statusFilter, pagination.page]);

    const fetchPermits = async () => {
        setLoading(true);
        try {
            const result = await loadPermits(statusFilter, search, pagination.page, pagination.pageSize);
            setPermits(result.data || []);
            setPagination(prev => ({
                ...prev,
                total: result.total || 0,
                totalPages: result.totalPages || 0
            }));
            setLoading(false);
        } catch (error) {
            console.error('Error loading permits:', error);
            setPermits([]);
            setLoading(false);
        }
    };

    let searchTimeout = null;
    const handleSearchChange = (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            setSearch(e.target.value.trim());
            setPagination(prev => ({ ...prev, page: 1 }));
        }, 500);
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            {/* Mobile Header */}
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 md:hidden">
                <div className="flex items-center gap-3">
                    <Link to="/work-permit" className="text-gray-500 hover:text-blue-600 transition-colors">
                        <i className="fas fa-arrow-left text-lg"></i>
                    </Link>
                    <h1 className="text-lg font-bold text-gray-800">
                        {statusFilter ? `${statusFilter} - 作业票` : '作业票列表'}
                    </h1>
                </div>
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
                    <div className="flex items-center gap-4">
                        <Link to="/work-permit" className="text-gray-500 hover:text-blue-600 transition-colors hidden md:block">
                            <i className="fas fa-arrow-left text-xl"></i>
                        </Link>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-gray-800">
                                {statusFilter ? `${statusFilter}作业票` : '所有作业票'}
                            </h2>
                            {statusFilter && (
                                <Link
                                    to="/work-permit/list"
                                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                                >
                                    <i className="fas fa-times"></i>
                                    <span>清除筛选</span>
                                </Link>
                            )}
                        </div>
                    </div>
                    
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
                            to="/work-permit/create"
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
                                            onClick={() => navigate(`/work-permit/detail/${permit.id}`)}
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
                                                        navigate(`/work-permit/detail/${permit.id}`);
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
                    
                    {/* Pagination */}
                    {!loading && permits.length > 0 && pagination.totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                共 {pagination.total} 条记录，第 {pagination.page} / {pagination.totalPages} 页
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(1)}
                                    disabled={pagination.page === 1}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    首页
                                </button>
                                <button
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                                
                                {/* Page numbers */}
                                {(() => {
                                    const pages = [];
                                    const showPages = 5;
                                    let startPage = Math.max(1, pagination.page - Math.floor(showPages / 2));
                                    let endPage = Math.min(pagination.totalPages, startPage + showPages - 1);
                                    
                                    if (endPage - startPage < showPages - 1) {
                                        startPage = Math.max(1, endPage - showPages + 1);
                                    }
                                    
                                    for (let i = startPage; i <= endPage; i++) {
                                        pages.push(
                                            <button
                                                key={i}
                                                onClick={() => handlePageChange(i)}
                                                className={`px-3 py-1 text-sm border rounded transition-colors ${
                                                    i === pagination.page
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                {i}
                                            </button>
                                        );
                                    }
                                    return pages;
                                })()}
                                
                                <button
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === pagination.totalPages}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                                <button
                                    onClick={() => handlePageChange(pagination.totalPages)}
                                    disabled={pagination.page === pagination.totalPages}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    末页
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
