const NODES = {
    incident: { x: 175, y: 12, w: 170, h: 42, lines: ['突发险情'] },
    verify: { x: 160, y: 78, w: 200, h: 46, lines: ['智能预判 + 人工核实'] },
    dismissed: { x: 15, y: 147, w: 135, h: 46, lines: ['排除险情', '记录归档'] },
    assess: { x: 205, y: 146, w: 110, h: 62, lines: ['智能研判', '险情大小判断'], diamond: true },
    onsite: { x: 155, y: 236, w: 210, h: 54, lines: ['启动现场处置方案', '初期处置 · 自救 · 互救'] },
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

const EDGES = [
    ['incident', 'verify', 'M260 54V78'],
    ['verify', 'assess', 'M260 124V146'],
    ['verify', 'dismissed', 'M160 101H82V147', '否', 112, 92],
    ['assess', 'onsite', 'M260 208V236', '启动险情', 298, 222],
    ['onsite', 'effective', 'M260 290V318'],
    ['effective', 'recovery', 'M205 349H120V829H150', '是', 130, 338],
    ['effective', 'special', 'M315 349H418V405', '否', 377, 340],
    ['special', 'controlled', 'M418 459V487'],
    ['controlled', 'recovery', 'M365 518H280V805', '是', 292, 508],
    ['controlled', 'command', 'M475 518H492V577', '否', 482, 508],
    ['command', 'comprehensive', 'M418 623V650'],
    ['comprehensive', 'disposed', 'M418 704V733'],
    ['disposed', 'recovery', 'M330 756H280V805'],
    ['dismissed', 'recovery', 'M82 193V829H150'],
    ['recovery', 'end', 'M235 853V880'],
    ['end', 'review', 'M235 924V950'],
    ['review', 'closed', 'M235 994V1020'],
];

function getFlowState(event) {
    if (!event) return { current: 'incident', visited: new Set() };
    const stage = event.stage || 'verification';
    const level = event.responseLevel || event.state?.responseLevel || '';
    const visited = new Set(['incident', 'verify']);
    let current = 'verify';

    if (stage === 'dismissed') return { current: 'dismissed', visited: new Set([...visited, 'dismissed']) };
    if (stage !== 'verification') visited.add('assess');
    if (stage === 'plan') current = 'assess';
    if (['report', 'fence', 'rescue-q1', 'rescue-q2', 'rescue-q3'].includes(stage)) {
        visited.add('onsite');
        current = 'onsite';
    }

    const laterStages = ['control', 'escalate-special', 'escalate-comprehensive', 'recovery', 'end', 'review', 'complete'];
    if (laterStages.includes(stage)) {
        if (level === 'onsite' || !level) visited.add('onsite');
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
    if (level === 'comprehensive' && ['recovery', 'end', 'review', 'complete'].includes(stage)) visited.add('disposed');
    if (stage === 'recovery') { visited.add('recovery'); current = 'recovery'; }
    if (stage === 'end') { visited.add('recovery'); visited.add('end'); current = 'end'; }
    if (stage === 'review') { visited.add('recovery'); visited.add('end'); visited.add('review'); current = 'review'; }
    if (stage === 'complete') { ['recovery', 'end', 'review', 'closed'].forEach((id) => visited.add(id)); current = 'closed'; }

    visited.add(current);
    return { current, visited };
}

export default function EmergencyFlowChart({ event }) {
    const { current, visited } = getFlowState(event);
    return <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="mb-1 flex shrink-0 items-center justify-center gap-4 text-[10px] text-cyan-100/55"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]" />当前节点</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />已走路径</span></div>
        <div className="relative min-h-0 flex-1 overflow-hidden">
        <svg viewBox="0 0 520 1080" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" role="img" aria-label="完整应急预案流程图">
            <defs>
                <filter id="activeGlow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                <marker id="arrowIdle" markerWidth="7" markerHeight="7" refX="6.4" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#2563eb" /></marker>
                <marker id="arrowDone" markerWidth="7" markerHeight="7" refX="6.4" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#34d399" /></marker>
            </defs>
            {EDGES.map(([from, to, d, label, lx, ly]) => {
                const done = visited.has(from) && visited.has(to);
                return <g key={`${from}-${to}`}><path d={d} fill="none" stroke={done ? '#34d399' : '#2563eb'} strokeWidth={done ? 3 : 2} opacity={done ? 1 : .55} markerEnd={`url(#${done ? 'arrowDone' : 'arrowIdle'})`} />{label && <EdgeLabel text={label} x={lx} y={ly} done={done} />}</g>;
            })}
            {Object.entries(NODES).map(([id, node]) => <FlowNode key={id} node={node} state={id === current ? 'current' : visited.has(id) ? 'done' : 'idle'} />)}
            <g transform="translate(325 805)">
                <rect width="180" height="118" rx="5" fill="#061b3b" stroke={visited.has('recovery') ? '#34d399' : '#2563eb'} opacity=".95" />
                {['现场清理', '警戒解除', '善后处理', '事故调查'].map((text, index) => <text key={text} x="90" y={22 + index * 26} fill={visited.has('recovery') ? '#a7f3d0' : '#93c5fd'} fontSize="14" fontWeight="500" textAnchor="middle" dominantBaseline="middle">{text}</text>)}
            </g>
        </svg>
        </div>
    </div>;
}

function FlowNode({ node, state }) {
    const stroke = state === 'current' ? '#67e8f9' : state === 'done' ? '#34d399' : '#2563eb';
    const fill = state === 'current' ? '#0e7490' : state === 'done' ? '#064e3b' : '#071c46';
    const shape = node.diamond
        ? <polygon points={`${node.x + node.w / 2},${node.y} ${node.x + node.w},${node.y + node.h / 2} ${node.x + node.w / 2},${node.y + node.h} ${node.x},${node.y + node.h / 2}`} fill={fill} stroke={stroke} strokeWidth={state === 'current' ? 3 : 2} />
        : <rect x={node.x} y={node.y} width={node.w} height={node.h} rx="5" fill={fill} stroke={stroke} strokeWidth={state === 'current' ? 3 : 2} />;
    const centerX = node.x + node.w / 2;
    const centerY = node.y + node.h / 2;
    const lineGap = node.diamond ? 16 : 18;
    const fontSize = node.diamond ? 14 : 15;
    return <g filter={state === 'current' ? 'url(#activeGlow)' : undefined}>{shape}{node.lines.map((line, index) => <text key={line} x={centerX} y={centerY + (index - (node.lines.length - 1) / 2) * lineGap} fill={state === 'idle' ? '#d5e6ff' : '#ecfeff'} fontSize={fontSize} fontWeight={state === 'current' ? '700' : '600'} textAnchor="middle" dominantBaseline="middle">{line}</text>)}</g>;
}

function EdgeLabel({ text, x, y, done }) {
    const width = Math.max(26, text.length * 15 + 12);
    return <g><rect x={x - width / 2} y={y - 11} width={width} height="22" rx="4" fill="#061b3b" fillOpacity=".96" /><text x={x} y={y} fill={done ? '#a7f3d0' : '#67e8f9'} fontSize="14" fontWeight="600" textAnchor="middle" dominantBaseline="middle">{text}</text></g>;
}
