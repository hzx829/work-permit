/**
 * 票证审批模块
 * 权限：其他人员 → 审批人
 */
import SignaturePad from '../SignaturePad';

export default function ApprovalModule({ data, onChange, readOnly, currentUser, onSave, saving, requireStrictSignAndPhotos = false }) {
    const canEdit = !readOnly && currentUser?.role === 'safety' && (
        data?.status === '待审批' ||
        (data?.status === '已批准' && data?.approver_sign && !data?.safety_briefing_sign)
    );

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

    const handleApproverSignatureChange = (dataUrl) => {
        if (!canEdit) return;
        if (dataUrl === '') {
            onChange('approver_signature', '');
            onChange('approver_sign', '');
            onChange('approver_sign_time', '');
            return;
        }

        if (!dataUrl) return;

        onChange('approver_signature', dataUrl);
        if (!data?.approver_sign) onChange('approver_sign', getCurrentUserName());
        if (!data?.approver_sign_time) onChange('approver_sign_time', getNowDateTimeLocal());
        if (!data?.approver_opinion) onChange('approver_opinion', '同意作业');
    };

    const commitApproverSignature = async (signature) => {
        const signName = signature ? getCurrentUserName() : '';
        const signTime = signature ? (data?.approver_sign_time || getNowDateTimeLocal()) : '';
        const opinion = signature ? (data?.approver_opinion || '同意作业') : (data?.approver_opinion || '');
        await onSave(
            {
                approver_sign: signName,
                approver_signature: signature || '',
                approver_opinion: opinion,
                approver_sign_time: signTime
            },
            null
        );
    };

    return (
        <div className="space-y-6">
            {/* 模块标题 */}
            <div className="pb-4 border-b border-gray-200">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <i className="fas fa-stamp text-purple-600"></i>
                        票证审批
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">权限：审批人（当前按安全员账号可审批）</p>
                </div>
            </div>

            {/* 审批意见输入 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-700 mb-3">
                    <i className="fas fa-comment-dots mr-2 text-blue-600"></i>
                    审批意见
                </h3>
                <textarea
                    value={data?.approver_opinion || '同意作业'}
                    onChange={(e) => onChange('approver_opinion', e.target.value)}
                    disabled={!canEdit}
                    placeholder="请输入审批意见..."
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                />
                <p className="text-xs text-gray-400 mt-2">
                    <i className="fas fa-info-circle mr-1"></i>
                    默认意见为"同意作业"，可根据实际情况进行修改
                </p>
            </div>

            {/* 审批人签字框 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-700 mb-3">
                    <i className="fas fa-signature mr-2 text-indigo-600"></i>
                    审批人签字确认
                    {requireStrictSignAndPhotos && <span className="text-red-500 ml-1">*</span>}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div>
                        <SignaturePad
                            value={data?.approver_signature || ''}
                            onChange={handleApproverSignatureChange}
                            onCommit={commitApproverSignature}
                            disabled={!canEdit}
                            className="h-20"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-500 block mb-1">签字时间</label>
                        <input
                            type="datetime-local"
                            value={data?.approver_sign_time || ''}
                            onChange={(e) => onChange('approver_sign_time', e.target.value)}
                            disabled={!canEdit}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                        />
                    </div>
                </div>
                <p className="mt-3 text-xs text-blue-600"><i className="fas fa-info-circle mr-1"></i>完成签字即代表确认审批意见，系统将自动保存并提交审批，无需另行点击保存。</p>
            </div>

            {/* 审批状态提示 */}
            {data?.approver_sign ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <i className="fas fa-check-circle text-green-600 text-2xl"></i>
                    <div>
                        <p className="font-medium text-green-800">审批已完成</p>
                        <p className="text-sm text-green-600 mt-1">
                            该作业票已通过审批，可以继续后续流程
                        </p>
                    </div>
                </div>
            ) : canEdit ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                    <i className="fas fa-exclamation-triangle text-yellow-600 text-2xl"></i>
                    <div>
                        <p className="font-medium text-yellow-800">待审批</p>
                        <p className="text-sm text-yellow-600 mt-1">
                            请完成审批意见填写和签字后提交审批
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-3">
                    <i className="fas fa-clock text-gray-400 text-2xl"></i>
                    <div>
                        <p className="font-medium text-gray-700">等待审批</p>
                        <p className="text-sm text-gray-500 mt-1">
                            该作业票正在等待审批人审批
                        </p>
                    </div>
                </div>
            )}

        </div>
    );
}
