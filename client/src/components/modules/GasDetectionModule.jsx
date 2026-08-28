import { Fragment, useState } from 'react';
import SignaturePad from '../SignaturePad';

const nowLocal = () => {
    const date = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const splitPeople = (value) => String(value || '').split(/[\s,，、;；]+/).map((item) => item.trim()).filter(Boolean);

export default function GasDetectionModule({ data, onChange, readOnly, currentUser, onSave, saving, requireStrictSignAndPhotos = false }) {
    const [selectedRecordIndex, setSelectedRecordIndex] = useState(null);
    const canEdit = !readOnly && currentUser?.role === 'safety';
    const records = data?.gas_detection_records || [];
    const analysts = [...new Set([...splitPeople(data?.workers), data?.supervisor].filter(Boolean))];
    const userName = currentUser?.full_name || currentUser?.name || currentUser?.username || '当前用户';

    const addRecord = () => onChange('gas_detection_records', [...records, {
        analyst: '', analysis_time: nowLocal(), samplingTime: nowLocal(), location: data?.confined_space_name || data?.location || '',
        gasName: '', standard: '', result: '', qualified: null, guardian_confirm: '', photos: []
    }]);
    const updateRecord = (index, field, value) => onChange('gas_detection_records', records.map((record, recordIndex) => recordIndex === index ? { ...record, [field]: value } : record));
    const updateRecordFields = (index, values) => onChange('gas_detection_records', records.map((record, recordIndex) => recordIndex === index ? { ...record, ...values } : record));
    const addPhotos = (index, event) => {
        const photos = Array.from(event.target.files || []).map((file) => ({ name: file.name, type: file.type || '图片', size: file.size }));
        if (photos.length) updateRecord(index, 'photos', [...(records[index].photos || []), ...photos]);
        event.target.value = '';
    };
    const removeRecord = (index) => {
        onChange('gas_detection_records', records.filter((_, recordIndex) => recordIndex !== index));
        if (selectedRecordIndex === index) setSelectedRecordIndex(null);
    };
    const changeSignature = (signature) => {
        onChange('gas_detection_guardian_signature', signature || '');
        onChange('gas_detection_guardian_sign', signature ? userName : '');
        onChange('gas_detection_guardian_time', signature ? nowLocal() : '');
    };
    const commitSignature = async (signature) => {
        const signName = signature ? userName : '';
        const signTime = signature ? (data?.gas_detection_guardian_time || nowLocal()) : '';
        await onSave?.({ gas_detection_records: records, gas_detection_guardian_sign: signName, gas_detection_guardian_signature: signature || '', gas_detection_guardian_time: signTime }, null);
    };

    const selectedRecord = selectedRecordIndex === null ? null : records[selectedRecordIndex];

    return <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4"><h2 className="flex items-center gap-2 text-xl font-bold text-gray-800"><i className="fas fa-wind text-blue-600" />气体浓度检测</h2><p className="mt-1 text-sm text-gray-500">检测记录自动关联当前作业票，分析人取作业人和作业负责人。</p></div>

        {selectedRecord ? <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 bg-blue-50 px-5 py-4">
                <div><button type="button" onClick={() => setSelectedRecordIndex(null)} className="mb-2 text-sm text-blue-600 hover:text-blue-800"><i className="fas fa-arrow-left mr-2" />返回检测记录列表</button><h3 className="text-lg font-bold text-gray-800">检测记录明细 · 第 {selectedRecordIndex + 1} 条</h3><p className="mt-1 text-sm text-gray-500">票号：{data?.permit_number || data?.permit_code || '自动生成'}</p></div>
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${selectedRecord.qualified === true ? 'bg-green-100 text-green-700' : selectedRecord.qualified === false ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{selectedRecord.qualified === true ? '合格' : selectedRecord.qualified === false ? '不合格' : '待判断'}</span>
            </div>
            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                <div><label className="mb-2 block text-sm font-medium text-gray-700">代表性气体名称 <span className="text-red-500">*</span></label><input disabled={!canEdit} value={selectedRecord.gasName || ''} onChange={(event) => updateRecord(selectedRecordIndex, 'gasName', event.target.value)} placeholder="如：氧气、一氧化碳、硫化氢等" className="w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" /></div>
                <div><label className="mb-2 block text-sm font-medium text-gray-700">检测点位置 <span className="text-red-500">*</span></label><input disabled={!canEdit} value={selectedRecord.location || ''} onChange={(event) => updateRecord(selectedRecordIndex, 'location', event.target.value)} placeholder="检测点的具体位置" className="w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" /></div>
                <div><label className="mb-2 block text-sm font-medium text-gray-700">合格标准 <span className="text-red-500">*</span></label><input disabled={!canEdit} value={selectedRecord.standard || ''} onChange={(event) => updateRecord(selectedRecordIndex, 'standard', event.target.value)} placeholder="如：≥19.5%、≤24ppm等" className="w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" /></div>
                <div><label className="mb-2 block text-sm font-medium text-gray-700">分析结果数据 <span className="text-red-500">*</span></label><input disabled={!canEdit} value={selectedRecord.result || ''} onChange={(event) => updateRecord(selectedRecordIndex, 'result', event.target.value)} placeholder="实际检测数值" className="w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" /></div>
                <div><label className="mb-2 block text-sm font-medium text-gray-700">取样时间 <span className="text-red-500">*</span></label><input disabled={!canEdit} type="datetime-local" value={selectedRecord.samplingTime || selectedRecord.analysis_time || ''} onChange={(event) => updateRecordFields(selectedRecordIndex, { samplingTime: event.target.value, analysis_time: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" /></div>
                <div><label className="mb-2 block text-sm font-medium text-gray-700">检测结果 <span className="text-red-500">*</span></label><div className="flex gap-6 pt-2"><label className="flex cursor-pointer items-center gap-2"><input type="radio" name={`detail-qualified-${selectedRecordIndex}`} checked={selectedRecord.qualified === true} onChange={() => updateRecord(selectedRecordIndex, 'qualified', true)} disabled={!canEdit} className="h-4 w-4 text-green-600" /><span className="text-sm text-gray-700">合格</span></label><label className="flex cursor-pointer items-center gap-2"><input type="radio" name={`detail-qualified-${selectedRecordIndex}`} checked={selectedRecord.qualified === false} onChange={() => updateRecord(selectedRecordIndex, 'qualified', false)} disabled={!canEdit} className="h-4 w-4 text-red-600" /><span className="text-sm text-gray-700">不合格</span></label></div></div>
            </div>
        </div> : <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4"><div><h3 className="font-semibold text-gray-800">气体浓度检测记录</h3><p className="mt-1 text-xs text-gray-500">分析结果会综合仪表读数自动判断，当前为模拟展示。</p></div>{canEdit && <button type="button" onClick={addRecord} className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"><i className="fas fa-plus mr-1" />添加记录</button>}</div>
            <table className="min-w-[1020px] w-full text-sm">
                <thead className="bg-blue-50 text-left text-sm text-blue-800"><tr>{['序号', '票号', '分析人', '分析时间', '分析结果', '采样地点', '监护人确认签字'].map((title) => <th key={title} className="whitespace-nowrap px-4 py-4 font-bold">{title}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-200">{records.length === 0 ? <tr><td colSpan="7" className="px-3 py-8 text-center text-gray-400">暂无检测记录，点击“添加记录”开始填写</td></tr> : records.map((record, index) => <Fragment key={index}>
                    <tr className="align-top hover:bg-slate-50"><td className="whitespace-nowrap px-4 py-4 text-gray-500">{index + 1}</td><td className="whitespace-nowrap px-4 py-4 font-mono text-sm text-gray-600">{data?.permit_number || data?.permit_code || '自动生成'}</td><td className="px-4 py-3"><select disabled={!canEdit} value={record.analyst || ''} onChange={(event) => updateRecord(index, 'analyst', event.target.value)} className="min-w-32 rounded border border-gray-300 px-2 py-2 disabled:bg-gray-100"><option value="">请选择</option>{analysts.map((person) => <option key={person}>{person}</option>)}</select></td><td className="px-4 py-3"><input disabled={!canEdit} type="datetime-local" value={record.analysis_time || ''} onChange={(event) => updateRecordFields(index, { analysis_time: event.target.value, samplingTime: event.target.value })} className="rounded border border-gray-300 px-2 py-2 disabled:bg-gray-100" /></td><td className="px-4 py-3"><select disabled={!canEdit} value={record.qualified === true ? '合格' : record.qualified === false ? '不合格' : ''} onChange={(event) => updateRecord(index, 'qualified', event.target.value === '合格' ? true : event.target.value === '不合格' ? false : null)} className="rounded border border-gray-300 px-2 py-2 disabled:bg-gray-100"><option value="">待判断</option><option>合格</option><option>不合格</option></select></td><td className="px-4 py-3"><input disabled={!canEdit} value={record.location || ''} onChange={(event) => updateRecord(index, 'location', event.target.value)} placeholder="受限空间名称" className="min-w-36 rounded border border-gray-300 px-2 py-2 disabled:bg-gray-100" /></td><td className="px-4 py-3"><input disabled={!canEdit} value={record.guardian_confirm || data?.guardian || ''} onChange={(event) => updateRecord(index, 'guardian_confirm', event.target.value)} placeholder="监护人签字" className="min-w-28 rounded border border-gray-300 px-2 py-2 disabled:bg-gray-100" /></td></tr>
                    <tr className="bg-white"><td colSpan="7" className="px-4 pb-4 pt-1"><div className="flex items-center justify-end gap-4"><button type="button" onClick={() => setSelectedRecordIndex(index)} className="text-blue-600 hover:text-blue-800"><i className="fas fa-clipboard-list mr-1" />检测记录</button>{canEdit && <label className="cursor-pointer text-blue-600 hover:text-blue-800"><i className="fas fa-paperclip mr-1" />上传照片<input className="hidden" type="file" accept="image/*" multiple onChange={(event) => addPhotos(index, event)} /></label>}<span className="text-xs text-gray-500">{(record.photos || []).length ? `${record.photos.length} 个附件` : '无附件'}</span>{canEdit && <button type="button" onClick={() => removeRecord(index)} className="text-xs text-red-500 hover:text-red-700">删除</button>}</div></td></tr>
                </Fragment>)}</tbody>
            </table>
        </div>}

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"><h3 className="mb-3 font-semibold text-gray-700">监护人签字确认{requireStrictSignAndPhotos && <span className="ml-1 text-red-500">*</span>}</h3><div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2"><div><SignaturePad value={data?.gas_detection_guardian_signature || ''} onChange={changeSignature} onCommit={commitSignature} disabled={!canEdit} className="h-20" /></div><div><label className="mb-1 block text-sm text-gray-500">签字时间</label><input type="datetime-local" disabled={!canEdit} value={data?.gas_detection_guardian_time || ''} onChange={(event) => onChange('gas_detection_guardian_time', event.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 disabled:bg-gray-100" /></div></div><p className="mt-3 text-xs text-blue-600"><i className="fas fa-info-circle mr-1" />完成签字即代表确认本板块内容，系统将自动保存，无需另行点击保存。</p></div>
    </div>;
}
