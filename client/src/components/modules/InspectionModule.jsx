/**
 * 验票及验收模块
 * 权限：其他人员 → 班长
 */
import SignaturePad from '../SignaturePad';

export default function InspectionModule({ data, onChange, readOnly, currentUser, onSave, saving, requireStrictSignAndPhotos = false }) {
    const canEdit = !readOnly && currentUser?.role === 'safety';
    const entryExitRecords = data?.entry_exit_records || [];

    const updateEntryExitRecords = (next) => onChange('entry_exit_records', next);
    const addEntryExitRecord = () => updateEntryExitRecords([...entryExitRecords, { person: '', direction: '进入', time: getNowDateTimeLocal(), photos: [] }]);
    const updateEntryExitRecord = (index, field, value) => updateEntryExitRecords(entryExitRecords.map((record, recordIndex) => recordIndex === index ? { ...record, [field]: value } : record));
    const addEntryExitPhotos = (index, event) => {
        const photos = Array.from(event.target.files || []).map((file) => ({ name: file.name, type: file.type || '图片', size: file.size }));
        if (!photos.length) return;
        updateEntryExitRecords(entryExitRecords.map((record, recordIndex) => recordIndex === index ? { ...record, photos: [...(record.photos || []), ...photos] } : record));
        event.target.value = '';
    };

    const getCurrentUserName = () => {
        if (!currentUser) return '当前用户';
        return (
            currentUser.full_name ||
            currentUser.name ||
            currentUser.username ||
            currentUser.account ||
            '当前用户'
        );
    };

    const getNowDateTimeLocal = () => {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const year = now.getFullYear();
        const month = pad(now.getMonth() + 1);
        const day = pad(now.getDate());
        const hours = pad(now.getHours());
        const minutes = pad(now.getMinutes());
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const handlePreSignatureChange = (dataUrl) => {
        if (!canEdit) return;
        if (dataUrl === '') {
            onChange('pre_inspection_signature_image', '');
            onChange('pre_inspection_signature', '');
            onChange('pre_inspection_person', '');
            onChange('pre_inspection_time', '');
            return;
        }

        if (!dataUrl) return;

        onChange('pre_inspection_signature_image', dataUrl);
        if (!data?.pre_inspection_signature) onChange('pre_inspection_signature', getCurrentUserName());
        if (!data?.pre_inspection_person) onChange('pre_inspection_person', getCurrentUserName());
        if (!data?.pre_inspection_time) onChange('pre_inspection_time', getNowDateTimeLocal());
    };

    const handlePostSignatureChange = (dataUrl) => {
        if (!canEdit) return;
        if (!canSignPostInspection) return;
        if (dataUrl === '') {
            onChange('post_inspection_signature_image', '');
            onChange('post_inspection_signature', '');
            onChange('post_inspection_person', '');
            onChange('post_inspection_time', '');
            return;
        }

        if (!dataUrl) return;

        onChange('post_inspection_signature_image', dataUrl);
        if (!data?.post_inspection_signature) onChange('post_inspection_signature', getCurrentUserName());
        if (!data?.post_inspection_person) onChange('post_inspection_person', getCurrentUserName());
        if (!data?.post_inspection_time) onChange('post_inspection_time', getNowDateTimeLocal());
    };

    // 检查所有前置签字是否完成
    const checkAllPreviousSignaturesComplete = () => {
        const requiredSignatures = [
            { field: 'gas_detection_guardian_sign', name: '气体浓度检测' },
            { field: 'safety_measures_sign', name: '现场安全措施确认' },
            { field: 'approver_sign', name: '票证审批' },
            { field: 'safety_briefing_sign', name: '安全交底' },
            { field: 'pre_inspection_signature', name: '作业前验票' }
        ];

        const missing = requiredSignatures.filter(sig => !data?.[sig.field]);
        return {
            allComplete: missing.length === 0,
            missingSignatures: missing
        };
    };

    const { allComplete: canSignPostInspection } = checkAllPreviousSignaturesComplete();

    const inspectionPayload = (overrides = {}) => ({
        pre_inspection_person: data?.pre_inspection_signature || data?.pre_inspection_person || '',
        pre_inspection_time: data?.pre_inspection_time || '',
        pre_inspection_notes: data?.pre_inspection_notes || '',
        pre_inspection_signature: data?.pre_inspection_signature || '',
        pre_inspection_signature_image: data?.pre_inspection_signature_image || '',
        entry_exit_records: data?.entry_exit_records || [],
        post_inspection_person: data?.post_inspection_signature || data?.post_inspection_person || '',
        post_inspection_time: data?.post_inspection_time || '',
        post_inspection_result: data?.post_inspection_result || '',
        post_inspection_notes: data?.post_inspection_notes || '',
        post_inspection_signature: data?.post_inspection_signature || '',
        post_inspection_signature_image: data?.post_inspection_signature_image || '',
        ...overrides
    });

    const commitPreSignature = async (signature) => {
        const signer = signature ? getCurrentUserName() : '';
        const signTime = signature ? (data?.pre_inspection_time || getNowDateTimeLocal()) : '';
        await onSave?.(inspectionPayload({ pre_inspection_person: signer, pre_inspection_time: signTime, pre_inspection_signature: signer, pre_inspection_signature_image: signature || '' }), null);
    };

    const commitPostSignature = async (signature) => {
        const signer = signature ? getCurrentUserName() : '';
        const signTime = signature ? (data?.post_inspection_time || getNowDateTimeLocal()) : '';
        await onSave?.(inspectionPayload({ post_inspection_person: signer, post_inspection_time: signTime, post_inspection_signature: signer, post_inspection_signature_image: signature || '' }), null);
    };

    return (
        <div className="space-y-6">
            {/* 模块标题 */}
            <div className="pb-4 border-b border-gray-200">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <i className="fas fa-clipboard-check text-teal-600"></i>
                        验票及验收
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">权限：班长（当前按安全员账号可编辑）</p>
                </div>
            </div>

            {/* 作业前验票 */}
            <div className="bg-white rounded-lg border-2 border-blue-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                        <i className="fas fa-check-double text-blue-600"></i>
                        作业前验票
                    </h3>
                    {data?.pre_inspection_signature && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            <i className="fas fa-check-circle mr-1"></i>
                            已验票
                        </span>
                    )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                        <i className="fas fa-info-circle"></i>
                        验票内容
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li className="flex items-start gap-2">
                            <i className="fas fa-check mt-1"></i>
                            <span>确认作业票信息完整、准确</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <i className="fas fa-check mt-1"></i>
                            <span>确认安全措施已落实到位</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <i className="fas fa-check mt-1"></i>
                            <span>确认作业人员已了解安全注意事项</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <i className="fas fa-check mt-1"></i>
                            <span>确认作业现场符合安全要求</span>
                        </li>
                    </ul>
                </div>

                <div className="space-y-4">
                    {/* 验票备注 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            验票备注
                        </label>
                        <textarea
                            value={data?.pre_inspection_notes || ''}
                            onChange={(e) => onChange('pre_inspection_notes', e.target.value)}
                            disabled={!canEdit}
                            placeholder="记录验票过程中发现的问题或需要注意的事项..."
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                        />
                    </div>

                    {/* 验票人签字 */}
                    <div className="pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-700 mb-3">
                            <i className="fas fa-signature mr-2 text-indigo-600"></i>
                            验票人签字
                            {requireStrictSignAndPhotos && <span className="text-red-500 ml-1">*</span>}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                            <div>
                                <span className="text-sm text-gray-500 block mb-1">签名处：</span>
                                <SignaturePad
                                    value={data?.pre_inspection_signature_image || ''}
                                    onChange={handlePreSignatureChange}
                                    onCommit={commitPreSignature}
                                    disabled={!canEdit}
                                    className="h-20"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 block mb-1">签字时间</label>
                                <input
                                    type="datetime-local"
                                    value={data?.pre_inspection_time || ''}
                                    onChange={(e) => onChange('pre_inspection_time', e.target.value)}
                                    disabled={!canEdit}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                                />
                            </div>
                        </div>
                        <p className="mt-3 text-xs text-blue-600"><i className="fas fa-info-circle mr-1"></i>完成签字即代表确认作业前验票内容，系统将自动保存，无需另行点击保存。</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border-2 border-cyan-200 p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div><h3 className="text-lg font-semibold text-gray-800"><i className="fas fa-right-left mr-2 text-cyan-600" />进出记录</h3><p className="mt-1 text-sm text-gray-500">记录人员进出受限空间的时间，并可上传现场照片。</p></div>
                    {canEdit && <button type="button" onClick={addEntryExitRecord} className="rounded bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-700"><i className="fas fa-plus mr-1" />添加记录</button>}
                </div>
                {entryExitRecords.length === 0 ? <div className="rounded border border-dashed border-cyan-200 bg-cyan-50 p-4 text-center text-sm text-cyan-700">暂无进出记录</div> : <div className="space-y-3">{entryExitRecords.map((record, index) => <div key={index} className="rounded border border-cyan-100 bg-cyan-50/40 p-3"><div className="grid grid-cols-1 gap-3 md:grid-cols-4"><input disabled={!canEdit} value={record.person || ''} onChange={(e) => updateEntryExitRecord(index, 'person', e.target.value)} placeholder="人员姓名" className="rounded border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100" /><select disabled={!canEdit} value={record.direction || '进入'} onChange={(e) => updateEntryExitRecord(index, 'direction', e.target.value)} className="rounded border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"><option>进入</option><option>离开</option></select><input disabled={!canEdit} type="datetime-local" value={record.time || ''} onChange={(e) => updateEntryExitRecord(index, 'time', e.target.value)} className="rounded border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100" /><div className="flex items-center gap-2">{canEdit && <label className="cursor-pointer rounded border border-cyan-500 px-3 py-2 text-sm text-cyan-700 hover:bg-cyan-50"><i className="fas fa-camera mr-1" />上传照片<input type="file" className="hidden" accept="image/*" multiple onChange={(event) => addEntryExitPhotos(index, event)} /></label>}{canEdit && <button type="button" onClick={() => updateEntryExitRecords(entryExitRecords.filter((_, recordIndex) => recordIndex !== index))} className="text-sm text-red-500 hover:text-red-700">删除</button>}</div></div>{(record.photos || []).length > 0 && <div className="mt-2 text-xs text-gray-600">{record.photos.map((photo, photoIndex) => <span key={`${photo.name}-${photoIndex}`} className="mr-2 inline-block rounded bg-white px-2 py-1"><i className="fas fa-image mr-1 text-cyan-500" />{photo.name}</span>)}</div>}</div>)}</div>}
            </div>

            {/* 作业后验收 */}
            <div className="bg-white rounded-lg border-2 border-purple-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                        <i className="fas fa-flag-checkered text-purple-600"></i>
                        作业后验收
                    </h3>
                    {data?.post_inspection_signature && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            <i className="fas fa-check-circle mr-1"></i>
                            已验收
                        </span>
                    )}
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                        <i className="fas fa-info-circle"></i>
                        验收内容
                    </h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                        <li className="flex items-start gap-2">
                            <i className="fas fa-check mt-1"></i>
                            <span>确认作业已完成，符合质量要求</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <i className="fas fa-check mt-1"></i>
                            <span>确认作业现场已清理干净</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <i className="fas fa-check mt-1"></i>
                            <span>确认工具设备已归位</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <i className="fas fa-check mt-1"></i>
                            <span>确认无遗留安全隐患</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <i className="fas fa-check mt-1"></i>
                            <span>确认可以解除安全措施</span>
                        </li>
                    </ul>
                </div>

                <div className="space-y-4">
                    {/* 验收结果 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            验收结果 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="post_inspection_result"
                                    checked={data?.post_inspection_result === 'qualified'}
                                    onChange={() => onChange('post_inspection_result', 'qualified')}
                                    disabled={!canEdit}
                                    className="text-green-600 focus:ring-green-500"
                                />
                                <span className="text-sm text-gray-700">合格</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="post_inspection_result"
                                    checked={data?.post_inspection_result === 'unqualified'}
                                    onChange={() => onChange('post_inspection_result', 'unqualified')}
                                    disabled={!canEdit}
                                    className="text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm text-gray-700">不合格</span>
                            </label>
                        </div>
                    </div>

                    {/* 验收备注 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            验收备注
                        </label>
                        <textarea
                            value={data?.post_inspection_notes || ''}
                            onChange={(e) => onChange('post_inspection_notes', e.target.value)}
                            disabled={!canEdit}
                            placeholder="记录验收过程中发现的问题或需要说明的事项..."
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-700 mb-3">
                            <i className="fas fa-signature mr-2 text-indigo-600"></i>
                            验收人签字
                            {requireStrictSignAndPhotos && <span className="text-red-500 ml-1">*</span>}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                            <div title={!canSignPostInspection ? '请先完成前置模块的签字' : ''}>
                                <span className="text-sm text-gray-500 block mb-1">签名处：</span>
                                <SignaturePad
                                    value={data?.post_inspection_signature_image || ''}
                                    onChange={handlePostSignatureChange}
                                    onCommit={commitPostSignature}
                                    disabled={!canEdit || !canSignPostInspection}
                                    className="h-20"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 block mb-1">签字时间</label>
                                <input
                                    type="datetime-local"
                                    value={data?.post_inspection_time || ''}
                                    onChange={(e) => onChange('post_inspection_time', e.target.value)}
                                    disabled={!canEdit}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                                />
                            </div>
                        </div>
                        <p className="mt-3 text-xs text-blue-600"><i className="fas fa-info-circle mr-1"></i>完成签字即代表确认作业后验收内容，系统将自动保存，无需另行点击保存。</p>
                    </div>
                </div>
            </div>

            {/* 整体状态提示 */}
            {data?.pre_inspection_signature && data?.post_inspection_signature ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <i className="fas fa-check-circle text-green-600 text-2xl"></i>
                    <div>
                        <p className="font-medium text-green-800">验票及验收已完成</p>
                        <p className="text-sm text-green-600 mt-1">
                            作业前验票和作业后验收均已完成
                        </p>
                    </div>
                </div>
            ) : data?.pre_inspection_signature ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                    <i className="fas fa-hourglass-half text-yellow-600 text-2xl"></i>
                    <div>
                        <p className="font-medium text-yellow-800">等待验收</p>
                        <p className="text-sm text-yellow-600 mt-1">
                            作业前验票已完成，作业后需要进行验收
                        </p>
                    </div>
                </div>
            ) : canEdit ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                    <i className="fas fa-exclamation-circle text-blue-600 text-2xl"></i>
                    <div>
                        <p className="font-medium text-blue-800">待验票</p>
                        <p className="text-sm text-blue-600 mt-1">
                            请先完成作业前验票，再进行作业
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-3">
                    <i className="fas fa-clock text-gray-400 text-2xl"></i>
                    <div>
                        <p className="font-medium text-gray-700">等待验票</p>
                        <p className="text-sm text-gray-500 mt-1">
                            该作业票正在等待班长进行验票
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
