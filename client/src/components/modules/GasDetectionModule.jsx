import { Fragment, useState } from 'react';
import SignaturePad from '../SignaturePad';
import { compressImages } from '../../utils/imageUtils';

const nowLocal = () => {
    const date = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const splitPeople = (value) => String(value || '').split(/[\s,，、;；]+/).map((item) => item.trim()).filter(Boolean);

export default function GasDetectionModule({ data, onChange, readOnly, currentUser, onSave, requireStrictSignAndPhotos = false }) {
    const [selectedRecordIndex, setSelectedRecordIndex] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [uploadingRecordIndex, setUploadingRecordIndex] = useState(null);
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
    const addPhotos = async (index, event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = '';
        if (!files.length) return;
        setUploadingRecordIndex(index);
        try {
            const photos = await compressImages(files, { maxWidth: 1200, maxHeight: 1200, quality: 0.7 });
            updateRecord(index, 'photos', [...(records[index].photos || []), ...photos]);
        } catch (error) {
            console.error('气体检测照片上传失败:', error);
            window.alert('照片上传失败，请重试');
        } finally {
            setUploadingRecordIndex(null);
        }
    };
    const removePhoto = (recordIndex, photoIndex) => updateRecord(recordIndex, 'photos', (records[recordIndex].photos || []).filter((_, index) => index !== photoIndex));
    const removeRecord = (index) => {
        onChange('gas_detection_records', records.filter((_, recordIndex) => recordIndex !== index));
        if (selectedRecordIndex !== null) setSelectedRecordIndex(records.length <= 1 ? null : 0);
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

    const showingRecordDetails = selectedRecordIndex !== null;

    return <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4"><h2 className="flex items-center gap-2 text-xl font-bold text-gray-800"><i className="fas fa-wind text-blue-600" />气体浓度检测</h2><p className="mt-1 text-sm text-gray-500">检测记录自动关联当前作业票，分析人取作业人和作业负责人。</p></div>

        {showingRecordDetails ? <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <button type="button" onClick={() => setSelectedRecordIndex(null)} className="mb-5 text-sm text-blue-600 hover:text-blue-800"><i className="fas fa-arrow-left mr-2" />返回检测记录列表</button>
            <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
                <div><h3 className="text-lg font-semibold text-gray-800">首次气体浓度检测记录</h3><p className="mt-1 text-sm text-gray-500">按检测点分别上传仪器读数或纸质记录照片，并确认检测结果。</p></div>
                {canEdit && <button type="button" onClick={addRecord} className="text-sm font-medium text-blue-600 hover:text-blue-800"><i className="fas fa-plus mr-1" />添加记录</button>}
            </div>
            <div className="space-y-5">
                {records.map((record, index) => <div key={index} className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    {canEdit && <button type="button" onClick={() => removeRecord(index)} aria-label={`删除第${index + 1}条检测记录`} className="absolute right-4 top-4 text-lg text-red-500 hover:text-red-700"><i className="fas fa-times" /></button>}
                    <div className="pr-10">
                        <label className="mb-2 block text-sm font-medium text-gray-700">检测点位置 <span className="text-red-500">*</span></label>
                        <input disabled={!canEdit} value={record.location || ''} onChange={(event) => updateRecord(index, 'location', event.target.value)} placeholder="请输入检测点位置，如：上、中、下" className="w-full rounded-lg border border-gray-300 px-3 py-3 disabled:bg-gray-100 disabled:text-gray-500" />
                    </div>
                    <div className="mt-5">
                        <h4 className="font-medium text-gray-800"><i className="fas fa-camera mr-2 text-blue-600" />检测数据照片上传 <span className="ml-1 text-sm font-normal text-gray-500">（请拍摄检测仪器读数、纸质记录等）</span></h4>
                        <div className="mt-3 flex flex-wrap gap-4">
                            {(record.photos || []).map((photo, photoIndex) => <div key={`${photo.name}-${photoIndex}`} className="group relative w-28">
                                {photo.url ? <img src={photo.url} alt={photo.name} loading="lazy" className="h-32 w-28 cursor-pointer rounded-lg border border-gray-200 bg-gray-100 object-cover" onClick={() => setPreviewImage(photo.url)} /> : <div className="flex h-32 w-28 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-gray-400"><i className="fas fa-image text-3xl" /></div>}
                                {canEdit && <button type="button" onClick={() => removePhoto(index, photoIndex)} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"><i className="fas fa-times" /></button>}
                                <p className="mt-1 truncate text-xs text-gray-500">{photo.name}</p>
                            </div>)}
                            {canEdit && <label className={`flex h-32 w-28 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-500 hover:bg-blue-50 ${uploadingRecordIndex === index ? 'pointer-events-none opacity-60' : ''}`}>
                                <i className={`fas ${uploadingRecordIndex === index ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'} mb-2 text-3xl text-gray-400`} />
                                <span className="text-sm text-gray-500">{uploadingRecordIndex === index ? '上传中...' : '点击上传'}</span>
                                <input className="hidden" type="file" accept="image/*" multiple onChange={(event) => addPhotos(index, event)} />
                            </label>}
                        </div>
                        {!canEdit && !(record.photos || []).length && <p className="py-4 text-sm text-gray-400">暂无检测照片</p>}
                    </div>
                    <div className="mt-6">
                        <label className="mb-3 block text-sm font-medium text-gray-700">检测结果 <span className="text-red-500">*</span></label>
                        <div className="flex gap-8"><label className="flex items-center gap-2"><input type="radio" name={`detail-qualified-${index}`} checked={record.qualified === true} onChange={() => updateRecord(index, 'qualified', true)} disabled={!canEdit} className="h-4 w-4 text-blue-600" /><span className="text-sm text-gray-700">合格</span></label><label className="flex items-center gap-2"><input type="radio" name={`detail-qualified-${index}`} checked={record.qualified === false} onChange={() => updateRecord(index, 'qualified', false)} disabled={!canEdit} className="h-4 w-4 text-blue-600" /><span className="text-sm text-gray-700">不合格</span></label></div>
                    </div>
                </div>)}
                {records.length === 0 && <div className="rounded-lg border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400">暂无检测点记录{canEdit ? '，请点击“添加记录”' : ''}</div>}
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
        {previewImage && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6" onClick={() => setPreviewImage(null)}><button type="button" className="absolute right-6 top-6 text-3xl text-white" onClick={() => setPreviewImage(null)}>&times;</button><img src={previewImage} alt="检测照片预览" className="max-h-full max-w-full rounded-lg object-contain" /></div>}
    </div>;
}
