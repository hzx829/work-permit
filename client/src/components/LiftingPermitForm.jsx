import React from 'react';

const FormField = ({ label, required = false, children, className = "" }) => (
    <div className={`flex flex-col ${className}`}>
        <label className="text-sm font-medium text-gray-500 mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

const Input = ({ className = "", readOnly, ...props }) => (
    <input 
        {...props}
        readOnly={readOnly}
        disabled={readOnly}
        className={`w-full bg-gray-50 border border-gray-200 rounded px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-400 disabled:cursor-not-allowed ${className}`}
    />
);

export default function LiftingPermitForm({ data, onChange, readOnly = false }) {
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
        
        // 当选择“是”时，自动勾选前面的复选框
        if (field === 'applicable' && value === 'yes') {
            newMeasures[index].checked = true;
        }

        onChange('safety_measures_list', newMeasures);
    };

    // Initialize safety measures if empty and not readOnly
    React.useEffect(() => {
        if (!readOnly && (!data.safety_measures_list || data.safety_measures_list.length === 0)) {
            const initialMeasures = [
                { id: 1, content: '一、二级吊装作业已编制吊装作业方案，已经审查批准；吊装物体形状复杂、刚度小、长径比大、精密贵重，作业条件特殊的三级吊装作业，已编制吊装作业方案，已经审查批准', applicable: '', confirmer: '' },
                { id: 2, content: '吊装场所如包含危险物料的设备、管道时，应制定详细吊装方案，并对设备、管道采取有效防护措施，必要时停车，放空物料，置换后再进行吊装作业', applicable: '', confirmer: '' },
                { id: 3, content: '作业人员已按规定佩戴个体防护装备', applicable: '', confirmer: '' },
                { id: 4, content: '已对起重吊装设备、钢丝绳、揽风绳、链条、吊钩等各种机具进行检查，安全可靠', applicable: '', confirmer: '' },
                { id: 5, content: '已明确各自分工、坚守岗位，并统一规定联络信号', applicable: '', confirmer: '' },
                { id: 6, content: '将建筑物、构筑物作为锚点，应经所属单位工程管理部门审查核算并批准', applicable: '', confirmer: '' },
                { id: 7, content: '吊装绳索、揽风绳、拖拉绳等不应与带电线路接触，并保持安全距离', applicable: '', confirmer: '' },
                { id: 8, content: '不应利用管道、管架、电杆、机电设备等作吊装锚点', applicable: '', confirmer: '' },
                { id: 9, content: '吊物捆扎坚固，未见绳打结、绳不齐现象，棱角吊物已采取衬垫措施', applicable: '', confirmer: '' },
                { id: 10, content: '起重机安全装置灵活好用', applicable: '', confirmer: '' },
                { id: 11, content: '吊装作业人员持有有效的法定资格证书', applicable: '', confirmer: '' },
                { id: 12, content: '地下通信电（光）缆、局域网络电（光）缆、排水沟的盖板，承重吊装机械的负重量已确认，保护措施已落实', applicable: '', confirmer: '' },
                { id: 13, content: '起吊物的质量（t）经确认，在吊装机械的承重范围内', applicable: '', confirmer: '' },
                { id: 14, content: '在吊装高度的管线、电缆桥架已做好防护措施', applicable: '', confirmer: '' },
                { id: 15, content: '作业现场围栏、警戒线、警告牌、夜间警示灯已按要求设置', applicable: '', confirmer: '' },
                { id: 16, content: '作业高度和转臂范围内无架空线路', applicable: '', confirmer: '' },
                { id: 17, content: '在爆炸危险场所内的作业，机动车排气管已装阻火器', applicable: '', confirmer: '' },
                { id: 18, content: '露天作业，环境风力满足作业安全要求', applicable: '', confirmer: '' },
                { id: 19, content: '其他相关特殊作业已办理相应安全作业票', applicable: '', confirmer: '' },
                { id: 20, content: '其他安全措施：', applicable: '', confirmer: '' },
            ];
            onChange('safety_measures_list', initialMeasures);
        }
    }, []);

    return (
        <div className="w-full max-w-7xl mx-auto bg-white p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                    <h1 className="text-xl font-bold text-gray-800">吊装安全作业票申请表</h1>
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
                            readOnly={readOnly}
                        />
                    </FormField>
                    <FormField label="作业申请时间">
                        <Input 
                            type="datetime-local" 
                            name="apply_time"
                            value={data.apply_time || ''}
                            onChange={handleChange}
                            readOnly={readOnly}
                        />
                    </FormField>
                    <FormField label="吊装地点">
                        <Input 
                            type="text" 
                            name="work_location"
                            value={data.work_location || ''}
                            onChange={handleChange}
                            placeholder="请输入吊装地点"
                            readOnly={readOnly}
                        />
                    </FormField>
                    <FormField label="吊具名称">
                        <Input 
                            type="text" 
                            name="rigging_name"
                            value={data.rigging_name || ''}
                            onChange={handleChange}
                            placeholder="请输入吊具名称"
                            readOnly={readOnly}
                        />
                    </FormField>
                    <FormField label="吊物内容" className="md:col-span-2">
                        <Input 
                            type="text" 
                            name="content"
                            value={data.content || ''}
                            onChange={handleChange}
                            placeholder="请输入吊物内容"
                            readOnly={readOnly}
                        />
                    </FormField>

                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <FormField label="吊物质量 (t)">
                             <Input 
                                type="text" 
                                name="lifting_weight"
                                value={data.lifting_weight || ''}
                                onChange={handleChange}
                                placeholder="请输入质量"
                                readOnly={readOnly}
                            />
                        </FormField>
                        <FormField label="作业级别">
                            <Input 
                                type="text" 
                                name="work_level"
                                value={data.work_level || ''}
                                onChange={handleChange}
                                placeholder="请输入级别"
                                readOnly={readOnly}
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
                            readOnly={readOnly}
                        />
                    </FormField>
                    <FormField label="吊装作业人">
                        <Input 
                            type="text" 
                            name="lifting_workers"
                            value={data.lifting_workers || ''}
                            onChange={handleChange}
                            placeholder="请输入吊装作业人"
                            readOnly={readOnly}
                        />
                    </FormField>
                    <FormField label="司索人">
                        <Input 
                            type="text" 
                            name="rigger"
                            value={data.rigger || ''}
                            onChange={handleChange}
                            placeholder="请输入司索人"
                            readOnly={readOnly}
                        />
                    </FormField>
                    <FormField label="指挥人员">
                        <Input 
                            type="text" 
                            name="commander"
                            value={data.commander || ''}
                            onChange={handleChange}
                            placeholder="请输入指挥人员"
                            readOnly={readOnly}
                        />
                    </FormField>
                    <FormField label="监护人">
                        <Input 
                            type="text" 
                            name="guardian"
                            value={data.guardian || ''}
                            onChange={handleChange}
                            placeholder="请输入监护人"
                            readOnly={readOnly}
                        />
                    </FormField>
                    
                    <FormField label="风险辨识结果" className="md:col-span-2">
                        <Input 
                            type="text" 
                            name="risk_identification"
                            value={data.risk_identification || ''}
                            onChange={handleChange}
                            placeholder="物体打击、起重伤害、车辆伤害……"
                            readOnly={readOnly}
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
                            readOnly={readOnly}
                        />
                    </FormField>
                    <FormField label="结束时间">
                        <Input 
                            type="datetime-local" 
                            name="end_time"
                            value={data.end_time || ''}
                            onChange={handleChange}
                            readOnly={readOnly}
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
                        <div className="col-span-8 text-sm font-medium text-gray-500">措施内容</div>
                        <div className="col-span-2 text-center text-sm font-medium text-gray-500">是否涉及</div>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {(data.safety_measures_list || []).map((measure, idx) => (
                            <div key={measure.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-blue-50/30 transition-colors group">
                                <div className="col-span-1 flex justify-center">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                                        disabled={readOnly}
                                        checked={measure.checked || false}
                                        onChange={(e) => handleMeasureChange(idx, 'checked', e.target.checked)}
                                    />
                                </div>
                                <div className="col-span-1 text-sm text-gray-500">{measure.id}</div>
                                <div className="col-span-8 text-sm text-gray-700 leading-relaxed">
                                    {measure.content}
                                    {measure.id === 20 && (
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
                            readOnly={readOnly}
                        />
                    </FormField>
                    <FormField label="接受交底人">
                        <Input 
                            type="text" 
                            name="safety_disclosee"
                            value={data.safety_disclosee || ''}
                            onChange={handleChange}
                            placeholder="请输入"
                            readOnly={readOnly}
                        />
                    </FormField>
                </div>

                <div className="space-y-6">
                    {/* Supervisor Opinion (Commander) */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <FormField label="作业指挥意见">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-6">
                                    <Input 
                                        type="text" 
                                        name="commander_opinion"
                                        value={data.commander_opinion || '同意作业'}
                                        onChange={handleChange}
                                        readOnly={readOnly}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="text" 
                                        placeholder="签字 (吊装指挥)"
                                        name="commander_sign"
                                        value={data.commander_sign || ''}
                                        onChange={handleChange}
                                        readOnly={readOnly}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="datetime-local" 
                                        name="commander_sign_time"
                                        value={data.commander_sign_time || ''}
                                        onChange={handleChange}
                                        readOnly={readOnly}
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
                                        readOnly={readOnly}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="text" 
                                        placeholder="签字 (车间有关人员)"
                                        name="unit_sign"
                                        value={data.unit_sign || ''}
                                        onChange={handleChange}
                                        readOnly={readOnly}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="datetime-local" 
                                        name="unit_sign_time"
                                        value={data.unit_sign_time || ''}
                                        onChange={handleChange}
                                        readOnly={readOnly}
                                    />
                                </div>
                            </div>
                        </FormField>
                    </div>

                    {/* Safety Dept Opinion (Audit) */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <FormField label="审核部门意见">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-6">
                                    <Input 
                                        type="text" 
                                        name="audit_opinion"
                                        value={data.audit_opinion || '同意作业'}
                                        onChange={handleChange}
                                        readOnly={readOnly}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="text" 
                                        placeholder="签字 (专业管理部门)"
                                        name="audit_sign"
                                        value={data.audit_sign || ''}
                                        onChange={handleChange}
                                        readOnly={readOnly}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="datetime-local" 
                                        name="audit_sign_time"
                                        value={data.audit_sign_time || ''}
                                        onChange={handleChange}
                                        readOnly={readOnly}
                                    />
                                </div>
                            </div>
                        </FormField>
                    </div>

                    {/* Approver Opinion */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <FormField label="审批部门意见">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-6">
                                    <Input 
                                        type="text" 
                                        name="approval_opinion"
                                        value={data.approval_opinion || '同意作业'}
                                        onChange={handleChange}
                                        readOnly={readOnly}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="text" 
                                        placeholder="签字 (主管厂长/总工)"
                                        name="approval_sign"
                                        value={data.approval_sign || ''}
                                        onChange={handleChange}
                                        readOnly={readOnly}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="datetime-local" 
                                        name="approval_sign_time"
                                        value={data.approval_sign_time || ''}
                                        onChange={handleChange}
                                        readOnly={readOnly}
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
                                        value={data.completion_acceptance || '吊装作业完成，同意验收。'}
                                        onChange={handleChange}
                                        readOnly={readOnly}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="text" 
                                        placeholder="签字"
                                        name="completion_sign"
                                        value={data.completion_sign || ''}
                                        onChange={handleChange}
                                        readOnly={readOnly}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="datetime-local" 
                                        name="completion_sign_time"
                                        value={data.completion_sign_time || ''}
                                        onChange={handleChange}
                                        readOnly={readOnly}
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
