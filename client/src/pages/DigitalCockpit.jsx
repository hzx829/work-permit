import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThreeMap from '../components/ThreeMap';

export default function DigitalCockpit() {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const week = weekDays[date.getDay()];
        return `${year}-${month}-${day} ${week}`;
    };

    // Mock Data
    const overallStats = [
        { label: '在厂人数(人)', value: 1326, icon: 'fa-users', color: 'text-blue-400' },
        { label: '设备运行总数(台)', value: 39223, icon: 'fa-cogs', color: 'text-cyan-400' },
        { label: '危险化学品总量(吨)', value: 34.81, icon: 'fa-flask', color: 'text-purple-400' },
        { label: '安全态势指数(%)', value: 92.13, icon: 'fa-shield-alt', color: 'text-green-400' },
    ];

    const riskStats = [
        { label: '重大风险', count: 15, color: 'bg-red-600', width: '30%' },
        { label: '较大风险', count: 55, color: 'bg-orange-500', width: '60%' },
        { label: '一般风险', count: 5, color: 'bg-yellow-400', width: '10%' },
        { label: '低风险', count: 3, color: 'bg-blue-400', width: '5%' },
    ];

    const alarmData = [
        { workshop: '化工2#车间', device: '压缩机', tag: 'C120038', type: '泄露', time: '15:00:23' },
        { workshop: '化工2#车间', device: '压缩机', tag: 'C120038', type: '泄露', time: '15:00:23' },
        { workshop: '化工2#车间', device: '压缩机', tag: 'C120038', type: '泄露', time: '15:00:23' },
        { workshop: '化工2#车间', device: '压缩机', tag: 'C120038', type: '泄露', time: '15:00:23' },
        { workshop: '化工2#车间', device: '压缩机', tag: 'C120038', type: '泄露', time: '15:00:23' },
    ];

    const aiAlarmData = [
        { location: '化工2#车间', type: '违规作业', reason: '未带安全帽', time: '15:00:23' },
        { location: '化工2#车间', type: '违规作业', reason: '未带安全帽', time: '15:00:23' },
        { location: '化工2#车间', type: '违规作业', reason: '未带安全帽', time: '15:00:23' },
        { location: '化工2#车间', type: '违规作业', reason: '未带安全帽', time: '15:00:23' },
        { location: '化工2#车间', type: '违规作业', reason: '未带安全帽', time: '15:00:23' },
    ];

    const workPermitStats = [
        { label: '动火', value: 90 },
        { label: '临电', value: 120 },
        { label: '受限', value: 70 },
        { label: '高处', value: 40 },
        { label: '盲板', value: 80 },
        { label: '动土', value: 50 },
        { label: '吊装', value: 95 },
        { label: '断路', value: 60 },
    ];

    return (
        <div className="h-screen w-screen bg-[#020617] text-white font-sans overflow-hidden relative flex flex-col">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#020617] to-[#020617] pointer-events-none"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

            {/* Header */}
            <header className="relative h-16 flex-none flex items-center justify-between px-6 bg-gradient-to-b from-[#0f172a]/90 to-transparent border-b border-blue-500/20 z-50 backdrop-blur-sm">
                <div className="text-blue-300 font-mono text-lg tracking-wider">{formatDate(currentTime)}</div>
                
                <div className="absolute left-1/2 transform -translate-x-1/2 top-0 h-full flex items-center">
                    <div className="relative px-12 py-2">
                        <div className="absolute inset-0 bg-blue-500/10 transform -skew-x-12 border-b border-blue-500/50"></div>
                        <h1 className="relative text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-blue-200 tracking-[0.2em] drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">
                            安全生产管控平台
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-blue-200">
                        <i className="fas fa-cloud text-blue-400 animate-pulse"></i>
                        <span>多云 24°C</span>
                    </div>
                </div>
            </header>

            {/* Main Content Grid */}
            <main className="flex-1 p-4 grid grid-cols-12 gap-4 min-h-0 relative z-10">
                
                {/* Left Column */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 h-full overflow-y-auto lg:overflow-hidden pr-2 lg:pr-0">
                    {/* Overall Analysis */}
                    <TechPanel 
                        title="总体分析" 
                        className="flex-none cursor-pointer hover:border-blue-400 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                        onClick={() => navigate('/comprehensive')}
                    >
                        <div className="grid grid-cols-2 gap-3">
                            {overallStats.map((stat, index) => (
                                <div key={index} className="bg-blue-950/30 p-3 rounded border border-blue-800/30 flex flex-col items-center justify-center text-center group hover:bg-blue-900/40 transition-colors">
                                    <i className={`fas ${stat.icon} text-2xl mb-2 ${stat.color} group-hover:scale-110 transition-transform`}></i>
                                    <div className="text-xl font-bold text-white font-mono">{stat.value}</div>
                                    <div className="text-xs text-blue-400/80">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </TechPanel>

                    {/* Risk Analysis */}
                    <TechPanel 
                        title="风险分析" 
                        className="flex-none cursor-pointer hover:border-blue-400 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                        onClick={() => navigate('/risk')}
                    >
                        <div className="space-y-3 px-1">
                            {riskStats.map((risk, index) => (
                                <div key={index} className="flex items-center gap-3 text-sm">
                                    <span className="w-16 text-blue-300 text-xs">{risk.label}</span>
                                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                        <div className={`h-full ${risk.color} relative shadow-[0_0_8px_currentColor]`} style={{ width: risk.width }}></div>
                                    </div>
                                    <span className="w-8 text-right font-mono text-white text-xs">{risk.count}</span>
                                </div>
                            ))}
                        </div>
                    </TechPanel>

                    {/* Hidden Danger Analysis */}
                    <TechPanel 
                        title="隐患风险分析" 
                        className="flex-none cursor-pointer hover:border-blue-400 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                        onClick={() => navigate('/hazard')}
                    >
                        <div className="flex justify-around items-center py-2">
                            <CircleProgress percentage={88.9} label="检查率" color="text-blue-500" />
                            <CircleProgress percentage={89.0} label="整改率" color="text-green-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center text-sm mt-2 border-t border-blue-900/30 pt-2">
                            <div>
                                <div className="text-red-400 font-bold font-mono text-lg">5558</div>
                                <div className="text-blue-400/60 text-xs">风险检查总数</div>
                            </div>
                            <div>
                                <div className="text-red-400 font-bold font-mono text-lg">2632</div>
                                <div className="text-blue-400/60 text-xs">隐患总数</div>
                            </div>
                        </div>
                    </TechPanel>

                    {/* Production Alarm */}
                    <TechPanel 
                        title="生产报警信息" 
                        className="flex-1 min-h-[200px] cursor-pointer hover:border-blue-400 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                        onClick={() => navigate('/equipment')}
                    >
                        <div className="h-full overflow-y-auto overflow-x-hidden dark-scrollbar" style={{ maxHeight: 'calc(100% - 0px)' }}>
                            <table className="w-full text-left text-xs">
                                <thead className="text-blue-400 sticky top-0 bg-[#0f172a]/95 z-10 backdrop-blur-sm">
                                    <tr>
                                        <th className="py-2 pl-2">车间</th>
                                        <th>设备</th>
                                        <th>类型</th>
                                        <th>时间</th>
                                    </tr>
                                </thead>
                                <tbody className="text-blue-100">
                                    {alarmData.map((item, i) => (
                                        <tr key={i} className="border-b border-blue-900/20 hover:bg-blue-900/40 transition-colors">
                                            <td className="py-2 pl-2">{item.workshop}</td>
                                            <td>{item.device}</td>
                                            <td className="text-red-400 animate-pulse">{item.type}</td>
                                            <td className="opacity-60 font-mono">{item.time}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TechPanel>
                </div>

                {/* Center Column */}
                <div className="col-span-12 lg:col-span-6 flex flex-col gap-4 h-full relative">
                    {/* 3D Map Area */}
                    <div className="flex-1 relative rounded-xl overflow-hidden border border-blue-500/30 bg-[#020617]/80 shadow-[0_0_50px_rgba(30,58,138,0.2)_inset]">
                        <ThreeMap />
                        
                        {/* Safe Days Counter */}
                        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center justify-center z-20 pointer-events-none">
                            <div className="text-white font-bold text-sm mb-1 tracking-wider drop-shadow-md">安全运行天数(天)</div>
                            
                            <div className="relative flex items-center justify-center px-12 py-2">
                                {/* Background Bar */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-900/60 to-transparent"></div>
                                <div className="absolute inset-x-6 top-0 bottom-0 border-y border-blue-500/20 bg-gradient-to-r from-transparent via-blue-950/80 to-transparent"></div>

                                {/* Left Decoration */}
                                <div className="absolute left-0 w-4 h-10 border-l-4 border-blue-500 rounded-l-full shadow-[-4px_0_10px_rgba(59,130,246,0.6)]"></div>
                                <div className="absolute left-2 w-2 h-8 border-l-2 border-blue-400/50 rounded-l-full"></div>

                                {/* Numbers */}
                                <div className="relative z-10 text-4xl font-bold text-white tracking-[0.5em] font-mono drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] pl-[0.5em]">
                                    1024
                                </div>

                                {/* Right Decoration */}
                                <div className="absolute right-0 w-4 h-10 border-r-4 border-blue-500 rounded-r-full shadow-[4px_0_10px_rgba(59,130,246,0.6)]"></div>
                                <div className="absolute right-2 w-2 h-8 border-r-2 border-blue-400/50 rounded-r-full"></div>
                                
                                {/* Bottom Accent */}
                                <div className="absolute bottom-0 w-12 h-[2px] bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,1)]"></div>
                            </div>
                        </div>

                        {/* Overlay UI Elements on Map */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                            <div className="bg-black/40 backdrop-blur-md border-l-2 border-orange-500 px-3 py-1 text-xs text-orange-300">
                                <span className="font-bold">⚠ 警告:</span> 化工2#车间 温度异常
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 h-full overflow-y-auto lg:overflow-hidden pl-2 lg:pl-0">
                    {/* Work Permit Analysis */}
                    <TechPanel 
                        title="作业票分析" 
                        className="flex-none h-48 cursor-pointer hover:border-blue-400 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                        onClick={() => navigate('/work-permit')}
                    >
                        <div className="flex items-end justify-between h-full px-1 pb-2 gap-1">
                            {workPermitStats.map((stat, index) => (
                                <div key={index} className="flex flex-col items-center flex-1 group h-full justify-end">
                                    <div className="w-full bg-blue-900/20 rounded-t relative overflow-hidden transition-all duration-500 hover:bg-blue-600/40" style={{ height: `${stat.value}%` }}>
                                        <div className="absolute bottom-0 left-0 right-0 top-0 bg-gradient-to-t from-blue-600 to-transparent opacity-60 group-hover:opacity-90"></div>
                                    </div>
                                    <div className="text-[10px] text-blue-400/80 mt-1 transform -rotate-45 origin-top-left translate-y-4 whitespace-nowrap">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </TechPanel>

                    {/* Legal Analysis */}
                    <TechPanel 
                        title="法律法规分析" 
                        className="flex-none cursor-pointer hover:border-blue-400 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                        onClick={() => navigate('/regulation')}
                    >
                        <div className="grid grid-cols-3 gap-2 text-center">
                            {['法律法规', '规章制度', '操作规程'].map((label, i) => (
                                <div key={i} className="bg-blue-950/20 p-2 rounded border border-blue-900/20">
                                    <div className="text-blue-400 text-[10px] mb-1">{label}</div>
                                    <div className="text-lg font-bold text-white font-mono">
                                        {[102, 246, 224][i]}
                                    </div>
                                    <div className="text-[10px] text-blue-500/60 mt-1">
                                        现行: {[91, 23, 14][i]}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TechPanel>

                    {/* Safety Education */}
                    <TechPanel 
                        title="安全教育培训" 
                        className="flex-none cursor-pointer hover:border-blue-400 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                        onClick={() => navigate('/training')}
                    >
                        <div className="flex items-center gap-4 mb-2">
                            <div className="relative w-16 h-16 flex-none">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="32" cy="32" r="28" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                                    <circle cx="32" cy="32" r="28" stroke="#3b82f6" strokeWidth="6" fill="transparent" strokeDasharray={28 * 2 * Math.PI} strokeDashoffset={28 * 2 * Math.PI * (1 - 0.92)} strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">92%</div>
                            </div>
                            <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-blue-900/20 px-2 py-1 rounded">
                                    <div className="text-blue-400">线上</div>
                                    <div className="text-green-400 font-mono">1722</div>
                                </div>
                                <div className="bg-blue-900/20 px-2 py-1 rounded">
                                    <div className="text-blue-400">线下</div>
                                    <div className="text-yellow-400 font-mono">997</div>
                                </div>
                            </div>
                        </div>
                    </TechPanel>

                    {/* AI Alarm Info */}
                    <TechPanel 
                        title="AI报警信息" 
                        className="flex-1 min-h-[200px] cursor-pointer hover:border-blue-400 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                        onClick={() => navigate('/video')}
                    >
                        <div className="h-full overflow-y-auto overflow-x-hidden dark-scrollbar" style={{ maxHeight: 'calc(100% - 0px)' }}>
                            <table className="w-full text-left text-xs">
                                <thead className="text-blue-400 sticky top-0 bg-[#0f172a]/95 z-10 backdrop-blur-sm">
                                    <tr>
                                        <th className="py-2 pl-2">位置</th>
                                        <th>类型</th>
                                        <th>原因</th>
                                        <th>时间</th>
                                    </tr>
                                </thead>
                                <tbody className="text-blue-100">
                                    {aiAlarmData.map((item, i) => (
                                        <tr key={i} className="border-b border-blue-900/20 hover:bg-blue-900/40 transition-colors">
                                            <td className="py-2 pl-2">{item.location}</td>
                                            <td>{item.type}</td>
                                            <td className="text-orange-400">{item.reason}</td>
                                            <td className="opacity-60 font-mono">{item.time}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TechPanel>
                </div>
            </main>
        </div>
    );
}

// Enhanced Tech Panel Component
function TechPanel({ title, children, className = '', onClick }) {
    return (
        <div 
            className={`bg-[#0f172a]/60 border border-blue-500/30 rounded-xl p-4 flex flex-col relative overflow-hidden backdrop-blur-md shadow-lg ${className}`}
            onClick={onClick}
        >
            {/* Glowing Corner Accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-400 rounded-tl-lg shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-400 rounded-tr-lg shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-400 rounded-bl-lg shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-400 rounded-br-lg shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
            
            {/* Title Bar */}
            <div className="flex items-center justify-between mb-4 border-b border-blue-500/20 pb-2 relative">
                <h3 className="text-blue-100 font-bold text-base flex items-center gap-2 tracking-wide">
                    <i className="fas fa-caret-right text-blue-500"></i>
                    {title}
                </h3>
                <div className="flex gap-1">
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-blue-500/50 rounded-full"></div>
                    <div className="w-1 h-1 bg-blue-500/30 rounded-full"></div>
                </div>
                <div className="absolute bottom-0 left-0 w-1/3 h-[1px] bg-gradient-to-r from-blue-500 to-transparent"></div>
            </div>
            
            <div className="flex-1 overflow-hidden relative">
                {children}
            </div>
        </div>
    );
}

// System Module Component
function SystemModule({ title, icon, color, onClick }) {
    return (
        <div 
            onClick={onClick}
            className="group relative bg-[#0f172a]/80 border border-blue-500/30 rounded-xl p-4 cursor-pointer hover:border-blue-400 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] backdrop-blur-md overflow-hidden"
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
            <div className="relative flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/40 transition-colors">
                    <i className={`fas ${icon} text-2xl text-blue-400 group-hover:text-blue-300 group-hover:scale-110 transition-all`}></i>
                </div>
                <span className="text-blue-100 font-medium text-sm group-hover:text-white transition-colors">{title}</span>
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <i className="fas fa-arrow-right text-blue-400 text-xs"></i>
            </div>
        </div>
    );
}

// Circle Progress Component
function CircleProgress({ percentage, label, color }) {
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex flex-col items-center group">
            <div className="relative w-16 h-16 transition-transform group-hover:scale-110">
                <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]">
                    <circle cx="32" cy="32" r={radius} stroke="#1e293b" strokeWidth="4" fill="transparent" />
                    <circle 
                        cx="32" 
                        cy="32" 
                        r={radius} 
                        stroke="currentColor" 
                        strokeWidth="4" 
                        fill="transparent" 
                        strokeDasharray={circumference} 
                        strokeDashoffset={offset} 
                        className={color}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                    {percentage}%
                </div>
            </div>
            <div className="text-xs text-blue-400 mt-1 font-medium">{label}</div>
        </div>
    );
}
