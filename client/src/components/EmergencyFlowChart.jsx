/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef } from 'react';

const NODES = {
    incident: { x: 175, y: 12, w: 170, h: 42, lines: ['突发险情'] },
    verify: { x: 160, y: 78, w: 200, h: 46, lines: ['智能预判 + 人工核实'] },
    dismissed: { x: 15, y: 147, w: 135, h: 46, lines: ['排除险情', '记录归档'] },
    assess: { x: 205, y: 146, w: 110, h: 62, lines: ['智能研判', '险情大小判断'], diamond: true },
    onsite: { x: 155, y: 236, w: 210, h: 54, lines: ['启动现场处置方案', '初期处置 · 自救 · 互救'] },
    'rescue-non-entry': { lines: ['非进入式救援'], side: 'left' },
    'rescue-entry': { lines: ['进入式救援'], side: 'right' },
    effective: { x: 205, y: 318, w: 110, h: 62, lines: ['处置有效？'], diamond: true },
    special: { x: 330, y: 405, w: 175, h: 54, lines: ['上报升级', '启动专项应急预案'] },
    controlled: { x: 365, y: 487, w: 110, h: 62, lines: ['事态可控？'], diamond: true },
    command: { x: 330, y: 577, w: 175, h: 46, lines: ['上报单位总指挥'] },
    comprehensive: { x: 310, y: 650, w: 195, h: 54, lines: ['启动综合应急预案', '全域统一指挥 · 联动救援'] },
    disposed: { x: 330, y: 733, w: 175, h: 46, lines: ['事故彻底处置完毕'] },
    recovery: { x: 150, y: 805, w: 170, h: 48, lines: ['应急恢复'] },
    end: { x: 170, y: 880, w: 130, h: 44, lines: ['应急结束'] },
    review: { x: 170, y: 950, w: 130, h: 44, lines: ['总结评审'] },
    closed: { x: 170, y: 1020, w: 130, h: 44, lines: ['闭环归档'] },
};

function getFlowState(event) {
    if (!event) return { current: 'incident', overviewCurrent: 'incident', visited: new Set() };
    const stage = event.stage || 'verification';
    const level = event.responseLevel || event.state?.responseLevel || '';
    const rescueMode = event.rescueMode || event.state?.rescueMode || '';
    const rescueNode = rescueMode === '非进入式救援' ? 'rescue-non-entry' : rescueMode === '进入式救援' ? 'rescue-entry' : '';
    const visited = new Set(['incident', 'verify']);
    let current = 'verify';

    if (stage === 'dismissed') return { current: 'dismissed', overviewCurrent: 'dismissed', visited: new Set([...visited, 'dismissed']) };
    if (stage !== 'verification') visited.add('assess');
    if (stage === 'plan') current = 'assess';
    if (['report', 'fence', 'rescue-q1', 'rescue-q2', 'rescue-q3', 'rescue-mode'].includes(stage)) {
        visited.add('onsite');
        current = 'onsite';
    }

    const laterStages = ['control', 'escalate-special', 'escalate-comprehensive', 'recovery', 'end', 'review', 'complete'];
    if (laterStages.includes(stage)) {
        // Every escalation starts from the on-site response. Keep that first
        // executed node marked complete even when the final level is upgraded.
        visited.add('onsite');
        if (rescueNode) visited.add(rescueNode);
        visited.add('effective');
        current = 'effective';
    }
    if (stage === 'escalate-special' || level === 'special' || level === 'comprehensive') {
        visited.add('special');
        current = stage === 'escalate-special' ? 'special' : 'controlled';
    }
    if (level === 'special' || level === 'comprehensive') visited.add('controlled');
    if (stage === 'escalate-comprehensive' || level === 'comprehensive') {
        visited.add('command');
        visited.add('comprehensive');
        current = 'comprehensive';
    }
    if (['recovery', 'end', 'review', 'complete'].includes(stage)) visited.add('disposed');
    if (stage === 'recovery') { visited.add('recovery'); current = 'recovery'; }
    if (stage === 'end') { visited.add('recovery'); visited.add('end'); current = 'end'; }
    if (stage === 'review') { visited.add('recovery'); visited.add('end'); visited.add('review'); current = 'review'; }
    if (stage === 'complete') { ['recovery', 'end', 'review', 'closed'].forEach((id) => visited.add(id)); current = 'closed'; }

    const currentAction = {
        assess: 'verify',
        effective: rescueNode || 'onsite',
        controlled: level === 'comprehensive' ? 'comprehensive' : 'special',
    }[current] || current;
    visited.add(currentAction);
    return { current: currentAction, overviewCurrent: current, visited };
}

export function getEmergencyFlowSnapshot(event) {
    const { current, visited } = getFlowState(event);
    const level = event?.responseLevel || event?.state?.responseLevel || '';
    const showsComprehensive = level === 'comprehensive' || ['command', 'comprehensive'].includes(current);
    const showsSpecial = ['special', 'comprehensive'].includes(level) || ['special', 'command', 'comprehensive'].includes(current);
    const rescueNode = event?.rescueMode === '非进入式救援' || event?.state?.rescueMode === '非进入式救援'
        ? 'rescue-non-entry'
        : event?.rescueMode === '进入式救援' || event?.state?.rescueMode === '进入式救援' ? 'rescue-entry' : '';
    // The competition screen follows only the route actually chosen. The full
    // response level and branch choice stay in event data for the management side.
    const responseNodes = ['onsite', ...(rescueNode ? [rescueNode] : []), ...(showsSpecial ? ['special'] : []), ...(showsComprehensive ? ['command', 'comprehensive'] : [])];
    const flowOrder = current === 'dismissed' ? ['incident', 'verify', 'dismissed'] : ['incident', 'verify', ...responseNodes, 'disposed', 'recovery', 'end', 'review', 'closed'];
    return { current, visited, flowOrder, showsSpecial };
}

const OVERVIEW_NODES = {
    incident: { x: 450, y: 20, w: 220, h: 54, lines: ['突发险情'] },
    verify: { x: 450, y: 105, w: 220, h: 54, lines: ['智能预判 + 人工核实'] },
    dismissed: { x: 55, y: 210, w: 190, h: 62, lines: ['排除险情', '记录归档'] },
    assess: { x: 475, y: 195, w: 170, h: 86, lines: ['智能研判', '险情大小判断'], diamond: true },
    onsite: { x: 425, y: 330, w: 270, h: 66, lines: ['启动现场处置方案', '初期处置 · 自救 · 互救'] },
    'rescue-non-entry': { x: 245, y: 445, w: 210, h: 58, lines: ['非进入式救援'] },
    'rescue-entry': { x: 665, y: 445, w: 210, h: 58, lines: ['进入式救援'] },
    effective: { x: 475, y: 555, w: 170, h: 86, lines: ['处置有效？'], diamond: true },
    special: { x: 800, y: 680, w: 235, h: 66, lines: ['上报升级', '启动专项应急预案'] },
    controlled: { x: 830, y: 800, w: 175, h: 86, lines: ['事态可控？'], diamond: true },
    command: { x: 800, y: 935, w: 235, h: 58, lines: ['上报单位总指挥'] },
    comprehensive: { x: 775, y: 1040, w: 285, h: 70, lines: ['启动综合应急预案', '全域统一指挥 · 联动救援'] },
    disposed: { x: 800, y: 1160, w: 235, h: 58, lines: ['事故彻底处置完毕'] },
    recovery: { x: 440, y: 1275, w: 240, h: 62, lines: ['应急恢复'] },
    end: { x: 460, y: 1385, w: 200, h: 56, lines: ['应急结束'] },
    review: { x: 460, y: 1490, w: 200, h: 56, lines: ['总结评审'] },
    closed: { x: 460, y: 1595, w: 200, h: 56, lines: ['闭环归档'] },
};

const OVERVIEW_EDGES = [
    { from: 'incident', to: 'verify', d: 'M560 74V105' },
    { from: 'verify', to: 'dismissed', d: 'M450 132H150V210', label: '否', lx: 285, ly: 122 },
    { from: 'verify', to: 'assess', d: 'M560 159V195', label: '是', lx: 575, ly: 181 },
    { from: 'assess', to: 'onsite', d: 'M560 281V330', label: '局部小险情', lx: 610, ly: 311 },
    { from: 'onsite', to: 'rescue-non-entry', d: 'M520 396V420H350V445' },
    { from: 'onsite', to: 'rescue-entry', d: 'M600 396V420H770V445' },
    { from: 'onsite', to: 'effective', d: 'M560 396V555', direct: true },
    { from: 'rescue-non-entry', to: 'effective', d: 'M350 503V530H520V555' },
    { from: 'rescue-entry', to: 'effective', d: 'M770 503V530H600V555' },
    { from: 'effective', to: 'recovery', d: 'M475 598H330V1306H440', label: '是', lx: 392, ly: 586, route: 'onsite' },
    { from: 'effective', to: 'special', d: 'M645 598H918V680', label: '否 · 上报升级', lx: 742, ly: 586, route: 'escalated' },
    { from: 'special', to: 'controlled', d: 'M918 746V800' },
    { from: 'controlled', to: 'recovery', d: 'M830 843H735V1306H680', label: '是', lx: 770, ly: 830, route: 'special' },
    { from: 'controlled', to: 'command', d: 'M918 886V935', label: '否', lx: 934, ly: 914, route: 'comprehensive' },
    { from: 'command', to: 'comprehensive', d: 'M918 993V1040' },
    { from: 'comprehensive', to: 'disposed', d: 'M918 1110V1160' },
    { from: 'disposed', to: 'recovery', d: 'M918 1218V1245H560V1275' },
    { from: 'dismissed', to: 'end', d: 'M150 272V1413H460' },
    { from: 'recovery', to: 'end', d: 'M560 1337V1385' },
    { from: 'end', to: 'review', d: 'M560 1441V1490' },
    { from: 'review', to: 'closed', d: 'M560 1546V1595' },
];

export function EmergencyFlowOverview({ event }) {
    const { overviewCurrent: current, visited } = getFlowState(event);
    const isFinished = event?.status === 'closed';
    const rescueMode = event?.rescueMode || event?.state?.rescueMode || '';
    const responseLevel = event?.responseLevel || event?.state?.responseLevel || '';
    const nodeState = (id) => (!isFinished && id === current ? 'current' : visited.has(id) ? 'selected' : 'idle');
    const edgeState = ({ from, to, route }) => {
        if (from === 'onsite' && to === 'effective' && rescueMode) return 'idle';
        if (route === 'onsite' && !['', 'onsite'].includes(responseLevel)) return 'idle';
        if (route === 'escalated' && !['special', 'comprehensive'].includes(responseLevel)) return 'idle';
        if (route === 'special' && responseLevel !== 'special') return 'idle';
        if (route === 'comprehensive' && responseLevel !== 'comprehensive') return 'idle';
        if (!isFinished && to === current && visited.has(from)) return 'current';
        return visited.has(from) && visited.has(to) ? 'selected' : 'idle';
    };
    const palette = {
        current: { stroke: '#fbbf24', fill: '#78350f', text: '#fffbeb', marker: 'url(#overview-arrow-current)' },
        selected: { stroke: '#22d3ee', fill: '#083344', text: '#ecfeff', marker: 'url(#overview-arrow-selected)' },
        idle: { stroke: '#64748b', fill: '#0f172a', text: '#94a3b8', marker: 'url(#overview-arrow-idle)' },
    };

    return <div className="flex h-full min-h-0 flex-col">
        <div className="mb-3 flex shrink-0 flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-cyan-50/75">
            <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_8px_#fbbf24]" />当前步骤</span>
            <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_7px_#22d3ee]" />已选择 / 已走流程</span>
            <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-slate-500" />未走流程</span>
        </div>
        <div className="min-h-0 flex-1 overflow-auto rounded border border-cyan-300/20 bg-slate-950/35 p-3 [scrollbar-color:#22d3ee_#06234c] [scrollbar-width:thin]">
            <svg viewBox="0 0 1120 1680" className="mx-auto block h-auto min-w-[720px] max-w-[1120px]" role="img" aria-label="完整应急处置流程总览">
                <defs>
                    {[['current', '#fbbf24'], ['selected', '#22d3ee'], ['idle', '#64748b']].map(([id, color]) => <marker key={id} id={`overview-arrow-${id}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill={color} /></marker>)}
                    <filter id="overview-glow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>
                {OVERVIEW_EDGES.map((edge) => { const state = edgeState(edge); const colors = palette[state]; return <g key={`${edge.from}-${edge.to}`}>
                    <path d={edge.d} fill="none" stroke={colors.stroke} strokeWidth={state === 'idle' ? 2 : 3} strokeDasharray={state === 'idle' ? '8 7' : undefined} opacity={state === 'idle' ? .48 : .95} markerEnd={colors.marker} filter={state === 'current' ? 'url(#overview-glow)' : undefined} />
                    {edge.label && <text x={edge.lx} y={edge.ly} fill={state === 'idle' ? '#64748b' : colors.stroke} fontSize="17" fontWeight="700" textAnchor="middle">{edge.label}</text>}
                </g>; })}
                {Object.entries(OVERVIEW_NODES).map(([id, node]) => { const state = nodeState(id); const colors = palette[state]; const points = node.diamond ? `${node.x + node.w / 2},${node.y} ${node.x + node.w},${node.y + node.h / 2} ${node.x + node.w / 2},${node.y + node.h} ${node.x},${node.y + node.h / 2}` : null; return <g key={id} filter={state === 'current' ? 'url(#overview-glow)' : undefined}>
                    {node.diamond ? <polygon points={points} fill={colors.fill} stroke={colors.stroke} strokeWidth={state === 'idle' ? 2 : 3} opacity={state === 'idle' ? .62 : 1} /> : <rect x={node.x} y={node.y} width={node.w} height={node.h} rx="7" fill={colors.fill} stroke={colors.stroke} strokeWidth={state === 'idle' ? 2 : 3} opacity={state === 'idle' ? .62 : 1} />}
                    {node.lines.map((line, index) => <text key={line} x={node.x + node.w / 2} y={node.y + node.h / 2 + (index - (node.lines.length - 1) / 2) * 23 + 6} fill={colors.text} fontSize="18" fontWeight="700" textAnchor="middle">{line}</text>)}
                    {state === 'selected' && <circle cx={node.x + 15} cy={node.y + 15} r="6" fill="#67e8f9" />}
                    {state === 'current' && <><circle cx={node.x + 16} cy={node.y + 16} r="8" fill="#fbbf24" /><circle cx={node.x + 16} cy={node.y + 16} r="13" fill="none" stroke="#fde68a" strokeWidth="2" opacity=".8" /></>}
                </g>; })}
            </svg>
        </div>
    </div>;
}

export default function EmergencyFlowChart({ event }) {
    const { current, visited, flowOrder, showsSpecial } = getEmergencyFlowSnapshot(event);
    const scrollRef = useRef(null);
    const nodeRefs = useRef(new Map());
    const isFinished = event?.status === 'closed';

    useEffect(() => {
        const container = scrollRef.current;
        const node = nodeRefs.current.get(current);
        if (!container || !node) return;
        const targetTop = node.offsetTop - container.clientHeight / 2 + node.clientHeight / 2;
        container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    }, [current]);

    return <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="mb-2 flex shrink-0 items-center justify-center gap-4 border-b border-cyan-400/20 pb-2 text-[12px] font-semibold text-cyan-50/70"><span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_10px_#fbbf24]" />当前节点</span><span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]" />已完成</span></div>
        <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-8 pt-2 [scrollbar-color:#22d3ee_#06234c] [scrollbar-width:thin]" role="list" aria-label="应急处置流程">
            {flowOrder.map((id, index) => {
                const node = NODES[id];
                const state = isFinished && visited.has(id) ? 'done' : id === current ? 'current' : visited.has(id) ? 'done' : 'idle';
                const connectorState = id === current ? 'current' : visited.has(id) && visited.has(flowOrder[index + 1]) ? 'done' : 'idle';
                const branchSide = node.side || (['special', 'command', 'comprehensive'].includes(id) ? 'right' : id === 'recovery' && !showsSpecial ? 'left' : 'center');
                const alignment = branchSide === 'left' ? 'items-start pr-7' : branchSide === 'right' ? 'items-end pl-7' : 'items-center';
                return <div key={id} ref={(element) => element ? nodeRefs.current.set(id, element) : nodeRefs.current.delete(id)} className={`flex flex-col ${alignment}`} role="listitem">
                    <div className={`relative w-full border px-3 py-3 text-center text-[15px] font-bold leading-6 tracking-wide transition-all duration-500 ${state === 'current' ? 'animate-pulse border-amber-300 bg-amber-500/20 text-amber-50 shadow-[inset_0_0_18px_rgba(251,191,36,.18),0_0_18px_rgba(251,191,36,.5)]' : state === 'done' ? 'border-cyan-300/90 bg-cyan-500/15 text-cyan-50 shadow-[inset_0_0_16px_rgba(34,211,238,.14),0_0_10px_rgba(34,211,238,.2)]' : 'border-slate-500/45 bg-slate-950/25 text-slate-300/60'}`} style={{ clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)' }}>
                        {state === 'current' && <span className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-amber-200 shadow-[0_0_10px_#fbbf24]" />}
                        {state === 'done' && <i className="fas fa-check mr-2 text-cyan-200" />}
                        {state === 'idle' && <i className="fas fa-xmark mr-2 text-slate-400/70" />}
                        {node.lines.join(' · ')}
                    </div>
                    {index < flowOrder.length - 1 && <div className={`h-6 border-l-2 ${branchSide === 'left' ? 'ml-[calc(50%+14px)]' : branchSide === 'right' ? 'mr-[calc(50%+14px)]' : ''} ${connectorState === 'current' ? 'border-solid animate-pulse border-amber-300 shadow-[0_0_8px_#fbbf24]' : connectorState === 'done' ? 'border-solid border-cyan-300 shadow-[0_0_6px_#22d3ee]' : 'border-dashed border-slate-500/45'}`} />}
                </div>;
            })}
        </div>
    </div>;
}
