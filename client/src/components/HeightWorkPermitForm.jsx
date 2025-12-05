import React from 'react';

export default function HeightWorkPermitForm({ data, onChange, readOnly = false }) {
    const handleChange = (e) => {
        if (readOnly) return;
        const { name, value, type, checked } = e.target;
        onChange(name, type === 'checkbox' ? checked : value);
    };

    const handleMeasureChange = (index, field, value) => {
        if (readOnly) return;
        const newMeasures = [...(data.safety_measures_list || [])];
        if (!newMeasures[index]) newMeasures[index] = {};
        newMeasures[index][field] = value;
        onChange('safety_measures_list', newMeasures);
    };

    // Initialize safety measures if empty and not readOnly
    React.useEffect(() => {
        if (!readOnly && (!data.safety_measures_list || data.safety_measures_list.length === 0)) {
            const initialMeasures = [
                { id: 1, content: '作业人员身体条件符合要求', applicable: '', confirmer: '' },
                { id: 2, content: '作业人员着装符合作业要求', applicable: '', confirmer: '' },
                { id: 3, content: '作业人员佩戴符合标准要求的安全帽、安全带，有可能散发有毒气体的场所携带正压式空气呼吸器或面罩备用', applicable: '', confirmer: '' },
                { id: 4, content: '作业人员携带工具袋及安全绳', applicable: '', confirmer: '' },
                { id: 5, content: '现场搭设的脚手架、防护网、围栏符合安全规定', applicable: '', confirmer: '' },
                { id: 6, content: '垂直分层作业中间有隔离设施', applicable: '', confirmer: '' },
                { id: 7, content: '梯子、绳子符合安全规定', applicable: '', confirmer: '' },
                { id: 8, content: '轻型棚的承重梁、柱能承重作业过程最大负荷的要求', applicable: '', confirmer: '' },
                { id: 9, content: '作业人员在不承重物处作业所搭设的承重板稳定牢固', applicable: '', confirmer: '' },
                { id: 10, content: '采光、夜间作业照明符合作业要求', applicable: '', confirmer: '' },
                { id: 11, content: '30m以上高处作业时，作业人员已配备通信、联络工具', applicable: '', confirmer: '' },
                { id: 12, content: '作业现场四周已设警戒区', applicable: '', confirmer: '' },
                { id: 13, content: '露天作业，风力满足作业安全要求', applicable: '', confirmer: '' },
                { id: 14, content: '其他相关特殊作业已办理相应安全作业票', applicable: '', confirmer: '' },
                { id: 15, content: '其他安全措施：携带便携式气体检测仪。', applicable: '', confirmer: '' },
            ];
            onChange('safety_measures_list', initialMeasures);
        }
    }, []);

    const FormField = ({ label, required = false, children, className = "" }) => (
        <div className={`flex flex-col ${className}`}>
            <label className="text-sm font-medium text-gray-500 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
        </div>
    );

    const Input = ({ className = "", ...props }) => (
        <input 
            {...props}
            readOnly={readOnly}
            disabled={readOnly}
            className={`w-full bg-gray-50 border border-gray-200 rounded px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-400 disabled:cursor-not-allowed ${className}`}
        />
    );

    return (
        <div className="w-full max-w-7xl mx-auto bg-white p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                    <h1 className="text-xl font-bold text-gray-800">高处安全作业票申请表</h1>
                </div>
                <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded border border-gray-200">
                    编号：{data.permit_code || '系统自动生成'}
                </div>
            </div>

            {/* Basic Information */}
            <div className="mb-8">
                <h2 className="text-base font-bold text-blue-600 mb-6">申请基本信息</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <FormField label="作业申请单位">
                        <Input 
                            type="text" 
                            name="applicant_unit"
                            value={data.applicant_unit || ''}
                            onChange={handleChange}
                            placeholder="请输入单位"
                        />
                    </FormField>
                    <FormField label="作业申请时间">
                        <Input 
                            type="datetime-local" 
                            name="apply_time"
                            value={data.apply_time || ''}
                            onChange={handleChange}
                        />
                    </FormField>
                    <FormField label="作业地点">
                        <Input 
                            type="text" 
                            name="work_location"
                            value={data.work_location || ''}
                            onChange={handleChange}
                            placeholder="请输入作业地点"
                        />
                    </FormField>
                     <FormField label="作业内容">
                        <Input 
                            type="text" 
                            name="content"
                            value={data.content || ''}
                            onChange={handleChange}
                            placeholder="请输入作业内容"
                        />
                    </FormField>
                    
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <FormField label="作业高度 (m)">
                             <Input 
                                type="text" 
                                name="work_height"
                                value={data.work_height || ''}
                                onChange={handleChange}
                                placeholder="请输入高度"
                            />
                        </FormField>
                        <FormField label="高处作业级别">
                            <Input 
                                type="text" 
                                name="work_level"
                                value={data.work_level || ''}
                                onChange={handleChange}
                                placeholder="请输入级别"
                            />
                        </FormField>
                    </div>

                    <FormField label="作业单位">
                        <Input 
                            type="text" 
                            name="work_unit"
                            value={data.work_unit || ''}
                            onChange={handleChange}
                            placeholder="请输入作业单位"
                        />
                    </FormField>
                     <FormField label="监护人">
                        <Input 
                            type="text" 
                            name="guardian"
                            value={data.guardian || ''}
                            onChange={handleChange}
                            placeholder="请输入监护人"
                        />
                    </FormField>
                     <FormField label="作业人">
                        <Input 
                            type="text" 
                            name="workers"
                            value={data.workers || ''}
                            onChange={handleChange}
                            placeholder="请输入作业人"
                        />
                    </FormField>
                     <FormField label="作业负责人">
                        <Input 
                            type="text" 
                            name="supervisor"
                            value={data.supervisor || ''}
                            onChange={handleChange}
                            placeholder="请输入作业负责人"
                        />
                    </FormField>
                    <FormField label="关联的其他特殊作业及安全作业票编号" className="md:col-span-2">
                        <Input 
                            type="text" 
                            name="related_permits"
                            value={data.related_permits || ''}
                            onChange={handleChange}
                            placeholder="请输入关联作业票编号"
                        />
                    </FormField>
                    <FormField label="风险辨识结果" className="md:col-span-2">
                        <Input 
                            type="text" 
                            name="risk_identification"
                            value={data.risk_identification || ''}
                            onChange={handleChange}
                            placeholder="高处坠落、灼伤、火灾爆炸..."
                        />
                    </FormField>
                </div>
            </div>

            {/* Time Range */}
             <div className="mb-8">
                <h2 className="text-base font-bold text-blue-600 mb-6">作业实施时间</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <FormField label="开始时间">
                        <Input 
                            type="datetime-local" 
                            name="start_time"
                            value={data.start_time || ''}
                            onChange={handleChange}
                        />
                    </FormField>
                    <FormField label="结束时间">
                        <Input 
                            type="datetime-local" 
                            name="end_time"
                            value={data.end_time || ''}
                            onChange={handleChange}
                        />
                    </FormField>
                </div>
            </div>

            {/* Safety Measures */}
            <div>
                <h2 className="text-base font-bold text-blue-600 mb-4">安全措施预判定</h2>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-6 py-3 grid grid-cols-12 gap-4 border-b border-gray-200">
                        <div className="col-span-1 flex justify-center"><input type="checkbox" disabled className="rounded border-gray-300" /></div>
                        <div className="col-span-1 text-sm font-medium text-gray-500">序号</div>
                        <div className="col-span-6 text-sm font-medium text-gray-500">措施内容</div>
                        <div className="col-span-2 text-center text-sm font-medium text-gray-500">是否涉及</div>
                        <div className="col-span-2 text-center text-sm font-medium text-gray-500">确认人</div>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {(data.safety_measures_list || []).map((measure, idx) => (
                            <div key={measure.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-blue-50/30 transition-colors group">
                                <div className="col-span-1 flex justify-center">
                                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" disabled={readOnly} />
                                </div>
                                <div className="col-span-1 text-sm text-gray-500">{measure.id}</div>
                                <div className="col-span-6 text-sm text-gray-700 leading-relaxed">
                                    {measure.content}
                                    {measure.id === 15 && (
                                        <input 
                                            type="text" 
                                            value={measure.extraContent || ''}
                                            onChange={(e) => handleMeasureChange(idx, 'extraContent', e.target.value)}
                                            readOnly={readOnly}
                                            disabled={readOnly}
                                            className="ml-2 border-b border-gray-300 outline-none focus:border-blue-500 bg-transparent"
                                            placeholder="请输入"
                                        />
                                    )}
                                </div>
                                <div className="col-span-2 flex justify-center gap-4">
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${measure.applicable === 'yes' ? 'border-blue-500' : 'border-gray-300'}`}>
                                            {measure.applicable === 'yes' && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                                        </div>
                                        <input type="radio" name={`applicable-${idx}`} value="yes" checked={measure.applicable === 'yes'} onChange={() => handleMeasureChange(idx, 'applicable', 'yes')} disabled={readOnly} className="hidden" />
                                        <span className="text-xs text-gray-600">是</span>
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${measure.applicable === 'no' ? 'border-blue-500' : 'border-gray-300'}`}>
                                            {measure.applicable === 'no' && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                                        </div>
                                        <input type="radio" name={`applicable-${idx}`} value="no" checked={measure.applicable === 'no'} onChange={() => handleMeasureChange(idx, 'applicable', 'no')} disabled={readOnly} className="hidden" />
                                        <span className="text-xs text-gray-600">否</span>
                                    </label>
                                </div>
                                <div className="col-span-2 flex justify-center">
                                    <div className="px-4 py-1.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium cursor-pointer hover:bg-gray-200 transition-colors">
                                        {measure.confirmer || '待确认'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Signatures and Approvals Section */}
            <div className="mt-8">
                <h2 className="text-base font-bold text-blue-600 mb-6">签字与验收</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                     <FormField label="安全交底人">
                        <Input 
                            type="text" 
                            name="safety_discloser"
                            value={data.safety_discloser || ''}
                            onChange={handleChange}
                            placeholder="请输入"
                        />
                    </FormField>
                    <FormField label="接受交底人">
                        <Input 
                            type="text" 
                            name="safety_receiver"
                            value={data.safety_receiver || ''}
                            onChange={handleChange}
                            placeholder="请输入"
                        />
                    </FormField>
                </div>

                <div className="space-y-6">
                    {/* Supervisor Opinion */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <FormField label="作业负责人意见">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-6">
                                    <Input 
                                        type="text" 
                                        name="supervisor_opinion"
                                        value={data.supervisor_opinion || '同意作业'}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="text" 
                                        placeholder="签字"
                                        name="supervisor_sign"
                                        value={data.supervisor_sign || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="datetime-local" 
                                        name="supervisor_sign_time"
                                        value={data.supervisor_sign_time || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </FormField>
                    </div>

                    {/* Unit Opinion */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <FormField label="所在单位意见">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-6">
                                    <Input 
                                        type="text" 
                                        name="unit_opinion"
                                        value={data.unit_opinion || '同意作业'}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="text" 
                                        placeholder="签字"
                                        name="unit_sign"
                                        value={data.unit_sign || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="datetime-local" 
                                        name="unit_sign_time"
                                        value={data.unit_sign_time || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </FormField>
                    </div>

                    {/* Safety Dept Opinion (was Audit Dept) */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <FormField label="审核部门意见">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-6">
                                    <Input 
                                        type="text" 
                                        name="safety_dept_opinion"
                                        value={data.safety_dept_opinion || '同意作业'}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="text" 
                                        placeholder="签字"
                                        name="safety_dept_sign"
                                        value={data.safety_dept_sign || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="datetime-local" 
                                        name="safety_dept_sign_time"
                                        value={data.safety_dept_sign_time || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </FormField>
                    </div>

                    {/* Approver Opinion (was Approval Dept) */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <FormField label="审批部门意见">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-6">
                                    <Input 
                                        type="text" 
                                        name="approver_opinion"
                                        value={data.approver_opinion || '同意作业'}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="text" 
                                        placeholder="签字"
                                        name="approver_sign"
                                        value={data.approver_sign || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="datetime-local" 
                                        name="approver_sign_time"
                                        value={data.approver_sign_time || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </FormField>
                    </div>

                    {/* Completion Acceptance */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <FormField label="完工验收">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-6">
                                    <Input 
                                        type="text" 
                                        name="completion_acceptance"
                                        value={data.completion_acceptance || '高处作业已完成。'}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="text" 
                                        placeholder="签字"
                                        name="completion_sign"
                                        value={data.completion_sign || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="datetime-local" 
                                        name="completion_sign_time"
                                        value={data.completion_sign_time || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </FormField>
                    </div>
                </div>
            </div>
        </div>
    );
}
