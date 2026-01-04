import { useState } from 'react';
import SignaturePad from '../SignaturePad';

/**
 * 现场安全措施确认模块
 * 权限：其他人员 → 安管人员
 */
export default function SafetyMeasuresConfirmModule({ data, onChange, readOnly, currentUser, onSave, saving, requireStrictSignAndPhotos = false }) {
    const [previewImage, setPreviewImage] = useState(null);

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

    // 照片列表
    const photos = data?.safety_measures_photos || [];

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
                    onChange('safety_measures_photos', [...photos, ...newPhotos]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index) => {
        const newPhotos = photos.filter((_, i) => i !== index);
        onChange('safety_measures_photos', newPhotos);
    };

    const canEdit = !readOnly && currentUser?.role === 'safety';

    const handleSafetyMeasuresSignatureChange = (dataUrl) => {
        if (!canEdit) return;
        if (dataUrl === '') {
            onChange('safety_measures_signature', '');
            onChange('safety_measures_sign', '');
            onChange('safety_measures_sign_time', '');
            return;
        }

        if (!dataUrl) return;

        onChange('safety_measures_signature', dataUrl);
        if (!data?.safety_measures_sign) onChange('safety_measures_sign', getCurrentUserName());
        if (!data?.safety_measures_sign_time) onChange('safety_measures_sign_time', getNowDateTimeLocal());
    };

    const handleSave = async () => {
        if (!onSave) return;
        if (requireStrictSignAndPhotos) {
            if (!data?.safety_measures_photos || data.safety_measures_photos.length === 0) {
                window.alert('请至少上传一张现场安全措施签字照片。');
                return;
            }
            if (!data?.safety_measures_signature) {
                window.alert('请完成提交人签字后再保存现场安全措施确认。');
                return;
            }
        }
        await onSave(
            {
                safety_measures_list: data?.safety_measures_list || [],
                safety_measures_photos: data?.safety_measures_photos || [],
                safety_measures_sign: data?.safety_measures_sign || '',
                safety_measures_signature: data?.safety_measures_signature || '',
                safety_measures_sign_time: data?.safety_measures_sign_time || ''
            },
            '现场安全措施确认已保存'
        );
    };

    return (
        <div className="space-y-6">
            {/* 模块标题 */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-200">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <i className="fas fa-clipboard-check text-green-600"></i>
                        现场安全措施确认
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">权限：安管人员（当前按安全员账号可编辑）</p>
                    <p className="text-xs text-gray-400 mt-1">
                        <i className="fas fa-info-circle mr-1"></i>
                        请上传现场安全措施相关照片并完成提交人签字
                    </p>
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

            {/* 照片上传区域 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-700 mb-3">
                    <i className="fas fa-camera mr-2 text-purple-600"></i>
                    安全措施签字照片上传
                    {requireStrictSignAndPhotos && <span className="text-red-500 ml-1">*</span>}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                    请在线下纸质签字完成后，拍照上传签字记录
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

            {/* 提交人签字框 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-700">
                        提交人签字
                        {requireStrictSignAndPhotos && <span className="text-red-500 ml-1">*</span>}
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div>
                        <span className="text-sm text-gray-500 block mb-1">签名处：</span>
                        <SignaturePad
                            value={data?.safety_measures_signature || ''}
                            onChange={handleSafetyMeasuresSignatureChange}
                            disabled={!canEdit}
                            className="h-20"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-500 block mb-1">签字时间</label>
                        <input
                            type="datetime-local"
                            value={data?.safety_measures_sign_time || ''}
                            onChange={(e) => onChange('safety_measures_sign_time', e.target.value)}
                            disabled={!canEdit}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                        />
                    </div>
                </div>
            </div>

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
