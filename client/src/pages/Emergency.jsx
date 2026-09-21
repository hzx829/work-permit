import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import EmergencyInteraction from '../components/EmergencyInteraction';
import EmergencyFlowChart, { EmergencyFlowOverview, getEmergencyFlowSnapshot } from '../components/EmergencyFlowChart';
import CompetitionLivePlayer from '../components/CompetitionLivePlayer';
import useCompetitionGasReadings from '../hooks/useCompetitionGasReadings';
import { createEmergencyEvent, getEmergencyEvent, loadEmergencyEvents, loadEmergencyMonitoring } from '../utils/api';
import { stopEmergencyAlarm } from '../utils/emergencyAlarm';

const STATUS_LABELS = { pending: '待确认', active: '处置中', recovering: '恢复中', closed: '已闭环', dismissed: '已排除', merged: '已合并' };
const FIELD_GAS_SPECS = [
    { key: 'CH4', label: '甲烷浓度', defaultUnit: 'Vol' },
    { key: 'CO2', label: '二氧化碳浓度', defaultUnit: 'Vol' },
    { key: 'O2', label: '氧气浓度', defaultUnit: 'Vol' },
    { key: 'CO', label: '一氧化碳浓度', defaultUnit: 'ppm' },
];

export default function Emergency() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [events, setEvents] = useState([]);
    const [event, setEvent] = useState(null);
    const [monitoring, setMonitoring] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [videoSource, setVideoSource] = useState('fixed');
    const [selectedFieldDeviceId, setSelectedFieldDeviceId] = useState('');
    const [now, setNow] = useState(new Date());
    const [showNewConversation, setShowNewConversation] = useState(false);
    const [showFlowOverview, setShowFlowOverview] = useState(false);
    const [historyFlowEvent, setHistoryFlowEvent] = useState(null);
    const [aiExpanded, setAiExpanded] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newIncident, setNewIncident] = useState({ title: '突发险情', incidentType: '', location: '' });
    const { devices: fieldDevices, error: fieldDeviceError } = useCompetitionGasReadings();

    const loadData = useCallback(async (preferredId) => {
        setError('');
        try {
            const [listResult, monitoringResult] = await Promise.all([loadEmergencyEvents(), loadEmergencyMonitoring()]);
            const list = listResult.events || [];
            setEvents(list);
            setMonitoring(monitoringResult);
            const requestedId = preferredId || searchParams.get('event');
            const selected = requestedId ? list.find((item) => String(item.id) === String(requestedId)) : list.find((item) => ['active', 'recovering'].includes(item.status)) || list[0];
            if (selected) {
                const details = await getEmergencyEvent(selected.id);
                setEvent(details);
                setSearchParams({ event: String(details.id) }, { replace: true });
            } else {
                setEvent(null);
            }
        } catch (loadError) {
            setError(loadError.message || '应急数据加载失败');
        } finally {
            setLoading(false);
        }
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        stopEmergencyAlarm();
        return stopEmergencyAlarm;
    }, []);
    useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    useEffect(() => {
        const timer = setInterval(async () => {
            try { setMonitoring(await loadEmergencyMonitoring()); } catch (refreshError) { console.error(refreshError); }
        }, 15000);
        return () => clearInterval(timer);
    }, []);
    const linkedDeviceId = event?.gas?.deviceId || monitoring?.gas?.deviceId || selectedFieldDeviceId;
    const fieldDevice = fieldDevices.find((device) => device.deviceId === linkedDeviceId)
        || fieldDevices.find((device) => device.deviceId === selectedFieldDeviceId)
        || fieldDevices[0]
        || null;
    const liveGas = fieldDevice && !fieldDeviceError ? {
        deviceId: fieldDevice.deviceId,
        deviceName: fieldDevice.deviceName || '智能气体检测仪',
        location: event?.location || '',
        measuredAt: fieldDevice.sampledAt || fieldDevice.receivedAt,
        dataStatus: fieldDevice.dataStatus,
        readings: FIELD_GAS_SPECS.map(({ key, label, defaultUnit }) => {
            const reading = fieldDevice.gasData?.[key];
            return {
                key,
                label,
                value: reading?.value ?? null,
                unit: reading?.unit || defaultUnit,
                available: Boolean(reading),
            };
        }),
    } : null;
    const gas = monitoring?.simulation?.active
        ? (event?.gas || monitoring?.gas)
        : (liveGas || event?.gas || monitoring?.gas);
    const readings = gas?.readings || [];

    const selectEvent = async (id) => {
        setLoading(true);
        await loadData(id);
    };

    const startNewConversation = async (submitEvent) => {
        submitEvent.preventDefault();
        if (creating) return;
        setCreating(true);
        setError('');
        try {
            const created = await createEmergencyEvent({
                alarmDecision: 'yes',
                title: newIncident.title.trim() || '突发险情',
                incidentType: newIncident.incidentType.trim() || '待研判',
                location: newIncident.location.trim(),
            });
            setShowNewConversation(false);
            setNewIncident({ title: '突发险情', incidentType: '', location: '' });
            setLoading(true);
            await loadData(created.id);
        } catch (createError) {
            setError(createError.message || '新增事故对话失败');
        } finally {
            setCreating(false);
        }
    };

    const activeEventCount = events.filter((item) => ['active', 'recovering'].includes(item.status)).length;

    return (
        <div className="h-full min-h-0 overflow-auto bg-[#020918] p-2 text-cyan-50 selection:bg-cyan-500/50 xl:overflow-hidden">
            <div className="relative mx-auto flex min-h-full max-w-[1900px] flex-col overflow-hidden border-2 border-cyan-400/60 bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,.24),transparent_38%),linear-gradient(125deg,#031229,#062e5a_52%,#04152f)] p-3 shadow-[inset_0_0_55px_rgba(14,165,233,.16),0_0_30px_rgba(14,165,233,.25)] before:pointer-events-none before:absolute before:inset-0 before:opacity-20 before:[background-image:linear-gradient(rgba(34,211,238,.14)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.14)_1px,transparent_1px)] before:[background-size:42px_42px] xl:h-full xl:min-h-0">
                <header className="relative mb-3 flex min-h-16 shrink-0 items-center justify-between overflow-hidden border-y border-cyan-300/55 bg-blue-950/35 px-5 shadow-[0_0_18px_rgba(34,211,238,.12)]">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(14,165,233,.1),transparent)]" />
                    <div className="relative py-2"><p className="text-xs tracking-[.35em] text-cyan-300/70">EMERGENCY COMMAND CENTER</p><div className="mt-1 flex items-center gap-3"><h1 className="text-2xl font-black tracking-[.16em] text-white md:text-3xl">应急处置管理</h1>{event && <span className={`border px-2 py-1 text-xs ${event.status === 'closed' ? 'border-emerald-400/40 text-emerald-200' : 'border-rose-400/50 bg-rose-500/10 text-rose-200'}`}>#{event.id} {STATUS_LABELS[event.status] || event.status}</span>}<span className="hidden border border-cyan-400/25 px-2 py-1 text-xs text-cyan-200/70 lg:inline">并行处置 {activeEventCount}</span></div><button type="button" onClick={() => setShowFlowOverview(true)} disabled={!event} className="mt-2 inline-flex items-center gap-2 rounded border border-cyan-300/45 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-35"><i className="fas fa-diagram-project" />查看全流程总览 <i className="fas fa-angle-right text-[10px]" /></button></div>
                    <div className="relative flex items-center gap-2 text-right"><div className="mr-2 hidden text-xs text-cyan-200/80 md:block">{now.toLocaleString('zh-CN', { hour12: false })}</div><button onClick={() => setShowNewConversation(true)} className="rounded border border-rose-400/60 bg-rose-500/15 px-3 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-400/25"><i className="fas fa-plus mr-1" />新增对话窗口</button><button onClick={() => navigate('/')} className="rounded border border-cyan-400/60 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20">返回驾驶舱 <i className="fas fa-arrow-right ml-1" /></button></div>
                </header>

                {error && <div className="mb-3 border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">{error}</div>}
                <main className="relative grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-auto xl:grid-cols-[.78fr_2.1fr_1fr] xl:grid-rows-[minmax(0,1fr)] xl:overflow-hidden">
                    <div className="min-h-[900px] xl:h-full xl:min-h-0">
                        <TechFrame title="应急处置流程" icon="fa-sitemap"><EmergencyFlowChart event={event} /></TechFrame>
                    </div>

                    <div className="grid min-h-[680px] min-w-0 grid-rows-[1.3fr_.7fr] gap-4 xl:min-h-0">
                        <TechFrame><div className="flex h-full min-h-0 flex-col"><div className="mb-2 flex items-center gap-2">{[['fixed', '现场实时视频'], ['drone', '无人机视频']].map(([key, label]) => <button key={key} onClick={() => setVideoSource(key)} className={`border px-4 py-1.5 text-[13px] font-semibold transition ${videoSource === key ? 'border-cyan-200 bg-cyan-400/25 text-white shadow-[0_0_12px_rgba(34,211,238,.18)]' : 'border-blue-300/35 bg-blue-900/20 text-cyan-100/75 hover:border-cyan-300/60'}`}>{label}</button>)}{videoSource === 'fixed' && fieldDevices.length > 1 && <select value={fieldDevice?.deviceId || ''} onChange={(inputEvent) => setSelectedFieldDeviceId(inputEvent.target.value)} className="ml-auto min-w-40 border border-cyan-300/35 bg-blue-950/70 px-2 py-1.5 text-xs text-cyan-50 outline-none"><option value="">选择记录仪</option>{fieldDevices.map((device) => <option key={device.deviceId} value={device.deviceId}>{device.deviceId}{device.primary ? '（默认）' : ''}</option>)}</select>}</div>{videoSource === 'fixed' && fieldDevice && !fieldDeviceError ? <div className="min-h-0 flex-1 border border-cyan-300/35"><CompetitionLivePlayer deviceId={fieldDevice.deviceId} fill /></div> : <VideoPlaceholder source={videoSource} message={videoSource === 'fixed' && fieldDeviceError ? fieldDeviceError.message : ''} />}</div></TechFrame>
                        <div className={aiExpanded ? 'fixed inset-4 z-[100] min-h-0 bg-[#041126] shadow-[0_0_80px_rgba(2,8,23,.9)]' : 'min-h-0'}><TechFrame title="AI 智能交互与处置指引" icon="fa-comments" action={<button type="button" onClick={() => setAiExpanded((expanded) => !expanded)} title={aiExpanded ? '还原窗口' : '放大窗口'} className="ml-auto flex h-7 w-7 items-center justify-center border border-cyan-300/40 bg-cyan-400/10 text-cyan-100 transition hover:bg-cyan-400/20"><i className={`fas ${aiExpanded ? 'fa-compress' : 'fa-expand'}`} /></button>}>{loading ? <EmptyState icon="fa-spinner fa-spin" text="正在加载应急事件" /> : event && ['active', 'recovering', 'closed'].includes(event.status) ? <EmergencyInteraction key={event.id} event={event} onEventChange={(updated) => { setEvent(updated); loadEmergencyEvents().then((result) => setEvents(result.events || [])); }} /> : <EmptyState icon="fa-shield-halved" text={event?.status === 'dismissed' ? `本次险情已排除：${event.rejectionReason}` : event?.status === 'merged' ? `本次报警已并入事件 #${event.mergedIntoId}` : '等待驾驶舱确认突发险情'} />}</TechFrame></div>
                    </div>

                    <div className="grid min-h-[760px] grid-rows-[1.25fr_.75fr] gap-4 xl:min-h-0">
                        <TechFrame title="现场实时气体检测" icon="fa-wave-square"><div className="space-y-3 overflow-auto pr-1">{fieldDeviceError && !monitoring?.simulation?.active ? <EmptyState icon="fa-link-slash" text={`气体检测仪连接中断：${fieldDeviceError.message}`} /> : readings.length ? readings.map((reading) => <GasReading key={reading.key} reading={reading} dataStatus={gas?.dataStatus} />) : <EmptyState icon="fa-plug-circle-xmark" text={gas?.dataStatus === 'no_data' ? '设备在线，暂未上报气体数据' : '暂无气体检测仪数据，请先将记录仪接入授权组织'} />}{gas && <div className="border border-cyan-300/35 bg-blue-950/45 p-3 text-[13px] leading-5 text-cyan-50/80"><div className="flex items-center justify-between gap-2"><p className="font-semibold">{gas.deviceName || '气体检测仪'} · {gas.location || '未标注点位'}</p>{gas.dataStatus && <span className={`border px-2 py-0.5 text-[11px] font-bold ${gas.dataStatus === 'fresh' ? 'border-emerald-300/50 text-emerald-200' : gas.dataStatus === 'stale' ? 'border-amber-300/50 text-amber-200' : 'border-slate-300/40 text-slate-300'}`}>{gas.dataStatus === 'fresh' ? '实时' : gas.dataStatus === 'stale' ? '数据过期' : '暂无数据'}</span>}</div><p className="mt-1 text-cyan-100/60">设备：{gas.deviceId || '--'} · 数据时间：{gas.measuredAt ? new Date(gas.measuredAt).toLocaleString('zh-CN', { hour12: false }) : '--'}</p></div>}</div></TechFrame>
                        <TechFrame title="事故对话与历史" icon="fa-clock-rotate-left"><div className="h-full min-h-0 space-y-2 overflow-y-auto overscroll-contain pr-1 [scrollbar-color:#22d3ee_#06234c] [scrollbar-width:thin]">{events.length ? events.map((item) => { const unfinished = ['active', 'recovering'].includes(item.status); const selected = event?.id === item.id; return <div key={item.id} className={`border text-[13px] transition ${selected ? 'border-cyan-200/75 bg-cyan-400/20 shadow-[inset_3px_0_0_#67e8f9]' : unfinished ? 'border-amber-300/45 bg-amber-400/10' : 'border-blue-300/35 bg-blue-950/35'}`}><button type="button" onClick={() => selectEvent(item.id)} className="w-full p-2.5 text-left hover:bg-cyan-300/5"><div className="flex items-center justify-between gap-2"><strong className="truncate text-[14px] text-white">#{item.id} {item.title}</strong><span className={unfinished ? 'shrink-0 font-semibold text-amber-100' : 'shrink-0 text-cyan-200/80'}>{STATUS_LABELS[item.status] || item.status}</span></div><div className="mt-1.5 flex items-center justify-between gap-2 text-cyan-50/65"><p className="truncate">{item.location || '未标注位置'} · {new Date(item.createdAt).toLocaleString('zh-CN', { hour12: false })}</p>{unfinished && <span className="shrink-0 font-semibold text-cyan-200">继续处置 <i className="fas fa-angle-right" /></span>}</div></button><button type="button" onClick={() => setHistoryFlowEvent(item)} className="block w-full border-t border-cyan-300/15 px-2.5 py-2 text-left transition hover:bg-cyan-300/10" title="展开完整处置流程"><HistoryFlowThumbnail event={item} /><span className="mt-1.5 block text-right text-[11px] font-semibold text-cyan-200/80">查看完整流程 <i className="fas fa-up-right-and-down-left-from-center ml-1" /></span></button></div>; }) : <EmptyState text="暂无应急事件，请新建事故对话或从驾驶舱启动" />}</div></TechFrame>
                    </div>
                </main>
                {showNewConversation && <NewConversationDialog value={newIncident} onChange={setNewIncident} creating={creating} onSubmit={startNewConversation} onClose={() => !creating && setShowNewConversation(false)} />}
                {showFlowOverview && event && <FlowOverviewDialog event={event} onClose={() => setShowFlowOverview(false)} />}
                {historyFlowEvent && <HistoryFlowDialog event={historyFlowEvent} onClose={() => setHistoryFlowEvent(null)} />}
            </div>
        </div>
    );
}

function FlowOverviewDialog({ event, onClose }) {
    useEffect(() => {
        const closeOnEscape = (keyEvent) => { if (keyEvent.key === 'Escape') onClose(); };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [onClose]);

    return <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/90 p-3 backdrop-blur-sm md:p-6" role="dialog" aria-modal="true" aria-label="应急处置全流程总览" onMouseDown={(mouseEvent) => { if (mouseEvent.target === mouseEvent.currentTarget) onClose(); }}>
        <div className="flex h-[94vh] w-full max-w-7xl flex-col overflow-hidden border-2 border-cyan-300/65 bg-[#04152f] shadow-[0_0_70px_rgba(34,211,238,.28)]">
            <div className="flex shrink-0 items-center justify-between border-b border-cyan-300/30 px-4 py-3 md:px-6 md:py-4">
                <div><p className="text-[11px] tracking-[.24em] text-cyan-300/65">EMERGENCY FLOW OVERVIEW</p><h2 className="mt-1 text-lg font-black text-white md:text-xl">#{event.id} {event.title} · 全流程总览</h2><p className="mt-1 text-xs text-cyan-100/55">高亮为本次已选择和已执行的路径，灰色为未走流程</p></div>
                <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center border border-cyan-300/45 text-cyan-100 transition hover:bg-cyan-400/15" aria-label="关闭全流程总览"><i className="fas fa-xmark" /></button>
            </div>
            <div className="min-h-0 flex-1 p-3 md:p-5"><EmergencyFlowOverview event={event} /></div>
        </div>
    </div>;
}

function HistoryFlowThumbnail({ event }) {
    const { current, visited, flowOrder } = getEmergencyFlowSnapshot(event);
    const isFinished = event?.status === 'closed';
    return <div className="flex items-center overflow-hidden" aria-label="处置流程缩略图">
        {flowOrder.map((id, index) => {
            const done = visited.has(id);
            const active = !isFinished && id === current;
            const connectorDone = done && visited.has(flowOrder[index + 1]);
            return <div key={id} className="flex min-w-0 flex-1 items-center">
                <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${active ? 'border-amber-200 bg-amber-300 shadow-[0_0_7px_#fbbf24]' : done ? 'border-cyan-200 bg-cyan-300' : 'border-slate-500 bg-slate-900'}`}>{!active && !done && <i className="fas fa-xmark text-[7px] text-slate-400" />}</span>
                {index < flowOrder.length - 1 && <span className={`h-0 flex-1 border-t ${connectorDone ? 'border-solid border-cyan-300' : 'border-dashed border-slate-500/60'}`} />}
            </div>;
        })}
    </div>;
}

function HistoryFlowDialog({ event, onClose }) {
    return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${event.title}完整处置进度`}>
        <div className="flex h-[min(860px,94vh)] w-full max-w-6xl flex-col overflow-hidden border-2 border-cyan-300/65 bg-[#04152f] shadow-[0_0_60px_rgba(34,211,238,.28)]">
            <div className="flex shrink-0 items-center justify-between border-b border-cyan-300/30 px-5 py-4">
                <div><p className="text-xs tracking-[.24em] text-cyan-300/65">HISTORICAL DISPOSAL FLOW</p><h2 className="mt-1 text-xl font-black text-white">#{event.id} {event.title} · 完整处置进度</h2></div>
                <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center border border-cyan-300/45 text-cyan-100 hover:bg-cyan-400/15" aria-label="关闭完整流程"><i className="fas fa-xmark" /></button>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[.8fr_1.2fr]">
                <div className="min-h-[460px] overflow-hidden border border-cyan-300/30 bg-blue-950/35 p-3"><EmergencyFlowChart event={event} /></div>
                <div className="min-h-0 overflow-y-auto border border-cyan-300/30 bg-blue-950/25 p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm"><FlowMeta label="处置状态" value={STATUS_LABELS[event.status] || event.status} /><FlowMeta label="事故位置" value={event.location || '未标注位置'} /><FlowMeta label="采用预案" value={event.selectedPlan || '尚未选择'} /><FlowMeta label="救援方式" value={event.rescueMode || '尚未选择'} /></div>
                    <h3 className="mb-3 mt-5 border-b border-cyan-300/20 pb-2 font-bold text-white">全流程处置记录</h3>
                    <div className="space-y-2">{event.timeline?.length ? event.timeline.map((entry, index) => <div key={`${entry.at}-${index}`} className="border-l-2 border-cyan-300 bg-cyan-400/5 px-3 py-2.5"><div className="flex items-start justify-between gap-3"><p className="font-semibold text-cyan-50">{entry.action}</p><time className="shrink-0 text-[11px] text-cyan-200/55">{entry.at ? new Date(entry.at).toLocaleString('zh-CN', { hour12: false }) : '--'}</time></div><p className="mt-1 text-xs text-cyan-100/55">{entry.operator || '系统'} · {entry.stage || '未标注阶段'}</p></div>) : <p className="py-10 text-center text-sm text-cyan-100/45">暂无处置记录</p>}</div>
                </div>
            </div>
        </div>
    </div>;
}

function FlowMeta({ label, value }) {
    return <div className="border border-cyan-300/20 bg-cyan-400/5 p-3"><p className="text-xs text-cyan-200/55">{label}</p><p className="mt-1 font-semibold text-cyan-50">{value}</p></div>;
}

function GasReading({ reading, dataStatus }) {
    const key = String(reading.key || '').toUpperCase();
    const ranges = { OXYGEN: [0, 25], O2: [0, 25], CO: [0, 100], CH4: [0, 5], CO2: [0, 5], H2S: [0, 50], COMBUSTIBLE: [0, 100] };
    const [min, max] = ranges[key] || [0, Math.max(Number(reading.threshold) || 100, Number(reading.value) || 0)];
    const value = Number(reading.value);
    const hasValue = reading.available !== false
        && reading.value !== null
        && reading.value !== undefined
        && Number.isFinite(value);
    const displayValue = (hasValue ? value : 0).toFixed(2);
    const thresholdValue = reading.threshold === null || reading.threshold === undefined ? null : Number(reading.threshold);
    const hasThreshold = Number.isFinite(thresholdValue);
    const abnormal = hasValue && (typeof reading.exceeded === 'boolean'
        ? reading.exceeded
        : hasThreshold && (key === 'OXYGEN' || key === 'O2'
            ? value <= thresholdValue || value > Number(reading.upperThreshold ?? 23.5)
            : reading.alarmInclusive ? value >= thresholdValue : value > thresholdValue));
    const percent = hasValue ? Math.max(2, Math.min(100, ((value - min) / (max - min || 1)) * 100)) : 0;
    const statusLabel = !hasValue ? '暂未上报' : dataStatus === 'stale' ? '数据过期' : dataStatus === 'no_data' ? '暂无数据' : hasThreshold ? (abnormal ? '已超限' : '正常') : '实时读数';
    return <div className={`border p-3.5 shadow-[inset_0_0_18px_rgba(59,130,246,.08)] ${abnormal ? 'border-rose-300/65 bg-rose-500/15' : dataStatus === 'stale' && hasValue ? 'border-amber-300/55 bg-amber-500/10' : 'border-cyan-300/35 bg-blue-950/40'}`}><div className="mb-2.5 flex items-center justify-between"><span className="text-[15px] font-black tracking-wide text-white">{reading.label}</span><span className={`font-mono text-base font-bold ${abnormal ? 'text-rose-100' : hasValue ? 'text-white' : 'text-cyan-100/45'}`}>{displayValue}<small className="ml-1 text-[11px] font-semibold text-cyan-200">{reading.unit}</small></span></div><div className="h-2.5 overflow-hidden bg-blue-950/80"><div className={`h-full transition-all ${abnormal ? 'bg-gradient-to-r from-rose-500 to-pink-400 shadow-[0_0_12px_#fb7185]' : hasValue ? 'bg-gradient-to-r from-cyan-300 to-blue-400' : 'bg-cyan-300/20'}`} style={{ width: `${percent}%` }} /></div><div className="mt-2 flex justify-between text-[11px] font-medium text-cyan-100/65"><span>{min}</span><span>{statusLabel}</span><span>{max}</span></div></div>;
}

function EmptyState({ icon = 'fa-circle-info', text }) {
    return <div className="flex h-full min-h-32 flex-1 flex-col items-center justify-center border border-dashed border-cyan-300/40 bg-[radial-gradient(circle_at_center,rgba(34,211,238,.16),rgba(8,47,91,.28)_45%,transparent_72%)] p-5 text-center"><i className={`fas ${icon} mb-3 text-3xl text-cyan-200/80 drop-shadow-[0_0_10px_rgba(34,211,238,.55)]`} /><p className="max-w-md text-[13px] font-medium leading-6 text-cyan-50/70">{text}</p></div>;
}

function TechFrame({ title, icon, action, children }) {
    return <section className="relative flex h-full min-h-0 flex-col overflow-hidden border border-cyan-300/35 bg-[linear-gradient(155deg,rgba(3,31,72,.94),rgba(5,54,104,.8)_52%,rgba(3,25,62,.94))] p-4 shadow-[inset_0_1px_20px_rgba(14,165,233,.08),0_8px_22px_rgba(0,10,32,.22)]" style={{ clipPath: 'polygon(14px 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px), 0 14px)' }}>
        <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(circle,rgba(56,189,248,.5)_1px,transparent_1px)] [background-size:20px_20px]" />
        <i className="pointer-events-none absolute left-2 top-2 h-5 w-8 border-l-2 border-t-2 border-cyan-200/55" />
        <i className="pointer-events-none absolute right-2 top-2 h-5 w-8 border-r-2 border-t-2 border-cyan-200/55" />
        <i className="pointer-events-none absolute bottom-2 left-2 h-4 w-6 border-b border-l border-cyan-300/35" />
        <i className="pointer-events-none absolute bottom-2 right-2 h-4 w-6 border-b border-r border-cyan-300/35" />
        {title && <div className="relative z-10 mx-2 mb-3 flex min-h-10 shrink-0 items-center justify-center border-b border-cyan-200/25 bg-gradient-to-r from-transparent via-cyan-500/[.05] to-transparent pb-2 text-[14px] font-bold tracking-[.04em] text-cyan-50 2xl:mx-5 2xl:text-[17px] 2xl:tracking-[.08em]"><span className="mr-2 shrink-0 text-cyan-200/80"><i className={`fas ${icon}`} /></span><span className="mx-2 whitespace-nowrap 2xl:mx-3">{title}</span>{action && <span className="absolute right-0 top-0">{action}</span>}</div>}
        <div className="relative z-10 min-h-0 flex-1">{children}</div>
    </section>;
}

function VideoPlaceholder({ source, message = '' }) {
    const label = source === 'fixed' ? '现场摄像头' : '无人机';
    return <div className="relative flex min-h-0 flex-1 overflow-hidden border border-cyan-300/35 bg-[linear-gradient(145deg,rgba(7,38,82,.56),rgba(8,63,112,.32))] text-center shadow-[inset_0_0_45px_rgba(14,165,233,.12)]"><div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(103,232,249,.14)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,.14)_1px,transparent_1px)] [background-size:32px_32px]" /><div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/15 shadow-[0_0_45px_rgba(34,211,238,.1)]" /><div className="relative m-auto flex max-w-lg flex-col items-center p-6"><span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-200/60 bg-cyan-400/15 text-3xl text-cyan-100 shadow-[0_0_25px_rgba(34,211,238,.3)]"><i className={`fas ${source === 'fixed' ? 'fa-video' : 'fa-helicopter'}`} /></span><h3 className="text-lg font-black tracking-widest text-white">视频信号待接入</h3><p className="mt-2 text-[14px] font-medium leading-6 text-cyan-50/70">{message || `${label}尚未配置视频流，完成接入后将在此自动显示实时画面`}</p><div className="mt-5 flex items-center gap-2 border border-cyan-300/30 bg-blue-950/35 px-4 py-2 text-xs font-semibold text-cyan-100/75"><i className="fas fa-link text-cyan-200" />等待设备配置</div></div></div>;
}

function NewConversationDialog({ value, onChange, creating, onSubmit, onClose }) {
    return <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"><form onSubmit={onSubmit} className="w-full max-w-md border border-cyan-300/60 bg-[#061b3b] p-5 shadow-[0_0_45px_rgba(34,211,238,.22)]"><div className="mb-4 flex items-start justify-between"><div><h2 className="text-lg font-bold text-white"><i className="fas fa-triangle-exclamation mr-2 text-rose-300" />新增事故对话</h2><p className="mt-1 text-xs text-cyan-100/55">新事故将独立建档，可与现有事故并行处置。</p></div><button type="button" onClick={onClose} disabled={creating} className="text-cyan-100/60 hover:text-white"><i className="fas fa-xmark" /></button></div><div className="space-y-3"><Field label="事故标题" value={value.title} onChange={(title) => onChange({ ...value, title })} required /><Field label="事故类型" value={value.incidentType} onChange={(incidentType) => onChange({ ...value, incidentType })} placeholder="例如：人员中毒、火灾、泄漏" /><Field label="事故位置" value={value.location} onChange={(location) => onChange({ ...value, location })} placeholder="例如：1号污水井" /></div><div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={onClose} disabled={creating} className="border border-blue-400/35 px-3 py-2 text-sm text-cyan-100/70">取消</button><button type="submit" disabled={creating} className="border border-rose-300/60 bg-rose-500/20 px-3 py-2 text-sm font-bold text-rose-100 disabled:opacity-50">{creating ? <><i className="fas fa-spinner fa-spin mr-2" />正在启动</> : <><i className="fas fa-bell mr-2" />确认并启动</>}</button></div></form></div>;
}

function Field({ label, value, onChange, placeholder = '', required = false }) {
    return <label className="block text-xs text-cyan-100/70"><span className="mb-1 block">{label}{required && <b className="ml-1 text-rose-300">*</b>}</span><input required={required} value={value} onChange={(inputEvent) => onChange(inputEvent.target.value)} placeholder={placeholder} className="w-full border border-cyan-400/35 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition placeholder:text-cyan-100/25 focus:border-cyan-300" /></label>;
}
