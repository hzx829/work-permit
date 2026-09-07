import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import EmergencyInteraction from '../components/EmergencyInteraction';
import { getEmergencyEvent, loadEmergencyEvents, loadEmergencyMonitoring } from '../utils/api';

const FLOW_STEPS = [
    { label: '智能预判与人工核实', stages: ['verification'] },
    { label: '智能研判与预案选择', stages: ['plan'] },
    { label: '险情播报与先期处置', stages: ['report', 'fence'] },
    { label: '救援条件确认', stages: ['rescue-q1', 'rescue-q2', 'rescue-q3'] },
    { label: '现场救援与效果判断', stages: ['control'] },
    { label: '上报升级与统一指挥', stages: ['escalate-special', 'escalate-comprehensive'] },
    { label: '应急恢复', stages: ['recovery'] },
    { label: '应急结束', stages: ['end'] },
    { label: '总结评审', stages: ['review', 'complete'] },
];

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

    const activeStep = useMemo(() => {
        const index = FLOW_STEPS.findIndex((item) => item.stages.includes(event?.stage));
        return index < 0 ? 0 : index;
    }, [event?.stage]);
    const gas = event?.gas || monitoring?.gas;
    const readings = gas?.readings || [];

    const selectEvent = async (id) => {
        setLoading(true);
        await loadData(id);
    };

    return (
        <div className="h-full min-h-0 overflow-auto bg-[#020817] p-3 text-cyan-50 selection:bg-cyan-500/50 xl:overflow-hidden">
            <div className="mx-auto flex min-h-full max-w-[1800px] flex-col bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,.18),transparent_38%),linear-gradient(115deg,#020817,#061b3b)] p-3 shadow-[0_0_70px_rgba(14,165,233,.15)] xl:h-full xl:min-h-0">
                <header className="relative mb-3 flex min-h-16 shrink-0 items-center justify-between overflow-hidden border-y border-cyan-400/35 px-5">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(14,165,233,.1),transparent)]" />
                    <div className="relative"><p className="text-xs tracking-[.35em] text-cyan-300/70">EMERGENCY COMMAND CENTER</p><div className="mt-1 flex items-center gap-3"><h1 className="text-2xl font-black tracking-[.16em] text-white md:text-3xl">应急处置管理</h1>{event && <span className={`border px-2 py-1 text-xs ${event.status === 'closed' ? 'border-emerald-400/40 text-emerald-200' : 'border-rose-400/50 bg-rose-500/10 text-rose-200'}`}>#{event.id} {STATUS_LABELS[event.status] || event.status}</span>}</div></div>
                    <div className="relative flex items-center gap-4 text-right"><div className="hidden text-xs text-cyan-200/80 md:block">{now.toLocaleString('zh-CN', { hour12: false })}</div><button onClick={() => navigate('/')} className="rounded border border-cyan-400/60 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20">返回驾驶舱 <i className="fas fa-arrow-right ml-1" /></button></div>
                </header>

                {error && <div className="mb-3 border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">{error}</div>}
                <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-auto xl:grid-cols-[1.05fr_1.9fr_1fr] xl:grid-rows-[minmax(0,1fr)] xl:overflow-hidden">
                    <div className="grid min-h-[620px] grid-rows-[1fr_.72fr] gap-3 xl:min-h-0">
                        <TechFrame title="应急处置流程" icon="fa-sitemap"><div className="space-y-2 overflow-auto pr-1">{FLOW_STEPS.map((step, index) => {
                            const active = activeStep === index;
                            const done = index < activeStep || event?.status === 'closed';
                            return <div key={step.label} className={`flex w-full items-center gap-3 border px-3 py-2 text-left ${active ? 'border-cyan-300 bg-cyan-400/20 text-white shadow-[0_0_18px_rgba(34,211,238,.25)]' : done ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100' : 'border-blue-500/25 bg-blue-950/25 text-cyan-100/65'}`}><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${active ? 'bg-cyan-300 text-slate-950' : done ? 'bg-emerald-400 text-slate-950' : 'bg-blue-900 text-cyan-300'}`}>{done ? <i className="fas fa-check text-[10px]" /> : index + 1}</span><span className="text-xs font-medium">{step.label}</span></div>;
                        })}</div></TechFrame>
                        <TechFrame title="历史应急处置" icon="fa-clock-rotate-left"><div className="space-y-2 overflow-auto pr-1">{events.length ? events.map((item) => <button key={item.id} onClick={() => selectEvent(item.id)} className={`w-full border p-2 text-left text-xs transition ${event?.id === item.id ? 'border-cyan-300/60 bg-cyan-500/15' : 'border-blue-400/25 bg-slate-950/35 hover:border-cyan-400/50'}`}><div className="flex items-center justify-between"><strong>#{item.id} {item.title}</strong><span className="text-cyan-300/70">{STATUS_LABELS[item.status] || item.status}</span></div><p className="mt-1 truncate text-cyan-100/55">{item.location || '未标注位置'} · {new Date(item.createdAt).toLocaleString('zh-CN', { hour12: false })}</p></button>) : <EmptyState text="暂无应急事件，请从驾驶舱报警窗确认启动" />}</div></TechFrame>
                    </div>

                    <div className="grid min-h-[680px] min-w-0 grid-rows-[1fr_1.05fr] gap-3 xl:min-h-0">
                        <TechFrame title="现场实时画面" icon="fa-video"><div className="flex h-full min-h-0 flex-col"><div className="mb-2 flex gap-2">{[['fixed', '现场视频'], ['drone', '无人机视频']].map(([key, label]) => <button key={key} onClick={() => setVideoSource(key)} className={`border px-3 py-1 text-xs ${videoSource === key ? 'border-cyan-300 bg-cyan-400/20 text-white' : 'border-blue-400/30 text-cyan-200/70'}`}>{label}</button>)}</div><EmptyState icon={videoSource === 'fixed' ? 'fa-video' : 'fa-helicopter'} text={`${videoSource === 'fixed' ? '现场摄像头' : '无人机'}尚未配置视频流，接入后可在此实时切换`} /></div></TechFrame>
                        <TechFrame title="AI 智能交互与处置指引" icon="fa-comments">{loading ? <EmptyState icon="fa-spinner fa-spin" text="正在加载应急事件" /> : event && ['active', 'recovering', 'closed'].includes(event.status) ? <EmergencyInteraction key={event.id} event={event} onEventChange={(updated) => { setEvent(updated); loadEmergencyEvents().then((result) => setEvents(result.events || [])); }} /> : <EmptyState icon="fa-shield-halved" text={event?.status === 'dismissed' ? `本次险情已排除：${event.rejectionReason}` : event?.status === 'merged' ? `本次报警已并入事件 #${event.mergedIntoId}` : '等待驾驶舱确认突发险情'} />}</TechFrame>
                    </div>

                    <TechFrame title="现场实时气体检测" icon="fa-wave-square"><div className="space-y-3 overflow-auto pr-1">{readings.length ? readings.map((reading) => <GasReading key={reading.key} reading={reading} />) : <EmptyState icon="fa-plug-circle-xmark" text="暂无气体检测仪数据，请通过应急监测接口接入设备" />}{gas && <div className="border border-cyan-400/25 bg-slate-950/45 p-3 text-xs text-cyan-100/70"><p>{gas.deviceName || '气体检测仪'} · {gas.location || '未标注点位'}</p><p className="mt-1">数据时间：{new Date(gas.measuredAt).toLocaleString('zh-CN', { hour12: false })}</p></div>}</div></TechFrame>
                </main>
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
    return <div className={`border p-3 ${abnormal ? 'border-rose-400/55 bg-rose-500/10' : 'border-blue-400/25 bg-slate-950/45'}`}><div className="mb-2 flex items-center justify-between"><span className="text-sm font-bold">{reading.label}</span><span className={`font-mono text-sm ${abnormal ? 'text-rose-200' : 'text-white'}`}>{reading.value}<small className="ml-1 text-[10px] text-cyan-300">{reading.unit}</small></span></div><div className="h-2 overflow-hidden bg-blue-950"><div className={`h-full transition-all ${abnormal ? 'bg-rose-500 shadow-[0_0_12px_#fb7185]' : 'bg-gradient-to-r from-cyan-400 to-blue-500'}`} style={{ width: `${percent}%` }} /></div><div className="mt-2 flex justify-between text-[10px] text-cyan-300/55"><span>{min}</span><span>{abnormal ? '已超限' : '正常'}</span><span>{max}</span></div></div>;
}

function EmptyState({ icon = 'fa-circle-info', text }) {
    return <div className="flex h-full min-h-32 flex-1 flex-col items-center justify-center border border-dashed border-cyan-400/25 bg-[radial-gradient(circle_at_center,rgba(14,165,233,.1),transparent_62%)] p-5 text-center"><i className={`fas ${icon} mb-3 text-2xl text-cyan-300/70`} /><p className="max-w-md text-xs leading-5 text-cyan-100/60">{text}</p></div>;
}

function TechFrame({ title, icon, children }) {
    return <section className="relative flex min-h-0 flex-col overflow-hidden border border-cyan-400/40 bg-[#061b3b]/70 p-3 shadow-[inset_0_0_25px_rgba(14,165,233,.08)]"><div className="absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-cyan-200" /><div className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-cyan-200" /><div className="mb-3 flex shrink-0 items-center gap-2 border-b border-cyan-400/25 pb-2 text-sm font-bold tracking-wider text-cyan-100"><i className={`fas ${icon} text-cyan-300`} />{title}<span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]" /></div><div className="min-h-0 flex-1">{children}</div></section>;
}
