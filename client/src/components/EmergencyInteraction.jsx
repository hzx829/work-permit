import { useCallback, useEffect, useRef, useState } from 'react';
import { updateEmergencyEvent, uploadEmergencyAttachment } from '../utils/api';

const INITIAL_PROMPT = '已确认突发险情。系统已匹配企业现有应急预案，请选择本次响应方案。';
const DEFAULT_BROADCAST = '1号污水井内有人晕倒，无关人员请勿靠近。';
const RECOVERY_ITEMS = ['现场清理', '污染物处理与环境修复', '生产秩序恢复', '善后处理', '警戒与交通管制已解除'];

const normalizeAssistantText = (text) => text.replace(/问题[一二三]：/g, '判断：');

const normalizeSpeechText = (text) => normalizeAssistantText(text)
    .replace(/[“”]/g, '')
    .replace(/120/g, '幺二零');

export default function EmergencyInteraction({ event, onEventChange }) {
    const initialMessages = (event.state?.messages?.length ? event.state.messages : [{ id: 1, role: 'assistant', text: INITIAL_PROMPT }])
        .map((message) => message.role === 'assistant' ? { ...message, text: normalizeAssistantText(message.text) } : message);
    const [stage, setStage] = useState(event.stage || 'plan');
    const [messages, setMessages] = useState(initialMessages);
    const [responseLevel, setResponseLevel] = useState(event.responseLevel || event.state?.responseLevel || '');
    const [rescueMode, setRescueMode] = useState(event.rescueMode || event.state?.rescueMode || '');
    const [broadcastText, setBroadcastText] = useState(event.state?.broadcastText || DEFAULT_BROADCAST);
    const [editingBroadcast, setEditingBroadcast] = useState(false);
    const [recoveryChecks, setRecoveryChecks] = useState(event.state?.recoveryChecks || {});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const scrollRef = useRef(null);
    const messageIdRef = useRef(Math.max(...initialMessages.map((message) => Number(message.id) || 0), 1));
    const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const endAttachment = event.attachments?.find((item) => item.kind === 'end');
    const reviewAttachment = event.attachments?.find((item) => item.kind === 'review');

    const speak = useCallback((text) => {
        if (!speechSupported || !text) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(normalizeSpeechText(text));
        utterance.lang = 'zh-CN';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    }, [speechSupported]);

    useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages, busy, stage, editingBroadcast, recoveryChecks]);
    useEffect(() => () => { if (speechSupported) window.speechSynthesis.cancel(); }, [speechSupported]);

    const ask = useCallback(async (userText, assistantText, nextStage, changes = {}) => {
        if (busy) return;
        const userMessages = [...messages, { id: ++messageIdRef.current, role: 'user', text: userText }];
        const nextLevel = changes.responseLevel ?? responseLevel;
        const nextMode = changes.rescueMode ?? rescueMode;
        const nextBroadcast = changes.broadcastText ?? broadcastText;
        const nextRecovery = changes.recoveryChecks ?? recoveryChecks;
        setMessages(userMessages);
        setBusy(true);
        setError('');
        try {
            const responseDelay = 850 + Math.floor(Math.random() * 351);
            await new Promise((resolve) => window.setTimeout(resolve, responseDelay));
            const nextMessages = [...userMessages, { id: ++messageIdRef.current, role: 'assistant', text: assistantText }];
            setMessages(nextMessages);
            const updated = await updateEmergencyEvent(event.id, {
                stage: nextStage,
                status: changes.status,
                responseLevel: nextLevel,
                selectedPlan: changes.selectedPlan,
                rescueMode: nextMode,
                state: { ...(event.state || {}), messages: nextMessages, responseLevel: nextLevel, rescueMode: nextMode, broadcastText: nextBroadcast, recoveryChecks: nextRecovery },
                timelineEntry: { action: userText },
            });
            setStage(nextStage);
            setResponseLevel(nextLevel);
            setRescueMode(nextMode);
            setBroadcastText(nextBroadcast);
            setRecoveryChecks(nextRecovery);
            onEventChange?.(updated);
            speak(assistantText);
        } catch (saveError) {
            setError(saveError.message || '处置记录保存失败');
        } finally {
            setBusy(false);
        }
    }, [broadcastText, busy, event.id, event.state, messages, onEventChange, recoveryChecks, rescueMode, responseLevel, speak]);

    const choosePlan = (plan) => {
        const onsite = plan.id === 'onsite';
        ask(plan.name, onsite ? '已启动现场处置方案。请立即上报，并由现场人员拨打120。平台尚未接入自动拨号能力。' : '已启动' + plan.name + '。请按预案组织救援力量和区域管控，并确认事态是否受控。', onsite ? 'report' : 'control', { responseLevel: plan.id, selectedPlan: plan.name });
    };

    const answerRescue = (question, answer) => {
        if (question === 1 && answer) return ask('是', '判断：安全绳是否连接D型环，且另一端牢固固定在受限空间外部？', 'rescue-q2');
        if (question === 2 && answer) return ask('是', '判断：受困人员位置至出入口是否通畅、无阻碍？', 'rescue-q3');
        const mode = question === 3 && answer ? '非进入式救援' : '进入式救援';
        return ask(answer ? '是' : '否', '根据当前条件，采用' + mode + '。请按预案组织救援，完成后确认事态是否受控。', 'control', { rescueMode: mode });
    };

    const handleControl = (controlled) => {
        if (controlled) return ask('处置完成，事态已控制', '事态已得到有效控制，进入应急恢复。请完成各项恢复措施。', 'recovery', { status: 'recovering' });
        if (responseLevel === 'onsite') {
            const special = event.availablePlans?.find((plan) => plan.id === 'special');
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
    const plans = event.availablePlans?.length ? event.availablePlans : [{ id: 'comprehensive', name: '综合应急预案' }];

    return <div className="flex h-full min-h-0 flex-col">
        <div ref={scrollRef} className="min-h-0 flex-1 space-y-3.5 overflow-y-auto pr-1.5">
            {messages.map((message) => <div key={message.id} className={`flex gap-2.5 ${message.role === 'user' ? 'justify-end' : ''}`}>{message.role === 'assistant' && <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-200/60 bg-cyan-400/20 text-sm text-white shadow-[0_0_14px_rgba(34,211,238,.22)]"><i className="fas fa-robot" /></span>}<div className={`group relative max-w-[86%] border px-4 py-2.5 text-[14px] font-medium leading-6 shadow-[0_5px_18px_rgba(2,8,23,.18)] ${message.role === 'user' ? 'border-cyan-200/65 bg-gradient-to-r from-cyan-500/35 to-blue-500/35 text-white' : 'border-cyan-200/45 bg-gradient-to-br from-blue-900/75 to-cyan-900/45 pr-11 text-cyan-50'}`}>{message.text}{message.role === 'assistant' && <button type="button" disabled={!speechSupported} onClick={() => speak(message.text)} title={speechSupported ? '重播此条语音' : '浏览器不支持语音播报'} className="absolute right-3 top-2.5 text-cyan-100/65 transition hover:text-white disabled:opacity-25"><i className="fas fa-volume-high" /></button>}</div></div>)}
            {error && <div className="ml-11 border border-rose-300/45 bg-rose-500/15 px-4 py-2.5 text-[13px] font-semibold text-rose-100"><i className="fas fa-circle-exclamation mr-2" />{error}</div>}
            {busy && <AssistantActionBubble><div className="flex items-center gap-2 py-1 text-[13px] font-semibold text-cyan-100"><span>AI 正在分析并生成回复</span><span className="flex gap-1">{[0, 1, 2].map((dot) => <i key={dot} className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-200" style={{ animationDelay: `${dot * 140}ms` }} />)}</span></div></AssistantActionBubble>}
            {!busy && stage !== 'complete' && <AssistantActionBubble>
                {stage === 'plan' && <ChoiceGrid options={plans.map((plan) => ({ value: plan, label: plan.name + (plan.recommended ? '（建议）' : '') }))} onSelect={choosePlan} />}
                {stage === 'report' && <ChoiceGrid options={['已完成上报并拨打120', '暂未完成']} onSelect={(value) => value.startsWith('已完成') ? ask(value, '是否设置10米电子围栏，并播报：“' + DEFAULT_BROADCAST + '”', 'fence') : ask(value, '请先完成事故上报，并由现场人员拨打120。', 'report')} />}
                {stage === 'fence' && !editingBroadcast && <ChoiceGrid options={['设置10米电子围栏并播报', '修改播报内容', '暂不设置电子围栏']} onSelect={(value) => value === '修改播报内容' ? setEditingBroadcast(true) : ask(value, '已记录本次围栏操作。判断：受困人员是否穿戴全身式安全带？', 'rescue-q1')} />}
                {stage === 'fence' && editingBroadcast && <div className="flex gap-2"><input value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} className="min-w-0 flex-1 border border-cyan-300/50 bg-blue-950/60 px-3 py-2 text-[13px] text-white" /><button onClick={() => { setEditingBroadcast(false); ask('修改并播报：' + broadcastText, '已记录新播报内容。判断：受困人员是否穿戴全身式安全带？', 'rescue-q1', { broadcastText }); }} className="border border-cyan-200/70 bg-cyan-400/15 px-4 text-[13px] font-bold">确认</button></div>}
                {stage === 'rescue-q1' && <YesNoButtons onSelect={(answer) => answerRescue(1, answer)} />}
                {stage === 'rescue-q2' && <YesNoButtons onSelect={(answer) => answerRescue(2, answer)} />}
                {stage === 'rescue-q3' && <YesNoButtons onSelect={(answer) => answerRescue(3, answer)} />}
                {stage === 'control' && <ChoiceGrid options={['处置完成，事态已控制', '处置未完成或事态仍在扩大']} onSelect={(value) => handleControl(value.startsWith('处置完成'))} />}
                {stage === 'escalate-special' && <ChoiceGrid options={['确认启动专项应急预案']} onSelect={(value) => ask(value, '专项应急预案已启动，请确认事态是否受控。', 'control', { responseLevel: 'special' })} />}
                {stage === 'escalate-comprehensive' && <ChoiceGrid options={['确认启动综合应急预案']} onSelect={(value) => ask(value, '综合应急预案已启动，请全域统一指挥并联动外部救援。', 'control', { responseLevel: 'comprehensive', selectedPlan: '综合应急预案' })} />}
                {stage === 'recovery' && <div className="space-y-2">{RECOVERY_ITEMS.map((item) => <label key={item} className="flex items-center gap-2.5 border border-cyan-300/35 bg-blue-950/25 px-3 py-2 text-[13px] font-semibold text-cyan-50"><input type="checkbox" checked={Boolean(recoveryChecks[item])} onChange={(e) => setRecoveryChecks((current) => ({ ...current, [item]: e.target.checked }))} />{item}</label>)}<button disabled={!recoveryComplete} onClick={() => ask('恢复措施已全部完成', '请确认权威机构已正式宣布解除应急状态，并上传相关文件。', 'end', { recoveryChecks })} className="w-full border border-cyan-200/60 bg-cyan-400/15 px-3 py-2.5 text-[13px] font-black disabled:opacity-35">确认完成应急恢复</button></div>}
                {stage === 'end' && <AttachmentActions label={endAttachment?.filename || '上传应急解除文件'} canConfirm={Boolean(endAttachment)} onFile={(file) => upload('end', file)} onConfirm={() => ask('确认应急结束', '应急状态已解除，进入总结评审。', 'review')} confirmText="确认应急结束" />}
                {stage === 'review' && <AttachmentActions label={reviewAttachment?.filename || '上传总结评审报告'} canConfirm={Boolean(reviewAttachment)} onFile={(file) => upload('review', file)} onConfirm={() => ask('完成总结评审', '本次应急处置已闭环，全部记录和附件均已留痕。', 'complete', { status: 'closed' })} confirmText="完成总结评审" />}
            </AssistantActionBubble>}
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

function ChoiceGrid({ options, onSelect }) {
    return <div className={`grid gap-2 ${options.length > 1 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>{options.map((option, index) => { const value = typeof option === 'string' ? option : option.value; const label = typeof option === 'string' ? option : option.label; return <button key={label} type="button" onClick={() => onSelect(value)} className={`border px-3.5 py-2.5 text-left text-[13px] font-bold leading-5 transition ${index === 0 ? 'border-cyan-200/70 bg-cyan-400/20 text-white hover:bg-cyan-400/30' : 'border-blue-300/45 bg-blue-800/30 text-cyan-50/90 hover:border-cyan-300/60 hover:bg-blue-700/35'}`}><i className={`fas ${index === 0 ? 'fa-check-circle text-cyan-100' : 'fa-circle text-blue-300/70'} mr-2`} />{label}</button>; })}</div>;
}

function YesNoButtons({ onSelect }) {
    return <ChoiceGrid options={['是', '否']} onSelect={(value) => onSelect(value === '是')} />;
}
