import React from 'react';

export default function BlindPlatePermitForm({ data, onChange, readOnly = false }) {
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
                { id: 1, content: '在管道、设备上作业时，降低系统压力，作业点应为常压或微正压', applicable: '', confirmer: '' },
                { id: 2, content: '在有毒介质的管道、设备上作业时，作业人员应穿戴适合的个体防护装备', applicable: '', confirmer: '' },
                { id: 3, content: '火灾爆炸危险场所，作业人员穿防静电工作服、工作鞋；作业时使用防爆灯具和防爆工具', applicable: '', confirmer: '' },
                { id: 4, content: '火灾爆炸危险场所的气体管道，距作业地点 30 m 内无其他动火作业', applicable: '', confirmer: '' },
                { id: 5, content: '在强腐蚀性介质的管道、设备上作业时，作业人员已采取防止酸碱化学灼伤的措施', applicable: '', confirmer: '' },
                { id: 6, content: '介质温度较高、可能造成烫伤的情况下，作业人员已采取防烫措施', applicable: '', confirmer: '' },
                { id: 7, content: '介质温度较低、可能造成人员冻伤的情况下，作业人员已采取防冻伤措施', applicable: '', confirmer: '' },
                { id: 8, content: '同一管道上未同时进行两处及两处以上的盲板抽堵作业', applicable: '', confirmer: '' },
                { id: 9, content: '其他相关特殊作业已办理相应安全作业票', applicable: '', confirmer: '' },
                { id: 10, content: '作业现场四周已设警戒区', applicable: '', confirmer: '' },
                { id: 11, content: '其他安全措施：', applicable: '', confirmer: '' },
            ];
            onChange('safety_measures_list', initialMeasures);
        }
    }, []); // Run once on mount

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
                    <h1 className="text-xl font-bold text-gray-800">盲板抽堵安全作业票申请表</h1>
                </div>
                <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded border border-gray-200">
                    编号：{data.permit_code || '系统自动生成'}
                </div>
            </div>

            {/* Basic Information */}
            <div className="mb-8">
                <h2 className="text-base font-bold text-blue-600 mb-6">申请基本信息</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <FormField label="申请单位">
                        <Input 
                            type="text" 
                            name="applicant_unit"
                            value={data.applicant_unit || ''}
                            onChange={handleChange}
                            placeholder="请输入申请单位"
                        />
                    </FormField>
                    <FormField label="作业单位">
                        <Input 
                            type="text" 
                            name="work_unit"
                            value={data.work_unit || ''}
                            onChange={handleChange}
                            placeholder="请输入作业单位"
                        />
                    </FormField>
                    <FormField label="作业类别">
                        <div className="flex gap-4 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="blind_plate_work_type" 
                                    value="堵盲板"
                                    checked={data.blind_plate_work_type === '堵盲板'}
                                    onChange={handleChange}
                                    disabled={readOnly}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                /> 
                                <span className="text-sm text-gray-700">堵盲板</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="blind_plate_work_type" 
                                    value="抽盲板"
                                    checked={data.blind_plate_work_type === '抽盲板'}
                                    onChange={handleChange}
                                    disabled={readOnly}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                /> 
                                <span className="text-sm text-gray-700">抽盲板</span>
                            </label>
                        </div>
                    </FormField>
                    <FormField label="设备、管道名称">
                        <Input 
                            type="text" 
                            name="equipment_pipeline_name"
                            value={data.equipment_pipeline_name || ''}
                            onChange={handleChange}
                            placeholder="请输入设备/管道名称"
                        />
                    </FormField>
                    
                    {/* Pipeline Parameters */}
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="md:col-span-3 text-sm font-bold text-gray-700 mb-2">管道参数</div>
                        <FormField label="介质">
                            <Input 
                                type="text" 
                                name="pipeline_media"
                                value={data.pipeline_media || ''}
                                onChange={handleChange}
                            />
                        </FormField>
                        <FormField label="温度">
                            <Input 
                                type="text" 
                                name="pipeline_temp"
                                value={data.pipeline_temp || ''}
                                onChange={handleChange}
                            />
                        </FormField>
                        <FormField label="压力">
                            <Input 
                                type="text" 
                                name="pipeline_pressure"
                                value={data.pipeline_pressure || ''}
                                onChange={handleChange}
                            />
                        </FormField>
                    </div>

                    {/* Blind Plate Parameters */}
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="md:col-span-3 text-sm font-bold text-gray-700 mb-2">盲板参数</div>
                        <FormField label="材质">
                            <Input 
                                type="text" 
                                name="blind_plate_material"
                                value={data.blind_plate_material || ''}
                                onChange={handleChange}
                            />
                        </FormField>
                        <FormField label="规格">
                            <Input 
                                type="text" 
                                name="blind_plate_spec"
                                value={data.blind_plate_spec || ''}
                                onChange={handleChange}
                            />
                        </FormField>
                        <FormField label="编号">
                            <Input 
                                type="text" 
                                name="blind_plate_number"
                                value={data.blind_plate_number || ''}
                                onChange={handleChange}
                            />
                        </FormField>
                    </div>

                    <FormField label="实际作业开始时间">
                        <Input 
                            type="datetime-local" 
                            name="start_time"
                            value={data.start_time || ''}
                            onChange={handleChange}
                        />
                    </FormField>
                     <FormField label="盲板位置图及编号" className="md:col-span-2">
                        <textarea
                            name="blind_plate_map"
                            value={data.blind_plate_map || ''}
                            onChange={handleChange}
                            readOnly={readOnly}
                            disabled={readOnly}
                            className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-400 disabled:cursor-not-allowed h-24 resize-none"
                            placeholder="请描述或附上图纸说明"
                        />
                    </FormField>

                    <FormField label="作业负责人">
                        <Input 
                            type="text" 
                            name="supervisor"
                            value={data.supervisor || ''}
                            onChange={handleChange}
                            placeholder="负责人姓名"
                        />
                    </FormField>
                    <FormField label="作业人">
                        <Input 
                            type="text" 
                            name="workers"
                            value={data.workers || ''}
                            onChange={handleChange}
                            placeholder="作业人姓名"
                        />
                    </FormField>
                    <FormField label="监护人">
                        <Input 
                            type="text" 
                            name="guardian"
                            value={data.guardian || ''}
                            onChange={handleChange}
                            placeholder="监护人姓名"
                        />
                    </FormField>
                    <FormField label="关联的其他特殊作业及安全作业票编号" className="md:col-span-2">
                        <Input 
                            type="text" 
                            name="related_permits"
                            value={data.related_permits || ''}
                            onChange={handleChange}
                            placeholder="如：动火作业 DH2022040101"
                        />
                    </FormField>
                    <FormField label="风险辨识结果" className="md:col-span-2">
                        <Input 
                            type="text" 
                            name="risk_identification"
                            value={data.risk_identification || ''}
                            onChange={handleChange}
                            placeholder="如：灼伤、火灾爆炸..."
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
                                    {measure.id === 11 && (
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
                     <FormField label="编制人">
                        <Input 
                            type="text" 
                            name="preparer"
                            value={data.preparer || ''}
                            onChange={handleChange}
                            placeholder="请输入"
                        />
                    </FormField>
                    <FormField label="监护人">
                        <Input 
                            type="text" 
                            name="guardian"
                            value={data.guardian || ''}
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

                    {/* Production Unit Opinion */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <FormField label="生产单位意见">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-6">
                                    <Input 
                                        type="text" 
                                        name="production_unit_opinion"
                                        value={data.production_unit_opinion || '同意作业'}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="text" 
                                        placeholder="签字"
                                        name="production_unit_sign"
                                        value={data.production_unit_sign || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="datetime-local" 
                                        name="production_unit_sign_time"
                                        value={data.production_unit_sign_time || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </FormField>
                    </div>

                    {/* Equipment Management Dept Opinion */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <FormField label="设备管理部门意见">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-6">
                                    <Input 
                                        type="text" 
                                        name="equipment_dept_opinion"
                                        value={data.equipment_dept_opinion || '同意作业'}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="text" 
                                        placeholder="签字"
                                        name="equipment_dept_sign"
                                        value={data.equipment_dept_sign || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="datetime-local" 
                                        name="equipment_dept_sign_time"
                                        value={data.equipment_dept_sign_time || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </FormField>
                    </div>

                    {/* Approver Opinion */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <FormField label="审批人意见">
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
                                        value={data.completion_acceptance || '作业已完成，人员已撤离，现场已清理'}
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
