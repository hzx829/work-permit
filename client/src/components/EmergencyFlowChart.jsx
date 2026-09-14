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
    if (!event) return { current: 'incident', visited: new Set() };
    const stage = event.stage || 'verification';
    const level = event.responseLevel || event.state?.responseLevel || '';
    const rescueMode = event.rescueMode || event.state?.rescueMode || '';
    const rescueNode = rescueMode === '非进入式救援' ? 'rescue-non-entry' : rescueMode === '进入式救援' ? 'rescue-entry' : '';
    const visited = new Set(['incident', 'verify']);
    let current = 'verify';

    if (stage === 'dismissed') return { current: 'dismissed', visited: new Set([...visited, 'dismissed']) };
    if (stage !== 'verification') visited.add('assess');
    if (stage === 'plan') current = 'assess';
    if (['report', 'fence', 'rescue-q1', 'rescue-q2', 'rescue-q3', 'rescue-mode'].includes(stage)) {
        visited.add('onsite');
        current = 'onsite';
    }

    const laterStages = ['control', 'escalate-special', 'escalate-comprehensive', 'recovery', 'end', 'review', 'complete'];
    if (laterStages.includes(stage)) {
        if (level === 'onsite' || !level) visited.add('onsite');
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
    return { current: currentAction, visited };
}

export default function EmergencyFlowChart({ event }) {
    const { current, visited } = getFlowState(event);
    const scrollRef = useRef(null);
    const nodeRefs = useRef(new Map());
    const level = event?.responseLevel || event?.state?.responseLevel || '';
    const showsComprehensive = level === 'comprehensive' || ['command', 'comprehensive'].includes(current);
    const showsSpecial = ['special', 'comprehensive'].includes(level) || ['special', 'command', 'comprehensive'].includes(current);
    const rescueNode = event?.rescueMode === '非进入式救援' || event?.state?.rescueMode === '非进入式救援'
        ? 'rescue-non-entry'
        : event?.rescueMode === '进入式救援' || event?.state?.rescueMode === '进入式救援' ? 'rescue-entry' : '';
    const responseNodes = ['onsite', ...(rescueNode ? [rescueNode] : []), ...(showsSpecial ? ['special'] : []), ...(showsComprehensive ? ['command', 'comprehensive'] : [])];
    const flowOrder = current === 'dismissed' ? ['incident', 'verify', 'dismissed'] : ['incident', 'verify', ...responseNodes, 'disposed', 'recovery', 'end', 'review', 'closed'];

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
                const state = id === current ? 'current' : visited.has(id) ? 'done' : 'idle';
                const connectorState = id === current ? 'current' : visited.has(id) && visited.has(flowOrder[index + 1]) ? 'done' : 'idle';
                const branchSide = node.side || (['special', 'command', 'comprehensive'].includes(id) ? 'right' : id === 'recovery' && !showsSpecial ? 'left' : 'center');
                const alignment = branchSide === 'left' ? 'items-start pr-7' : branchSide === 'right' ? 'items-end pl-7' : 'items-center';
                return <div key={id} ref={(element) => element ? nodeRefs.current.set(id, element) : nodeRefs.current.delete(id)} className={`flex flex-col ${alignment}`} role="listitem">
                    <div className={`relative w-full border px-3 py-3 text-center text-[15px] font-bold leading-6 tracking-wide transition-all duration-500 ${state === 'current' ? 'animate-pulse border-amber-300 bg-amber-500/20 text-amber-50 shadow-[inset_0_0_18px_rgba(251,191,36,.18),0_0_18px_rgba(251,191,36,.5)]' : state === 'done' ? 'border-cyan-300/90 bg-cyan-500/15 text-cyan-50 shadow-[inset_0_0_16px_rgba(34,211,238,.14),0_0_10px_rgba(34,211,238,.2)]' : 'border-blue-500/45 bg-blue-950/35 text-blue-100/65'}`} style={{ clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)' }}>
                        {state === 'current' && <span className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-amber-200 shadow-[0_0_10px_#fbbf24]" />}
                        {node.lines.join(' · ')}
                    </div>
                    {index < flowOrder.length - 1 && <div className={`h-6 border-l-2 border-dashed ${branchSide === 'left' ? 'ml-[calc(50%+14px)]' : branchSide === 'right' ? 'mr-[calc(50%+14px)]' : ''} ${connectorState === 'current' ? 'animate-pulse border-amber-300 shadow-[0_0_8px_#fbbf24]' : connectorState === 'done' ? 'border-cyan-300 shadow-[0_0_6px_#22d3ee]' : 'border-blue-600/45'}`} />}
                </div>;
            })}
        </div>
    </div>;
}
import { useEffect, useRef } from 'react';
