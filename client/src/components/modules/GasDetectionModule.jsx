import { useState } from 'react';
import SignaturePad from '../SignaturePad';

export default function GasDetectionModule({ data, onChange, readOnly, currentUser, onSave, saving, requireStrictSignAndPhotos = false }) {
    const [isWaiting, setIsWaiting] = useState(false);
    const [waitingProgress, setWaitingProgress] = useState(0);

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

    // 初始化气体检测记录数据
    const gasDetectionRecords = data?.gas_detection_records || [
        {
            gasName: '',
            location: '',
            standard: '',
            result: '',
            samplingTime: '',
            qualified: null
        }
    ];

    // 初始化连续检测记录（表格）
    const continuousGasDetectionRecords = data?.continuous_gas_detection_records || [
        {
            gasName: '',
            location: '',
            standard: '',
            result: '',
            samplingTime: '',
            qualified: null
        }
    ];

    const handleRecordChange = (index, field, value) => {
        const newRecords = [...gasDetectionRecords];
        newRecords[index] = { ...newRecords[index], [field]: value };
        onChange('gas_detection_records', newRecords);
    };

    const addRecord = () => {
        const newRecords = [...gasDetectionRecords, {
            gasName: '',
            location: '',
            standard: '',
            result: '',
            samplingTime: '',
            qualified: null
        }];
        onChange('gas_detection_records', newRecords);
    };

    const removeRecord = (index) => {
        const newRecords = gasDetectionRecords.filter((_, i) => i !== index);
        onChange('gas_detection_records', newRecords);
    };

    const handleContinuousRecordChange = (index, field, value) => {
        const newRecords = [...continuousGasDetectionRecords];
        newRecords[index] = { ...newRecords[index], [field]: value };
        onChange('continuous_gas_detection_records', newRecords);
    };

    const addContinuousRecord = () => {
        const newRecords = [...continuousGasDetectionRecords, {
            gasName: '',
            location: '',
            standard: '',
            result: '',
            samplingTime: '',
            qualified: null
        }];
        onChange('continuous_gas_detection_records', newRecords);
    };

    const removeContinuousRecord = (index) => {
        const newRecords = continuousGasDetectionRecords.filter((_, i) => i !== index);
        onChange('continuous_gas_detection_records', newRecords);
    };

    // 启动等待检测（25秒）
    const startWaiting = () => {
        setIsWaiting(true);
        setWaitingProgress(0);
        const interval = setInterval(() => {
            setWaitingProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsWaiting(false);
                    return 100;
                }
                return prev + (100 / 25); // 25秒
            });
        }, 1000);
    };

    const canEdit = !readOnly && currentUser?.role === 'safety';

    const handleGuardianSignatureChange = (dataUrl) => {
        if (!canEdit) return;
        if (dataUrl === '') {
            onChange('gas_detection_guardian_signature', '');
            onChange('gas_detection_guardian_sign', '');
            onChange('gas_detection_guardian_time', '');
            return;
        }

        if (!dataUrl) return;

        onChange('gas_detection_guardian_signature', dataUrl);
        if (!data?.gas_detection_guardian_sign) onChange('gas_detection_guardian_sign', getCurrentUserName());
        if (!data?.gas_detection_guardian_time) onChange('gas_detection_guardian_time', getNowDateTimeLocal());
    };

    const handleSave = async () => {
        if (!onSave) return;
        if (requireStrictSignAndPhotos && !data?.gas_detection_guardian_signature) {
            window.alert('请先完成监护人签字后再保存气体浓度检测。');
            return;
        }
        await onSave(
            {
                gas_detection_records: data?.gas_detection_records || gasDetectionRecords,
                continuous_gas_detection_records: data?.continuous_gas_detection_records || continuousGasDetectionRecords,
                continuous_gas_detection: data?.continuous_gas_detection || '',
                gas_detection_guardian_sign: data?.gas_detection_guardian_sign || '',
                gas_detection_guardian_signature: data?.gas_detection_guardian_signature || '',
                gas_detection_guardian_time: data?.gas_detection_guardian_time || ''
            },
            '气体浓度检测已保存'
        );
    };

    return (
        <div className="space-y-6">
            {/* 模块标题 */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <i className="fas fa-wind text-blue-600"></i>
                        气体浓度检测
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">权限：监护人员（当前按安全员账号可编辑）</p>
                </div>
                {canEdit && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={startWaiting}
                            disabled={isWaiting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            <i className="fas fa-clock mr-2"></i>
                            {isWaiting ? '检测中...' : '开始检测'}
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            <i className="fas fa-save mr-2"></i>
                            {saving ? '保存中...' : '保存'}
                        </button>
                    </div>
                )}
            </div>

            {/* 等待检测进度条 */}
            {isWaiting && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-700 font-medium">
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            正在进行气体浓度检测...
                        </span>
                        <span className="text-sm text-blue-600">{Math.round(waitingProgress)}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                        <div 
                            className="bg-blue-600 h-full transition-all duration-1000 ease-linear"
                            style={{ width: `${waitingProgress}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                        <i className="fas fa-info-circle mr-1"></i>
                        等待时长：25秒（根据现场条件自动检测）
                    </p>
                </div>
            )}

            {/* 气体检测记录列表 */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-700">首次气体浓度检测记录</h3>
                    {canEdit && (
                        <button
                            onClick={addRecord}
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                            <i className="fas fa-plus"></i>
                            添加记录
                        </button>
                    )}
                </div>

                {gasDetectionRecords.map((record, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative">
                        {canEdit && gasDetectionRecords.length > 1 && (
                            <button
                                onClick={() => removeRecord(index)}
                                className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 气体名称 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    代表性气体名称 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={record.gasName || ''}
                                    onChange={(e) => handleRecordChange(index, 'gasName', e.target.value)}
                                    disabled={!canEdit}
                                    placeholder="如：氧气、一氧化碳、硫化氢等"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                                />
                            </div>

                            {/* 检测点位置 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    检测点位置 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={record.location || ''}
                                    onChange={(e) => handleRecordChange(index, 'location', e.target.value)}
                                    disabled={!canEdit}
                                    placeholder="检测点的具体位置"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                                />
                            </div>

                            {/* 合格标准 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    合格标准 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={record.standard || ''}
                                    onChange={(e) => handleRecordChange(index, 'standard', e.target.value)}
                                    disabled={!canEdit}
                                    placeholder="如：≥19.5%、≤24ppm等"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                                />
                            </div>

                            {/* 分析结果 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    分析结果数据 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={record.result || ''}
                                    onChange={(e) => handleRecordChange(index, 'result', e.target.value)}
                                    disabled={!canEdit}
                                    placeholder="实际检测数值"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                                />
                            </div>

                            {/* 取样时间 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    取样时间 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={record.samplingTime || ''}
                                    onChange={(e) => handleRecordChange(index, 'samplingTime', e.target.value)}
                                    disabled={!canEdit}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                                />
                            </div>

                            {/* 是否合格 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    检测结果 <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-4 pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`qualified-${index}`}
                                            checked={record.qualified === true}
                                            onChange={() => handleRecordChange(index, 'qualified', true)}
                                            disabled={!canEdit}
                                            className="text-green-600 focus:ring-green-500"
                                        />
                                        <span className="text-sm text-gray-700">合格</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`qualified-${index}`}
                                            checked={record.qualified === false}
                                            onChange={() => handleRecordChange(index, 'qualified', false)}
                                            disabled={!canEdit}
                                            className="text-red-600 focus:ring-red-500"
                                        />
                                        <span className="text-sm text-gray-700">不合格</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 连续气体检测记录（表格） */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-700">连续气体检测记录</h3>
                    {canEdit && (
                        <button
                            type="button"
                            onClick={addContinuousRecord}
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                            <i className="fas fa-plus"></i>
                            添加记录
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="px-3 py-2 text-left font-medium">检测时间</th>
                                <th className="px-3 py-2 text-left font-medium">代表性气体</th>
                                <th className="px-3 py-2 text-left font-medium">检测点位置</th>
                                <th className="px-3 py-2 text-left font-medium">合格标准</th>
                                <th className="px-3 py-2 text-left font-medium">检测值</th>
                                <th className="px-3 py-2 text-left font-medium">结论</th>
                                {canEdit && <th className="px-3 py-2 text-right font-medium">操作</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {continuousGasDetectionRecords.map((row, index) => (
                                <tr key={index} className="bg-white">
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        <input
                                            type="datetime-local"
                                            value={row.samplingTime || ''}
                                            onChange={(e) => handleContinuousRecordChange(index, 'samplingTime', e.target.value)}
                                            disabled={!canEdit}
                                            className="w-52 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="text"
                                            value={row.gasName || ''}
                                            onChange={(e) => handleContinuousRecordChange(index, 'gasName', e.target.value)}
                                            disabled={!canEdit}
                                            placeholder="如：氧气"
                                            className="w-40 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="text"
                                            value={row.location || ''}
                                            onChange={(e) => handleContinuousRecordChange(index, 'location', e.target.value)}
                                            disabled={!canEdit}
                                            placeholder="位置"
                                            className="w-40 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="text"
                                            value={row.standard || ''}
                                            onChange={(e) => handleContinuousRecordChange(index, 'standard', e.target.value)}
                                            disabled={!canEdit}
                                            placeholder="标准"
                                            className="w-40 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="text"
                                            value={row.result || ''}
                                            onChange={(e) => handleContinuousRecordChange(index, 'result', e.target.value)}
                                            disabled={!canEdit}
                                            placeholder="数值"
                                            className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                                        />
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        <select
                                            value={row.qualified === true ? 'qualified' : row.qualified === false ? 'unqualified' : ''}
                                            onChange={(e) => handleContinuousRecordChange(index, 'qualified', e.target.value === '' ? null : e.target.value === 'qualified')}
                                            disabled={!canEdit}
                                            className="w-24 px-2 py-1 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                                        >
                                            <option value="">未选择</option>
                                            <option value="qualified">合格</option>
                                            <option value="unqualified">不合格</option>
                                        </select>
                                    </td>
                                    {canEdit && (
                                        <td className="px-3 py-2 text-right whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => removeContinuousRecord(index)}
                                                disabled={continuousGasDetectionRecords.length <= 1}
                                                className="text-red-600 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                                title={continuousGasDetectionRecords.length <= 1 ? '至少保留一条记录' : '删除'}
                                            >
                                                删除
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 连续检测备注（保留原字段，兼容历史数据） */}
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">连续检测备注</label>
                    <textarea
                        value={data?.continuous_gas_detection || ''}
                        onChange={(e) => onChange('continuous_gas_detection', e.target.value)}
                        disabled={!canEdit}
                        placeholder="可填写趋势变化、异常说明、处理情况等..."
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                    />
                </div>
            </div>

            {/* 监护人签字 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-700">
                        监护人签字确认
                        {requireStrictSignAndPhotos && <span className="text-red-500 ml-1">*</span>}
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div>
                        <span className="text-sm text-gray-500 block mb-1">签名处：</span>
                        <SignaturePad
                            value={data?.gas_detection_guardian_signature || ''}
                            onChange={handleGuardianSignatureChange}
                            disabled={!canEdit}
                            className="h-20"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-500 block mb-1">签字时间</label>
                        <input
                            type="datetime-local"
                            value={data?.gas_detection_guardian_time || ''}
                            onChange={(e) => onChange('gas_detection_guardian_time', e.target.value)}
                            disabled={!canEdit}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
