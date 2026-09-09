import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import EmergencyInteraction from '../components/EmergencyInteraction';
import EmergencyFlowChart from '../components/EmergencyFlowChart';
import { createEmergencyEvent, getEmergencyEvent, loadEmergencyEvents, loadEmergencyMonitoring } from '../utils/api';

const STATUS_LABELS = { pending: '待确认', active: '处置中', recovering: '恢复中', closed: '已闭环', dismissed: '已排除', merged: '已合并' };

export default function Emergency() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [events, setEvents] = useState([]);
    const [event, setEvent] = useState(null);
    const [monitoring, setMonitoring] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [videoSource, setVideoSource] = useState('fixed');
    const [now, setNow] = useState(new Date());
    const [showNewConversation, setShowNewConversation] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newIncident, setNewIncident] = useState({ title: '突发险情', incidentType: '', location: '' });
    const alarmStopRef = useRef(null);

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
    useEffect(() => () => alarmStopRef.current?.(), []);
    useEffect(() => {
        if (!event?.id || event.stage !== 'plan' || event.status !== 'active') return;
        const alarmKey = `emergency-alarm-played-${event.id}`;
        if (sessionStorage.getItem(alarmKey)) return;
        sessionStorage.setItem(alarmKey, 'true');
        alarmStopRef.current?.();
        alarmStopRef.current = playEmergencyAlarm();
    }, [event?.id, event?.stage, event?.status]);

    const gas = event?.gas || monitoring?.gas;
    const readings = gas?.readings || [];

    const selectEvent = async (id) => {
        setLoading(true);
        await loadData(id);
    };

    const startNewConversation = async (submitEvent) => {
        submitEvent.preventDefault();
        if (creating) return;
        alarmStopRef.current?.();
        alarmStopRef.current = playEmergencyAlarm();
        setCreating(true);
        setError('');
        try {
            const created = await createEmergencyEvent({
                alarmDecision: 'yes',
                title: newIncident.title.trim() || '突发险情',
                incidentType: newIncident.incidentType.trim() || '待研判',
                location: newIncident.location.trim(),
            });
            sessionStorage.setItem(`emergency-alarm-played-${created.id}`, 'true');
            setShowNewConversation(false);
            setNewIncident({ title: '突发险情', incidentType: '', location: '' });
            setLoading(true);
            await loadData(created.id);
        } catch (createError) {
            alarmStopRef.current?.();
            setError(createError.message || '新增事故对话失败');
        } finally {
            setCreating(false);
        }
    };

    const activeEventCount = events.filter((item) => ['active', 'recovering'].includes(item.status)).length;

    return (
        <div className="h-full min-h-0 overflow-auto bg-[#041126] p-3 text-cyan-50 selection:bg-cyan-500/50 xl:overflow-hidden">
            <div className="relative mx-auto flex min-h-full max-w-[1800px] flex-col bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,.2),transparent_42%),linear-gradient(125deg,#06152d,#082b55_52%,#061a38)] p-3 shadow-[0_0_70px_rgba(14,165,233,.2)] xl:h-full xl:min-h-0">
                <header className="relative mb-3 flex min-h-16 shrink-0 items-center justify-between overflow-hidden border-y border-cyan-400/35 px-5">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(14,165,233,.1),transparent)]" />
                    <div className="relative"><p className="text-xs tracking-[.35em] text-cyan-300/70">EMERGENCY COMMAND CENTER</p><div className="mt-1 flex items-center gap-3"><h1 className="text-2xl font-black tracking-[.16em] text-white md:text-3xl">应急处置管理</h1>{event && <span className={`border px-2 py-1 text-xs ${event.status === 'closed' ? 'border-emerald-400/40 text-emerald-200' : 'border-rose-400/50 bg-rose-500/10 text-rose-200'}`}>#{event.id} {STATUS_LABELS[event.status] || event.status}</span>}<span className="hidden border border-cyan-400/25 px-2 py-1 text-xs text-cyan-200/70 lg:inline">并行处置 {activeEventCount}</span></div></div>
                    <div className="relative flex items-center gap-2 text-right"><div className="mr-2 hidden text-xs text-cyan-200/80 md:block">{now.toLocaleString('zh-CN', { hour12: false })}</div><button onClick={() => setShowNewConversation(true)} className="rounded border border-rose-400/60 bg-rose-500/15 px-3 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-400/25"><i className="fas fa-plus mr-1" />新增对话窗口</button><button onClick={() => navigate('/')} className="rounded border border-cyan-400/60 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20">返回驾驶舱 <i className="fas fa-arrow-right ml-1" /></button></div>
                </header>

                {error && <div className="mb-3 border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">{error}</div>}
                <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-auto xl:grid-cols-[1.15fr_1.9fr_1fr] xl:grid-rows-[minmax(0,1fr)] xl:overflow-hidden">
                    <div className="min-h-[900px] xl:h-full xl:min-h-0">
                        <TechFrame title="应急预案完整流程" icon="fa-sitemap"><EmergencyFlowChart event={event} /></TechFrame>
                    </div>

                    <div className="grid min-h-[680px] min-w-0 grid-rows-[1fr_1.05fr] gap-3 xl:min-h-0">
                        <TechFrame title="现场实时画面" icon="fa-video"><div className="flex h-full min-h-0 flex-col"><div className="mb-2 flex gap-2">{[['fixed', '现场视频'], ['drone', '无人机视频']].map(([key, label]) => <button key={key} onClick={() => setVideoSource(key)} className={`border px-4 py-1.5 text-[13px] font-semibold transition ${videoSource === key ? 'border-cyan-200 bg-cyan-400/25 text-white shadow-[0_0_12px_rgba(34,211,238,.18)]' : 'border-blue-300/35 bg-blue-900/20 text-cyan-100/75 hover:border-cyan-300/60'}`}>{label}</button>)}</div><VideoPlaceholder source={videoSource} /></div></TechFrame>
                        <TechFrame title="AI 智能交互与处置指引" icon="fa-comments">{loading ? <EmptyState icon="fa-spinner fa-spin" text="正在加载应急事件" /> : event && ['active', 'recovering', 'closed'].includes(event.status) ? <EmergencyInteraction key={event.id} event={event} onEventChange={(updated) => { setEvent(updated); loadEmergencyEvents().then((result) => setEvents(result.events || [])); }} /> : <EmptyState icon="fa-shield-halved" text={event?.status === 'dismissed' ? `本次险情已排除：${event.rejectionReason}` : event?.status === 'merged' ? `本次报警已并入事件 #${event.mergedIntoId}` : '等待驾驶舱确认突发险情'} />}</TechFrame>
                    </div>

                    <div className="grid min-h-[760px] grid-rows-[1.25fr_.75fr] gap-3 xl:min-h-0">
                        <TechFrame title="现场实时气体检测" icon="fa-wave-square"><div className="space-y-3 overflow-auto pr-1">{readings.length ? readings.map((reading) => <GasReading key={reading.key} reading={reading} />) : <EmptyState icon="fa-plug-circle-xmark" text="暂无气体检测仪数据，请通过应急监测接口接入设备" />}{gas && <div className="border border-cyan-300/35 bg-blue-950/45 p-3 text-[13px] leading-5 text-cyan-50/80"><p className="font-semibold">{gas.deviceName || '气体检测仪'} · {gas.location || '未标注点位'}</p><p className="mt-1 text-cyan-100/60">数据时间：{new Date(gas.measuredAt).toLocaleString('zh-CN', { hour12: false })}</p></div>}</div></TechFrame>
                        <TechFrame title="事故对话与历史" icon="fa-clock-rotate-left"><div className="space-y-2 overflow-auto pr-1">{events.length ? events.map((item) => { const unfinished = ['active', 'recovering'].includes(item.status); return <button key={item.id} onClick={() => selectEvent(item.id)} className={`w-full border p-2.5 text-left text-[13px] transition ${event?.id === item.id ? 'border-cyan-200/75 bg-cyan-400/20 shadow-[inset_3px_0_0_#67e8f9]' : unfinished ? 'border-amber-300/45 bg-amber-400/10 hover:border-amber-200/70' : 'border-blue-300/35 bg-blue-950/35 hover:border-cyan-300/60'}`}><div className="flex items-center justify-between gap-2"><strong className="truncate text-[14px] text-white">#{item.id} {item.title}</strong><span className={unfinished ? 'shrink-0 font-semibold text-amber-100' : 'shrink-0 text-cyan-200/80'}>{STATUS_LABELS[item.status] || item.status}</span></div><div className="mt-1.5 flex items-center justify-between gap-2 text-cyan-50/65"><p className="truncate">{item.location || '未标注位置'} · {new Date(item.createdAt).toLocaleString('zh-CN', { hour12: false })}</p>{unfinished && <span className="shrink-0 font-semibold text-cyan-200">继续处置 <i className="fas fa-angle-right" /></span>}</div></button>; }) : <EmptyState text="暂无应急事件，请新建事故对话或从驾驶舱启动" />}</div></TechFrame>
                    </div>
                </main>
                {showNewConversation && <NewConversationDialog value={newIncident} onChange={setNewIncident} creating={creating} onSubmit={startNewConversation} onClose={() => !creating && setShowNewConversation(false)} />}
            </div>
        </div>
    );
}

function GasReading({ reading }) {
    const ranges = { oxygen: [0, 25], co: [0, 100], h2s: [0, 50], combustible: [0, 100] };
    const [min, max] = ranges[reading.key] || [0, Math.max(Number(reading.threshold) || 100, Number(reading.value) || 0)];
    const value = Number(reading.value);
    const abnormal = reading.key === 'oxygen' ? value < 19.5 || value > 23.5 : Number.isFinite(Number(reading.threshold)) && value > Number(reading.threshold);
    const percent = Math.max(2, Math.min(100, ((value - min) / (max - min || 1)) * 100));
    return <div className={`border p-3.5 shadow-[inset_0_0_18px_rgba(59,130,246,.08)] ${abnormal ? 'border-rose-300/65 bg-rose-500/15' : 'border-cyan-300/35 bg-blue-950/40'}`}><div className="mb-2.5 flex items-center justify-between"><span className="text-[15px] font-black tracking-wide text-white">{reading.label}</span><span className={`font-mono text-base font-bold ${abnormal ? 'text-rose-100' : 'text-white'}`}>{reading.value}<small className="ml-1 text-[11px] font-semibold text-cyan-200">{reading.unit}</small></span></div><div className="h-2.5 overflow-hidden bg-blue-950/80"><div className={`h-full transition-all ${abnormal ? 'bg-gradient-to-r from-rose-500 to-pink-400 shadow-[0_0_12px_#fb7185]' : 'bg-gradient-to-r from-cyan-300 to-blue-400'}`} style={{ width: `${percent}%` }} /></div><div className="mt-2 flex justify-between text-[11px] font-medium text-cyan-100/65"><span>{min}</span><span>{abnormal ? '已超限' : '正常'}</span><span>{max}</span></div></div>;
}

function EmptyState({ icon = 'fa-circle-info', text }) {
    return <div className="flex h-full min-h-32 flex-1 flex-col items-center justify-center border border-dashed border-cyan-300/40 bg-[radial-gradient(circle_at_center,rgba(34,211,238,.16),rgba(8,47,91,.28)_45%,transparent_72%)] p-5 text-center"><i className={`fas ${icon} mb-3 text-3xl text-cyan-200/80 drop-shadow-[0_0_10px_rgba(34,211,238,.55)]`} /><p className="max-w-md text-[13px] font-medium leading-6 text-cyan-50/70">{text}</p></div>;
}

function TechFrame({ title, icon, children }) {
    return <section className="relative flex h-full min-h-0 flex-col overflow-hidden border border-cyan-300/55 bg-[linear-gradient(145deg,rgba(9,55,104,.9),rgba(6,35,76,.86))] p-3.5 shadow-[inset_0_0_32px_rgba(34,211,238,.12),0_0_16px_rgba(14,165,233,.08)]"><div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200 to-transparent shadow-[0_0_9px_#67e8f9]" /><div className="absolute left-0 top-0 h-4 w-4 border-l-[3px] border-t-[3px] border-cyan-100 drop-shadow-[0_0_5px_#22d3ee]" /><div className="absolute bottom-0 right-0 h-4 w-4 border-b-[3px] border-r-[3px] border-cyan-100 drop-shadow-[0_0_5px_#22d3ee]" /><div className="mb-3 flex shrink-0 items-center gap-2.5 border-b border-cyan-300/35 pb-2.5 text-[15px] font-black tracking-wider text-white"><span className="flex h-7 w-7 items-center justify-center rounded-sm bg-cyan-400/15 text-cyan-100 shadow-[inset_0_0_10px_rgba(34,211,238,.18)]"><i className={`fas ${icon}`} /></span>{title}<span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-cyan-200 shadow-[0_0_10px_#67e8f9]" /></div><div className="relative min-h-0 flex-1">{children}</div></section>;
}

function VideoPlaceholder({ source }) {
    const label = source === 'fixed' ? '现场摄像头' : '无人机';
    return <div className="relative flex min-h-0 flex-1 overflow-hidden border border-cyan-300/35 bg-[linear-gradient(145deg,rgba(7,38,82,.56),rgba(8,63,112,.32))] text-center shadow-[inset_0_0_45px_rgba(14,165,233,.12)]"><div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(103,232,249,.14)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,.14)_1px,transparent_1px)] [background-size:32px_32px]" /><div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/15 shadow-[0_0_45px_rgba(34,211,238,.1)]" /><div className="relative m-auto flex max-w-lg flex-col items-center p-6"><span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-200/60 bg-cyan-400/15 text-3xl text-cyan-100 shadow-[0_0_25px_rgba(34,211,238,.3)]"><i className={`fas ${source === 'fixed' ? 'fa-video' : 'fa-helicopter'}`} /></span><h3 className="text-lg font-black tracking-widest text-white">视频信号待接入</h3><p className="mt-2 text-[14px] font-medium leading-6 text-cyan-50/70">{label}尚未配置视频流，完成接入后将在此自动显示实时画面</p><div className="mt-5 flex items-center gap-2 border border-cyan-300/30 bg-blue-950/35 px-4 py-2 text-xs font-semibold text-cyan-100/75"><i className="fas fa-link text-cyan-200" />等待设备配置</div></div></div>;
}

function NewConversationDialog({ value, onChange, creating, onSubmit, onClose }) {
    return <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"><form onSubmit={onSubmit} className="w-full max-w-md border border-cyan-300/60 bg-[#061b3b] p-5 shadow-[0_0_45px_rgba(34,211,238,.22)]"><div className="mb-4 flex items-start justify-between"><div><h2 className="text-lg font-bold text-white"><i className="fas fa-triangle-exclamation mr-2 text-rose-300" />新增事故对话</h2><p className="mt-1 text-xs text-cyan-100/55">新事故将独立建档，可与现有事故并行处置。</p></div><button type="button" onClick={onClose} disabled={creating} className="text-cyan-100/60 hover:text-white"><i className="fas fa-xmark" /></button></div><div className="space-y-3"><Field label="事故标题" value={value.title} onChange={(title) => onChange({ ...value, title })} required /><Field label="事故类型" value={value.incidentType} onChange={(incidentType) => onChange({ ...value, incidentType })} placeholder="例如：人员中毒、火灾、泄漏" /><Field label="事故位置" value={value.location} onChange={(location) => onChange({ ...value, location })} placeholder="例如：1号污水井" /></div><div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={onClose} disabled={creating} className="border border-blue-400/35 px-3 py-2 text-sm text-cyan-100/70">取消</button><button type="submit" disabled={creating} className="border border-rose-300/60 bg-rose-500/20 px-3 py-2 text-sm font-bold text-rose-100 disabled:opacity-50">{creating ? <><i className="fas fa-spinner fa-spin mr-2" />正在启动</> : <><i className="fas fa-bell mr-2" />确认并启动</>}</button></div></form></div>;
}

function Field({ label, value, onChange, placeholder = '', required = false }) {
    return <label className="block text-xs text-cyan-100/70"><span className="mb-1 block">{label}{required && <b className="ml-1 text-rose-300">*</b>}</span><input required={required} value={value} onChange={(inputEvent) => onChange(inputEvent.target.value)} placeholder={placeholder} className="w-full border border-cyan-400/35 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition placeholder:text-cyan-100/25 focus:border-cyan-300" /></label>;
}

function playEmergencyAlarm() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return () => {};
    let stopped = false;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sawtooth';
    oscillator.connect(gain);
    gain.connect(context.destination);
    const start = context.currentTime;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.12, start + 0.08);
    for (let offset = 0; offset < 8; offset += 0.55) {
        oscillator.frequency.setValueAtTime(620, start + offset);
        oscillator.frequency.linearRampToValueAtTime(920, start + offset + 0.42);
    }
    gain.gain.setValueAtTime(0.12, start + 7.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 8);
    oscillator.start(start);
    oscillator.stop(start + 8.05);
    const stop = () => {
        if (stopped) return;
        stopped = true;
        try { oscillator.stop(); } catch { /* oscillator already stopped */ }
        context.close().catch(() => {});
    };
    oscillator.addEventListener('ended', stop, { once: true });
    context.resume().catch(stop);
    return stop;
}
