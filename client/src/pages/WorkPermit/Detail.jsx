import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getPermit, formatDate, getStatusColor, updatePermitStatus, updatePermitExtraData } from '../../utils/api';
import HotWorkPermitForm from '../../components/HotWorkPermitForm';
import ConfinedSpacePermitForm from '../../components/ConfinedSpacePermitForm';
import BlindPlatePermitForm from '../../components/BlindPlatePermitForm';
import HeightWorkPermitForm from '../../components/HeightWorkPermitForm';
import LiftingPermitForm from '../../components/LiftingPermitForm';
import TemporaryElectricityPermitForm from '../../components/TemporaryElectricityPermitForm';
import GroundBreakingPermitForm from '../../components/GroundBreakingPermitForm';
import RoadBreakingPermitForm from '../../components/RoadBreakingPermitForm';
import GasDetectionModule from '../../components/modules/GasDetectionModule';
import SafetyMeasuresConfirmModule from '../../components/modules/SafetyMeasuresConfirmModule';
import ApprovalModule from '../../components/modules/ApprovalModule';
import SafetyBriefingModule from '../../components/modules/SafetyBriefingModule';
import InspectionModule from '../../components/modules/InspectionModule';

export default function Detail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [permit, setPermit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(false);
    const [savingExtra, setSavingExtra] = useState(false);
    const [showConfinedSpaceModal, setShowConfinedSpaceModal] = useState(false);
    const [blindPlateStatus, setBlindPlateStatus] = useState(null); // null, 'checking', 'completed'
    const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'gas', 'safety', 'approval', 'briefing', 'inspection'

    useEffect(() => {
        const fetchPermit = async () => {
            try {
                const data = await getPermit(id);
                // 适配不同组件对编号字段的命名差异
                if (data.permit_number) {
                    data.permit_code = data.permit_number;
                }
                setPermit(data);
                setLoading(false);
            } catch (error) {
                console.error('Error loading permit:', error);
                alert('作业票不存在');
                navigate('/list');
            }
        };

        fetchPermit();
    }, [id, navigate]);

    const saveExtraData = async (updates, successMessage = '保存成功') => {
        if (!updates || Object.keys(updates).length === 0) return;
        setSavingExtra(true);
        try {
            await updatePermitExtraData(id, updates);
            const data = await getPermit(id);
            if (data.permit_number) data.permit_code = data.permit_number;
            setPermit(data);
            alert(successMessage);
        } catch (error) {
            console.error('Error saving extra data:', error);
            alert('保存失败，请重试');
        } finally {
            setSavingExtra(false);
        }
    };

    const handleApprove = async () => {
        // 特殊逻辑：受限空间作业需要二次确认
        if (permit.type === '受限空间作业') {
            setShowConfinedSpaceModal(true);
            setBlindPlateStatus(null); // 重置状态
            return;
        }

        if (!window.confirm('确认批准该作业票？')) return;
        
        await executeApprove();
    };

    const executeApprove = async () => {
        setApproving(true);
        try {
            // 保存审批人签字数据
            if (permit.approver_sign) {
                await updatePermitExtraData(id, {
                    approver_sign: permit.approver_sign,
                    approver_signature: permit.approver_signature || '',
                    approver_opinion: permit.approver_opinion || '',
                    approver_sign_time: permit.approver_sign_time || ''
                });
            }
            
            await updatePermitStatus(id, '已批准');
            alert('审批成功');
            const data = await getPermit(id);
            if (data.permit_number) data.permit_code = data.permit_number;
            setPermit(data);
            setShowConfinedSpaceModal(false);
        } catch (error) {
            console.error('Error approving permit:', error);
            alert('审批失败，请重试');
        } finally {
            setApproving(false);
        }
    };

    const handleReject = async () => {
        const reason = window.prompt('请输入驳回原因：');
        if (!reason) return;
        
        setApproving(true);
        try {
            await updatePermitStatus(id, '已驳回');
            alert('已驳回该作业票');
            const data = await getPermit(id);
            if (data.permit_number) data.permit_code = data.permit_number;
            setPermit(data);
        } catch (error) {
            console.error('Error rejecting permit:', error);
            alert('操作失败，请重试');
        } finally {
            setApproving(false);
        }
    };

    const handleStartWork = async () => {
        if (!window.confirm('确认开始作业？')) return;
        
        setApproving(true);
        try {
            // 保存安全交底签字数据和图片到数据库
            const extraData = {};
            if (permit.safety_briefing_sign) {
                extraData.safety_briefing_sign = permit.safety_briefing_sign;
                extraData.safety_briefing_signature = permit.safety_briefing_signature || '';
                extraData.safety_briefing_confirm = permit.safety_briefing_confirm || '';
                extraData.safety_briefing_time = permit.safety_briefing_time || '';
            }
            if (permit.safety_briefing_images && permit.safety_briefing_images.length > 0) {
                extraData.safety_briefing_images = permit.safety_briefing_images;
            }
            if (Object.keys(extraData).length > 0) {
                await updatePermitExtraData(id, extraData);
            }
            
            await updatePermitStatus(id, '作业中');
            alert('作业已开始');
            const data = await getPermit(id);
            if (data.permit_number) data.permit_code = data.permit_number;
            setPermit(data);
        } catch (error) {
            console.error('Error starting work:', error);
            alert('操作失败，请重试');
        } finally {
            setApproving(false);
        }
    };

    const handleCompleteWork = async () => {
        if (!window.confirm('确认结束作业？')) return;
        
        setApproving(true);
        try {
            // 保存完工签字数据到数据库
            if (permit.completion_sign) {
                await updatePermitExtraData(id, {
                    completion_sign: permit.completion_sign,
                    completion_signature: permit.completion_signature || '',
                    completion_confirm: permit.completion_confirm || '',
                    completion_time: permit.completion_time || ''
                });
            }
            
            await updatePermitStatus(id, '已完工');
            alert('作业已完成');
            const data = await getPermit(id);
            if (data.permit_number) data.permit_code = data.permit_number;
            setPermit(data);
        } catch (error) {
            console.error('Error completing work:', error);
            alert('操作失败，请重试');
        } finally {
            setApproving(false);
        }
    };

    if (loading || !permit) {
        return (
            <div className="h-screen flex items-center justify-center">
                <i className="fas fa-spinner fa-spin text-4xl text-blue-500"></i>
            </div>
        );
    }

    let safetyMeasures = [];
    try {
        safetyMeasures = Array.isArray(permit.safety_measures)
            ? permit.safety_measures
            : JSON.parse(permit.safety_measures || '[]');
    } catch {
        safetyMeasures = [];
    }

    const getSpecificForm = () => {
        switch (permit.type) {
            case '动火作业': return HotWorkPermitForm;
            case '受限空间作业': return ConfinedSpacePermitForm;
            case '盲板抽堵作业': return BlindPlatePermitForm;
            case '高处作业': return HeightWorkPermitForm;
            case '吊装作业': return LiftingPermitForm;
            case '临时用电作业': return TemporaryElectricityPermitForm;
            case '动土作业': return GroundBreakingPermitForm;
            case '断路作业': return RoadBreakingPermitForm;
            default: return null;
        }
    };

    const SpecificForm = getSpecificForm();

    return (
        <>
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Link to="/work-permit/list" className="text-gray-500 hover:text-blue-600 transition-colors">
                        <i className="fas fa-arrow-left text-xl"></i>
                    </Link>
                    <h1 className="text-xl font-bold text-gray-800">作业票详情</h1>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm font-mono hidden md:inline-block">
                        {permit.permit_number}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">{user?.full_name}</span>
                    <button onClick={logout} className="text-sm text-red-500 hover:underline">
                        退出
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Content Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tab Navigation */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="flex overflow-x-auto border-b border-gray-200">
                                <button
                                    onClick={() => setActiveTab('basic')}
                                    className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                                        activeTab === 'basic'
                                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                    }`}
                                >
                                    <i className="fas fa-file-alt mr-2"></i>
                                    基本信息
                                </button>
                                <button
                                    onClick={() => setActiveTab('gas')}
                                    className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                                        activeTab === 'gas'
                                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                    }`}
                                >
                                    <i className="fas fa-wind mr-2"></i>
                                    气体浓度检测
                                </button>
                                <button
                                    onClick={() => setActiveTab('safety')}
                                    className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                                        activeTab === 'safety'
                                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                    }`}
                                >
                                    <i className="fas fa-clipboard-check mr-2"></i>
                                    现场安全措施确认
                                </button>
                                <button
                                    onClick={() => setActiveTab('approval')}
                                    className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                                        activeTab === 'approval'
                                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                    }`}
                                >
                                    <i className="fas fa-stamp mr-2"></i>
                                    票证审批
                                </button>
                                <button
                                    onClick={() => setActiveTab('briefing')}
                                    className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                                        activeTab === 'briefing'
                                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                    }`}
                                >
                                    <i className="fas fa-chalkboard-teacher mr-2"></i>
                                    安全交底
                                </button>
                                <button
                                    onClick={() => setActiveTab('inspection')}
                                    className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                                        activeTab === 'inspection'
                                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                    }`}
                                >
                                    <i className="fas fa-clipboard-check mr-2"></i>
                                    验票及验收
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="p-6">
                                {activeTab === 'basic' && (
                                    SpecificForm ? (
                                        <SpecificForm 
                                            data={permit} 
                                            readOnly={true} 
                                            onChange={(field, value) => setPermit(prev => ({ ...prev, [field]: value }))} 
                                            userRole={user?.role} 
                                            status={permit.status} 
                                        />
                                    ) : (
                                        <>
                                            {/* Basic Info */}
                                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden mb-6">
                                                <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center opacity-50 pointer-events-none">
                                                    <i className="fas fa-file-contract text-6xl text-blue-200 ml-4 mt-4"></i>
                                                </div>

                                                <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">基础信息</h2>
                                                <div className="grid grid-cols-2 gap-y-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-500 block mb-1">作业类型</span>
                                                        <span className="font-medium text-gray-900 text-lg">{permit.type}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block mb-1">作业编号</span>
                                                        <span className="font-mono text-gray-700">{permit.permit_number}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block mb-1">申请单位/部门</span>
                                                        <span className="text-gray-900">{permit.department}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block mb-1">作业地点</span>
                                                        <span className="text-gray-900">{permit.location}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Time */}
                                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                                                <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">时间安排</h2>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <div className="flex-1">
                                                        <span className="text-gray-500 block mb-1">计划开始时间</span>
                                                        <span className="text-gray-900 font-mono">{formatDate(permit.start_time)}</span>
                                                    </div>
                                                    <i className="fas fa-arrow-right text-gray-300"></i>
                                                    <div className="flex-1 text-right">
                                                        <span className="text-gray-500 block mb-1">计划结束时间</span>
                                                        <span className="text-gray-900 font-mono">{formatDate(permit.end_time)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                                                <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">作业内容</h2>
                                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{permit.content}</p>
                                            </div>

                                            {/* Safety Measures */}
                                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                                <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">安全措施</h2>
                                                <ul className="space-y-2">
                                                    {safetyMeasures.map((measure, index) => (
                                                        <li key={index} className="flex items-start gap-2 text-gray-700">
                                                            <i className="fas fa-check-circle text-green-500 mt-1"></i>
                                                            <span>{measure}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </>
                                    )
                                )}

                                {activeTab === 'gas' && (
                                    <GasDetectionModule
                                        data={permit}
                                        onChange={(field, value) => setPermit(prev => ({ ...prev, [field]: value }))}
                                        readOnly={false}
                                        currentUser={user}
                                        onSave={saveExtraData}
                                        saving={savingExtra}
                                    />
                                )}

                                {activeTab === 'safety' && (
                                    <SafetyMeasuresConfirmModule
                                        data={permit}
                                        onChange={(field, value) => setPermit(prev => ({ ...prev, [field]: value }))}
                                        readOnly={false}
                                        currentUser={user}
                                        onSave={saveExtraData}
                                        saving={savingExtra}
                                    />
                                )}

                                {activeTab === 'approval' && (
                                    <ApprovalModule
                                        data={permit}
                                        onChange={(field, value) => setPermit(prev => ({ ...prev, [field]: value }))}
                                        readOnly={false}
                                        currentUser={user}
                                        onSave={saveExtraData}
                                        saving={savingExtra}
                                    />
                                )}

                                {activeTab === 'briefing' && (
                                    <SafetyBriefingModule
                                        data={permit}
                                        onChange={(field, value) => setPermit(prev => ({ ...prev, [field]: value }))}
                                        readOnly={false}
                                        currentUser={user}
                                        onSave={saveExtraData}
                                        saving={savingExtra}
                                    />
                                )}

                                {activeTab === 'inspection' && (
                                    <InspectionModule
                                        data={permit}
                                        onChange={(field, value) => setPermit(prev => ({ ...prev, [field]: value }))}
                                        readOnly={false}
                                        currentUser={user}
                                        onSave={saveExtraData}
                                        saving={savingExtra}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Status & Actions */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">当前状态</h3>
                            <span className={`inline-block px-4 py-2 rounded-lg text-lg font-semibold ${getStatusColor(permit.status)}`}>
                                {permit.status}
                            </span>
                        </div>

                        {/* Applicant Info */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-sm font-medium text-gray-500 mb-4">申请人信息</h3>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-xs text-gray-500">申请人</span>
                                    <div className="group relative inline-block">
                                        <p className="font-medium text-gray-900 cursor-help border-b border-dashed border-gray-300 inline-block">
                                            {permit.applicant_name}
                                        </p>
                                        {/* Tooltip */}
                                        <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute right-full top-1/2 -translate-y-1/2 mr-3 w-[36rem] bg-gray-800 text-white text-base rounded-xl shadow-xl p-6 z-50 transition-all duration-200">
                                            <div className="space-y-5">
                                                <div>
                                                    <h4 className="font-bold text-blue-200 text-lg mb-3 border-b border-gray-600 pb-2">培训考核教育纪录</h4>
                                                    <ul className="space-y-2 text-gray-300">
                                                        <li className="flex items-start gap-3">
                                                            <i className="fas fa-check text-green-400 mt-1"></i>
                                                            <span>2024年度安全生产教育培训 (合格)</span>
                                                        </li>
                                                        <li className="flex items-start gap-3">
                                                            <i className="fas fa-check text-green-400 mt-1"></i>
                                                            <span>入场三级安全教育 (通过)</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-blue-200 text-lg mb-3 border-b border-gray-600 pb-2">考核合格记录</h4>
                                                    <ul className="space-y-2 text-gray-300">
                                                        <li className="flex items-start gap-3">
                                                            <i className="fas fa-certificate text-yellow-400 mt-1"></i>
                                                            <span>特殊作业监护人资格证 (有效)</span>
                                                        </li>
                                                        <li className="flex items-start gap-3">
                                                            <i className="fas fa-certificate text-yellow-400 mt-1"></i>
                                                            <span>安全管理人员资格证 (有效)</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                            {/* Arrow pointing right */}
                                            <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-[1px] border-[12px] border-transparent border-l-gray-800"></div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500">申请时间</span>
                                    <p className="text-sm text-gray-700">{formatDate(permit.created_at)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-sm font-medium text-gray-500 mb-4">操作</h3>
                            
                            {/* 安全员审批按钮 - 仅安全员且状态为待审批时显示 */}
                            {user?.role === 'safety' && permit.status === '待审批' && (
                                <>
                                    {!permit.approver_sign && (
                                        <p className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded mb-3">
                                            <i className="fas fa-info-circle mr-1"></i>
                                            请先在下方完成审批人签字后再点击批准
                                        </p>
                                    )}
                                    <button
                                        onClick={handleApprove}
                                        disabled={approving || !permit.approver_sign}
                                        className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mb-3 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        <i className="fas fa-check mr-2"></i>
                                        {approving ? '处理中...' : '批准'}
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        disabled={approving}
                                        className="w-full py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        <i className="fas fa-times mr-2"></i>
                                        {approving ? '处理中...' : '驳回'}
                                    </button>
                                </>
                            )}
                            
                            {/* 作业人员开始作业按钮 - 仅作业人员本人且状态为已批准时显示 */}
                            {user?.role === 'worker' && user?.id === permit.applicant_id && permit.status === '已批准' && (
                                <>
                                    {!permit.safety_briefing_sign && (
                                        <p className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded mb-3">
                                            <i className="fas fa-info-circle mr-1"></i>
                                            请先在下方完成安全交底签字后再开始作业
                                        </p>
                                    )}
                                    <button
                                        onClick={handleStartWork}
                                        disabled={approving || !permit.safety_briefing_sign}
                                        className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        <i className="fas fa-play mr-2"></i>
                                        {approving ? '处理中...' : '开始作业'}
                                    </button>
                                </>
                            )}
                            
                            {/* 作业人员结束作业按钮 - 仅作业人员本人且状态为作业中时显示 */}
                            {user?.role === 'worker' && user?.id === permit.applicant_id && permit.status === '作业中' && (
                                <>
                                    {!permit.completion_sign && (
                                        <p className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded mb-3">
                                            <i className="fas fa-info-circle mr-1"></i>
                                            请先在下方完成完工验收签字后再结束作业
                                        </p>
                                    )}
                                    <button
                                        onClick={handleCompleteWork}
                                        disabled={approving || !permit.completion_sign}
                                        className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        <i className="fas fa-flag-checkered mr-2"></i>
                                        {approving ? '处理中...' : '结束作业'}
                                    </button>
                                </>
                            )}
                            
                            {/* 无可操作时显示提示 */}
                            {!((user?.role === 'safety' && permit.status === '待审批') ||
                               (user?.role === 'worker' && user?.id === permit.applicant_id && permit.status === '已批准') ||
                               (user?.role === 'worker' && user?.id === permit.applicant_id && permit.status === '作业中')) && (
                                <div className="text-center py-4 text-gray-400 text-sm">
                                    <i className="fas fa-info-circle mb-2"></i>
                                    <p>当前状态无可执行操作</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* 受限空间作业二次确认弹窗 */}
            {showConfinedSpaceModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4 text-amber-600">
                                <i className="fas fa-exclamation-triangle text-2xl"></i>
                                <h3 className="text-lg font-bold">特殊作业审批确认</h3>
                            </div>
                            
                            <p className="text-gray-600 mb-6">
                                当前为<span className="font-bold text-gray-800">受限空间作业</span>，批准前请务必确认以下关联作业状态：
                            </p>

                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-700">盲板抽堵作业进度</span>
                                    
                                    {/* 交互区域 */}
                                    <div 
                                        className="relative group"
                                        onMouseEnter={() => {
                                            if (!blindPlateStatus) {
                                                // 模拟查询延迟
                                                setBlindPlateStatus('checking');
                                                setTimeout(() => {
                                                    setBlindPlateStatus('completed');
                                                }, 600);
                                            }
                                        }}
                                    >
                                        <div className={`px-3 py-1.5 rounded text-sm font-medium transition-all duration-300 cursor-help select-none ${
                                            blindPlateStatus === 'completed' 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-gray-200 text-gray-500'
                                        }`}>
                                            {blindPlateStatus === 'completed' ? (
                                                <span className="flex items-center gap-1">
                                                    <i className="fas fa-check-circle"></i>
                                                    已完成
                                                </span>
                                            ) : blindPlateStatus === 'checking' ? (
                                                <span className="flex items-center gap-1">
                                                    <i className="fas fa-spinner fa-spin"></i>
                                                    查询中...
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1">
                                                    <i className="fas fa-mouse-pointer"></i>
                                                    移入查看
                                                </span>
                                            )}
                                        </div>

                                        {/* Tooltip - optional extra info */}
                                        {blindPlateStatus === 'completed' && (
                                            <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-800 text-white text-xs rounded p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                关联作业票：BP-20240320-001<br/>
                                                状态：已验收合格
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfinedSpaceModal(false)}
                                    className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={executeApprove}
                                    disabled={blindPlateStatus !== 'completed' || approving}
                                    className="flex-1 py-2.5 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    {approving ? '处理中...' : '确认批准'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
