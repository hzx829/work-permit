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

export default function TemporaryElectricityPermitForm({ data, onChange, readOnly = false }) {
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
                { id: 1, content: '作业人员持有电工作业操作证', applicable: '', confirmer: '' },
                { id: 2, content: '在防爆场所使用的临时电源、元器件和线路达到相应的防爆等级要求', applicable: '', confirmer: '' },
                { id: 3, content: '上级开关已断电、加锁，并挂安全警示标牌', applicable: '', confirmer: '' },
                { id: 4, content: '临时用电的单相和混用线路要求按照 TN-S 三相五线制方式接线', applicable: '', confirmer: '' },
                { id: 5, content: '临时用电线路如架空敷设，在作业现场敷设高度应不低于 2.5 m，跨越道路高度应不低于 5 m', applicable: '', confirmer: '' },
                { id: 6, content: '临时用电线路如沿墙面或地面敷设，已沿建筑物墙根部敷设，穿越道路或其他易受机械损伤的区域，已采取防机械损伤的措施；在电缆敷设路径附近，已采取防止火花损伤电缆的措施', applicable: '', confirmer: '' },
                { id: 7, content: '临时用电线路架空进线不应采用裸线', applicable: '', confirmer: '' },
                { id: 8, content: '暗管埋设及地下电缆线路敷设时，已备好“走向标志”和“安全标志”等标志桩，电缆埋深要求大于 0.7 m', applicable: '', confirmer: '' },
                { id: 9, content: '现场临时用配电盘、箱配备有防雨措施，并可靠接地', applicable: '', confirmer: '' },
                { id: 10, content: '临时用电设施已装配漏电保护器，移动工具、手持工具已采取防漏电的安全措施（一机一闸一保护）', applicable: '', confirmer: '' },
                { id: 11, content: '用电设备、线路容量、负荷符合要求', applicable: '', confirmer: '' },
                { id: 12, content: '其他相关特殊作业已办理相应安全作业票', applicable: '', confirmer: '' },
                { id: 13, content: '作业场所已进行气体检测且符合作业安全要求', applicable: '', confirmer: '' },
                { id: 14, content: '其他安全措施：', applicable: '', confirmer: '' },
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
                    <h1 className="text-xl font-bold text-gray-800">临时用电安全作业票</h1>
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
                        <Input readOnly={readOnly} 
                            type="text" 
                            name="applicant_unit"
                            value={data.applicant_unit || ''}
                            onChange={handleChange}
                            placeholder="请输入申请单位"
                        />
                    </FormField>
                    <FormField label="作业申请时间">
                        <Input readOnly={readOnly} 
                            type="datetime-local" 
                            name="apply_time"
                            value={data.apply_time || ''}
                            onChange={handleChange}
                        />
                    </FormField>
                    <FormField label="作业地点">
                        <Input readOnly={readOnly} 
                            type="text" 
                            name="work_location"
                            value={data.work_location || ''}
                            onChange={handleChange}
                            placeholder="请输入作业地点"
                        />
                    </FormField>
                    <FormField label="作业内容">
                        <Input readOnly={readOnly} 
                            type="text" 
                            name="content"
                            value={data.content || ''}
                            onChange={handleChange}
                            placeholder="请输入作业内容"
                        />
                    </FormField>
                    <FormField label="电源接入点及许可用电功率">
                        <Input readOnly={readOnly} 
                            type="text" 
                            name="power_source"
                            value={data.power_source || ''}
                            onChange={handleChange}
                            placeholder="如：xx配电箱, 500kW"
                        />
                    </FormField>
                    <FormField label="工作电压">
                        <Input readOnly={readOnly} 
                            type="text" 
                            name="work_voltage"
                            value={data.work_voltage || ''}
                            onChange={handleChange}
                            placeholder="如：380V"
                        />
                    </FormField>
                    <FormField label="用电设备名称及额定功率">
                        <Input readOnly={readOnly} 
                            type="text" 
                            name="equipment_power"
                            value={data.equipment_power || ''}
                            onChange={handleChange}
                            placeholder="如：电焊机, 30kW"
                        />
                    </FormField>
                    <FormField label="监护人">
                        <Input readOnly={readOnly} 
                            type="text" 
                            name="guardian"
                            value={data.guardian || ''}
                            onChange={handleChange}
                            placeholder="请输入监护人"
                        />
                    </FormField>
                    <FormField label="用电人">
                        <Input readOnly={readOnly} 
                            type="text" 
                            name="electricity_user"
                            value={data.electricity_user || ''}
                            onChange={handleChange}
                            placeholder="请输入用电人"
                        />
                    </FormField>
                    <FormField label="作业人">
                        <Input readOnly={readOnly} 
                            type="text" 
                            name="workers"
                            value={data.workers || ''}
                            onChange={handleChange}
                            placeholder="请输入作业人"
                        />
                    </FormField>
                    <FormField label="作业人电工证号">
                        <Input readOnly={readOnly} 
                            type="text" 
                            name="worker_cert"
                            value={data.worker_cert || ''}
                            onChange={handleChange}
                            placeholder="请输入证号"
                        />
                    </FormField>
                    <FormField label="作业负责人">
                        <Input readOnly={readOnly} 
                            type="text" 
                            name="supervisor"
                            value={data.supervisor || ''}
                            onChange={handleChange}
                            placeholder="请输入负责人"
                        />
                    </FormField>
                    <FormField label="负责人电工证号">
                        <Input readOnly={readOnly} 
                            type="text" 
                            name="supervisor_cert"
                            value={data.supervisor_cert || ''}
                            onChange={handleChange}
                            placeholder="请输入证号"
                        />
                    </FormField>
                    <FormField label="关联的其他特殊作业及安全作业票编号" className="md:col-span-2">
                        <Input readOnly={readOnly} 
                            type="text" 
                            name="related_permits"
                            value={data.related_permits || ''}
                            onChange={handleChange}
                            placeholder="请输入关联作业票编号"
                        />
                    </FormField>
                    <FormField label="风险辨识结果" className="md:col-span-2">
                        <Input readOnly={readOnly} 
                            type="text" 
                            name="risk_identification"
                            value={data.risk_identification || ''}
                            onChange={handleChange}
                            placeholder="触电、火灾爆炸..."
                        />
                    </FormField>
                </div>
            </div>

            {/* Gas Analysis */}
            <div className="mb-8">
                <h2 className="text-base font-bold text-blue-600 mb-6">可燃气体分析（运行的生产装置、罐区和具有火灾爆炸危险场所）</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <FormField label="分析时间">
                        <Input readOnly={readOnly} 
                            type="text" 
                            name="gas_analysis_time" 
                            value={data.gas_analysis_time || ''} 
                            onChange={handleChange} 
                            placeholder="9时20分"
                        />
                    </FormField>
                    <FormField label="检测结果">
                        <Input readOnly={readOnly} 
                            type="text" 
                            name="gas_analysis_result" 
                            value={data.gas_analysis_result || ''} 
                            onChange={handleChange} 
                            placeholder="xxx"
                        />
                    </FormField>
                    <FormField label="分析点">
                        <Input readOnly={readOnly} 
                            type="text" 
                            name="gas_analysis_point" 
                            value={data.gas_analysis_point || ''} 
                            onChange={handleChange} 
                            placeholder="配电箱周围"
                        />
                    </FormField>
                    <FormField label="分析人">
                        <Input readOnly={readOnly} 
                            type="text" 
                            name="gas_analyst" 
                            value={data.gas_analyst || ''} 
                            onChange={handleChange} 
                            placeholder="签字"
                        />
                    </FormField>
                </div>
            </div>

            {/* Time Range */}
            <div className="mb-8">
                <h2 className="text-base font-bold text-blue-600 mb-6">作业实施时间</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <FormField label="开始时间">
                        <Input readOnly={readOnly} 
                            type="datetime-local" 
                            name="start_time"
                            value={data.start_time || ''}
                            onChange={handleChange}
                        />
                    </FormField>
                    <FormField label="结束时间">
                        <Input readOnly={readOnly} 
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
                <h2 className="text-base font-bold text-blue-600 mb-4">安全措施</h2>
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
                                    {measure.id === 14 && (
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
                     <FormField label="安全交底人（作业人、监护人）">
                        <Input readOnly={readOnly} 
                            type="text" 
                            name="safety_discloser"
                            value={data.safety_discloser || ''}
                            onChange={handleChange}
                            placeholder="签字"
                        />
                    </FormField>
                    <FormField label="接受交底人（用电人）">
                        <Input readOnly={readOnly} 
                            type="text" 
                            name="safety_disclosee"
                            value={data.safety_disclosee || ''}
                            onChange={handleChange}
                            placeholder="签字"
                        />
                    </FormField>
                </div>

                <div className="space-y-6">
                    {/* Supervisor Opinion */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <FormField label="作业负责人意见">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-6">
                                    <Input readOnly={readOnly} 
                                        type="text" 
                                        name="supervisor_opinion"
                                        value={data.supervisor_opinion || '同意作业'}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input readOnly={readOnly} 
                                        type="text" 
                                        placeholder="签字 (作业负责人)"
                                        name="supervisor_sign"
                                        value={data.supervisor_sign || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input readOnly={readOnly} 
                                        type="datetime-local" 
                                        name="supervisor_sign_date"
                                        value={data.supervisor_sign_date || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </FormField>
                    </div>

                    {/* Unit Opinion */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <FormField label="用电单位意见">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-6">
                                    <Input readOnly={readOnly} 
                                        type="text" 
                                        name="unit_opinion"
                                        value={data.unit_opinion || '同意作业'}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input readOnly={readOnly} 
                                        type="text" 
                                        placeholder="签字 (用电单位有关人员)"
                                        name="unit_sign"
                                        value={data.unit_sign || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input readOnly={readOnly} 
                                        type="datetime-local" 
                                        name="unit_sign_date"
                                        value={data.unit_sign_date || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </FormField>
                    </div>

                    {/* Power Dept Opinion */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <FormField label="配送电单位意见">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-6">
                                    <Input readOnly={readOnly} 
                                        type="text" 
                                        name="power_dept_opinion"
                                        value={data.power_dept_opinion || '同意接线送电'}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input readOnly={readOnly} 
                                        type="text" 
                                        placeholder="签字 (配送电单位人员)"
                                        name="power_dept_sign"
                                        value={data.power_dept_sign || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input readOnly={readOnly} 
                                        type="datetime-local" 
                                        name="power_dept_sign_date"
                                        value={data.power_dept_sign_date || ''}
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
                                    <Input readOnly={readOnly} 
                                        type="text" 
                                        name="completion_acceptance"
                                        value={data.completion_acceptance || '临时用电作业完成，线路已拆除。'}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input readOnly={readOnly} 
                                        type="text" 
                                        placeholder="签字 (作业人、用电人)"
                                        name="completion_sign"
                                        value={data.completion_sign || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Input readOnly={readOnly} 
                                        type="datetime-local" 
                                        name="completion_sign_date"
                                        value={data.completion_sign_date || ''}
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
