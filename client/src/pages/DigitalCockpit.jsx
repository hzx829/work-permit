import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadPermits } from '../utils/api';
const SatelliteGlobe = lazy(() => import('../components/SatelliteGlobe'));

class MapLoadBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { failed: false };
    }

    static getDerivedStateFromError() {
        return { failed: true };
    }

    render() {
        if (this.state.failed) {
            return <div className="h-full w-full rounded-xl border border-cyan-300/55 bg-[url('/sichuan-satellite-texture.jpg')] bg-cover bg-center" />;
        }
        return this.props.children;
    }
}

export default function DigitalCockpit() {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [workPermitStats, setWorkPermitStats] = useState([]);
    const safeDays = Math.max(1, Math.floor((currentTime.getTime() - new Date('2026-04-25T00:00:00').getTime()) / 86400000));
    const [weatherData, setWeatherData] = useState({
        condition: '多云', temp: 24, windSpeed: '3级', windDirection: '东北风', humidity: 65
    });
    const [regulationFiles, setRegulationFiles] = useState([]);
    const [safetyDynamics, setSafetyDynamics] = useState([
        { type: '安全员活动', officer: '张三', action: '化工1#车间安全检查', time: '14:30', status: '已完成' },
        { type: '应急事件', event: '化工2#车间设备故障', level: '一般', time: '13:45', status: '已处置' },
        { type: '安全员活动', officer: '李四', action: '消防设施专项检查', time: '12:20', status: '进行中' },
        { type: '应急事件', event: '仓库区物料泄漏演练', level: '演练', time: '11:30', status: '已完成' },
    ]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setWeatherData((current) => ({
                ...current,
                temp: Number((current.temp + (Math.random() - 0.48) * 0.4).toFixed(1)),
                humidity: Math.max(45, Math.min(85, Math.round(current.humidity + (Math.random() - 0.5) * 2))),
                windSpeed: `${Math.max(1, Math.min(5, Math.round(3 + (Math.random() - 0.5) * 2)))}级`
            }));
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    const handleRegulationUpload = (event) => {
        const selectedFiles = Array.from(event.target.files || []);
        if (!selectedFiles.length) return;
        const now = new Date();
        const uploaded = selectedFiles.map((file, index) => ({
            id: `${file.name}-${file.lastModified}-${index}`,
            name: file.name,
            type: file.type || '文件',
            time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        }));
        setRegulationFiles((current) => [...uploaded, ...current]);
        setSafetyDynamics((current) => [
            ...uploaded.map((file) => ({ type: '法规更新', fileName: file.name, time: file.time, status: '已上传' })),
            ...current
        ]);
        event.target.value = '';
    };

    // 加载作业票统计数据
    useEffect(() => {
        async function fetchWorkPermitStats() {
            try {
                // 获取所有作业票（设置较大的 pageSize 以获取全部数据用于统计）
                const response = await loadPermits('', '', 1, 1000);
                console.log('数字驾驶舱 - 加载的作业票数据:', response);
                
                // API 返回的是分页格式: { data: [...], total, page, pageSize, totalPages }
                const permits = response?.data || [];
                
                if (permits.length > 0) {
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
                        { label: '动火作业', value: typeCount['动火作业'] || typeCount['动火'] || 0 },
                        { label: '临时用电作业', value: typeCount['临时用电作业'] || typeCount['临时用电'] || 0 },
                        { label: '受限空间作业', value: typeCount['受限空间作业'] || typeCount['受限空间'] || 0 },
                        { label: '高处作业', value: typeCount['高处作业'] || 0 },
                        { label: '盲板抽堵作业', value: typeCount['盲板抽堵作业'] || typeCount['盲板抽堵'] || 0 },
                        { label: '动土作业', value: typeCount['动土作业'] || typeCount['动土'] || 0 },
                        { label: '吊装作业', value: typeCount['吊装作业'] || typeCount['吊装'] || 0 },
                        { label: '断路作业', value: typeCount['断路作业'] || typeCount['断路'] || 0 },
                    ];
                    console.log('最终统计数据:', stats);
                    setWorkPermitStats(stats);
                } else {
                    console.log('没有作业票数据');
                    // 如果没有数据，使用默认值
                    setWorkPermitStats([
                        { label: '动火作业', value: 0 },
                        { label: '临时用电作业', value: 0 },
                        { label: '受限空间作业', value: 0 },
                        { label: '高处作业', value: 0 },
                        { label: '盲板抽堵作业', value: 0 },
                        { label: '动土作业', value: 0 },
                        { label: '吊装作业', value: 0 },
                        { label: '断路作业', value: 0 },
                    ]);
                }
            } catch (error) {
                console.error('Failed to load work permit stats:', error);
                // 出错时使用默认值
                setWorkPermitStats([
                    { label: '动火作业', value: 0 },
                    { label: '临时用电作业', value: 0 },
                    { label: '受限空间作业', value: 0 },
                    { label: '高处作业', value: 0 },
                    { label: '盲板抽堵作业', value: 0 },
                    { label: '动土作业', value: 0 },
                    { label: '吊装作业', value: 0 },
                    { label: '断路作业', value: 0 },
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
    const safetyKnowledge = [
        { title: '正确佩戴安全帽', content: '安全帽必须正确佩戴，系好下颚带，避免头部受伤' },
        { title: '高处作业注意事项', content: '高处作业必须系好安全带，检查作业平台稳固性' },
        { title: '动火作业安全规程', content: '动火作业前清理易燃物，配备灭火器，设置监护人' },
        { title: '受限空间作业要求', content: '进入受限空间前必须检测气体，保持通风，设专人监护' },
    ];

    const announcements = [
        { type: '检查通知', title: '关于开展本周安全大检查的通知', dept: '安全部', time: '12-06 09:00' },
        { type: '培训公告', title: '新员工安全教育培训安排', dept: '安全部', time: '12-05 14:30' },
        { type: '检查通知', title: '消防设施维护检查计划', dept: '安全部', time: '12-04 10:15' },
        { type: '培训公告', title: '特种作业人员复训通知', dept: '技术部', time: '12-03 16:20' },
    ];

    return (
        <div className="h-screen w-screen bg-[#020617] text-white font-sans overflow-hidden relative flex flex-col">
            {/* CSS-only backdrop: avoids loading the previous 7 MB globe image. */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_50%_44%,rgba(8,94,150,.42),transparent_38%),linear-gradient(135deg,#020617_0%,#062452_50%,#020617_100%)]" />
            <div className="absolute inset-0 z-0 opacity-20 [background-image:linear-gradient(rgba(56,189,248,.24)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,.24)_1px,transparent_1px)] [background-size:56px_56px]" />

            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-[#020617]/60 to-[#020617]/80 pointer-events-none z-0"></div>

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
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 h-full overflow-y-auto lg:overflow-hidden pr-2 lg:pr-0">
                    {/* 法律法规 */}
                    <TechPanel 
                        title="法律法规" 
                        className="flex-none h-[286px] hover:border-blue-400 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                    >
                        <div className="grid grid-cols-3 gap-2 text-center items-center">
                            {['法律法规', '规章制度', '操作规程'].map((label, i) => (
                                <button type="button" key={i} onClick={() => navigate('/regulation')} className="bg-blue-950/40 p-2 rounded-lg border border-blue-900/40 hover:border-blue-700/60 transition-colors">
                                    <div className="text-blue-300 text-xs font-bold mb-1 whitespace-nowrap">{label}</div>
                                    <div className="text-2xl font-bold text-white font-mono mb-0.5">
                                        {[102, 246, 224][i] + (i === 0 ? regulationFiles.length : 0)}
                                    </div>
                                    <div className="text-[10px] text-blue-400 font-medium whitespace-nowrap">
                                        现行: {[91, 223, 214][i]}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-cyan-400/60 bg-cyan-500/10 px-2 py-1.5 text-xs font-medium text-cyan-100 hover:bg-cyan-500/20">
                            <i className="fas fa-cloud-upload-alt" /> 上传标准文件
                            <input type="file" className="hidden" multiple accept="image/*,.doc,.docx,.pdf" onChange={handleRegulationUpload} />
                        </label>
                        <div className="mt-1 truncate text-[10px] text-blue-300">
                            {regulationFiles.length ? `最新：${regulationFiles[0].name}` : '支持图片、Word、PDF'}
                        </div>
                    </TechPanel>

                    {/* 安全动态 */}
                    <TechPanel 
                        title="安全动态" 
                        className="flex-none h-[320px]"
                    >
                        <AutoScrollList>
                            {safetyDynamics.map((item, i) => (
                                <div key={i} className="bg-blue-950/40 p-3 rounded-lg border border-blue-900/40 hover:bg-blue-900/50 transition-colors cursor-pointer"
                                    onClick={() => navigate(item.type === '安全员活动' ? '/safety-officer' : item.type === '法规更新' ? '/regulation' : '/emergency')}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-1 text-xs font-bold rounded ${
                                                    item.type === '安全员活动' ? 'bg-blue-600/40 text-blue-200' : item.type === '法规更新' ? 'bg-cyan-600/40 text-cyan-100' : 'bg-orange-600/40 text-orange-200'
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
                                                {item.action || item.event || item.fileName}
                                                {item.level && <span className="text-orange-300 ml-1">【{item.level}】</span>}
                                            </div>
                                        </div>
                                        <div className="text-sm text-blue-300 font-mono whitespace-nowrap">{item.time}</div>
                                    </div>
                                </div>
                            ))}
                        </AutoScrollList>
                    </TechPanel>

                    {/* 通知公告 */}
                    <TechPanel 
                        title="通知公告" 
                        className="flex-1 min-h-0"
                    >
                        <AutoScrollList>
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
                        </AutoScrollList>
                    </TechPanel>
                </div>

                {/* Center Column */}
                <div className="col-span-12 lg:col-span-6 flex flex-col gap-3 h-full min-h-0 relative">
                    <div className="flex-1 min-h-0 relative">
                        <MapLoadBoundary>
                            <Suspense fallback={<div className="h-full w-full rounded-xl border border-cyan-300/55 bg-[url('/sichuan-satellite-texture.jpg')] bg-cover bg-center shadow-[0_0_30px_rgba(14,165,233,.3)]" />}>
                                <SatelliteGlobe />
                            </Suspense>
                        </MapLoadBoundary>
                    </div>
                    <div className="grid flex-none grid-cols-3 gap-2" aria-label="驾驶舱核心指标">
                        <div className="rounded border border-cyan-400/35 bg-slate-950/75 px-3 py-2 text-center">
                            <div className="text-[11px] tracking-wider text-cyan-200">安全运行天数</div>
                            <div className="font-mono text-2xl font-bold text-white">{String(safeDays).padStart(3, '0')}</div>
                        </div>
                        <div className="rounded border border-cyan-400/35 bg-slate-950/75 px-3 py-2 text-center">
                            <div className="text-[11px] tracking-wider text-cyan-200">四川监测点</div>
                            <div className="font-mono text-2xl font-bold text-white">04</div>
                        </div>
                        <div className="rounded border border-cyan-400/35 bg-slate-950/75 px-3 py-2 text-center">
                            <div className="text-[11px] tracking-wider text-cyan-200">风险告警</div>
                            <div className="font-mono text-2xl font-bold text-amber-300">02</div>
                        </div>
                    </div>
                </div>

                {/* Right Column - 作业票分析 + 安全小知识 */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 h-full overflow-y-auto lg:overflow-hidden pl-2 lg:pl-0">
                    {/* Weather Module */}
                    <TechPanel 
                        title="气象监测" 
                        className="flex-none h-[110px] cursor-pointer hover:border-blue-400 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                        onClick={() => navigate('/risk')}
                        compact={true}
                    >
                        <div className="flex items-center justify-between px-2 h-full">
                            <div className="flex items-center gap-2">
                                <i className="fas fa-cloud text-3xl text-blue-400"></i>
                                <span className="text-2xl font-bold text-white">{weatherData.temp}°C</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-blue-200 font-medium">
                                <div className="flex items-center gap-2">
                                    <span className="text-blue-400 font-bold">天气</span>
                                    <span>{weatherData.condition}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-blue-400 font-bold">湿度</span>
                                    <span>{weatherData.humidity}%</span>
                                </div>
                                <div className="flex items-center gap-2 col-span-2">
                                    <span className="text-blue-400 font-bold">风向</span>
                                    <span>{weatherData.windDirection} {weatherData.windSpeed}</span>
                                </div>
                            </div>
                        </div>
                    </TechPanel>

                    {/* Work Permit Analysis */}
                    <TechPanel 
                        title="作业票分析" 
                        className="flex-none h-[430px] cursor-pointer hover:border-blue-400 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                        onClick={() => navigate('/work-permit')}
                        compact={true}
                    >
                        <div className="flex flex-col h-full justify-between py-1 px-1 overflow-hidden">
                            {workPermitStats.map((stat, index) => (
                                <div key={index} className="relative flex items-center justify-between px-4 py-1 rounded bg-gradient-to-r from-blue-900/30 to-transparent border-l-4 border-blue-600 hover:border-yellow-400 hover:from-blue-800/40 transition-all group">
                                    <div className="text-lg text-cyan-100 font-bold tracking-wider group-hover:text-white transition-colors">{stat.label}</div>
                                    <div className="text-3xl font-bold text-yellow-400 font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform">{stat.value}</div>
                                </div>
                            ))}
                        </div>
                    </TechPanel>

                    {/* Safety Knowledge */}
                    <TechPanel 
                        title="安全小知识" 
                        className="flex-1 min-h-0 cursor-pointer hover:border-blue-400 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                        onClick={() => navigate('/training')}
                    >
                        <AutoScrollList>
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
                        </AutoScrollList>
                    </TechPanel>
                </div>
            </main>
        </div>
    );
}

// Auto Scroll List Component
function AutoScrollList({ children, className = '', speed = 0.2 }) {
    const scrollRef = useRef(null);
    const scrollTopRef = useRef(0);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;
        
        // Sync ref with actual scroll position on mount/update
        scrollTopRef.current = scrollContainer.scrollTop;

        let animationFrameId;
        
        const scroll = () => {
            if (!isHovered && scrollContainer) {
                scrollTopRef.current += speed;
                
                // When scrolled halfway (end of first set), reset to 0
                if (scrollTopRef.current >= scrollContainer.scrollHeight / 2) {
                    scrollTopRef.current = 0;
                }
                
                scrollContainer.scrollTop = scrollTopRef.current;
            }
            animationFrameId = requestAnimationFrame(scroll);
        };

        animationFrameId = requestAnimationFrame(scroll);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isHovered, speed]);

    return (
        <div 
            ref={scrollRef}
            className={`h-full overflow-hidden ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="space-y-3 pb-3">
                {children}
            </div>
            <div className="space-y-3">
                {children}
            </div>
        </div>
    );
}

// Enhanced Tech Panel Component
function TechPanel({ title, children, className = '', onClick, compact = false }) {
    return (
        <div 
            className={`bg-[#0f172a]/60 border border-blue-500/30 rounded-xl ${compact ? 'p-3' : 'p-6'} flex flex-col relative overflow-hidden backdrop-blur-md shadow-lg ${className}`}
            onClick={onClick}
        >
            {/* Glowing Corner Accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400 rounded-tl-lg shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400 rounded-tr-lg shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400 rounded-bl-lg shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400 rounded-br-lg shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
            
            {/* Title Bar */}
            <div className={`flex items-center justify-between ${compact ? 'mb-2 pb-1' : 'mb-6 pb-3'} border-b border-blue-500/20 relative`}>
                <h3 className={`text-blue-100 font-bold ${compact ? 'text-lg' : 'text-xl'} flex items-center gap-3 tracking-wide`}>
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
