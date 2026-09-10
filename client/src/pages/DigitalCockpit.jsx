import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    createEmergencyEvent,
    loadEmergencyEvents,
    loadEmergencyMonitoring,
    loadCurrentWeather,
    setEmergencySimulation,
    loadPermits,
    loadRegulations,
    loadWatchSnapshot,
} from '../utils/api';
import { playEmergencyAlarm, stopEmergencyAlarm } from '../utils/emergencyAlarm';
const RealtimeWatchMap = lazy(() => import('../components/RealtimeWatchMap'));
const PLATFORM_RESEARCH_STARTED_AT = Date.UTC(2025, 10, 27);
const INITIAL_SAFE_DAYS = 138;
const COCKPIT_PERMIT_COUNTER_STARTED_AT = '2026-09-10 03:26:49';

const COCKPIT_PERMIT_BASELINES = [
    { label: '动火作业', value: 18, aliases: ['动火作业', '动火'] },
    { label: '临时用电作业', value: 12, aliases: ['临时用电作业', '临时用电'] },
    { label: '受限空间作业', value: 43, aliases: ['受限空间作业', '受限空间'] },
    { label: '高处作业', value: 16, aliases: ['高处作业'] },
    { label: '盲板抽堵作业', value: 11, aliases: ['盲板抽堵作业', '盲板抽堵'] },
    { label: '动土作业', value: 13, aliases: ['动土作业', '动土'] },
    { label: '吊装作业', value: 14, aliases: ['吊装作业', '吊装'] },
    { label: '断路作业', value: 10, aliases: ['断路作业', '断路'] },
];

const buildCockpitPermitStats = (permits = []) => COCKPIT_PERMIT_BASELINES.map((baseline) => ({
    label: baseline.label,
    value: baseline.value + permits.filter((permit) => (
        baseline.aliases.includes(permit.type)
        && String(permit.created_at || '') > COCKPIT_PERMIT_COUNTER_STARTED_AT
    )).length,
}));

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
    const [watchSnapshot, setWatchSnapshot] = useState({
        configured: true,
        watches: [],
        stats: { total: 0, online: 0, offline: 0, located: 0, withHealthData: 0, alerts: 0 },
        updatedAt: null,
    });
    const [watchLoading, setWatchLoading] = useState(true);
    const [watchError, setWatchError] = useState('');
    const [selectedWatchId, setSelectedWatchId] = useState('');
    const [emergencyAlarm, setEmergencyAlarm] = useState(null);
    const [activeEmergencyEvents, setActiveEmergencyEvents] = useState([]);
    const [alarmSubmitting, setAlarmSubmitting] = useState(false);
    const [alarmError, setAlarmError] = useState('');
    const [simulation, setSimulation] = useState({ enabled: false, active: false });
    const [simulationBusy, setSimulationBusy] = useState(false);
    const today = Date.UTC(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate());
    const safeDays = INITIAL_SAFE_DAYS + Math.max(0, Math.floor((today - PLATFORM_RESEARCH_STARTED_AT) / 86400000));
    const [weatherData, setWeatherData] = useState({
        condition: '--', temperature: null, windLevel: null, windDirection: '--', humidity: null
    });
    const [weatherError, setWeatherError] = useState('');
    const [regulationData, setRegulationData] = useState({
        stats: { laws: 102, lawsActive: 91, regulations: 246, regulationsActive: 223, procedures: 224, proceduresActive: 214 },
        uploadedDocuments: []
    });
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
        let cancelled = false;
        const refreshEmergencyLinkage = async () => {
            try {
                const [monitoring, activeResult] = await Promise.all([
                    loadEmergencyMonitoring(),
                    loadEmergencyEvents('active'),
                ]);
                if (cancelled) return;
                setActiveEmergencyEvents(activeResult.events || []);
                setSimulation(monitoring.simulation || { enabled: false, active: false });
                if (monitoring.alarm) {
                    const ignoredKey = sessionStorage.getItem('ignored-emergency-alarm-key');
                    if (ignoredKey !== monitoring.alarm.alarmKey) setEmergencyAlarm(monitoring.alarm);
                }
            } catch (error) {
                console.error('Emergency linkage refresh failed:', error);
            }
        };
        refreshEmergencyLinkage();
        const timer = setInterval(refreshEmergencyLinkage, 15 * 1000);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, []);

    const submitAlarmDecision = async (alarmDecision, extra = {}) => {
        if (!emergencyAlarm || alarmSubmitting) return;
        if (alarmDecision === 'yes') stopEmergencyAlarm();
        setAlarmSubmitting(true);
        setAlarmError('');
        try {
            const event = await createEmergencyEvent({ ...emergencyAlarm, alarmDecision, ...extra });
            if (alarmDecision === 'yes') {
                sessionStorage.setItem('ignored-emergency-alarm-key', emergencyAlarm.alarmKey);
                navigate(`/emergency?event=${event.id}`);
                return;
            }
            sessionStorage.setItem('ignored-emergency-alarm-key', emergencyAlarm.alarmKey);
            setEmergencyAlarm(null);
        } catch (error) {
            setAlarmError(error.message || '报警处理失败');
        } finally {
            setAlarmSubmitting(false);
        }
    };

    const toggleEmergencySimulation = async () => {
        if (simulationBusy) return;
        setSimulationBusy(true);
        setAlarmError('');
        try {
            const next = await setEmergencySimulation(!simulation.active);
            setSimulation(next);
            const monitoring = await loadEmergencyMonitoring();
            setSimulation(monitoring.simulation || next);
            if (monitoring.alarm) {
                sessionStorage.removeItem('ignored-emergency-alarm-key');
                setEmergencyAlarm(monitoring.alarm);
            } else if (emergencyAlarm?.simulated) {
                setEmergencyAlarm(null);
            }
        } catch (error) {
            setAlarmError(error.message || '模拟开关更新失败');
        } finally {
            setSimulationBusy(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const refreshWatches = async () => {
            try {
                const snapshot = await loadWatchSnapshot();
                if (cancelled) return;
                setWatchSnapshot(snapshot);
                setWatchError(snapshot.configured ? '' : '后台尚未配置手表平台账号');
            } catch (error) {
                if (cancelled) return;
                setWatchError(error.message || '手表数据同步失败');
            } finally {
                if (!cancelled) setWatchLoading(false);
            }
        };

        refreshWatches();
        const timer = setInterval(refreshWatches, 30 * 1000);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, []);

    const selectedWatch = watchSnapshot.watches.find((watch) => watch.id === selectedWatchId)
        || watchSnapshot.watches.find((watch) => watch.online)
        || watchSnapshot.watches[0]
        || null;

    useEffect(() => {
        if (!watchSnapshot.watches.length) {
            setSelectedWatchId('');
            return;
        }
        if (!watchSnapshot.watches.some((watch) => watch.id === selectedWatchId)) {
            setSelectedWatchId(
                watchSnapshot.watches.find((watch) => watch.online)?.id
                || watchSnapshot.watches[0].id,
            );
        }
    }, [selectedWatchId, watchSnapshot.watches]);

    useEffect(() => {
        let cancelled = false;

        const refreshWeather = async () => {
            try {
                const weather = await loadCurrentWeather();
                if (cancelled) return;
                setWeatherData(weather);
                setWeatherError(weather.stale ? '显示最近一次同步数据' : '');
            } catch (error) {
                if (cancelled) return;
                setWeatherError(error.message || '实时气象数据同步失败');
            }
        };

        refreshWeather();
        const timer = setInterval(refreshWeather, 10 * 60 * 1000);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        loadRegulations().then((result) => {
            if (cancelled) return;
            setRegulationData(result);
            const updates = (result.uploadedDocuments || []).slice(0, 10).map((file) => ({
                type: '法规更新',
                fileName: file.name,
                time: new Date(file.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                status: '已同步'
            }));
            if (updates.length) setSafetyDynamics((current) => [...updates, ...current.filter((item) => item.type !== '法规更新')]);
        }).catch((error) => console.error('Regulation data refresh failed:', error));
        return () => { cancelled = true; };
    }, []);

    // 加载作业票统计数据
    useEffect(() => {
        let cancelled = false;

        async function fetchWorkPermitStats() {
            try {
                // 获取所有作业票（设置较大的 pageSize 以获取全部数据用于统计）
                const response = await loadPermits('', '', 1, 1000);
                // API 返回的是分页格式: { data: [...], total, page, pageSize, totalPages }
                const permits = response?.data || [];
                if (!cancelled) setWorkPermitStats(buildCockpitPermitStats(permits));
            } catch (error) {
                console.error('Failed to load work permit stats:', error);
                if (!cancelled) setWorkPermitStats(buildCockpitPermitStats());
            }
        }

        fetchWorkPermitStats();
        const timer = setInterval(fetchWorkPermitStats, 30 * 1000);
        window.addEventListener('focus', fetchWorkPermitStats);
        return () => {
            cancelled = true;
            clearInterval(timer);
            window.removeEventListener('focus', fetchWorkPermitStats);
        };
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
            {emergencyAlarm && (
                <EmergencyAlarmDialog
                    alarm={emergencyAlarm}
                    activeEvents={activeEmergencyEvents}
                    submitting={alarmSubmitting}
                    error={alarmError}
                    onDecision={submitAlarmDecision}
                    onStopSimulation={toggleEmergencySimulation}
                />
            )}
            {alarmError && !emergencyAlarm && <div className="absolute right-6 top-24 z-[90] border border-rose-400/50 bg-slate-950/95 px-4 py-3 text-sm text-rose-200 shadow-lg">{alarmError}</div>}
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
                    {simulation.enabled && (
                        <button
                            type="button"
                            onClick={toggleEmergencySimulation}
                            disabled={simulationBusy}
                            className={`flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-bold transition disabled:opacity-50 ${simulation.active ? 'border-rose-400 bg-rose-500/20 text-rose-100 shadow-[0_0_18px_rgba(244,63,94,.45)]' : 'border-amber-400/55 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20'}`}
                            aria-pressed={simulation.active}
                            title="仅用于测试应急联动流程"
                        >
                            <span className={`h-2.5 w-2.5 rounded-full ${simulation.active ? 'animate-pulse bg-rose-400' : 'bg-amber-300'}`} />
                            {simulationBusy ? '切换中...' : simulation.active ? '测试事故模拟中' : '启动事故模拟'}
                        </button>
                    )}
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
                        className="h-[150px] flex-none transition-all hover:border-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                        compact={true}
                    >
                        <div className="grid grid-cols-3 gap-2 text-center items-center">
                            {[
                                ['法律法规', regulationData.stats?.laws, regulationData.stats?.lawsActive],
                                ['规章制度', regulationData.stats?.regulations, regulationData.stats?.regulationsActive],
                                ['操作规程', regulationData.stats?.procedures, regulationData.stats?.proceduresActive]
                            ].map(([label, total, active], i) => (
                                <button type="button" key={i} onClick={() => navigate('/regulation')} className="rounded-lg border border-blue-900/40 bg-blue-950/40 px-1.5 py-2 transition-colors hover:border-blue-700/60">
                                    <div className="mb-0.5 whitespace-nowrap text-[11px] font-bold text-blue-300">{label}</div>
                                    <div className="mb-0.5 font-mono text-xl font-bold text-white">
                                        {total ?? 0}
                                    </div>
                                    <div className="whitespace-nowrap text-[9px] font-medium text-blue-400">
                                        现行: {active ?? 0}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </TechPanel>

                    {/* 安全动态 */}
                    <TechPanel 
                        title="安全动态" 
                        className="min-h-0 flex-1"
                        compact={true}
                    >
                        <AutoScrollList>
                            {safetyDynamics.map((item, i) => (
                                <div key={i} className="cursor-pointer rounded-lg border border-blue-900/40 bg-blue-950/40 p-2.5 transition-colors hover:bg-blue-900/50"
                                    onClick={() => navigate(item.type === '安全员活动' ? '/safety-officer' : item.type === '法规更新' ? '/regulation' : '/emergency')}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="mb-1.5 flex items-center gap-1.5">
                                                <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                                                    item.type === '安全员活动' ? 'bg-blue-600/40 text-blue-200' : item.type === '法规更新' ? 'bg-cyan-600/40 text-cyan-100' : 'bg-orange-600/40 text-orange-200'
                                                }`}>
                                                    {item.type}
                                                </span>
                                                <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                                                    item.status === '已完成' || item.status === '已处置' ? 'bg-green-600/40 text-green-200' : 'bg-yellow-600/40 text-yellow-200'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                            <div className="text-sm font-medium leading-snug text-white">
                                                {item.officer && <span className="text-blue-300">{item.officer}：</span>}
                                                {item.action || item.event || item.fileName}
                                                {item.level && <span className="text-orange-300 ml-1">【{item.level}】</span>}
                                            </div>
                                        </div>
                                        <div className="whitespace-nowrap font-mono text-xs text-blue-300">{item.time}</div>
                                    </div>
                                </div>
                            ))}
                        </AutoScrollList>
                    </TechPanel>

                    {/* 通知公告 */}
                    <TechPanel 
                        title="通知公告" 
                        className="min-h-0 flex-1"
                        compact={true}
                    >
                        <AutoScrollList>
                            {announcements.map((item, i) => (
                                <div key={i} className="cursor-pointer rounded-lg border border-blue-900/40 bg-blue-950/40 p-2.5 transition-colors hover:bg-blue-900/50"
                                    onClick={() => navigate(item.type === '检查通知' ? '/daily-inspection' : '/training')}
                                >
                                    <div className="flex items-start gap-2">
                                        <span className={`whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-bold ${
                                            item.type === '检查通知' ? 'bg-orange-600/40 text-orange-200' : 'bg-green-600/40 text-green-200'
                                        }`}>
                                            {item.type}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="truncate text-sm font-medium text-white">{item.title}</div>
                                            <div className="mt-1 flex items-center justify-between text-xs text-blue-300">
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
                                <RealtimeWatchMap
                                    watches={watchSnapshot.watches}
                                    loading={watchLoading}
                                    error={watchError}
                                    updatedAt={watchSnapshot.updatedAt}
                                    selectedWatchId={selectedWatch?.id || ''}
                                    onSelectWatch={setSelectedWatchId}
                                />
                            </Suspense>
                        </MapLoadBoundary>
                    </div>
                    <div className="grid flex-none grid-cols-2 gap-2 sm:grid-cols-4" aria-label="驾驶舱核心指标">
                        <div
                            className="relative col-span-2 overflow-hidden rounded border border-cyan-400/45 bg-[linear-gradient(90deg,rgba(3,37,83,.9),rgba(8,76,148,.82),rgba(3,37,83,.9))] px-4 py-1.5 shadow-[inset_0_0_24px_rgba(14,165,233,.16),0_0_14px_rgba(14,165,233,.12)]"
                            aria-label={`安全运行天数 ${safeDays} 天`}
                        >
                            <div className="absolute inset-x-[26%] bottom-0 h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
                            <div className="flex h-full items-end justify-between gap-3">
                                <div className="pb-1 text-xs font-bold tracking-[0.18em] text-cyan-100 sm:text-sm">实时监测</div>
                                <div className="text-center">
                                    <div className="text-[10px] font-semibold tracking-[0.2em] text-cyan-200">安全运行天数（天）</div>
                                    <div className="font-mono text-3xl font-bold tracking-[0.26em] text-white drop-shadow-[0_0_10px_rgba(125,211,252,.85)] sm:text-4xl">
                                        {String(safeDays).padStart(3, '0')}
                                    </div>
                                </div>
                                <div className="pb-1 text-xs font-bold tracking-[0.18em] text-cyan-100 sm:text-sm">行为识别</div>
                            </div>
                        </div>
                        <div className="rounded border border-cyan-400/35 bg-slate-950/75 px-2 py-1.5">
                            <div className="flex items-center justify-between gap-2 text-[10px] tracking-wider text-cyan-200">
                                <label htmlFor="cockpit-watch-selector">选择手表</label>
                                <span className="whitespace-nowrap text-emerald-300">在线 {watchSnapshot.stats.online}/{watchSnapshot.stats.total}</span>
                            </div>
                            <select
                                id="cockpit-watch-selector"
                                value={selectedWatch?.id || ''}
                                onChange={(event) => setSelectedWatchId(event.target.value)}
                                disabled={!watchSnapshot.watches.length}
                                className="mt-1 w-full rounded border border-cyan-400/30 bg-slate-950 px-1.5 py-1 text-[11px] font-bold text-cyan-100 outline-none hover:border-cyan-300 focus:border-cyan-300 disabled:cursor-not-allowed disabled:text-slate-500"
                            >
                                {!watchSnapshot.watches.length && <option value="">暂无手表</option>}
                                {watchSnapshot.watches.map((watch) => (
                                    <option key={watch.id} value={watch.id}>
                                        {watch.name} · {watch.online ? '在线' : '离线'}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="rounded border border-cyan-400/35 bg-slate-950/75 px-2 py-1.5 text-center">
                            <div className="flex items-center justify-between gap-2 text-[10px] tracking-wider text-cyan-200">
                                <span>实时心率</span>
                                <span className={`h-1.5 w-1.5 rounded-full ${selectedWatch?.online ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                            </div>
                            <div className="font-mono text-xl font-bold leading-tight text-rose-300">
                                {selectedWatch?.heartRate ?? '--'}<span className="ml-1 text-[10px] text-slate-400">BPM</span>
                            </div>
                            <div className="truncate text-[9px] text-slate-400">
                                {selectedWatch
                                    ? `${selectedWatch.name} · 血氧 ${selectedWatch.bloodOxygen ?? '--'}% · 体温 ${selectedWatch.bodyTemperature ?? '--'}℃`
                                    : '请选择需要查看的手表'}
                            </div>
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
                        meta={(
                            <a
                                href={weatherData.attributionUrl || 'https://open-meteo.com/'}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(event) => event.stopPropagation()}
                                className="whitespace-nowrap text-[9px] font-normal text-blue-400/80 hover:text-cyan-200"
                            >
                                实时 · Open-Meteo
                            </a>
                        )}
                    >
                        <div className="grid h-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2 px-1">
                            <div className="flex items-center gap-1 whitespace-nowrap">
                                <i className="fas fa-cloud text-2xl text-blue-400"></i>
                                <span className="text-xl font-bold text-white">{weatherData.temperature ?? '--'}°C</span>
                            </div>
                            <div className="grid min-w-0 grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-medium text-blue-200">
                                <div className="flex min-w-0 items-center gap-1">
                                    <span className="text-blue-400 font-bold">天气</span>
                                    <span className="truncate">{weatherData.condition}</span>
                                </div>
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    <span className="text-blue-400 font-bold">湿度</span>
                                    <span>{weatherData.humidity ?? '--'}%</span>
                                </div>
                                <div className="col-span-2 flex items-center gap-1 whitespace-nowrap">
                                    <span className="font-bold text-blue-400">风向</span>
                                    <span>{weatherData.windDirection} {weatherData.windLevel == null ? '--' : `${weatherData.windLevel}级`}</span>
                                </div>
                            </div>
                        </div>
                        {weatherError && <div className="absolute bottom-1 right-3 text-[9px] text-amber-300">{weatherError}</div>}
                    </TechPanel>

                    {/* Work Permit Analysis */}
                    <TechPanel 
                        title="作业票分析" 
                        className="flex-none h-[315px] cursor-pointer hover:border-blue-400 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                        onClick={() => navigate('/work-permit')}
                        compact={true}
                    >
                        <div className="flex h-full flex-col justify-between overflow-hidden px-1 py-0.5">
                            {workPermitStats.map((stat, index) => (
                                <div key={index} className="group relative flex items-center justify-between rounded border-l-4 border-blue-600 bg-gradient-to-r from-blue-900/30 to-transparent px-3 py-0.5 transition-all hover:border-yellow-400 hover:from-blue-800/40">
                                    <div className="text-sm font-bold tracking-wide text-cyan-100 transition-colors group-hover:text-white">{stat.label}</div>
                                    <div className="font-mono text-xl font-bold text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-110">{stat.value}</div>
                                </div>
                            ))}
                        </div>
                    </TechPanel>

                    {/* Safety Knowledge */}
                    <TechPanel 
                        title="安全小知识" 
                        className="flex-1 min-h-[300px] cursor-pointer hover:border-blue-400 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                        onClick={() => navigate('/training')}
                        compact={true}
                    >
                        <AutoScrollList>
                            {safetyKnowledge.map((tip, i) => (
                                <div key={i} className="rounded-lg border border-blue-800/40 bg-gradient-to-br from-blue-950/50 to-blue-900/30 p-3 transition-all hover:border-blue-600/60 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                    <div className="mb-1.5 flex items-start gap-2">
                                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-600/40">
                                            <i className="fas fa-lightbulb text-xs text-yellow-400"></i>
                                        </div>
                                        <div className="pt-1 text-sm font-bold text-blue-100">{tip.title}</div>
                                    </div>
                                    <div className="pl-9 text-xs font-medium leading-relaxed text-blue-200">
                                        {tip.content}
                                    </div>
                                    <div className="mt-2 flex items-center gap-3 pl-9">
                                        <span className="rounded bg-blue-700/40 px-2 py-0.5 text-[10px] font-bold text-blue-200">
                                            {tip.category || '安全常识'}
                                        </span>
                                        <span className="text-[10px] font-medium text-blue-400">
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
function EmergencyAlarmDialog({ alarm, activeEvents, submitting, error, onDecision, onStopSimulation }) {
    const [mode, setMode] = useState('choose');
    const [reason, setReason] = useState('');
    const [mergeId, setMergeId] = useState(activeEvents[0]?.id || '');
    const abnormalReadings = (alarm.gas?.readings || []).filter((reading) => {
        const value = Number(reading.value);
        if (reading.key === 'oxygen') return value < 19.5 || value > 23.5;
        if (reading.key === 'co') return value > 20;
        if (reading.key === 'h2s') return value > 10;
        if (reading.key === 'combustible') return value > 25;
        return Number.isFinite(Number(reading.threshold)) && value > Number(reading.threshold);
    });

    useEffect(() => {
        const stopAlarm = playEmergencyAlarm();
        return stopAlarm;
    }, []);

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-label="突发险情报警">
            <div className="w-full max-w-2xl animate-pulse border-2 border-rose-400 bg-[#19060c] p-1 shadow-[0_0_60px_rgba(244,63,94,.7)]">
                <div className="border border-rose-400/55 bg-slate-950/95 p-6 [animation:none]">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-3xl text-rose-300"><i className="fas fa-triangle-exclamation" /></div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold tracking-[.35em] text-rose-300">EMERGENCY ALARM</p>
                            <div className="mt-1 flex items-center gap-3"><h2 className="text-3xl font-black tracking-wider text-white">{alarm.title}</h2>{alarm.simulated && <span className="border border-amber-300/70 bg-amber-400/15 px-2 py-1 text-xs font-bold text-amber-200">测试模拟数据</span>}</div>
                            <p className="mt-2 text-sm text-rose-100">{alarm.incidentType} · {alarm.location}</p>
                        </div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="border border-rose-400/30 bg-rose-500/10 p-3 text-sm">
                            <p className="mb-2 font-bold text-rose-200">人员体征异常</p>
                            <p>{alarm.watch?.name || '未知人员'} · 心率 {alarm.watch?.heartRate || '--'} BPM</p>
                            <p className="mt-1 text-xs text-rose-100/70">血氧 {alarm.watch?.bloodOxygen || '--'}% · 体温 {alarm.watch?.bodyTemperature || '--'}℃</p>
                        </div>
                        <div className="border border-amber-400/30 bg-amber-500/10 p-3 text-sm">
                            <p className="mb-2 font-bold text-amber-200">气体浓度超限</p>
                            {abnormalReadings.map((reading) => <p key={reading.key}>{reading.label}: {reading.value} {reading.unit}<span className="ml-2 text-xs text-amber-100/60">阈值 {reading.threshold ?? '规范值'}</span></p>)}
                        </div>
                    </div>
                    {mode === 'choose' && (
                        <div className="mt-5 grid grid-cols-3 gap-3">
                            <button disabled={submitting} onClick={() => onDecision('yes')} className="bg-rose-600 px-4 py-3 font-bold hover:bg-rose-500 disabled:opacity-50">是 · 启动应急处置</button>
                            <button disabled={submitting} onClick={() => setMode('reject')} className="border border-slate-500 px-4 py-3 font-bold text-slate-200 hover:bg-slate-800">否 · 排除险情</button>
                            <button disabled={submitting || !activeEvents.length} onClick={() => setMode('merge')} className="border border-amber-400/60 px-4 py-3 font-bold text-amber-200 hover:bg-amber-500/10 disabled:opacity-40">其他 · 并入事故</button>
                        </div>
                    )}
                    {mode === 'reject' && <div className="mt-5"><textarea autoFocus value={reason} onChange={(event) => setReason(event.target.value)} placeholder="请输入排除原因（必填）" className="h-24 w-full border border-rose-400/40 bg-slate-950 p-3 text-sm outline-none focus:border-rose-300" /><div className="mt-2 flex justify-end gap-2"><button onClick={() => setMode('choose')} className="px-4 py-2 text-sm text-slate-300">返回</button><button disabled={!reason.trim() || submitting} onClick={() => onDecision('no', { rejectionReason: reason.trim() })} className="bg-rose-600 px-4 py-2 text-sm font-bold disabled:opacity-40">确认并停止本次报警</button></div></div>}
                    {mode === 'merge' && <div className="mt-5"><label className="mb-2 block text-sm text-amber-100">选择需要并入的在处事件</label><select value={mergeId} onChange={(event) => setMergeId(event.target.value)} className="w-full border border-amber-400/40 bg-slate-950 p-3 text-sm">{activeEvents.map((event) => <option key={event.id} value={event.id}>#{event.id} {event.title} · {event.location}</option>)}</select><div className="mt-2 flex justify-end gap-2"><button onClick={() => setMode('choose')} className="px-4 py-2 text-sm text-slate-300">返回</button><button disabled={!mergeId || submitting} onClick={() => onDecision('other', { mergedIntoId: Number(mergeId) })} className="bg-amber-600 px-4 py-2 text-sm font-bold disabled:opacity-40">确认合并</button></div></div>}
                    {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
                    {alarm.simulated && <div className="mt-4 border-t border-amber-400/25 pt-3 text-right"><button type="button" onClick={onStopSimulation} className="border border-amber-300/55 px-3 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-400/10">停止事故模拟</button></div>}
                </div>
            </div>
        </div>
    );
}

function AutoScrollList({ children, className = '', speed = 0.12 }) {
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
            <div className="space-y-2.5 pb-2.5">
                {children}
            </div>
            <div className="space-y-2.5">
                {children}
            </div>
        </div>
    );
}

// Enhanced Tech Panel Component
function TechPanel({ title, children, className = '', onClick, compact = false, meta = null }) {
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
                <div className="flex items-center gap-3">
                    {meta}
                    <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                        <div className="w-1.5 h-1.5 bg-blue-500/50 rounded-full"></div>
                        <div className="w-1.5 h-1.5 bg-blue-500/30 rounded-full"></div>
                    </div>
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
