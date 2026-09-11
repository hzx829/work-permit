import { useState } from 'react';
import CompetitionLivePlayer from './CompetitionLivePlayer';
import useCompetitionGasReadings from '../hooks/useCompetitionGasReadings';

const GAS_ORDER = ['CH4', 'CO2', 'O2', 'CO'];
const GAS_NAMES = { CH4: '甲烷', CO2: '二氧化碳', O2: '氧气', CO: '一氧化碳' };

function formatTime(value) {
    if (!value) return '--';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '--' : date.toLocaleString('zh-CN', { hour12: false });
}

function statusMeta(status, disconnected) {
    if (disconnected) return { label: '连接中断', classes: 'bg-rose-100 text-rose-700' };
    if (status === 'fresh') return { label: '实时', classes: 'bg-emerald-100 text-emerald-700' };
    if (status === 'stale') return { label: '数据过期', classes: 'bg-amber-100 text-amber-700' };
    return { label: '暂无数据', classes: 'bg-slate-100 text-slate-600' };
}

export default function CompetitionDevicePanel() {
    const { devices, serverTime, loading, error, refresh } = useCompetitionGasReadings();
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const selectedDevice = devices.find((device) => device.deviceId === selectedDeviceId) || devices[0] || null;

    const meta = statusMeta(selectedDevice?.dataStatus, Boolean(error));

    return (
        <div className="space-y-5">
            <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-900">记录仪与气体检测仪联动</h3>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${meta.classes}`}>{meta.label}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">视频与气体读数按同一设备 ID 绑定；气体每 3 秒刷新，视频断流后自动重连。</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={selectedDevice?.deviceId || ''}
                            onChange={(event) => setSelectedDeviceId(event.target.value)}
                            disabled={!devices.length}
                            className="min-w-64 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 disabled:text-slate-400"
                        >
                            {!devices.length && <option value="">暂无授权设备</option>}
                            {devices.map((device) => <option key={device.deviceId} value={device.deviceId}>{device.deviceName || device.deviceId}{device.primary ? '（默认）' : ''}</option>)}
                        </select>
                        <button type="button" onClick={refresh} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">
                            <i className="fas fa-rotate mr-1" />刷新
                        </button>
                    </div>
                </div>
                {error && <p className="mt-3 rounded-lg border border-rose-200 bg-white/70 px-3 py-2 text-sm text-rose-700">{error.message}</p>}
            </div>

            {loading && !devices.length ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500"><i className="fas fa-spinner fa-spin mr-2" />正在连接现场设备...</div>
            ) : !selectedDevice ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">授权组织中暂无设备，请先将比赛记录仪分配到对应组织。</div>
            ) : (
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,.55fr)]">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <CompetitionLivePlayer deviceId={selectedDevice.deviceId} active={!error || error.status !== 403} />
                        <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-4 py-3">
                            <div className="min-w-0"><p className="truncate font-semibold text-slate-800">{selectedDevice.deviceName || '现场设备'} · {selectedDevice.deviceId}</p><p className="text-xs text-slate-500">同源 HTTP-FLV 实时画面</p></div>
                            <span className="whitespace-nowrap text-xs text-slate-400">服务器时间 {formatTime(serverTime)}</span>
                        </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div><h4 className="font-bold text-slate-800">实时气体读数</h4><p className="mt-1 text-xs text-slate-500">未上报的气体保持为空，不补零</p></div>
                            <span className={`rounded-full px-2 py-1 text-xs font-bold ${meta.classes}`}>{meta.label}</span>
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-3">
                            {GAS_ORDER.map((key) => {
                                const reading = selectedDevice.gasData?.[key];
                                return <div key={key} className="rounded-lg border border-slate-100 bg-slate-50 p-4"><p className="text-xs font-medium text-slate-500">{GAS_NAMES[key]} <span className="font-mono">{key}</span></p><p className="mt-2 font-mono text-2xl font-bold text-slate-900">{reading?.value ?? '--'} <span className="text-xs font-normal text-slate-500">{reading?.unit || ''}</span></p></div>;
                            })}
                        </div>
                        <dl className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                            <div className="flex justify-between gap-3"><dt>采样时间</dt><dd className="text-right text-slate-700">{formatTime(selectedDevice.sampledAt)}</dd></div>
                            <div className="flex justify-between gap-3"><dt>接收时间</dt><dd className="text-right text-slate-700">{formatTime(selectedDevice.receivedAt)}</dd></div>
                            <div className="flex justify-between gap-3"><dt>读数 ID</dt><dd className="max-w-56 truncate font-mono text-slate-700" title={selectedDevice.readingId || ''}>{selectedDevice.readingId || '--'}</dd></div>
                        </dl>
                    </div>
                </div>
            )}
        </div>
    );
}
