import { useCallback, useEffect, useRef, useState } from 'react';
import { updateEmergencyEvent, uploadEmergencyAttachment } from '../utils/api';

const DEFAULT_BROADCAST = '1号污水井内有人晕倒，无关人员请勿靠近。';
const PLAN_SELECTION_SPEECH = '请选择处置预案。';
const INITIAL_PLAN_REVEAL_DELAY_MS = 1500;
const PLAN_NAMES = {
    onsite: '受限空间现场处置方案',
    special: '中毒事故应急预案',
};
const RECOVERY_ITEMS = ['现场清理', '污染物处理与环境修复', '生产秩序恢复', '善后处理', '警戒与交通管制已解除'];
const RESCUE_STRATEGY = `受限空间救援策略优先情况：自救最优，非进入式次之，进入式风险最高。非进入式能救就绝不进入；进入式仅作兜底，培训只是门槛，有证也未必该进。不自信宁可等119并持续送风。
（1）非进入式须同时满足：
①全身式安全带
②安全绳与外部挂点可靠连接
③通道畅通无障碍
（2）进入式救援：
条件不满足时启动，风险高。
请人工核实后决策。决策及准备过程中，建议救援人员按进入式救援标准穿戴相关防护用品，确保随时可安全响应。`;
const NON_ENTRY_GUIDANCE = `非进入式救援已选定。注意：禁止直接用三脚架或人力拉拽。

三脚架：缺乏机械增益、制动与锁定，无法可控、省力提升。

人力直拉：可能拉不动失去意识的成年人，且易滑脱或突然受力，造成二次伤害。

建议：采用绳索救援系统（绞盘/滑轮组），实现可控、省力的平稳提升，确保被救人员安全。`;
const ENTRY_GUIDANCE = '进入式救援已选定，风险高。请严格按进入式救援标准组织实施，持续通风和气体检测，落实监护、通信及个人防护，严禁盲目施救。';

const normalizeAssistantText = (text) => text.replace(/问题[一二三]：/g, '判断：');

const normalizeSpeechText = (text) => normalizeAssistantText(text)
    .replace(/[“”]/g, '')
    .replace(/120/g, '幺二零');

const speechTextForMessage = (text) => {
    const normalized = normalizeSpeechText(text);
    return normalized.includes('AI研判') || normalized.length > 120
        ? '请确认如下内容'
        : normalized;
};

export default function EmergencyInteraction({ event, onEventChange }) {
    const plans = (event.availablePlans?.length ? event.availablePlans : [{ id: 'comprehensive', name: '综合应急预案' }])
        .map((plan) => ({ ...plan, name: PLAN_NAMES[plan.id] || plan.name }));
    const recommendedPlan = plans.find((plan) => plan.recommended) || plans.find((plan) => plan.id === 'onsite') || plans[0];
    const initialPrompt = `AI研判\n根据企业提供预案，匹配本次事件预案有：\n${plans.map((plan) => plan.name).join('、')}。\n根据现场实际，建议采用${recommendedPlan.name}。`;
    const initialMessages = (event.state?.messages?.length ? event.state.messages : [{ id: 1, role: 'assistant', text: initialPrompt }])
        .map((message) => message.role === 'assistant' ? { ...message, text: normalizeAssistantText(message.text) } : message);
    const initialStage = event.stage || 'plan';
    const [stage, setStage] = useState(initialStage);
    const [messages, setMessages] = useState(initialStage === 'plan' ? [] : initialMessages);
    const [responseLevel, setResponseLevel] = useState(event.responseLevel || event.state?.responseLevel || '');
    const [rescueMode, setRescueMode] = useState(event.rescueMode || event.state?.rescueMode || '');
    const [reportStatus, setReportStatus] = useState(event.state?.reportStatus || '');
    const [broadcastText, setBroadcastText] = useState(event.state?.broadcastText || DEFAULT_BROADCAST);
    const [editingBroadcast, setEditingBroadcast] = useState(false);
    const [recoveryChecks, setRecoveryChecks] = useState(event.state?.recoveryChecks || {});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const scrollRef = useRef(null);
    const initialPlanSpeechPlayedRef = useRef(false);
    const initialMessagesRef = useRef(initialMessages);
    const messageIdRef = useRef(Math.max(...initialMessages.map((message) => Number(message.id) || 0), 1));
    const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const endAttachment = event.attachments?.find((item) => item.kind === 'end');
    const reviewAttachment = event.attachments?.find((item) => item.kind === 'review');

    const speak = useCallback((text) => {
        if (!speechSupported || !text) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(speechTextForMessage(text));
        utterance.lang = 'zh-CN';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    }, [speechSupported]);

    const speakSequence = useCallback((texts) => {
        if (!speechSupported) return;
        window.speechSynthesis.cancel();
        texts.filter(Boolean).forEach((text) => {
            const utterance = new SpeechSynthesisUtterance(speechTextForMessage(text));
            utterance.lang = 'zh-CN';
            utterance.rate = 0.95;
            window.speechSynthesis.speak(utterance);
        });
    }, [speechSupported]);

    useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages, busy, stage, editingBroadcast, recoveryChecks]);
    useEffect(() => {
        if (stage !== 'plan' || initialPlanSpeechPlayedRef.current) return undefined;
        const timer = window.setTimeout(() => {
            initialPlanSpeechPlayedRef.current = true;
            setMessages(initialMessagesRef.current);
            speak(PLAN_SELECTION_SPEECH);
        }, INITIAL_PLAN_REVEAL_DELAY_MS);
        return () => window.clearTimeout(timer);
    }, [speak, stage]);
    useEffect(() => () => { if (speechSupported) window.speechSynthesis.cancel(); }, [speechSupported]);

    const ask = useCallback(async (userText, assistantText, nextStage, changes = {}) => {
        if (busy) return;
        const userMessages = [...messages, { id: ++messageIdRef.current, role: 'user', text: userText }];
        const nextLevel = changes.responseLevel ?? responseLevel;
        const nextMode = changes.rescueMode ?? rescueMode;
        const nextReportStatus = changes.reportStatus ?? reportStatus;
        const nextBroadcast = changes.broadcastText ?? broadcastText;
        const nextRecovery = changes.recoveryChecks ?? recoveryChecks;
        setMessages(userMessages);
        setBusy(true);
        setError('');
        try {
            const responseDelay = 180 + Math.floor(Math.random() * 121);
            await new Promise((resolve) => window.setTimeout(resolve, responseDelay));
            const nextMessages = [...userMessages, { id: ++messageIdRef.current, role: 'assistant', text: assistantText }];
            setMessages(nextMessages);
            const updated = await updateEmergencyEvent(event.id, {
                stage: nextStage,
                status: changes.status,
                responseLevel: nextLevel,
                selectedPlan: changes.selectedPlan,
                rescueMode: nextMode,
                state: { ...(event.state || {}), messages: nextMessages, responseLevel: nextLevel, rescueMode: nextMode, reportStatus: nextReportStatus, broadcastText: nextBroadcast, recoveryChecks: nextRecovery },
                timelineEntry: { action: userText },
            });
            setStage(nextStage);
            setResponseLevel(nextLevel);
            setRescueMode(nextMode);
            setReportStatus(nextReportStatus);
            setBroadcastText(nextBroadcast);
            setRecoveryChecks(nextRecovery);
            onEventChange?.(updated);
            speak(assistantText);
        } catch (saveError) {
            setMessages(messages);
            setError(saveError.message || '处置记录保存失败');
        } finally {
            setBusy(false);
        }
    }, [broadcastText, busy, event.id, event.state, messages, onEventChange, recoveryChecks, reportStatus, rescueMode, responseLevel, speak]);

    const choosePlan = (plan) => {
        const onsite = plan.id === 'onsite';
        ask(plan.name, onsite ? `请立即上报并拨打120。\n${RESCUE_STRATEGY}` : '已启动' + plan.name + '。请按预案组织救援力量和区域管控，并确认事态是否受控。', onsite ? 'report' : 'control', { responseLevel: plan.id, selectedPlan: plan.name, reportStatus: onsite ? '' : reportStatus });
    };

    const chooseRescueMode = (mode) => {
        if (stage === 'report' && reportStatus !== '已拨打120并上报') {
            setError('请先确认已拨打120并上报');
            return undefined;
        }
        const guidance = mode === '非进入式救援' ? NON_ENTRY_GUIDANCE : ENTRY_GUIDANCE;
        const userText = stage === 'report' ? `已拨打120并上报；${mode}` : mode;
        return ask(userText, guidance, 'control', { rescueMode: mode, reportStatus });
    };

    const handleControl = (controlled) => {
        if (controlled) return ask('处置完成，事态已控制', '事态已得到有效控制，进入应急恢复。请完成各项恢复措施。', 'recovery', { status: 'recovering' });
        if (responseLevel === 'onsite') {
            const special = plans.find((plan) => plan.id === 'special');
            return special ? ask('事态仍未控制', '请上报单位总指挥，并启动' + special.name + '。', 'escalate-special') : ask('事态仍未控制', '本事件未配置专项预案，请直接启动综合应急预案。', 'escalate-comprehensive');
        }
        if (responseLevel === 'special') return ask('事态仍未控制', '请上报单位总指挥，启动综合应急预案。', 'escalate-comprehensive');
        return ask('事态仍未控制', '请继续全域统一指挥并联动外部救援。', 'control');
    };

    const upload = async (kind, file) => {
        if (!file) return;
        setBusy(true);
        setError('');
        try {
            await uploadEmergencyAttachment(event.id, kind, file);
            const updated = await updateEmergencyEvent(event.id, { timelineEntry: { action: '上传' + (kind === 'end' ? '应急解除文件' : '总结评审报告') + '：' + file.name } });
            onEventChange?.(updated);
        } catch (uploadError) {
            setError(uploadError.message || '附件上传失败');
        } finally {
            setBusy(false);
        }
    };

    const recoveryComplete = RECOVERY_ITEMS.every((item) => recoveryChecks[item]);
    const activeStage = ['rescue-q1', 'rescue-q2', 'rescue-q3'].includes(stage) ? 'rescue-mode' : stage;

    const renderActions = () => <>
        {activeStage === 'plan' && <ChoiceGrid options={plans.map((plan) => ({ value: plan, label: plan.name + (plan.recommended ? '（建议）' : '') }))} onSelect={choosePlan} />}
        {activeStage === 'report' && <div className="space-y-2.5"><ChoiceGrid options={['已拨打120并上报', '暂未完成']} selectedValue={reportStatus} onSelect={(value) => { setReportStatus(value); setError(value === '已拨打120并上报' ? '' : '请完成上报并拨打120后，再确认救援方式'); if (value === '已拨打120并上报') speakSequence(['已拨打120并上报', '请选择并确认救援方式']); }} /><div className="border-t border-cyan-200/25 pt-2.5"><div className="mb-2 text-[13px] font-bold text-cyan-50">请选择并确认救援方式</div><ChoiceGrid options={['非进入式救援', '进入式救援']} selectedValue="" disabled={reportStatus !== '已拨打120并上报'} onSelect={chooseRescueMode} /></div></div>}
        {activeStage === 'fence' && !editingBroadcast && <ChoiceGrid options={['设置10米电子围栏并播报', '修改播报内容', '暂不设置电子围栏']} onSelect={(value) => value === '修改播报内容' ? setEditingBroadcast(true) : ask(value, RESCUE_STRATEGY, 'rescue-mode')} />}
        {activeStage === 'fence' && editingBroadcast && <div className="flex gap-2"><input value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} className="min-w-0 flex-1 border border-cyan-300/50 bg-blue-950/60 px-3 py-2 text-[13px] text-white" /><button onClick={() => { setEditingBroadcast(false); ask('修改并播报：' + broadcastText, RESCUE_STRATEGY, 'rescue-mode', { broadcastText }); }} className="border border-cyan-200/70 bg-cyan-400/15 px-4 text-[13px] font-bold">确认</button></div>}
        {activeStage === 'rescue-mode' && <ChoiceGrid options={['非进入式救援', '进入式救援']} onSelect={chooseRescueMode} />}
        {activeStage === 'control' && <ChoiceGrid options={['处置完成，事态已控制', '处置未完成或事态仍在扩大']} onSelect={(value) => handleControl(value.startsWith('处置完成'))} />}
        {activeStage === 'escalate-special' && <ChoiceGrid options={['确认启动专项应急预案']} onSelect={(value) => ask(value, '专项应急预案已启动，请确认事态是否受控。', 'control', { responseLevel: 'special' })} />}
        {activeStage === 'escalate-comprehensive' && <ChoiceGrid options={['确认启动综合应急预案']} onSelect={(value) => ask(value, '综合应急预案已启动，请全域统一指挥并联动外部救援。', 'control', { responseLevel: 'comprehensive', selectedPlan: '综合应急预案' })} />}
        {activeStage === 'recovery' && <div className="space-y-2">{RECOVERY_ITEMS.map((item) => <label key={item} className="flex items-center gap-2.5 border border-cyan-300/35 bg-blue-950/25 px-3 py-2 text-[13px] font-semibold text-cyan-50"><input type="checkbox" checked={Boolean(recoveryChecks[item])} onChange={(e) => setRecoveryChecks((current) => ({ ...current, [item]: e.target.checked }))} />{item}</label>)}<button disabled={!recoveryComplete} onClick={() => ask('恢复措施已全部完成', '请确认权威机构已正式宣布解除应急状态，并上传相关文件。', 'end', { recoveryChecks })} className="w-full border border-cyan-200/60 bg-cyan-400/15 px-3 py-2.5 text-[13px] font-black disabled:opacity-35">确认完成应急恢复</button></div>}
        {activeStage === 'end' && <AttachmentActions label={endAttachment?.filename || '上传应急解除文件'} canConfirm={Boolean(endAttachment)} onFile={(file) => upload('end', file)} onConfirm={() => ask('确认应急结束', '应急状态已解除，进入总结评审。', 'review')} confirmText="确认应急结束" />}
        {activeStage === 'review' && <AttachmentActions label={reviewAttachment?.filename || '上传总结评审报告'} canConfirm={Boolean(reviewAttachment)} onFile={(file) => upload('review', file)} onConfirm={() => ask('完成总结评审', '本次应急处置已闭环，全部记录和附件均已留痕。', 'complete', { status: 'closed' })} confirmText="完成总结评审" />}
    </>;

    return <div className="flex h-full min-h-0 flex-col">
        <div ref={scrollRef} className="min-h-0 flex-1 space-y-3.5 overflow-y-auto pr-1.5">
            {messages.map((message, index) => { const isActiveAssistant = !busy && stage !== 'complete' && message.role === 'assistant' && index === messages.length - 1; return <div key={message.id} className={`flex gap-2.5 ${message.role === 'user' ? 'justify-end' : ''}`}>{message.role === 'assistant' && <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-200/60 bg-cyan-400/20 text-sm text-white shadow-[0_0_14px_rgba(34,211,238,.22)]"><i className="fas fa-robot" /></span>}<div className={`group relative max-w-[86%] whitespace-pre-line border px-4 py-2.5 text-[14px] font-medium leading-6 shadow-[0_5px_18px_rgba(2,8,23,.18)] ${message.role === 'user' ? 'border-cyan-200/65 bg-gradient-to-r from-cyan-500/35 to-blue-500/35 text-white' : 'border-cyan-200/45 bg-gradient-to-br from-blue-900/75 to-cyan-900/45 pr-11 text-cyan-50'}`}>{message.text}{message.role === 'assistant' && <button type="button" disabled={!speechSupported} onClick={() => speak(message.text)} title={speechSupported ? '重播此条语音' : '浏览器不支持语音播报'} className="absolute right-3 top-2.5 text-cyan-100/65 transition hover:text-white disabled:opacity-25"><i className="fas fa-volume-high" /></button>}{isActiveAssistant && <div className="mt-3 whitespace-normal border-t border-cyan-200/25 pt-2.5">{renderActions()}</div>}</div></div>; })}
            {error && <div className="ml-11 border border-rose-300/45 bg-rose-500/15 px-4 py-2.5 text-[13px] font-semibold text-rose-100"><i className="fas fa-circle-exclamation mr-2" />{error}</div>}
            {busy && <AssistantActionBubble><div className="flex items-center gap-2 py-1 text-[13px] font-semibold text-cyan-100"><span>AI 正在分析并生成回复</span><span className="flex gap-1">{[0, 1, 2].map((dot) => <i key={dot} className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-200" style={{ animationDelay: `${dot * 140}ms` }} />)}</span></div></AssistantActionBubble>}
            {!busy && stage === 'complete' && <div className="ml-11 border border-emerald-300/45 bg-emerald-500/15 px-4 py-2.5 text-[13px] font-semibold text-emerald-50"><i className="fas fa-check-circle mr-2" />本次应急处置已闭环{rescueMode ? ' · ' + rescueMode : ''}</div>}
        </div>
    </div>;
}

function AssistantActionBubble({ children }) {
    return <div className="flex gap-2.5"><span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-200/60 bg-cyan-400/20 text-sm text-white shadow-[0_0_14px_rgba(34,211,238,.22)]"><i className="fas fa-robot" /></span><div className="w-[86%] border border-cyan-200/45 bg-gradient-to-br from-blue-900/70 to-cyan-900/35 p-2.5 shadow-[0_5px_18px_rgba(2,8,23,.16)]">{children}</div></div>;
}

function AttachmentActions({ label, canConfirm, onFile, onConfirm, confirmText }) {
    return <div className="grid grid-cols-2 gap-2"><label className="cursor-pointer border border-dashed border-cyan-200/60 bg-cyan-400/10 px-3 py-2.5 text-center text-[13px] font-semibold"><i className="fas fa-upload mr-1" />{label}<input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} /></label><button disabled={!canConfirm} onClick={onConfirm} className="border border-cyan-200/60 bg-cyan-400/15 px-3 py-2.5 text-[13px] font-black disabled:opacity-35">{confirmText}</button></div>;
}

function ChoiceGrid({ options, onSelect, selectedValue, disabled = false }) {
    return <div className={`grid gap-2 ${options.length > 1 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>{options.map((option, index) => { const value = typeof option === 'string' ? option : option.value; const label = typeof option === 'string' ? option : option.label; const selected = selectedValue === value; const highlighted = selected || (selectedValue === undefined && index === 0); return <button key={label} type="button" disabled={disabled} onClick={() => onSelect(value)} className={`border px-3.5 py-2.5 text-left text-[13px] font-bold leading-5 transition disabled:cursor-not-allowed disabled:opacity-35 ${highlighted ? 'border-cyan-200/70 bg-cyan-400/20 text-white hover:bg-cyan-400/30' : 'border-blue-300/45 bg-blue-800/30 text-cyan-50/90 hover:border-cyan-300/60 hover:bg-blue-700/35'}`}><i className={`fas ${highlighted ? 'fa-check-circle text-cyan-100' : 'fa-circle text-blue-300/70'} mr-2`} />{label}</button>; })}</div>;
}
