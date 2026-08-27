import SignaturePad from '../SignaturePad';

const nowLocal = () => {
    const date = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const splitPeople = (value) => String(value || '').split(/[\s,，、;；]+/).map((item) => item.trim()).filter(Boolean);

export default function GasDetectionModule({ data, onChange, readOnly, currentUser, onSave, saving, requireStrictSignAndPhotos = false }) {
    const canEdit = !readOnly && currentUser?.role === 'safety';
    const records = data?.gas_detection_records || [];
    const analysts = [...new Set([...splitPeople(data?.workers), data?.supervisor].filter(Boolean))];
    const userName = currentUser?.full_name || currentUser?.name || currentUser?.username || '当前用户';

    const addRecord = () => onChange('gas_detection_records', [...records, {
        analyst: '', analysis_time: nowLocal(), location: data?.confined_space_name || data?.location || '', qualified: null, guardian_confirm: '', photos: []
    }]);
    const updateRecord = (index, field, value) => onChange('gas_detection_records', records.map((record, recordIndex) => recordIndex === index ? { ...record, [field]: value } : record));
    const addPhotos = (index, event) => {
        const photos = Array.from(event.target.files || []).map((file) => ({ name: file.name, type: file.type || '图片', size: file.size }));
        if (photos.length) updateRecord(index, 'photos', [...(records[index].photos || []), ...photos]);
        event.target.value = '';
    };
    const changeSignature = (signature) => {
        onChange('gas_detection_guardian_signature', signature || '');
        onChange('gas_detection_guardian_sign', signature ? userName : '');
        onChange('gas_detection_guardian_time', signature ? nowLocal() : '');
    };
    const save = async () => {
        if (requireStrictSignAndPhotos && !data?.gas_detection_guardian_signature) return window.alert('请先完成监护人签字后再保存气体浓度检测。');
        await onSave?.({ gas_detection_records: records, gas_detection_guardian_sign: data?.gas_detection_guardian_sign || '', gas_detection_guardian_signature: data?.gas_detection_guardian_signature || '', gas_detection_guardian_time: data?.gas_detection_guardian_time || '' }, '气体浓度检测已保存');
    };

    return <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4"><div><h2 className="flex items-center gap-2 text-xl font-bold text-gray-800"><i className="fas fa-wind text-blue-600" />气体浓度检测</h2><p className="mt-1 text-sm text-gray-500">检测记录自动关联当前作业票，分析人取作业人和作业负责人。</p></div>{canEdit && <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"><i className="fas fa-save mr-2" />{saving ? '保存中...' : '保存'}</button>}</div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-gray-100 px-5 py-4"><div><h3 className="font-semibold text-gray-800">气体浓度检测记录</h3><p className="mt-1 text-xs text-gray-500">分析结果会综合仪表读数自动判断，当前为模拟展示。</p></div>{canEdit && <button type="button" onClick={addRecord} className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"><i className="fas fa-plus mr-1" />添加记录</button>}</div>
            <table className="min-w-[980px] w-full text-sm"><thead className="bg-blue-50 text-left text-xs text-blue-800"><tr>{['序号', '票号', '分析人', '分析时间', '分析结果', '采样地点', '监护人确认签字', '检测记录'].map((title) => <th key={title} className="px-3 py-3 font-semibold">{title}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{records.length === 0 ? <tr><td colSpan="8" className="px-3 py-8 text-center text-gray-400">暂无检测记录，点击“添加记录”开始填写</td></tr> : records.map((record, index) => <tr key={index} className="align-top hover:bg-slate-50"><td className="px-3 py-4 text-gray-500">{index + 1}</td><td className="px-3 py-4 font-mono text-xs text-gray-600">{data?.permit_number || data?.permit_code || '自动生成'}</td><td className="px-3 py-3"><select disabled={!canEdit} value={record.analyst || ''} onChange={(event) => updateRecord(index, 'analyst', event.target.value)} className="min-w-32 rounded border border-gray-300 px-2 py-2 disabled:bg-gray-100"><option value="">请选择</option>{analysts.map((person) => <option key={person}>{person}</option>)}</select></td><td className="px-3 py-3"><input disabled={!canEdit} type="datetime-local" value={record.analysis_time || ''} onChange={(event) => updateRecord(index, 'analysis_time', event.target.value)} className="rounded border border-gray-300 px-2 py-2 disabled:bg-gray-100" /></td><td className="px-3 py-3"><select disabled={!canEdit} value={record.qualified === true ? '合格' : record.qualified === false ? '不合格' : ''} onChange={(event) => updateRecord(index, 'qualified', event.target.value === '合格' ? true : event.target.value === '不合格' ? false : null)} className="rounded border border-gray-300 px-2 py-2 disabled:bg-gray-100"><option value="">待判断</option><option>合格</option><option>不合格</option></select></td><td className="px-3 py-3"><input disabled={!canEdit} value={record.location || ''} onChange={(event) => updateRecord(index, 'location', event.target.value)} placeholder="受限空间名称" className="min-w-36 rounded border border-gray-300 px-2 py-2 disabled:bg-gray-100" /></td><td className="px-3 py-3"><input disabled={!canEdit} value={record.guardian_confirm || data?.guardian || ''} onChange={(event) => updateRecord(index, 'guardian_confirm', event.target.value)} placeholder="监护人签字" className="min-w-28 rounded border border-gray-300 px-2 py-2 disabled:bg-gray-100" /></td><td className="px-3 py-3"><div className="flex flex-col gap-2">{canEdit && <label className="cursor-pointer text-blue-600 hover:text-blue-800"><i className="fas fa-paperclip mr-1" />上传照片<input className="hidden" type="file" accept="image/*" multiple onChange={(event) => addPhotos(index, event)} /></label>}<span className="text-xs text-gray-500">{(record.photos || []).length ? `${record.photos.length} 个附件` : '无附件'}</span>{canEdit && <button type="button" onClick={() => onChange('gas_detection_records', records.filter((_, recordIndex) => recordIndex !== index))} className="text-left text-xs text-red-500 hover:text-red-700">删除</button>}</div></td></tr>)}</tbody></table>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"><h3 className="mb-3 font-semibold text-gray-700">监护人签字确认{requireStrictSignAndPhotos && <span className="ml-1 text-red-500">*</span>}</h3><div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2"><div><SignaturePad value={data?.gas_detection_guardian_signature || ''} onChange={changeSignature} disabled={!canEdit} className="h-20" /></div><div><label className="mb-1 block text-sm text-gray-500">签字时间</label><input type="datetime-local" disabled={!canEdit} value={data?.gas_detection_guardian_time || ''} onChange={(event) => onChange('gas_detection_guardian_time', event.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 disabled:bg-gray-100" /></div></div></div>
    </div>;
}
