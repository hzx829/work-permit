import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmergencyInteraction from '../components/EmergencyInteraction';

const FLOW_STEPS = ['应急响应启动', '信息报告与先期处置', '现场警戒', '救援防护', '伤员救治', '应急指挥', '善后处置', '应急终止', '总结评估'];
const INITIAL_METRICS = [
    { key: 'temperature', label: '温度', unit: '°C', value: 25.8, min: 0, max: 50, color: 'from-lime-400 to-green-500' },
    { key: 'co2', label: '二氧化碳浓度', unit: 'ppm', value: 680, min: 0, max: 2000, color: 'from-cyan-400 to-blue-500' },
    { key: 'oxygen', label: '氧气浓度', unit: '%VOL', value: 20.9, min: 0, max: 25, color: 'from-violet-400 to-fuchsia-500' },
    { key: 'co', label: '一氧化碳浓度', unit: 'ppm', value: 4.2, min: 0, max: 50, color: 'from-orange-300 to-red-500' },
    { key: 'humidity', label: '湿度', unit: '%RH', value: 62, min: 0, max: 100, color: 'from-sky-400 to-indigo-500' }
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export default function Emergency() {
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState(INITIAL_METRICS);
    const [activeStep, setActiveStep] = useState(0);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
            setMetrics((current) => current.map((metric) => {
                const variation = metric.key === 'co2' ? 35 : metric.key === 'oxygen' ? 0.08 : metric.key === 'co' ? 0.8 : metric.key === 'humidity' ? 1.5 : 0.35;
                const next = clamp(metric.value + (Math.random() - 0.5) * variation, metric.min, metric.max);
                return { ...metric, value: Number(next.toFixed(metric.key === 'oxygen' || metric.key === 'temperature' || metric.key === 'co' ? 1 : 0)) };
            }));
        }, 2200);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="h-full min-h-0 overflow-auto bg-[#020817] p-4 text-cyan-50 selection:bg-cyan-500/50 xl:overflow-hidden">
            <div className="mx-auto flex min-h-full max-w-[1700px] flex-col bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,.18),transparent_38%),linear-gradient(115deg,#020817,#061b3b)] p-4 shadow-[0_0_70px_rgba(14,165,233,.15)] xl:h-full xl:min-h-0">
                <header className="relative mb-4 flex min-h-16 shrink-0 items-center justify-between overflow-hidden border-y border-cyan-400/35 px-5">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(14,165,233,.1),transparent)]" />
                    <div className="relative"><p className="text-xs tracking-[.35em] text-cyan-300/70">EMERGENCY COMMAND CENTER</p><h1 className="mt-1 text-2xl font-black tracking-[.16em] text-white md:text-3xl">应急处置管理</h1></div>
                    <div className="relative flex items-center gap-4 text-right"><div className="hidden text-xs text-cyan-200/80 md:block">{now.toLocaleString('zh-CN', { hour12: false })}</div><button onClick={() => navigate('/')} className="rounded border border-cyan-400/60 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20">返回驾驶舱 <i className="fas fa-arrow-right ml-1" /></button></div>
                </header>

                <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-auto xl:grid-cols-[1fr_1.8fr_1fr] xl:grid-rows-[minmax(0,1fr)] xl:overflow-hidden">
                    <TechFrame title="应急处置流程" icon="fa-sitemap"><div className="space-y-2 overflow-auto pr-1">{FLOW_STEPS.map((step, index) => {
                        const active = activeStep === index;
                        return <button key={step} type="button" onClick={() => setActiveStep(index)} className={`group flex w-full items-center gap-3 border px-3 py-2.5 text-left transition ${active ? 'border-cyan-300 bg-cyan-400/20 text-white shadow-[0_0_18px_rgba(34,211,238,.35)]' : 'border-blue-500/30 bg-blue-950/30 text-cyan-100/80 hover:border-cyan-400/70 hover:bg-cyan-500/10'}`}><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${active ? 'bg-cyan-300 text-slate-950' : 'bg-blue-900 text-cyan-300'}`}>{index + 1}</span><span className="text-sm font-medium">{step}</span>{active && <i className="fas fa-chevron-right ml-auto text-xs text-cyan-300" />}</button>;
                    })}</div></TechFrame>

                    <div className="grid min-h-[620px] min-w-0 grid-rows-[1.12fr_.88fr] gap-4 xl:min-h-0 xl:grid-rows-[minmax(0,1.12fr)_minmax(0,.88fr)]">
                        <TechFrame title="现场实时画面" icon="fa-video"><Placeholder icon="fa-video" title="视频接入预留区域" text="现场视频 / 无人机视频将在后续设备接入后显示" /></TechFrame>
                        <TechFrame title="智能交互对话 · 固定规则引导" icon="fa-comments"><EmergencyInteraction onStepChange={setActiveStep} /></TechFrame>
                    </div>

                    <TechFrame title="气体检测仪" icon="fa-wave-square"><div className="space-y-3 overflow-auto pr-1">{metrics.map((metric) => {
                        const percent = ((metric.value - metric.min) / (metric.max - metric.min)) * 100;
                        return <div key={metric.key} className="border border-blue-400/25 bg-slate-950/45 p-3"><div className="mb-2 flex items-center justify-between"><span className="text-sm font-bold text-cyan-100">{metric.label}</span><span className="font-mono text-sm text-white">{metric.value}<small className="ml-1 text-[10px] text-cyan-300">{metric.unit}</small></span></div><div className="h-2 overflow-hidden bg-blue-950"><div className={`h-full bg-gradient-to-r ${metric.color} shadow-[0_0_12px_rgba(34,211,238,.9)] transition-all duration-700`} style={{ width: `${clamp(percent, 2, 100)}%` }} /></div><div className="mt-2 flex justify-between text-[10px] text-cyan-300/55"><span>{metric.min}</span><span>实时监测</span><span>{metric.max}</span></div></div>;
                    })}<div className="border border-emerald-400/30 bg-emerald-500/10 p-3 text-xs text-emerald-200"><i className="fas fa-circle mr-2 animate-pulse text-[8px]" />仪表状态正常 · 数据持续刷新</div></div></TechFrame>
                </main>
            </div>
        </div>
    );
}

function Placeholder({ icon, title, text }) {
    return <div className="flex h-full flex-col items-center justify-center border border-dashed border-cyan-400/30 bg-[radial-gradient(circle_at_center,rgba(14,165,233,.12),transparent_62%)] text-center"><div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-400/10 text-2xl text-cyan-300"><i className={`fas ${icon}`} /></div><p className="font-semibold tracking-wider text-cyan-50">{title}</p><p className="mt-2 text-xs text-cyan-200/60">{text}</p></div>;
}

function TechFrame({ title, icon, children }) {
    return <section className="relative flex min-h-0 flex-col overflow-hidden border border-cyan-400/40 bg-[#061b3b]/70 p-3 shadow-[inset_0_0_25px_rgba(14,165,233,.08)]"><div className="absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-cyan-200" /><div className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-cyan-200" /><div className="mb-3 flex shrink-0 items-center gap-2 border-b border-cyan-400/25 pb-2 text-sm font-bold tracking-wider text-cyan-100"><i className={`fas ${icon} text-cyan-300`} />{title}<span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]" /></div><div className="min-h-0 flex-1">{children}</div></section>;
}
