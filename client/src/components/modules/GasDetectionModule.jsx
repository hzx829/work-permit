import { useState } from 'react';
import SignaturePad from '../SignaturePad';
import { compressImages } from '../../utils/imageUtils';
import useCompetitionGasReadings from '../../hooks/useCompetitionGasReadings';
import { formatGasValue } from '../../utils/gasUtils';

const nowLocal = () => {
    const date = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const splitPeople = (value) => String(value || '').split(/[\s,，、;；]+/).map((item) => item.trim()).filter(Boolean);

const gasNames = { CH4: '甲烷', CO2: '二氧化碳', O2: '氧气', CO: '一氧化碳' };
const toLocalInput = (value) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return nowLocal();
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const getRecordTicketSequence = (record, index) => {
    if (Number.isInteger(record?.ticket_sequence) && record.ticket_sequence > 0) return record.ticket_sequence;
    const ticketNumber = String(record?.ticket_number || '');
    const legacyMatch = ticketNumber.match(/^(\d+)号$/);
    return legacyMatch ? Number(legacyMatch[1]) : index + 1;
};

const buildRecordTicketNumber = (baseNumber, sequence) => {
    const normalizedBase = String(baseNumber || 'QTJC');
    const match = normalizedBase.match(/^(.*?)(\d+)$/);
    if (!match) return `${normalizedBase}-${String(sequence).padStart(3, '0')}`;
    const [, prefix, trailingNumber] = match;
    const incrementedNumber = String(Number(trailingNumber) + sequence - 1).padStart(trailingNumber.length, '0');
    return `${prefix}${incrementedNumber}`;
};

const getNextTicketSequence = (records) => records.reduce((highest, record, index) => (
    Math.max(highest, getRecordTicketSequence(record, index))
), 0) + 1;

const createDetectionPoint = (location = '') => ({
    location,
    gasName: '',
    standard: '',
    result: '',
    qualified: null,
    photos: []
});

const getDetectionPoints = (record) => {
    if (Array.isArray(record?.detection_points)) return record.detection_points;
    return [{
        location: record?.location || '',
        gasName: record?.gasName || '',
        standard: record?.standard || '',
        result: record?.result || '',
        qualified: record?.qualified ?? null,
        photos: record?.photos || [],
        source: record?.source,
        sourceDeviceId: record?.sourceDeviceId,
        sourceReadingId: record?.sourceReadingId,
        sourceSampledAt: record?.sourceSampledAt,
        gasReadings: record?.gasReadings || []
    }];
};

const syncRecordFromPoints = (record, points) => {
    const locations = [...new Set(points.map((point) => point.location).filter(Boolean))];
    const qualified = points.length > 0 && points.every((point) => point.qualified === true)
        ? true
        : points.some((point) => point.qualified === false) ? false : null;
    return {
        ...record,
        detection_points: points,
        location: locations.join('、'),
        qualified,
        photos: points.flatMap((point) => point.photos || [])
    };
};

export default function GasDetectionModule({ data, onChange, readOnly, currentUser, onSave, requireStrictSignAndPhotos = false }) {
    const [selectedRecordIndex, setSelectedRecordIndex] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [uploadingDetailKey, setUploadingDetailKey] = useState(null);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const { devices, loading: devicesLoading, error: devicesError, refresh: refreshDevices } = useCompetitionGasReadings();
    const canEdit = !readOnly && currentUser?.role === 'safety';
    const baseTicketNumber = data?.permit_number || data?.permit_code || 'QTJC';
    const records = (data?.gas_detection_records || []).map((record, index) => {
        const ticketSequence = getRecordTicketSequence(record, index);
        return syncRecordFromPoints({
            ...record,
            ticket_sequence: ticketSequence,
            ticket_number: buildRecordTicketNumber(baseTicketNumber, ticketSequence)
        }, getDetectionPoints(record));
    });
    const getTicketNumber = (record, index) => record?.ticket_number || buildRecordTicketNumber(baseTicketNumber, getRecordTicketSequence(record, index));
    const legacySignedRecord = records.find((record) => record.guardian_signature);
    const hasGuardianSignatureField = Object.prototype.hasOwnProperty.call(data || {}, 'gas_detection_guardian_signature');
    const guardianSignature = hasGuardianSignatureField ? (data?.gas_detection_guardian_signature || '') : (legacySignedRecord?.guardian_signature || '');
    const guardianName = hasGuardianSignatureField ? (data?.gas_detection_guardian_sign || '') : (legacySignedRecord?.guardian_confirm || data?.guardian || '');
    const guardianTime = hasGuardianSignatureField ? (data?.gas_detection_guardian_time || '') : (legacySignedRecord?.guardian_time || '');
    const analysts = [...new Set(['1号', '2号', ...splitPeople(data?.workers), data?.supervisor].filter(Boolean))];
    const userName = currentUser?.full_name || currentUser?.name || currentUser?.username || '当前用户';
    const selectedDevice = devices.find((device) => device.deviceId === selectedDeviceId) || devices[0] || null;
    const addRecord = () => {
        const analysisTime = nowLocal();
        const point = createDetectionPoint(data?.confined_space_name || data?.location || '');
        const ticketSequence = getNextTicketSequence(records);
        const nextRecords = [...records, syncRecordFromPoints({
            ticket_sequence: ticketSequence,
            ticket_number: buildRecordTicketNumber(baseTicketNumber, ticketSequence),
            analyst: '', analysis_time: analysisTime, samplingTime: analysisTime
        }, [point])];
        onChange('gas_detection_records', nextRecords);
    };
    const updateRecord = (index, field, value) => onChange('gas_detection_records', records.map((record, recordIndex) => recordIndex === index ? { ...record, [field]: value } : record));
    const updateRecordFields = (index, values) => onChange('gas_detection_records', records.map((record, recordIndex) => recordIndex === index ? { ...record, ...values } : record));
    const addDetail = () => {
        if (selectedRecordIndex === null) return;
        const updatedRecords = records.map((record, recordIndex) => recordIndex === selectedRecordIndex
            ? syncRecordFromPoints(record, [...getDetectionPoints(record), createDetectionPoint(data?.confined_space_name || data?.location || '')])
            : record);
        onChange('gas_detection_records', updatedRecords);
    };
    const updateDetail = (recordIndex, detailIndex, field, value) => {
        const updatedRecords = records.map((record, index) => {
            if (index !== recordIndex) return record;
            const points = getDetectionPoints(record).map((point, pointIndex) => pointIndex === detailIndex ? { ...point, [field]: value } : point);
            return syncRecordFromPoints(record, points);
        });
        onChange('gas_detection_records', updatedRecords);
    };
    const updateTicketQualification = (recordIndex, qualified) => {
        const updatedRecords = records.map((record, index) => index === recordIndex
            ? syncRecordFromPoints(record, getDetectionPoints(record).map((point) => ({ ...point, qualified })))
            : record);
        onChange('gas_detection_records', updatedRecords);
    };
    const addPhotos = async (recordIndex, detailIndex, event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = '';
        if (!files.length) return;
        const detailKey = `${recordIndex}-${detailIndex}`;
        setUploadingDetailKey(detailKey);
        try {
            const photos = await compressImages(files, { maxWidth: 1200, maxHeight: 1200, quality: 0.7 });
            const updatedRecords = records.map((record, index) => {
                if (index !== recordIndex) return record;
                const points = getDetectionPoints(record).map((point, pointIndex) => pointIndex === detailIndex ? {
                    ...point,
                    photos: [...(point.photos || []), ...photos]
                } : point);
                return syncRecordFromPoints(record, points);
            });
            onChange('gas_detection_records', updatedRecords);
            await onSave?.({ gas_detection_records: updatedRecords }, null);
        } catch (error) {
            console.error('气体检测照片保存失败:', error);
            window.alert('照片保存失败，请重试');
        } finally {
            setUploadingDetailKey(null);
        }
    };
    const removePhoto = async (recordIndex, detailIndex, photoIndex) => {
        const updatedRecords = records.map((record, index) => {
            if (index !== recordIndex) return record;
            const points = getDetectionPoints(record).map((point, pointIndex) => pointIndex === detailIndex ? {
                ...point,
                photos: (point.photos || []).filter((_, index) => index !== photoIndex)
            } : point);
            return syncRecordFromPoints(record, points);
        });
        onChange('gas_detection_records', updatedRecords);
        await onSave?.({ gas_detection_records: updatedRecords }, null);
    };
    const removeDetail = (recordIndex, detailIndex) => {
        const updatedRecords = records.map((record, index) => index === recordIndex
            ? syncRecordFromPoints(record, getDetectionPoints(record).filter((_, pointIndex) => pointIndex !== detailIndex))
            : record);
        onChange('gas_detection_records', updatedRecords);
    };
    const removeRecord = (index) => {
        const nextRecords = records.filter((_, recordIndex) => recordIndex !== index);
        onChange('gas_detection_records', nextRecords);
        if (selectedRecordIndex === index || nextRecords.length === 0) setSelectedRecordIndex(null);
        else if (selectedRecordIndex > index) setSelectedRecordIndex(selectedRecordIndex - 1);
    };
    const getGuardianName = () => data?.guardian || userName;
    const changeGuardianSignature = (signature) => {
        onChange('gas_detection_guardian_signature', signature || '');
        onChange('gas_detection_guardian_sign', signature ? getGuardianName() : '');
        onChange('gas_detection_guardian_time', signature ? (guardianTime || nowLocal()) : '');
    };
    const commitGuardianSignature = async (signature) => {
        const updates = {
            gas_detection_records: records,
            gas_detection_guardian_signature: signature || '',
            gas_detection_guardian_sign: signature ? getGuardianName() : '',
            gas_detection_guardian_time: signature ? (guardianTime || nowLocal()) : ''
        };
        Object.entries(updates).forEach(([field, value]) => onChange(field, value));
        await onSave?.(updates, null);
    };

    const captureDeviceReading = () => {
        if (!canEdit || !selectedDevice || selectedDevice.dataStatus !== 'fresh' || devicesError) return;
        const readings = Object.entries(selectedDevice.gasData || {}).map(([key, reading]) => ({
            key,
            label: gasNames[key] || key,
            value: reading.value,
            unit: reading.unit,
        }));
        if (!readings.length) return;
        const analysisTime = toLocalInput(selectedDevice.sampledAt || selectedDevice.receivedAt);
        const point = {
            location: data?.confined_space_name || data?.location || '',
            gasName: readings.map((reading) => reading.label).join('、'),
            standard: '检测仪原始读数，按现场赛事标准人工判定',
            result: readings.map((reading) => `${reading.label} ${formatGasValue(reading.value, reading.key)} ${reading.unit}`).join('；'),
            qualified: null,
            photos: [],
            source: 'competition-device',
            sourceDeviceId: selectedDevice.deviceId,
            sourceReadingId: selectedDevice.readingId,
            sourceSampledAt: selectedDevice.sampledAt,
            gasReadings: readings,
        };
        const ticketSequence = getNextTicketSequence(records);
        const record = syncRecordFromPoints({
            ticket_sequence: ticketSequence,
            ticket_number: buildRecordTicketNumber(baseTicketNumber, ticketSequence),
            analyst: analysts.includes(userName) ? userName : (analysts[0] || userName),
            analysis_time: analysisTime,
            samplingTime: analysisTime,
        }, [point]);
        const nextRecords = [...records, record];
        onChange('gas_detection_records', nextRecords);
        setSelectedRecordIndex(nextRecords.length - 1);
    };

    const showingRecordDetails = selectedRecordIndex !== null && Boolean(records[selectedRecordIndex]);
    const selectedRecord = showingRecordDetails ? records[selectedRecordIndex] : null;
    const selectedDetails = selectedRecord ? getDetectionPoints(selectedRecord) : [];

    return <div className="min-w-0 space-y-5">
        <div className="border-b border-gray-200 pb-4"><h2 className="flex items-center gap-2 text-xl font-bold text-gray-800"><i className="fas fa-wind text-blue-600" />气体浓度检测</h2><p className="mt-1 text-sm text-gray-500">检测记录自动关联当前作业票，分析人取作业人和作业负责人。</p></div>

        <div className="rounded-xl border border-cyan-200 bg-cyan-50/60 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div><h3 className="font-semibold text-slate-800"><i className="fas fa-satellite-dish mr-2 text-cyan-600" />智能气体检测仪</h3><p className="mt-1 text-xs text-slate-500">每 3 秒读取一次设备原始数据；仅实时且有读数的数据可采集。</p></div>
                <div className="flex flex-wrap items-center gap-2">
                    <select value={selectedDevice?.deviceId || ''} onChange={(event) => setSelectedDeviceId(event.target.value)} disabled={!devices.length} className="min-w-56 rounded-lg border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:text-slate-400">
                        {!devices.length && <option value="">{devicesLoading ? '正在连接设备...' : '暂无授权设备'}</option>}
                        {devices.map((device) => <option key={device.deviceId} value={device.deviceId}>{device.deviceName || device.deviceId}{device.primary ? '（默认）' : ''}</option>)}
                    </select>
                    <button type="button" onClick={refreshDevices} className="rounded-lg border border-cyan-200 bg-white px-3 py-2 text-sm text-cyan-700 hover:bg-cyan-50"><i className="fas fa-rotate" /></button>
                    {canEdit && <button type="button" onClick={captureDeviceReading} disabled={!selectedDevice || selectedDevice.dataStatus !== 'fresh' || !Object.keys(selectedDevice.gasData || {}).length || Boolean(devicesError)} className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"><i className="fas fa-download mr-1" />采集当前读数</button>}
                </div>
            </div>
            {devicesError ? <p className="mt-3 text-sm text-rose-600">连接中断：{devicesError.message}</p> : selectedDevice ? <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">{['CH4', 'CO2', 'O2', 'CO'].map((key) => { const reading = selectedDevice.gasData?.[key]; return <div key={key} className="min-w-0 overflow-hidden rounded-lg border border-cyan-100 bg-white px-3 py-2"><p className="truncate text-[11px] text-slate-500">{gasNames[key]} {key}</p><p className="mt-1 truncate font-mono text-lg font-bold text-slate-800" title={reading?.value ?? ''}>{formatGasValue(reading?.value, key)} <span className="text-xs font-normal text-slate-400">{reading?.unit || ''}</span></p></div>; })}</div> : null}
            {selectedDevice && !devicesError && <p className={`mt-3 text-xs font-medium ${selectedDevice.dataStatus === 'fresh' ? 'text-emerald-600' : selectedDevice.dataStatus === 'stale' ? 'text-amber-600' : 'text-slate-500'}`}>{selectedDevice.dataStatus === 'fresh' ? '数据实时，可采集' : selectedDevice.dataStatus === 'stale' ? '数据已过期，不可采集' : '设备暂无气体数据'}</p>}
        </div>

        {showingRecordDetails ? <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <button type="button" onClick={() => setSelectedRecordIndex(null)} className="mb-5 text-sm text-blue-600 hover:text-blue-800"><i className="fas fa-arrow-left mr-2" />返回检测记录列表</button>
            <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
                <div><h3 className="text-lg font-semibold text-gray-800">气体浓度检测记录 · {getTicketNumber(selectedRecord, selectedRecordIndex)}</h3><p className="mt-1 text-sm text-gray-500">当前页面仅显示本票的检测点明细。</p></div>
                {canEdit && <button type="button" onClick={addDetail} className="text-sm font-medium text-blue-600 hover:text-blue-800"><i className="fas fa-plus mr-1" />添加检测明细</button>}
            </div>
            <div className="space-y-5">
                {selectedDetails.map((detail, detailIndex) => <div key={detailIndex} className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    {canEdit && <button type="button" onClick={() => removeDetail(selectedRecordIndex, detailIndex)} aria-label={`删除第${detailIndex + 1}个检测点`} className="absolute right-4 top-4 text-lg text-red-500 hover:text-red-700"><i className="fas fa-times" /></button>}
                    <div>
                            <div className="pr-10">
                                <label className="mb-2 block text-sm font-medium text-gray-700">检测点位置 <span className="text-red-500">*</span></label>
                                <input disabled={!canEdit} value={detail.location || ''} onChange={(event) => updateDetail(selectedRecordIndex, detailIndex, 'location', event.target.value)} placeholder="请输入检测点位置，如：上、中、下" className="w-full rounded-lg border border-gray-300 px-3 py-3 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            {detail.source === 'competition-device' && (
                                <div className="mt-5 rounded-lg border border-cyan-200 bg-cyan-50 p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-semibold text-cyan-900">检测仪采集数据</h4><span className="font-mono text-xs text-cyan-700">{detail.sourceDeviceId}</span></div>
                                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{(detail.gasReadings || []).map((reading) => <div key={reading.key} className="min-w-0 overflow-hidden rounded border border-cyan-100 bg-white px-2 py-2"><p className="truncate text-[11px] text-slate-500">{reading.label}</p><p className="truncate font-mono font-bold text-slate-800" title={reading.value ?? ''}>{formatGasValue(reading.value, reading.key)} <span className="text-[11px] font-normal text-slate-400">{reading.unit}</span></p></div>)}</div>
                                    <p className="mt-2 text-[11px] text-cyan-700">读数 ID：{detail.sourceReadingId || '--'} · 采样时间：{detail.sourceSampledAt ? new Date(detail.sourceSampledAt).toLocaleString('zh-CN', { hour12: false }) : '--'}</p>
                                </div>
                            )}
                            <div className="mt-5">
                                <label className="mb-3 block text-sm font-medium text-gray-700">检测结果 <span className="text-red-500">*</span></label>
                                <div className="flex gap-8"><label className="flex items-center gap-2"><input type="radio" name={`detail-qualified-${selectedRecordIndex}-${detailIndex}`} checked={detail.qualified === true} onChange={() => updateDetail(selectedRecordIndex, detailIndex, 'qualified', true)} disabled={!canEdit} className="h-4 w-4 text-blue-600" /><span className="text-sm text-gray-700">合格</span></label><label className="flex items-center gap-2"><input type="radio" name={`detail-qualified-${selectedRecordIndex}-${detailIndex}`} checked={detail.qualified === false} onChange={() => updateDetail(selectedRecordIndex, detailIndex, 'qualified', false)} disabled={!canEdit} className="h-4 w-4 text-blue-600" /><span className="text-sm text-gray-700">不合格</span></label></div>
                            </div>
                            <div className="mt-6">
                                <h4 className="font-medium text-gray-800"><i className="fas fa-camera mr-2 text-blue-600" />检测数据照片{requireStrictSignAndPhotos && <span className="ml-1 text-red-500">*</span>} <span className="ml-1 text-sm font-normal text-gray-500">（请拍摄检测仪器读数、纸质记录等）</span></h4>
                                <div className="mt-3 flex flex-wrap gap-4">
                                    {(detail.photos || []).map((photo, photoIndex) => <div key={`${photo.name}-${photoIndex}`} className="group relative w-28">
                                        {photo.url ? <img src={photo.url} alt={photo.name} loading="lazy" className="h-32 w-28 cursor-pointer rounded-lg border border-gray-200 bg-gray-100 object-cover" onClick={() => setPreviewImage(photo.url)} /> : <div className="flex h-32 w-28 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-gray-400"><i className="fas fa-image text-3xl" /></div>}
                                        {canEdit && <button type="button" onClick={() => removePhoto(selectedRecordIndex, detailIndex, photoIndex)} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"><i className="fas fa-times" /></button>}
                                        <p className="mt-1 truncate text-xs text-gray-500">{photo.name}</p>
                                    </div>)}
                                    {canEdit && <label className={`flex h-32 w-28 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-500 hover:bg-blue-50 ${uploadingDetailKey === `${selectedRecordIndex}-${detailIndex}` ? 'pointer-events-none opacity-60' : ''}`}>
                                        <i className={`fas ${uploadingDetailKey === `${selectedRecordIndex}-${detailIndex}` ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'} mb-2 text-3xl text-gray-400`} />
                                        <span className="text-sm text-gray-500">{uploadingDetailKey === `${selectedRecordIndex}-${detailIndex}` ? '上传中...' : '点击上传'}</span>
                                        <input className="hidden" type="file" accept="image/*" multiple onChange={(event) => addPhotos(selectedRecordIndex, detailIndex, event)} />
                                    </label>}
                                </div>
                                {!canEdit && !(detail.photos || []).length && <p className="py-4 text-sm text-gray-400">暂无检测照片</p>}
                            </div>
                    </div>
                </div>)}
                {selectedDetails.length === 0 && <div className="rounded-lg border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400">暂无检测点明细{canEdit ? '，请点击“添加检测明细”' : ''}</div>}
            </div>
            {selectedRecord && <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/60 p-5">
                <h4 className="font-semibold text-gray-800"><i className="fas fa-signature mr-2 text-blue-600" />监护人确认签字{requireStrictSignAndPhotos && <span className="ml-1 text-red-500">*</span>}</h4>
                <p className="mt-1 text-xs text-gray-500">确认当前作业票下全部气体检测记录，仅需签字一次，签字后自动保存。</p>
                <div className="mt-4"><SignaturePad value={guardianSignature} onChange={changeGuardianSignature} onCommit={commitGuardianSignature} disabled={!canEdit} className="h-32" /></div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div><label className="mb-1 block text-xs text-gray-500">监护人</label><input readOnly value={guardianName} placeholder="完成签字后自动生成" className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700" /></div>
                    <div><label className="mb-1 block text-xs text-gray-500">签字时间</label><input readOnly type="datetime-local" value={guardianTime} className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700" /></div>
                </div>
            </div>}
        </div> : <div className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4"><div><h3 className="font-semibold text-gray-800">气体浓度检测记录</h3><p className="mt-1 text-xs text-gray-500">支持从智能检测仪采集原始读数，合格结论按现场标准人工确认。</p></div>{canEdit && <button type="button" onClick={addRecord} className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"><i className="fas fa-plus mr-1" />新增检测票</button>}</div>
            <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[820px] table-fixed text-sm">
                    <colgroup><col className="w-[7%]" /><col className="w-[18%]" /><col className="w-[14%]" /><col className="w-[20%]" /><col className="w-[12%]" /><col className="w-[14%]" /><col className="w-[15%]" /></colgroup>
                    <thead className="bg-blue-50 text-left text-sm text-blue-800"><tr>{['序号', '票号', '分析人', '分析时间', '分析结果', '采样地点', '监护人确认'].map((title) => <th key={title} className="whitespace-nowrap px-3 py-3 font-bold">{title}</th>)}</tr></thead>
                    <tbody className="divide-y divide-gray-200">{records.length === 0 ? <tr><td colSpan="7" className="px-3 py-8 text-center text-gray-400">暂无检测票，点击“新增检测票”开始填写</td></tr> : records.map((record, index) => (
                        <tr key={index} className="align-middle hover:bg-slate-50"><td className="whitespace-nowrap px-3 py-3 text-gray-500">{index + 1}</td><td className="truncate whitespace-nowrap px-3 py-3 font-mono text-xs font-medium text-blue-700" title={getTicketNumber(record, index)}>{getTicketNumber(record, index)}</td><td className="px-3 py-3"><select disabled={!canEdit} value={record.analyst || ''} onChange={(event) => updateRecord(index, 'analyst', event.target.value)} className="w-full rounded border border-gray-300 px-2 py-2 disabled:bg-gray-100"><option value="">请选择</option>{analysts.map((person) => <option key={person}>{person}</option>)}</select></td><td className="px-3 py-3"><input disabled={!canEdit} type="datetime-local" value={record.analysis_time || ''} onChange={(event) => updateRecordFields(index, { analysis_time: event.target.value, samplingTime: event.target.value })} className="w-full rounded border border-gray-300 px-2 py-2 disabled:bg-gray-100" /></td><td className="px-3 py-3"><select disabled={!canEdit} value={record.qualified === true ? '合格' : record.qualified === false ? '不合格' : ''} onChange={(event) => updateTicketQualification(index, event.target.value === '合格' ? true : event.target.value === '不合格' ? false : null)} className="w-full rounded border border-gray-300 px-2 py-2 disabled:bg-gray-100"><option value="">待判断</option><option>合格</option><option>不合格</option></select></td><td className="px-3 py-3"><div className="truncate rounded border border-gray-200 bg-gray-50 px-2 py-2 text-gray-700" title={record.location || '未填写'}>{record.location || '未填写'}{getDetectionPoints(record).length > 1 ? `（${getDetectionPoints(record).length}个检测点）` : ''}</div></td><td className="px-3 py-3"><div className="space-y-2">{guardianSignature ? <div className="flex items-center gap-2"><img src={guardianSignature} alt={`${guardianName || '监护人'}签字`} className="h-9 w-16 rounded border border-gray-200 bg-white object-contain" /><div className="min-w-0"><p className="truncate text-xs font-medium text-gray-700">{guardianName}</p><p className="text-[11px] text-green-600">全部记录已确认</p></div></div> : <span className="text-sm text-amber-600"><i className="far fa-clock mr-1" />待统一签字</span>}<div className="flex flex-wrap items-center gap-x-3 gap-y-1 whitespace-nowrap"><button type="button" onClick={() => setSelectedRecordIndex(index)} className="text-xs font-medium text-blue-600 hover:text-blue-800">检测详情</button><span className="text-[11px] text-gray-500">{getDetectionPoints(record).length} 个检测点 · {(record.photos || []).length} 张照片</span>{canEdit && <button type="button" onClick={() => removeRecord(index)} className="text-xs text-red-500 hover:text-red-700">删除</button>}</div></div></td></tr>
                    ))}</tbody>
                </table>
            </div>
        </div>}
        {previewImage && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6" onClick={() => setPreviewImage(null)}><button type="button" className="absolute right-6 top-6 text-3xl text-white" onClick={() => setPreviewImage(null)}>&times;</button><img src={previewImage} alt="检测照片预览" className="max-h-full max-w-full rounded-lg object-contain" /></div>}
    </div>;
}
