import React from 'react';

// Helper components for consistent styling
const FormField = ({ label, required = false, children, className = "" }) => (
    <div className={`flex flex-col ${className}`}>
        <label className="text-sm font-medium text-gray-500 mb-1.5">
            {label}
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

export default function HotWorkPermitForm({ data, onChange, readOnly = false }) {
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

    const handleGasAnalysisChange = (index, field, value) => {
        if (readOnly) return;
        const newGas = [...(data.gas_analysis || [])];
        if (!newGas[index]) newGas[index] = {};
        newGas[index][field] = value;
        onChange('gas_analysis', newGas);
    };

    // Initialize safety measures if empty and not readOnly
    React.useEffect(() => {
        if (!readOnly && (!data.safety_measures_list || data.safety_measures_list.length === 0)) {
            const initialMeasures = [
                { id: 1, content: '动火设备内部构件清理干净，蒸汽吹扫或水洗合格，达到动火条件', applicable: '', confirmer: '' },
                { id: 2, content: '断开与动火设备相连接的所有管线，加盲板（ ）块，未采取水封或仅关闭阀门的方式代替盲板', applicable: '', confirmer: '' },
                { id: 3, content: '动火点周围的下水井、地漏、地沟、电缆沟等已清除易燃物，并已采取覆盖、铺沙、水封等手段进行隔离', applicable: '', confirmer: '' },
                { id: 4, content: '油气罐区内动火点同一防火堤内和防火间距内的油罐不同时进行脱水和取样作业', applicable: '', confirmer: '' },
                { id: 5, content: '高处作业已采取防火花飞溅措施，作业人员应佩戴必要的个体防护装备', applicable: '', confirmer: '' },
                { id: 6, content: '在有可燃物构件和使用可燃物做防腐内衬的设备内部动火作业，已采取防火隔绝 措施', applicable: '', confirmer: '' },
                { id: 7, content: '乙炔气瓶直立放置，已采取防倾倒措施并安装防回火装置；乙炔气瓶、氧气瓶与火 源间的距离不应小于 10 m，两气瓶相互间距不应小于 5 m', applicable: '', confirmer: '' },
                { id: 8, content: '现场配备灭火器 （ ）台，灭火毯 （ ）块，消防蒸汽带或消防水带（ ）', applicable: '', confirmer: '' },
                { id: 9, content: '电焊机所处位置已考虑防火防爆要求，且已可靠接地', applicable: '', confirmer: '' },
                { id: 10, content: '动火点周围规定距离内没有易燃易爆化学品的装卸、排放、喷漆等可能引起火爆炸的危险作业', applicable: '', confirmer: '' },
                { id: 11, content: '动火点 30 m 内垂直空间未排放可燃气体；15 m 内垂直空间未排放可燃液体；10 m 范围内及动火点下方未同时进行可燃溶剂清洗或喷漆等作业，10 m 范围内未见有可燃性粉尘清扫作业', applicable: '', confirmer: '' },
                { id: 12, content: '已开展作业危害分析，制定相应的安全风险管控措施，交叉作业已明确协调人', applicable: '', confirmer: '' },
                { id: 13, content: '用于连续检测的移动式可燃气体检测仪已配备到位', applicable: '', confirmer: '' },
                { id: 14, content: '配备的摄录设备已到位，且防爆级别满足安全要求', applicable: '', confirmer: '' },
                { id: 15, content: '其他相关特殊作业已办理相应安全作业票，作业现场四周已设立警戒区', applicable: '', confirmer: '' },
                { id: 16, content: '其他安全措施：', applicable: '', confirmer: '' },
            ];
            onChange('safety_measures_list', initialMeasures);
        }
    }, []); // Run once on mount

    return (
        <div className="w-full max-w-7xl mx-auto bg-white p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                    <h1 className="text-xl font-bold text-gray-800">动火作业票申请</h1>
                </div>
                <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded border border-gray-200">
                    编号：{data.permit_code || '系统自动生成'}
                </div>
            </div>

            {/* Basic Info Section */}
            <div className="mb-8">
                <h2 className="text-base font-bold text-blue-600 mb-6">申请基本信息</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <FormField label="作业票编号">
                        <Input value={data.permit_code || 'YH-DH-2021-0006'} disabled readOnly={readOnly} />
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

                    <FormField label="作业负责人">
                        <Input 
                            type="text" 
                            name="supervisor"
                            value={data.supervisor || ''}
                            onChange={handleChange}
                            placeholder="张承包"
                            readOnly={readOnly}
                        />
                    </FormField>

                    <FormField label="属地单位">
                        <Input 
                            type="text" 
                            name="applicant_unit"
                            value={data.applicant_unit || ''}
                            onChange={handleChange}
                            placeholder="请输入"
                            readOnly={readOnly}
                        />
                    </FormField>

                    <FormField label="施工单位">
                        <Input 
                            type="text" 
                            name="work_unit"
                            value={data.work_unit || ''}
                            onChange={handleChange}
                            readOnly={readOnly}
                        />
                    </FormField>

                    <div className="md:col-span-2">
                        <FormField label="作业内容">
                            <Input 
                                type="text" 
                                name="content"
                                value={data.content || ''}
                                onChange={handleChange}
                                placeholder="请输入"
                                readOnly={readOnly}
                            />
                        </FormField>
                    </div>

                    <FormField label="动火地点及动火部位">
                        <Input 
                            type="text" 
                            name="work_location"
                            value={data.work_location || ''}
                            onChange={handleChange}
                            placeholder="请输入"
                            readOnly={readOnly}
                        />
                    </FormField>

                    <FormField label="动火方式">
                        <select 
                            name="work_method"
                            value={data.work_method || ''}
                            onChange={handleChange}
                            disabled={readOnly}
                            className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:cursor-not-allowed appearance-none"
                        >
                            <option value="">请选择</option>
                            <option value="电焊">电焊</option>
                            <option value="气割">气割</option>
                            <option value="打磨">打磨</option>
                        </select>
                    </FormField>

                    {/* Gas Analysis Section - Styled as Form Fields for consistency with the new image */}
                    <FormField label="分析点名称">
                        <Input 
                            type="text" 
                            value={data.gas_analysis?.[0]?.location || ''}
                            onChange={(e) => handleGasAnalysisChange(0, 'location', e.target.value)}
                            placeholder="请输入"
                            readOnly={readOnly}
                        />
                    </FormField>

                    <FormField label="代表性气体">
                        <Input 
                            type="text" 
                            value={data.gas_analysis?.[0]?.gas || ''}
                            onChange={(e) => handleGasAnalysisChange(0, 'gas', e.target.value)}
                            placeholder="请输入"
                            readOnly={readOnly}
                        />
                    </FormField>

                    <FormField label="合格标准">
                        <Input 
                            type="text" 
                            value={data.gas_analysis?.[0]?.standard || ''}
                            onChange={(e) => handleGasAnalysisChange(0, 'standard', e.target.value)}
                            placeholder="请输入"
                            readOnly={readOnly}
                        />
                    </FormField>
                     
                     <FormField label="涉及的其他特殊作业">
                        <Input 
                            type="text" 
                            name="related_permits"
                            value={data.related_permits || ''}
                            onChange={handleChange}
                            placeholder="请输入"
                            readOnly={readOnly}
                        />
                    </FormField>

                     <FormField label="相关作业票编号">
                        <Input 
                            type="text" 
                            name="related_permit_code"
                            value={data.related_permit_code || ''}
                            onChange={handleChange}
                            placeholder="请输入"
                            readOnly={readOnly}
                        />
                    </FormField>
                    
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="动火级别">
                            <div className="flex gap-6 pt-2">
                                {['特级', '一级', '二级'].map(level => (
                                    <label key={level} className="flex items-center gap-2 cursor-pointer">
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${data.work_level === level ? 'border-blue-500' : 'border-gray-300'}`}>
                                            {data.work_level === level && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                                        </div>
                                        <input 
                                            type="radio" 
                                            name="work_level" 
                                            value={level}
                                            checked={data.work_level === level}
                                            onChange={handleChange}
                                            disabled={readOnly}
                                            className="hidden"
                                        /> 
                                        <span className="text-sm text-gray-700">{level}</span>
                                    </label>
                                ))}
                            </div>
                        </FormField>

                        <FormField label="装置已清洗、置换，并采取安全隔离措施">
                             <label className="flex items-center gap-2 cursor-pointer pt-2">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    disabled={readOnly}
                                />
                                <span className="text-sm text-gray-700">确认</span>
                            </label>
                        </FormField>
                    </div>

                    <FormField label="计划作业开始时间">
                        <Input 
                            type="datetime-local" 
                            name="start_time"
                            value={data.start_time || ''}
                            onChange={handleChange}
                            placeholder="选择时间"
                            readOnly={readOnly}
                        />
                    </FormField>

                    <FormField label="计划作业结束时间">
                        <Input 
                            type="datetime-local" 
                            name="end_time"
                            value={data.end_time || ''}
                            onChange={handleChange}
                            placeholder="选择时间"
                            readOnly={readOnly}
                        />
                    </FormField>
                </div>
            </div>

            {/* Safety Measures Section */}
            <div>
                <h2 className="text-base font-bold text-blue-600 mb-4">安全措施预判定</h2>
                
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gray-50 px-6 py-3 grid grid-cols-12 gap-4 border-b border-gray-200">
                        <div className="col-span-1 flex justify-center">
                             <input type="checkbox" disabled className="rounded border-gray-300" />
                        </div>
                        <div className="col-span-1 text-sm font-medium text-gray-500">序号</div>
                        <div className="col-span-8 text-sm font-medium text-gray-500">措施内容</div>
                        <div className="col-span-2 text-center text-sm font-medium text-gray-500">是否涉及</div>
                    </div>

                    {/* List */}
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
                                    {measure.id === 16 && (
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
                                        <input 
                                            type="radio" 
                                            name={`applicable-${idx}`}
                                            value="yes"
                                            checked={measure.applicable === 'yes'}
                                            onChange={() => handleMeasureChange(idx, 'applicable', 'yes')}
                                            disabled={readOnly}
                                            className="hidden"
                                        />
                                        <span className="text-xs text-gray-600">是</span>
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${measure.applicable === 'no' ? 'border-blue-500' : 'border-gray-300'}`}>
                                            {measure.applicable === 'no' && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                                        </div>
                                        <input 
                                            type="radio" 
                                            name={`applicable-${idx}`}
                                            value="no"
                                            checked={measure.applicable === 'no'}
                                            onChange={() => handleMeasureChange(idx, 'applicable', 'no')}
                                            disabled={readOnly}
                                            className="hidden"
                                        />
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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

                    {/* Safety Dept Opinion */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <FormField label="安全管理部门意见">
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

                    {/* Approver Opinion */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <FormField label="动火审批人意见">
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

                    {/* Shift Leader Check */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <FormField label="动火前，岗位当班班长验票情况">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-6">
                                    <Input 
                                        type="text" 
                                        name="shift_leader_check"
                                        value={data.shift_leader_check || '安全措施到位，已经验票'}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="text" 
                                        placeholder="签字"
                                        name="shift_leader_sign"
                                        value={data.shift_leader_sign || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input 
                                        type="datetime-local" 
                                        name="shift_leader_sign_time"
                                        value={data.shift_leader_sign_time || ''}
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
                                        value={data.completion_acceptance || '动火作业已完成，作业现场已清理'}
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
