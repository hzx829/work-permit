import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadPermits } from '../utils/api';
// import ThreeMap from '../components/ThreeMap';

export default function DigitalCockpit() {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [workPermitStats, setWorkPermitStats] = useState([]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // 加载作业票统计数据
    useEffect(() => {
        async function fetchWorkPermitStats() {
            try {
                const permits = await loadPermits('', '');
                console.log('数字驾驶舱 - 加载的作业票数据:', permits);
                
                // API 直接返回数组，不是 {success, data} 格式
                if (Array.isArray(permits) && permits.length > 0) {
                    // 按作业类型统计
                    const typeCount = {};
                    permits.forEach(permit => {
                        const type = permit.type || '其他';
                        console.log('作业票类型:', type);
                        typeCount[type] = (typeCount[type] || 0) + 1;
                    });
                    
                    console.log('类型统计:', typeCount);
                    
                    // 转换为显示格式 - 注意这里要匹配数据库中的实际值
                    const stats = [
                        { label: '动火', value: typeCount['动火作业'] || typeCount['动火'] || 0 },
                        { label: '临电', value: typeCount['临时用电作业'] || typeCount['临时用电'] || 0 },
                        { label: '受限', value: typeCount['受限空间作业'] || typeCount['受限空间'] || 0 },
                        { label: '高处', value: typeCount['高处作业'] || 0 },
                        { label: '盲板', value: typeCount['盲板抽堵作业'] || typeCount['盲板抽堵'] || 0 },
                        { label: '动土', value: typeCount['动土作业'] || typeCount['动土'] || 0 },
                        { label: '吊装', value: typeCount['吊装作业'] || typeCount['吊装'] || 0 },
                        { label: '断路', value: typeCount['断路作业'] || typeCount['断路'] || 0 },
                    ];
                    console.log('最终统计数据:', stats);
                    setWorkPermitStats(stats);
                } else {
                    console.log('没有作业票数据或数据格式错误');
                    // 如果加载失败，使用默认值
                    setWorkPermitStats([
                        { label: '动火', value: 0 },
                        { label: '临电', value: 0 },
                        { label: '受限', value: 0 },
                        { label: '高处', value: 0 },
                        { label: '盲板', value: 0 },
                        { label: '动土', value: 0 },
                        { label: '吊装', value: 0 },
                        { label: '断路', value: 0 },
                    ]);
                }
            } catch (error) {
                console.error('Failed to load work permit stats:', error);
                // 出错时使用默认值
                setWorkPermitStats([
                    { label: '动火', value: 0 },
                    { label: '临电', value: 0 },
                    { label: '受限', value: 0 },
                    { label: '高处', value: 0 },
                    { label: '盲板', value: 0 },
                    { label: '动土', value: 0 },
                    { label: '吊装', value: 0 },
                    { label: '断路', value: 0 },
                ]);
            }
        }
        fetchWorkPermitStats();
    }, []);

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const week = weekDays[date.getDay()];
        return `${year}-${month}-${day} ${week}`;
    };

    // Mock Data - 数字驾驶舱6大模块数据
    const weatherData = {
        condition: '多云',
        temp: 24,
        windSpeed: '3级',
        windDirection: '东北风',
        humidity: 65
    };

    const safetyKnowledge = [
        { title: '正确佩戴安全帽', content: '安全帽必须正确佩戴，系好下颚带，避免头部受伤' },
        { title: '高处作业注意事项', content: '高处作业必须系好安全带，检查作业平台稳固性' },
        { title: '动火作业安全规程', content: '动火作业前清理易燃物，配备灭火器，设置监护人' },
        { title: '受限空间作业要求', content: '进入受限空间前必须检测气体，保持通风，设专人监护' },
    ];

    const safetyDynamics = [
        { type: '安全员活动', officer: '张三', action: '化工1#车间安全检查', time: '14:30', status: '已完成' },
        { type: '应急事件', event: '化工2#车间设备故障', level: '一般', time: '13:45', status: '已处置' },
        { type: '安全员活动', officer: '李四', action: '消防设施专项检查', time: '12:20', status: '进行中' },
        { type: '应急事件', event: '仓库区物料泄漏演练', level: '演练', time: '11:30', status: '已完成' },
    ];

    const announcements = [
        { type: '检查通知', title: '关于开展本周安全大检查的通知', dept: '安全部', time: '12-06 09:00' },
        { type: '培训公告', title: '新员工安全教育培训安排', dept: '安全部', time: '12-05 14:30' },
        { type: '检查通知', title: '消防设施维护检查计划', dept: '安全部', time: '12-04 10:15' },
        { type: '培训公告', title: '特种作业人员复训通知', dept: '技术部', time: '12-03 16:20' },
    ];

    return (
        <div className="h-screen w-screen bg-[#020617] text-white font-sans overflow-hidden relative flex flex-col">
            {/* Full Screen Background Map */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/work-permit-background.png" 
                    alt="Background" 
                    className="w-full h-full object-cover opacity-80"
                />
            </div>

            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-[#020617]/60 to-[#020617]/80 pointer-events-none z-0"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-0"></div>

            {/* Header */}
            <header className="relative h-20 flex-none flex items-center justify-between px-8 bg-gradient-to-b from-[#0f172a]/90 to-transparent border-b border-blue-500/20 z-50 backdrop-blur-sm">
                <div className="text-blue-200 font-mono text-2xl tracking-wider font-bold">{formatDate(currentTime)}</div>
                
                <div className="absolute left-1/2 transform -translate-x-1/2 top-0 h-full flex items-center">
                    <div className="relative px-16 py-3">
                        <div className="absolute inset-0 bg-blue-500/10 transform -skew-x-12 border-b border-blue-500/50"></div>
                        <h1 className="relative text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-blue-200 tracking-[0.2em] drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]">
                            安全生产管控平台
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate('/comprehensive')}
                        className="px-6 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-blue-100 rounded-full text-lg transition-all duration-300 flex items-center gap-2 backdrop-blur-sm group font-bold"
                    >
                        <span>管理中心</span>
                        <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                    </button>
                </div>
            </header>

            {/* Main Content Grid */}
            <main className="flex-1 p-4 grid grid-cols-12 gap-4 min-h-0 relative z-10">
                
                {/* Left Column - 法律法规 + 安全动态 + 通知公告 */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 h-full overflow-y-auto lg:overflow-hidden pr-2 lg:pr-0">
                    {/* 法律法规 */}
                    <TechPanel 
                        title="法律法规" 
                        className="flex-none cursor-pointer hover:border-blue-400 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                        onClick={() => navigate('/regulation')}
                    >
                        <div className="grid grid-cols-3 gap-4 text-center">
                            {['法律法规', '规章制度', '操作规程'].map((label, i) => (
                                <div key={i} className="bg-blue-950/40 p-4 rounded-lg border border-blue-900/40 hover:border-blue-700/60 transition-colors">
                                    <div className="text-blue-300 text-sm font-bold mb-2">{label}</div>
                                    <div className="text-3xl font-bold text-white font-mono mb-1">
                                        {[102, 246, 224][i]}
                                    </div>
                                    <div className="text-xs text-blue-400 font-medium">
                                        现行: {[91, 223, 214][i]}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TechPanel>

                    {/* 安全动态 */}
                    <TechPanel 
                        title="安全动态" 
                        className="flex-1 min-h-[200px]"
                    >
                        <div className="h-full overflow-y-auto overflow-x-hidden dark-scrollbar">
                            <div className="space-y-3">
                                {safetyDynamics.map((item, i) => (
                                    <div key={i} className="bg-blue-950/40 p-3 rounded-lg border border-blue-900/40 hover:bg-blue-900/50 transition-colors cursor-pointer"
                                        onClick={() => navigate(item.type === '安全员活动' ? '/safety-officer' : '/emergency')}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                                                        item.type === '安全员活动' ? 'bg-blue-600/40 text-blue-200' : 'bg-orange-600/40 text-orange-200'
                                                    }`}>
                                                        {item.type}
                                                    </span>
                                                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                                                        item.status === '已完成' || item.status === '已处置' ? 'bg-green-600/40 text-green-200' : 'bg-yellow-600/40 text-yellow-200'
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                                <div className="text-base text-white font-medium leading-snug">
                                                    {item.officer && <span className="text-blue-300">{item.officer}：</span>}
                                                    {item.action || item.event}
                                                    {item.level && <span className="text-orange-300 ml-1">【{item.level}】</span>}
                                                </div>
                                            </div>
                                            <div className="text-sm text-blue-300 font-mono whitespace-nowrap">{item.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TechPanel>

                    {/* 通知公告 */}
                    <TechPanel 
                        title="通知公告" 
                        className="flex-1 min-h-[200px]"
                    >
                        <div className="h-full overflow-y-auto overflow-x-hidden dark-scrollbar">
                            <div className="space-y-3">
                                {announcements.map((item, i) => (
                                    <div key={i} className="bg-blue-950/40 p-3 rounded-lg border border-blue-900/40 hover:bg-blue-900/50 transition-colors cursor-pointer"
                                        onClick={() => navigate(item.type === '检查通知' ? '/daily-inspection' : '/training')}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className={`px-2 py-1 text-xs font-bold rounded whitespace-nowrap ${
                                                item.type === '检查通知' ? 'bg-orange-600/40 text-orange-200' : 'bg-green-600/40 text-green-200'
                                            }`}>
                                                {item.type}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-base text-white font-medium truncate">{item.title}</div>
                                                <div className="text-sm text-blue-300 mt-1 flex items-center justify-between">
                                                    <span>{item.dept}</span>
                                                    <span className="font-mono">{item.time}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TechPanel>
                </div>

                {/* Center Column */}
                <div className="col-span-12 lg:col-span-6 flex flex-col gap-4 h-full relative pointer-events-none">
                    {/* 3D Map Area */}
                    <div className="flex-1 relative flex items-center justify-center">
                        
                        {/* Floating Helmet */}
                        <img 
                            src="/work-permit-safety-helmet.png" 
                            alt="Safety Helmet" 
                            className="helmet-img relative z-10 drop-shadow-[0_0_50px_rgba(59,130,246,0.6)] scale-125"
                        />
                        
                        {/* Safe Days Counter */}
                        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center justify-center z-20 pointer-events-none">
                            <div className="text-blue-200 font-bold text-xl mb-2 tracking-wider drop-shadow-md">安全运行天数(天)</div>
                            
                            <div className="relative flex items-center justify-center px-16 py-4">
                                {/* Background Bar */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-900/60 to-transparent"></div>
                                <div className="absolute inset-x-8 top-0 bottom-0 border-y border-blue-500/20 bg-gradient-to-r from-transparent via-blue-950/80 to-transparent"></div>

                                {/* Left Decoration */}
                                <div className="absolute left-0 w-6 h-12 border-l-4 border-blue-500 rounded-l-full shadow-[-4px_0_10px_rgba(59,130,246,0.6)]"></div>
                                <div className="absolute left-3 w-3 h-10 border-l-2 border-blue-400/50 rounded-l-full"></div>

                                {/* Numbers */}
                                <div className="relative z-10 text-6xl font-bold text-white tracking-[0.5em] font-mono drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] pl-[0.5em]">
                                    1024
                                </div>

                                {/* Right Decoration */}
                                <div className="absolute right-0 w-6 h-12 border-r-4 border-blue-500 rounded-r-full shadow-[4px_0_10px_rgba(59,130,246,0.6)]"></div>
                                <div className="absolute right-3 w-3 h-10 border-r-2 border-blue-400/50 rounded-r-full"></div>
                                
                                {/* Bottom Accent */}
                                <div className="absolute bottom-0 w-20 h-[3px] bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,1)]"></div>
                            </div>
                        </div>

                    </div>

                </div>

                {/* Right Column - 作业票分析 + 安全小知识 */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 h-full overflow-y-auto lg:overflow-hidden pl-2 lg:pl-0">
                    {/* Weather Module */}
                    <TechPanel 
                        title="气象监测" 
                        className="flex-none cursor-pointer hover:border-blue-400 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                        onClick={() => navigate('/risk')}
                    >
                        <div className="flex items-center justify-between px-6 py-4">
                            <div className="flex flex-col items-center">
                                <i className="fas fa-cloud text-5xl text-blue-400 mb-3"></i>
                                <span className="text-4xl font-bold text-white">{weatherData.temp}°C</span>
                            </div>
                            <div className="flex flex-col gap-3 text-base text-blue-200 font-medium">
                                <div className="flex items-center gap-3">
                                    <span className="text-blue-400 w-12 font-bold">天气</span>
                                    <span>{weatherData.condition}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-blue-400 w-12 font-bold">风向</span>
                                    <span>{weatherData.windDirection} {weatherData.windSpeed}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-blue-400 w-12 font-bold">湿度</span>
                                    <span>{weatherData.humidity}%</span>
                                </div>
                            </div>
                        </div>
                    </TechPanel>

                    {/* Work Permit Analysis */}
                    <TechPanel 
                        title="作业票分析" 
                        className="flex-none cursor-pointer hover:border-blue-400 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                        onClick={() => navigate('/work-permit')}
                    >
                        <div className="grid grid-cols-4 gap-3">
                            {workPermitStats.map((stat, index) => (
                                <div key={index} className="bg-blue-950/40 p-3 rounded-lg border border-blue-800/40 flex flex-col items-center justify-center text-center group hover:bg-blue-900/50 transition-colors">
                                    <div className="text-2xl font-bold text-white font-mono mb-1">{stat.value}</div>
                                    <div className="text-xs text-blue-300 font-bold">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </TechPanel>

                    {/* Safety Knowledge */}
                    <TechPanel 
                        title="安全小知识" 
                        className="flex-1 min-h-[400px] cursor-pointer hover:border-blue-400 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                        onClick={() => navigate('/training')}
                    >
                        <div className="h-full overflow-y-auto overflow-x-hidden dark-scrollbar">
                            <div className="space-y-4">
                                {safetyKnowledge.map((tip, i) => (
                                    <div key={i} className="bg-gradient-to-br from-blue-950/50 to-blue-900/30 p-4 rounded-lg border border-blue-800/40 hover:border-blue-600/60 transition-all hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                        <div className="flex items-start gap-3 mb-2">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/40 flex items-center justify-center">
                                                <i className="fas fa-lightbulb text-yellow-400 text-sm"></i>
                                            </div>
                                            <div className="text-base font-bold text-blue-100 pt-1">{tip.title}</div>
                                        </div>
                                        <div className="text-sm text-blue-200 leading-relaxed pl-11 font-medium">
                                            {tip.content}
                                        </div>
                                        <div className="flex items-center gap-3 mt-3 pl-11">
                                            <span className="px-2 py-1 text-xs font-bold rounded bg-blue-700/40 text-blue-200">
                                                {tip.category || '安全常识'}
                                            </span>
                                            <span className="text-xs text-blue-400 font-medium">
                                                阅读: {tip.views || '99+'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
            className={`bg-[#0f172a]/60 border border-blue-500/30 rounded-xl p-6 flex flex-col relative overflow-hidden backdrop-blur-md shadow-lg ${className}`}
            onClick={onClick}
        >
            {/* Glowing Corner Accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400 rounded-tl-lg shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400 rounded-tr-lg shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400 rounded-bl-lg shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400 rounded-br-lg shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
            
            {/* Title Bar */}
            <div className="flex items-center justify-between mb-6 border-b border-blue-500/20 pb-3 relative">
                <h3 className="text-blue-100 font-bold text-xl flex items-center gap-3 tracking-wide">
                    <i className="fas fa-caret-right text-blue-500 text-lg"></i>
                    {title}
                </h3>
                <div className="flex gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500/50 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500/30 rounded-full"></div>
                </div>
                <div className="absolute bottom-0 left-0 w-1/3 h-[2px] bg-gradient-to-r from-blue-500 to-transparent"></div>
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
