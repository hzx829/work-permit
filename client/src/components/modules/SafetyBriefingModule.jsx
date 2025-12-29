import { useState } from 'react';
import SignaturePad from '../SignaturePad';

/**
 * 安全交底模块
 * 权限：其他人员 → 班长
 */
export default function SafetyBriefingModule({ data, onChange, readOnly, currentUser, onSave, saving }) {
    const [previewImage, setPreviewImage] = useState(null);

    // 照片列表
    const photos = data?.safety_briefing_images || [];

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

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        const newPhotos = [];

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                newPhotos.push({
                    url: event.target.result,
                    name: file.name,
                    uploadTime: new Date().toISOString()
                });
                
                if (newPhotos.length === files.length) {
                    onChange('safety_briefing_images', [...photos, ...newPhotos]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index) => {
        const newPhotos = photos.filter((_, i) => i !== index);
        onChange('safety_briefing_images', newPhotos);
    };

    const canEdit = !readOnly && currentUser?.role === 'safety';

    const handleSafetyBriefingSignatureChange = (dataUrl) => {
        if (!canEdit) return;
        if (dataUrl === '') {
            onChange('safety_briefing_signature', '');
            onChange('safety_briefing_sign', '');
            onChange('safety_briefing_time', '');
            return;
        }

        if (!dataUrl) return;

        onChange('safety_briefing_signature', dataUrl);
        if (!data?.safety_briefing_sign) onChange('safety_briefing_sign', getCurrentUserName());
        if (!data?.safety_briefing_time) onChange('safety_briefing_time', getNowDateTimeLocal());
    };

    const handleSave = async () => {
        if (!onSave) return;
        await onSave(
            {
                safety_briefing_images: data?.safety_briefing_images || [],
                safety_briefing_confirm: data?.safety_briefing_confirm || '',
                safety_briefing_sign: data?.safety_briefing_sign || '',
                safety_briefing_signature: data?.safety_briefing_signature || '',
                safety_briefing_time: data?.safety_briefing_time || ''
            },
            '安全交底已保存'
        );
    };

    return (
        <div className="space-y-6">
            {/* 模块标题 */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <i className="fas fa-chalkboard-teacher text-orange-600"></i>
                        安全交底
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">权限：班长（当前按安全员账号可编辑）</p>
                </div>
                {canEdit && (
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        <i className="fas fa-save mr-2"></i>
                        {saving ? '保存中...' : '保存'}
                    </button>
                )}
            </div>

            {/* 安全交底说明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <i className="fas fa-info-circle"></i>
                    安全交底要求
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li className="flex items-start gap-2">
                        <i className="fas fa-check mt-1"></i>
                        <span>班长需向作业人员详细说明作业内容、安全注意事项和应急措施</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <i className="fas fa-check mt-1"></i>
                        <span>作业人员需确认已完全理解安全交底内容</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <i className="fas fa-check mt-1"></i>
                        <span>完成线下纸质签字后，拍照上传签字记录或交底现场照片</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <i className="fas fa-check mt-1"></i>
                        <span>班长在系统中完成电子签名确认</span>
                    </li>
                </ul>
            </div>

            {/* 交底照片上传区域 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-700 mb-3">
                    <i className="fas fa-camera mr-2 text-purple-600"></i>
                    交底签字照片上传
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                    请上传线下安全交底纸质签字记录或交底现场照片
                </p>

                {/* 照片网格 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {photos.map((photo, index) => (
                        <div key={index} className="relative group">
                            <img
                                src={photo.url}
                                alt={photo.name}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
                                onClick={() => setPreviewImage(photo.url)}
                            />
                            {canEdit && (
                                <button
                                    onClick={() => removePhoto(index)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <i className="fas fa-times text-xs"></i>
                                </button>
                            )}
                            <p className="text-xs text-gray-500 mt-1 truncate">{photo.name}</p>
                        </div>
                    ))}

                    {/* 上传按钮 */}
                    {canEdit && (
                        <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                            <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                            <span className="text-sm text-gray-500">点击上传</span>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handlePhotoUpload}
                                className="hidden"
                            />
                        </label>
                    )}
                </div>

                {photos.length === 0 && !canEdit && (
                    <p className="text-center text-gray-400 py-4">暂无照片</p>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-700">
                        <i className="fas fa-signature mr-2 text-indigo-600"></i>
                        交底人签字确认
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div>
                        <span className="text-sm text-gray-500 block mb-1">签名处：</span>
                        <SignaturePad
                            value={data?.safety_briefing_signature || ''}
                            onChange={handleSafetyBriefingSignatureChange}
                            disabled={!canEdit}
                            className="h-20"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-500 block mb-1">签字时间</label>
                        <input
                            type="datetime-local"
                            value={data?.safety_briefing_time || ''}
                            onChange={(e) => onChange('safety_briefing_time', e.target.value)}
                            disabled={!canEdit}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                        />
                    </div>
                </div>
            </div>

            {/* 交底状态提示 */}
            {data?.safety_briefing_sign ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <i className="fas fa-check-circle text-green-600 text-2xl"></i>
                    <div>
                        <p className="font-medium text-green-800">安全交底已完成</p>
                        <p className="text-sm text-green-600 mt-1">
                            班长已完成安全交底并签字确认
                        </p>
                    </div>
                </div>
            ) : canEdit ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                    <i className="fas fa-exclamation-triangle text-yellow-600 text-2xl"></i>
                    <div>
                        <p className="font-medium text-yellow-800">待完成安全交底</p>
                        <p className="text-sm text-yellow-600 mt-1">
                            请完成交底内容记录、照片上传和签字确认
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-3">
                    <i className="fas fa-clock text-gray-400 text-2xl"></i>
                    <div>
                        <p className="font-medium text-gray-700">等待安全交底</p>
                        <p className="text-sm text-gray-500 mt-1">
                            该作业票正在等待班长进行安全交底
                        </p>
                    </div>
                </div>
            )}

            {/* 图片预览模态框 */}
            {previewImage && (
                <div 
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-10 right-0 text-white hover:text-gray-300 text-2xl"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                        <img
                            src={previewImage}
                            alt="预览"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
