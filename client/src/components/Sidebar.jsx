import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
    const location = useLocation();
    const { user, logout } = useAuth();

    const isActive = (path) => location.pathname === path;

    const menuItems = [
        { path: '/comprehensive', icon: 'fa-chart-pie', label: '总体分析' },
        { path: '/risk', icon: 'fa-exclamation-triangle', label: '风险分析' },
        { path: '/hazard', icon: 'fa-search', label: '隐患排查' },
        { path: '/equipment', icon: 'fa-bell', label: '生产报警' },
        { type: 'divider', label: '作业管理' },
        { path: '/work-permit', icon: 'fa-chart-line', label: '工作台' },
        { path: '/work-permit/list', icon: 'fa-list', label: '作业票列表' },
        { path: '/work-permit/create', icon: 'fa-plus-circle', label: '新建申请' },
        { type: 'divider', label: '其他模块' },
        { path: '/regulation', icon: 'fa-book', label: '法律法规' },
        { path: '/training', icon: 'fa-graduation-cap', label: '教育培训' },
        { path: '/video', icon: 'fa-video', label: 'AI报警' },
    ];

    return (
        <aside className="w-64 bg-slate-800 text-white flex flex-col hidden md:flex shadow-xl">
            <div className="h-16 flex items-center justify-center border-b border-slate-700">
                <h1 className="text-xl font-bold">
                    <i className="fas fa-shield-halved mr-2"></i>
                    安全生产管控
                </h1>
            </div>
            <nav className="flex-1 py-6 overflow-y-auto">
                <ul>
                    {menuItems.map((item, index) => (
                        item.type === 'divider' ? (
                            <li key={index} className="px-6 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {item.label}
                            </li>
                        ) : (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`flex items-center px-6 py-3 ${
                                        isActive(item.path)
                                            ? 'bg-slate-700 text-white border-l-4 border-blue-500'
                                            : 'text-slate-300 hover:bg-slate-700 hover:text-white transition-colors'
                                    }`}
                                >
                                    <i className={`fas ${item.icon} w-6`}></i>
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        )
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                        <i className="fas fa-user"></i>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium">
                            {user?.full_name || '-'}
                        </p>
                        <p className="text-xs text-slate-400">在线</p>
                    </div>
                    <button
                        onClick={logout}
                        className="text-xs text-slate-400 hover:text-white"
                        title="退出"
                    >
                        <i className="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            </div>
        </aside>
    );
}
