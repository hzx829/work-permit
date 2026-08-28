import { useCallback, useEffect, useRef, useState } from 'react';

const INITIAL_PROMPT = '已确认突发险情。系统已匹配企业现有应急预案，请选择本次响应方案。';
const DEFAULT_BROADCAST = '1号污水井内有人晕倒，无关人员请勿靠近。';

const PLAN_LEVELS = {
    '现场处置方案（推荐）': 'onsite',
    '受限空间专项应急预案': 'special',
    '综合应急预案': 'comprehensive',
};

export default function EmergencyInteraction({ onStepChange }) {
    const [stage, setStage] = useState('plan');
    const [messages, setMessages] = useState([{ id: 1, role: 'assistant', text: INITIAL_PROMPT }]);
    const [responseLevel, setResponseLevel] = useState('onsite');
    const [rescueMode, setRescueMode] = useState('');
    const [editingBroadcast, setEditingBroadcast] = useState(false);
    const [broadcastText, setBroadcastText] = useState(DEFAULT_BROADCAST);
    const [endFileName, setEndFileName] = useState('');
    const [reviewFileName, setReviewFileName] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messageIdRef = useRef(1);
    const scrollRef = useRef(null);
    const pendingTimerRef = useRef(null);

    const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

    const speak = useCallback((text) => {
        if (!speechSupported || !text) return;
        window.speechSynthesis.cancel();
        const utterance = new window.SpeechSynthesisUtterance(text.replace(/[“”]/g, ''));
        utterance.lang = 'zh-CN';
        utterance.rate = 0.95;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    }, [speechSupported]);

    useEffect(() => {
        speak(INITIAL_PROMPT);
        return () => {
            if (pendingTimerRef.current) window.clearTimeout(pendingTimerRef.current);
            if (speechSupported) window.speechSynthesis.cancel();
        };
    }, [speak, speechSupported]);

    useEffect(() => {
        const container = scrollRef.current;
        if (container) container.scrollTop = container.scrollHeight;
    }, [messages, editingBroadcast, isThinking]);

    const appendMessage = useCallback((role, text) => {
        const messageId = messageIdRef.current + 1;
        messageIdRef.current = messageId;
        setMessages((current) => [...current, { id: messageId, role, text }]);
        if (role === 'assistant') speak(text);
    }, [speak]);

    const ask = useCallback((userText, assistantText, nextStage, stepIndex) => {
        appendMessage('user', userText);
        setIsThinking(true);
        const responseDelay = 1000 + Math.floor(Math.random() * 1001);
        pendingTimerRef.current = window.setTimeout(() => {
            appendMessage('assistant', assistantText);
            setStage(nextStage);
            if (typeof stepIndex === 'number') onStepChange?.(stepIndex);
            setIsThinking(false);
            pendingTimerRef.current = null;
        }, responseDelay);
    }, [appendMessage, onStepChange]);

    const choosePlan = (plan) => {
        const level = PLAN_LEVELS[plan];
        setResponseLevel(level);
        if (level === 'onsite') {
            ask(
                plan,
                '已启动现场处置方案。请立即上报，并由现场人员拨打120。完成后请选择下方选项。',
                'report',
                1,
            );
            return;
        }
        ask(
            plan,
            `已启动${plan}。请按预案组织救援力量和现场管控。当前事态是否已经得到有效控制？`,
            'control',
            5,
        );
    };

    const confirmReport = (completed) => {
        if (!completed) {
            ask('暂未完成', '请先完成事故上报，并由现场人员拨打120。平台不会自动拨号。', 'report', 1);
            return;
        }
        ask(
            '已完成上报并拨打120',
            `是否在现场10米范围内设置电子围栏，并播报：“${DEFAULT_BROADCAST}”`,
            'fence',
            2,
        );
    };

    const finishFence = (choice, message) => {
        ask(choice, `${message}下面开始确认受困人员救援条件。问题一：受困人员是否穿戴全身式安全带？`, 'rescue-q1', 3);
        setEditingBroadcast(false);
    };

    const submitCustomBroadcast = () => {
        const normalized = broadcastText.trim();
        if (!normalized) return;
        finishFence(`修改并播报：${normalized}`, `已设置10米电子围栏，并播报：“${normalized}”`);
    };

    const answerRescueQuestion = (question, answer) => {
        if (question === 1 && answer) {
            ask('是', '问题二：安全绳是否连接D型环，且另一端牢固固定在受限空间外部？', 'rescue-q2', 3);
            return;
        }
        if (question === 2 && answer) {
            ask('是', '问题三：受困人员位置至出入口是否通畅、无阻碍？', 'rescue-q3', 3);
            return;
        }

        const mode = question === 3 && answer ? '非进入式救援' : '进入式救援';
        setRescueMode(mode);
        ask(
            answer ? '是' : '否',
            `根据以上条件，固定处置结果为：采用${mode}。请按现场处置方案组织救援。救援完成后确认事态是否得到有效控制。`,
            'control',
            question === 3 && answer ? 4 : 3,
        );
    };

    const handleControl = (controlled) => {
        if (controlled) {
            ask(
                '处置完成，事态已控制',
                '事态已得到有效控制，进入应急恢复。请依次完成现场清理、污染物处理与环境修复、生产秩序恢复和善后处理，并确认警戒及交通管制已经解除。',
                'recovery',
                6,
            );
            return;
        }

        if (responseLevel === 'onsite') {
            ask('处置未完成或事态仍在扩大', '现场处置未能控制事态，请立即上报单位总指挥，并启动受限空间专项应急预案。', 'escalate-special', 5);
            return;
        }
        if (responseLevel === 'special') {
            ask('事态仍未控制', '专项应急响应未能控制事态，请上报单位总指挥并启动综合应急预案。', 'escalate-comprehensive', 5);
            return;
        }
        ask('事态仍未控制', '综合应急响应正在执行，请继续组织全域统一指挥并联动外部救援，事态受控后再进行确认。', 'control', 5);
    };

    const escalate = (level) => {
        const isSpecial = level === 'special';
        const planName = isSpecial ? '受限空间专项应急预案' : '综合应急预案';
        setResponseLevel(level);
        ask(`确认启动${planName}`, `已启动${planName}。请按预案执行处置，并确认当前事态是否已经得到有效控制。`, 'control', 5);
    };

    const reset = () => {
        if (pendingTimerRef.current) {
            window.clearTimeout(pendingTimerRef.current);
            pendingTimerRef.current = null;
        }
        if (speechSupported) window.speechSynthesis.cancel();
        messageIdRef.current = 1;
        setMessages([{ id: 1, role: 'assistant', text: INITIAL_PROMPT }]);
        setStage('plan');
        setResponseLevel('onsite');
        setRescueMode('');
        setEditingBroadcast(false);
        setBroadcastText(DEFAULT_BROADCAST);
        setEndFileName('');
        setReviewFileName('');
        setIsThinking(false);
        onStepChange?.(0);
        speak(INITIAL_PROMPT);
    };

    const handleEndFile = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setEndFileName(file.name);
        appendMessage('user', `已选择应急解除文件：${file.name}`);
    };

    const handleReviewFile = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setReviewFileName(file.name);
        appendMessage('user', `已选择总结评审报告：${file.name}`);
    };

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="mb-2 flex shrink-0 items-center justify-between gap-2 border border-cyan-400/20 bg-slate-950/35 px-2.5 py-2 text-[11px]">
                <span className="flex items-center gap-2 text-emerald-200">
                    <i className="fas fa-volume-up animate-pulse" />
                    {speechSupported ? '自动语音播报已开启' : '当前浏览器不支持语音播报'}
                </span>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => speak(messages.at(-1)?.text)} className="border border-cyan-400/35 px-2 py-1 text-cyan-100 transition hover:bg-cyan-400/15">
                        <i className="fas fa-redo-alt mr-1" />重播
                    </button>
                    <button type="button" onClick={reset} className="border border-slate-500/40 px-2 py-1 text-slate-300 transition hover:bg-slate-500/15">重置</button>
                </div>
            </div>

            <div ref={scrollRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {messages.map((message) => (
                    <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {message.role === 'assistant' && <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-400/10 text-xs text-cyan-200"><i className="fas fa-robot" /></span>}
                        <div className={`max-w-[86%] border px-3 py-2 text-xs leading-5 ${message.role === 'user' ? 'border-blue-400/40 bg-blue-500/15 text-blue-50' : 'border-cyan-400/30 bg-slate-950/50 text-cyan-50'}`}>
                            {message.text}
                        </div>
                    </div>
                ))}
                {isThinking && (
                    <div className="flex gap-2 justify-start" aria-label="正在生成回复">
                        <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-400/10 text-xs text-cyan-200"><i className="fas fa-robot" /></span>
                        <div className="flex items-center gap-1 border border-cyan-400/30 bg-slate-950/50 px-4 py-3">
                            {[0, 1, 2].map((dot) => <span key={dot} className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300" style={{ animationDelay: `${dot * 140}ms` }} />)}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-2 shrink-0 border-t border-cyan-400/20 pt-2">
                {isThinking && <div className="flex items-center justify-center gap-2 border border-cyan-400/20 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-200"><i className="fas fa-circle-notch animate-spin" />正在生成处置指令...</div>}
                {!isThinking && stage === 'plan' && <ChoiceGrid options={Object.keys(PLAN_LEVELS)} onSelect={choosePlan} />}
                {!isThinking && stage === 'report' && <ChoiceGrid options={['已完成上报并拨打120', '暂未完成']} onSelect={(value) => confirmReport(value.startsWith('已完成'))} />}
                {!isThinking && stage === 'fence' && !editingBroadcast && (
                    <ChoiceGrid
                        options={['设置10米电子围栏并播报', '修改播报内容', '暂不设置电子围栏']}
                        onSelect={(value) => {
                            if (value === '修改播报内容') {
                                setEditingBroadcast(true);
                                return;
                            }
                            if (value.startsWith('设置')) finishFence(value, `已设置10米电子围栏，并播报：“${DEFAULT_BROADCAST}”`);
                            else finishFence(value, '已记录本次不设置电子围栏。');
                        }}
                    />
                )}
                {!isThinking && stage === 'fence' && editingBroadcast && (
                    <div className="flex gap-2">
                        <input value={broadcastText} onChange={(event) => setBroadcastText(event.target.value)} className="min-w-0 flex-1 border border-cyan-400/40 bg-slate-950/70 px-2 py-2 text-xs text-white outline-none focus:border-cyan-300" aria-label="修改广播内容" />
                        <button type="button" onClick={submitCustomBroadcast} className="border border-cyan-300/60 bg-cyan-400/15 px-3 text-xs font-semibold text-cyan-50">确认播报</button>
                        <button type="button" onClick={() => setEditingBroadcast(false)} className="border border-slate-500/40 px-2 text-xs text-slate-300">取消</button>
                    </div>
                )}
                {!isThinking && stage === 'rescue-q1' && <YesNoButtons onSelect={(answer) => answerRescueQuestion(1, answer)} />}
                {!isThinking && stage === 'rescue-q2' && <YesNoButtons onSelect={(answer) => answerRescueQuestion(2, answer)} />}
                {!isThinking && stage === 'rescue-q3' && <YesNoButtons onSelect={(answer) => answerRescueQuestion(3, answer)} />}
                {!isThinking && stage === 'control' && <ChoiceGrid options={['处置完成，事态已控制', '处置未完成或事态仍在扩大']} onSelect={(value) => handleControl(value.startsWith('处置完成'))} />}
                {!isThinking && stage === 'escalate-special' && <ChoiceGrid options={['确认启动受限空间专项应急预案']} onSelect={() => escalate('special')} />}
                {!isThinking && stage === 'escalate-comprehensive' && <ChoiceGrid options={['确认启动综合应急预案']} onSelect={() => escalate('comprehensive')} />}
                {!isThinking && stage === 'recovery' && (
                    <ChoiceGrid
                        options={['恢复措施已完成', '恢复措施尚未完成']}
                        onSelect={(value) => {
                            if (value === '恢复措施已完成') ask(value, '应急恢复已完成。请确认权威机构已经正式宣布解除应急状态，并上传相关通知或文件。', 'end', 7);
                            else ask(value, '请继续完成现场清理、环境修复、秩序恢复和善后处理，解除警戒及交通管制后再确认。', 'recovery', 6);
                        }}
                    />
                )}
                {!isThinking && stage === 'end' && (
                    <div className="grid grid-cols-2 gap-2">
                        <label className="cursor-pointer border border-dashed border-cyan-400/50 bg-cyan-400/10 px-3 py-2 text-center text-xs text-cyan-50 hover:bg-cyan-400/15">
                            <i className="fas fa-upload mr-1" />{endFileName || '选择解除通知文件'}
                            <input type="file" className="hidden" onChange={handleEndFile} />
                        </label>
                        <button type="button" disabled={!endFileName} onClick={() => ask('确认应急结束', '应急状态已经解除，进入总结评审。请上传总结评审报告，完成本次应急处置闭环。', 'review', 8)} className="border border-cyan-300/50 bg-cyan-400/15 px-3 py-2 text-xs font-semibold text-cyan-50 disabled:cursor-not-allowed disabled:opacity-40">确认应急结束</button>
                    </div>
                )}
                {!isThinking && stage === 'review' && (
                    <div className="grid grid-cols-2 gap-2">
                        <label className="cursor-pointer border border-dashed border-cyan-400/50 bg-cyan-400/10 px-3 py-2 text-center text-xs text-cyan-50 hover:bg-cyan-400/15">
                            <i className="fas fa-upload mr-1" />{reviewFileName || '选择总结评审报告'}
                            <input type="file" className="hidden" onChange={handleReviewFile} />
                        </label>
                        <button type="button" disabled={!reviewFileName} onClick={() => ask('完成总结评审', '本次应急处置流程已完成，所有问答、处置结果和上传资料已进入历史记录。', 'complete', 8)} className="border border-emerald-300/50 bg-emerald-400/15 px-3 py-2 text-xs font-semibold text-emerald-50 disabled:cursor-not-allowed disabled:opacity-40">完成总结评审</button>
                    </div>
                )}
                {!isThinking && stage === 'complete' && (
                    <div className="flex items-center justify-between border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                        <span><i className="fas fa-check-circle mr-2" />应急处置闭环已完成{rescueMode ? ` · ${rescueMode}` : ''}</span>
                        <button type="button" onClick={reset} className="border border-emerald-300/40 px-3 py-1 hover:bg-emerald-300/10">重新演示</button>
                    </div>
                )}
            </div>
        </div>
    );
}

function ChoiceGrid({ options, onSelect }) {
    return (
        <div className={`grid gap-2 ${options.length > 1 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
            {options.map((option, index) => (
                <button key={option} type="button" onClick={() => onSelect(option)} className={`border px-3 py-2 text-left text-xs font-medium transition ${index === 0 ? 'border-cyan-300/60 bg-cyan-400/15 text-cyan-50 hover:bg-cyan-400/25' : 'border-blue-400/35 bg-blue-950/45 text-blue-100 hover:border-cyan-400/60 hover:bg-blue-900/50'}`}>
                    <i className={`fas ${index === 0 ? 'fa-check-circle text-cyan-300' : 'fa-circle text-blue-400/60'} mr-2`} />{option}
                </button>
            ))}
        </div>
    );
}

function YesNoButtons({ onSelect }) {
    return <ChoiceGrid options={['是', '否']} onSelect={(value) => onSelect(value === '是')} />;
}
