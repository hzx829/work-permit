import React from 'react';

export default function ConfinedSpacePermitForm({ data, onChange, readOnly = false }) {
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
                { id: 1, content: '盛装过有毒、可燃物料的受限空间，所有与受限空间有联系的阀门、管线已加盲板 隔离，并落实盲板责任人，未采用水封或关闭阀门代替盲板', applicable: '', confirmer: '' },
                { id: 2, content: '盛装过有毒、可燃物料的受限空间，设备已经过置换、吹扫或蒸煮', applicable: '', confirmer: '' },
                { id: 3, content: '设备通风孔已打开进行自然通风，温度适宜人员作业；必要时采用强制通风或佩戴隔绝式呼吸防护装备，不应采用直接通入氧气或富氧空气的方法补充氧', applicable: '', confirmer: '' },
                { id: 4, content: '转动设备已切断电源，电源开关处已加锁并悬挂“禁止合闸”标志牌', applicable: '', confirmer: '' },
                { id: 5, content: '受限空间内部已具备进入作业条件，易燃易爆物料容器内作业，作业人员未采用非防爆工具，手持电动工具符合作业安全要求', applicable: '', confirmer: '' },
                { id: 6, content: '受限空间进出口通道畅通，无阻碍人员进出的障碍物', applicable: '', confirmer: '' },
                { id: 7, content: '盛装过可燃有毒液体、气体的受限空间，已分析其中的可燃、有毒有害气体和氧气 含量，且在安全范围内', applicable: '', confirmer: '' },
                { id: 8, content: '存在大量扬尘的设备已停止扬尘', applicable: '', confirmer: '' },
                { id: 9, content: '用于连续检测的移动式可燃、有毒气体、氧气检测仪已配备到位', applicable: '', confirmer: '' },
                { id: 10, content: '作业人员已佩戴必要的个体防护装备，清除受限空间内存在的危险因素', applicable: '', confirmer: '' },
                { id: 11, content: '已配备作业应急设施：消防器材（ ）、救生绳（ ）、气防装备（ ），盛有腐蚀性介 质的容器作业现场已配备应急冲洗水', applicable: '', confirmer: '' },
                { id: 12, content: '受限空间内作业已配备通信设备', applicable: '', confirmer: '' },
                { id: 13, content: '受限空间出入口四周已设立警戒区', applicable: '', confirmer: '' },
                { id: 14, content: '其他相关特殊作业已办理相应安全作业票', applicable: '', confirmer: '' },
                { id: 15, content: '其他安全措施：', applicable: '', confirmer: '' },
            ];
            onChange('safety_measures_list', initialMeasures);
        }
    }, []); // Run once on mount

    const inputProps = {
        readOnly,
        disabled: readOnly,
        className: "w-full outline-none bg-transparent text-black placeholder-red-600 disabled:cursor-not-allowed"
    };

    return (
        <div className="w-full max-w-7xl mx-auto bg-white p-6 overflow-x-auto">
            <div className="text-center mb-6 relative">
                <h1 className="text-3xl font-bold text-black">受限空间安全作业票</h1>
                <div className="absolute right-0 top-0 text-base text-black">
                    编号：{data.permit_code}
                </div>
            </div>

            <table className="w-full border-collapse border border-black text-base">
                <tbody>
                    {/* Row 1 */}
                    <tr>
                        <td className="border border-black p-2 w-32 font-medium">作业申请单位</td>
                        <td colSpan="3" className="border border-black p-2">
                            <input 
                                type="text" 
                                name="applicant_unit"
                                value={data.applicant_unit || ''}
                                onChange={handleChange}
                                {...inputProps}
                                placeholder={readOnly ? "" : "请输入单位"}
                            />
                        </td>
                        <td className="border border-black p-2 w-32 font-medium">作业申请时间</td>
                        <td colSpan="3" className="border border-black p-2">
                            <input 
                                type="datetime-local" 
                                name="apply_time"
                                value={data.apply_time || ''}
                                onChange={handleChange}
                                {...inputProps}
                            />
                        </td>
                    </tr>

                    {/* Row 2 */}
                    <tr>
                        <td className="border border-black p-2 font-medium">受限空间名称</td>
                        <td colSpan="3" className="border border-black p-2">
                            <input 
                                type="text" 
                                name="work_location"
                                value={data.work_location || ''}
                                onChange={handleChange}
                                {...inputProps}
                                placeholder={readOnly ? "" : "请输入受限空间名称"}
                            />
                        </td>
                        <td className="border border-black p-2 font-medium">
                            受限空间内<br/>原有介质名称
                        </td>
                        <td colSpan="3" className="border border-black p-2">
                            <input 
                                type="text" 
                                name="original_media"
                                value={data.original_media || ''}
                                onChange={handleChange}
                                {...inputProps}
                                placeholder={readOnly ? "" : "请输入原有介质"}
                            />
                        </td>
                    </tr>

                    {/* Row 3 */}
                    <tr>
                        <td className="border border-black p-2 font-medium">作业内容</td>
                        <td colSpan="7" className="border border-black p-2">
                            <input 
                                type="text" 
                                name="content"
                                value={data.content || ''}
                                onChange={handleChange}
                                {...inputProps}
                                placeholder={readOnly ? "" : "请输入作业内容"}
                            />
                        </td>
                    </tr>

                    {/* Row 4 */}
                    <tr>
                        <td className="border border-black p-2 font-medium">作业单位</td>
                        <td colSpan="3" className="border border-black p-2">
                            <input 
                                type="text" 
                                name="work_unit"
                                value={data.work_unit || ''}
                                onChange={handleChange}
                                {...inputProps}
                                placeholder={readOnly ? "" : "请输入作业单位"}
                            />
                        </td>
                        <td className="border border-black p-2 font-medium">作业负责人</td>
                        <td colSpan="3" className="border border-black p-2">
                            <input 
                                type="text" 
                                name="supervisor"
                                value={data.supervisor || ''}
                                onChange={handleChange}
                                {...inputProps}
                                placeholder={readOnly ? "" : "请输入负责人姓名"}
                            />
                        </td>
                    </tr>

                    {/* Row 5 */}
                    <tr>
                        <td className="border border-black p-2 font-medium">作业人</td>
                        <td colSpan="3" className="border border-black p-2">
                            <input 
                                type="text" 
                                name="workers"
                                value={data.workers || ''}
                                onChange={handleChange}
                                {...inputProps}
                                placeholder={readOnly ? "" : "请输入作业人姓名"}
                            />
                        </td>
                        <td className="border border-black p-2 font-medium">监护人</td>
                        <td colSpan="3" className="border border-black p-2">
                            <input 
                                type="text" 
                                name="guardian"
                                value={data.guardian || ''}
                                onChange={handleChange}
                                {...inputProps}
                                placeholder={readOnly ? "" : "请输入监护人姓名"}
                            />
                        </td>
                    </tr>

                    {/* Related Permits */}
                    <tr>
                        <td className="border border-black p-2 font-medium">
                            关联的其他特殊作业<br/>及安全作业票编号
                        </td>
                        <td colSpan="7" className="border border-black p-2">
                            <input 
                                type="text" 
                                name="related_permits"
                                value={data.related_permits || ''}
                                onChange={handleChange}
                                {...inputProps}
                            />
                        </td>
                    </tr>

                    {/* Risk Identification */}
                    <tr>
                        <td className="border border-black p-2 font-medium">风险辨识结果</td>
                        <td colSpan="7" className="border border-black p-2">
                            <input 
                                type="text" 
                                name="risk_identification"
                                value={data.risk_identification || ''}
                                onChange={handleChange}
                                {...inputProps}
                            />
                        </td>
                    </tr>

                    {/* Gas Analysis Section */}
                    <tr>
                        <td rowSpan="4" className="border border-black p-2 font-medium text-center w-24">气体分析</td>
                        <td className="border border-black p-2 font-medium text-center">分析项目</td>
                        <td className="border border-black p-2 font-medium text-center">
                            有毒有害气体名称<br/>
                            <input 
                                type="text" 
                                name="gas_toxic_name"
                                value={data.gas_toxic_name || ''}
                                onChange={handleChange}
                                {...inputProps}
                                className="w-full text-center border-b border-gray-300 outline-none placeholder-red-600"
                                placeholder="如: H2S, 苯"
                            />
                        </td>
                        <td className="border border-black p-2 font-medium text-center">
                            可燃气体名称<br/>
                            <input 
                                type="text" 
                                name="gas_comb_name"
                                value={data.gas_comb_name || ''}
                                onChange={handleChange}
                                {...inputProps}
                                className="w-full text-center border-b border-gray-300 outline-none placeholder-red-600"
                                placeholder="如: 甲烷"
                            />
                        </td>
                        <td className="border border-black p-2 font-medium text-center">
                            氧气含量<br/>(体积分数)
                        </td>
                        <td className="border border-black p-2 font-medium text-center">取样分析时间</td>
                        <td className="border border-black p-2 font-medium text-center">分析部位</td>
                        <td className="border border-black p-2 font-medium text-center">分析人</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-2 font-medium text-center">合格标准</td>
                        <td className="border border-black p-2">
                            <input 
                                type="text" 
                                name="gas_toxic_std"
                                value={data.gas_toxic_std || ''}
                                onChange={handleChange}
                                {...inputProps}
                                className="w-full text-center outline-none placeholder-red-600"
                            />
                        </td>
                        <td className="border border-black p-2">
                            <input 
                                type="text" 
                                name="gas_comb_std"
                                value={data.gas_comb_std || ''}
                                onChange={handleChange}
                                {...inputProps}
                                className="w-full text-center outline-none placeholder-red-600"
                            />
                        </td>
                        <td className="border border-black p-2 text-center">19.5% ~ 21%</td>
                        <td className="border border-black p-2 bg-gray-100"></td>
                        <td className="border border-black p-2 bg-gray-100"></td>
                        <td className="border border-black p-2 bg-gray-100"></td>
                    </tr>
                    <tr>
                        <td className="border border-black p-2 font-medium text-center">分析数据</td>
                        <td className="border border-black p-2">
                            <input 
                                type="text" 
                                name="gas_toxic_result"
                                value={data.gas_toxic_result || ''}
                                onChange={handleChange}
                                {...inputProps}
                                className="w-full text-center outline-none placeholder-red-600"
                            />
                        </td>
                        <td className="border border-black p-2">
                            <input 
                                type="text" 
                                name="gas_comb_result"
                                value={data.gas_comb_result || ''}
                                onChange={handleChange}
                                {...inputProps}
                                className="w-full text-center outline-none placeholder-red-600"
                            />
                        </td>
                        <td className="border border-black p-2">
                            <input 
                                type="text" 
                                name="gas_oxygen_result"
                                value={data.gas_oxygen_result || ''}
                                onChange={handleChange}
                                {...inputProps}
                                className="w-full text-center outline-none placeholder-red-600"
                            />
                        </td>
                        <td className="border border-black p-2">
                            <input 
                                type="text" 
                                name="gas_time"
                                value={data.gas_time || ''}
                                onChange={handleChange}
                                {...inputProps}
                                className="w-full text-center outline-none placeholder-red-600"
                                placeholder="月 日 时 分"
                            />
                        </td>
                        <td className="border border-black p-2">
                            <input 
                                type="text" 
                                name="gas_location"
                                value={data.gas_location || ''}
                                onChange={handleChange}
                                {...inputProps}
                                className="w-full text-center outline-none placeholder-red-600"
                            />
                        </td>
                        <td className="border border-black p-2">
                            <input 
                                type="text" 
                                name="gas_analyst"
                                value={data.gas_analyst || ''}
                                onChange={handleChange}
                                {...inputProps}
                                className="w-full text-center outline-none placeholder-red-600"
                            />
                        </td>
                    </tr>
                    {/* Empty row for visual spacing or additional data if needed, as per image it has one data row */}
                    
                    {/* Implementation Time */}
                    <tr>
                        <td colSpan="2" className="border border-black p-2 font-medium">作业实施时间</td>
                        <td colSpan="6" className="border border-black p-2 text-center">
                            自 
                            <input 
                                type="datetime-local" 
                                name="start_time"
                                value={data.start_time || ''}
                                onChange={handleChange}
                                {...inputProps}
                                className="mx-2 outline-none bg-transparent text-black placeholder-red-600 disabled:cursor-not-allowed"
                            />
                            至
                            <input 
                                type="datetime-local" 
                                name="end_time"
                                value={data.end_time || ''}
                                onChange={handleChange}
                                {...inputProps}
                                className="mx-2 outline-none bg-transparent text-black placeholder-red-600 disabled:cursor-not-allowed"
                            />
                            止
                        </td>
                    </tr>

                    {/* Safety Measures Header */}
                    <tr>
                        <td className="border border-black p-2 font-medium text-center w-12">序号</td>
                        <td colSpan="5" className="border border-black p-2 font-medium text-center">安全措施</td>
                        <td className="border border-black p-2 font-medium text-center w-24">是否涉及</td>
                        <td className="border border-black p-2 font-medium text-center w-24">确认人</td>
                    </tr>

                    {/* Safety Measures List */}
                    {(data.safety_measures_list || []).map((measure, idx) => (
                        <tr key={measure.id}>
                            <td className="border border-black p-2 text-center">{measure.id}</td>
                            <td colSpan="5" className="border border-black p-2">
                                {measure.content}
                                {measure.id === 15 && (
                                    <input 
                                        type="text" 
                                        value={measure.extraContent || ''}
                                        onChange={(e) => handleMeasureChange(idx, 'extraContent', e.target.value)}
                                        readOnly={readOnly}
                                        disabled={readOnly}
                                        className="ml-2 outline-none border-b border-gray-300 w-1/2 text-black placeholder-red-600 disabled:cursor-not-allowed"
                                    />
                                )}
                            </td>
                            <td className="border border-black p-2 text-center">
                                <select
                                    value={measure.applicable || ''}
                                    onChange={(e) => handleMeasureChange(idx, 'applicable', e.target.value)}
                                    disabled={readOnly}
                                    className="outline-none bg-transparent text-center text-black disabled:cursor-not-allowed appearance-none w-full"
                                >
                                    <option value="">请选择</option>
                                    <option value="yes">√</option>
                                    <option value="no">×</option>
                                </select>
                            </td>
                            <td className="border border-black p-2 text-center">
                                <input 
                                    type="text" 
                                    value={measure.confirmer || ''}
                                    onChange={(e) => handleMeasureChange(idx, 'confirmer', e.target.value)}
                                    readOnly={readOnly}
                                    disabled={readOnly}
                                    className="w-full outline-none bg-transparent text-center text-black placeholder-red-600 disabled:cursor-not-allowed"
                                />
                            </td>
                        </tr>
                    ))}

                    {/* Signatures */}
                    <tr>
                        <td className="border border-black p-2 font-medium">安全交底人</td>
                        <td colSpan="3" className="border border-black p-2">
                            <input 
                                type="text" 
                                name="safe_discloser"
                                value={data.safe_discloser || ''}
                                onChange={handleChange}
                                {...inputProps}
                            />
                        </td>
                        <td colSpan="2" className="border border-black p-2 font-medium text-center">接受交底人</td>
                        <td colSpan="2" className="border border-black p-2">
                            <input 
                                type="text" 
                                name="accept_discloser"
                                value={data.accept_discloser || ''}
                                onChange={handleChange}
                                {...inputProps}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td className="border border-black p-2 font-medium">作业负责人意见</td>
                        <td colSpan="7" className="border border-black p-2">
                            <div className="flex items-center justify-between">
                                <input 
                                    type="text" 
                                    name="supervisor_opinion"
                                    value={data.supervisor_opinion || ''}
                                    onChange={handleChange}
                                    {...inputProps}
                                    className="flex-1 outline-none bg-transparent text-black placeholder-red-600 disabled:cursor-not-allowed"
                                    placeholder="同意作业"
                                />
                                <div className="flex items-center gap-2 min-w-[300px]">
                                    <span>签字：</span>
                                    <input 
                                        type="text" 
                                        name="supervisor_sign"
                                        value={data.supervisor_sign || ''}
                                        onChange={handleChange}
                                        {...inputProps}
                                        className="w-24 border-b border-black outline-none bg-transparent"
                                        placeholder="(作业负责人)"
                                    />
                                    <input 
                                        type="datetime-local" 
                                        name="supervisor_sign_time"
                                        value={data.supervisor_sign_time || ''}
                                        onChange={handleChange}
                                        {...inputProps}
                                        className="w-48 outline-none bg-transparent"
                                    />
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td className="border border-black p-2 font-medium">所在单位意见</td>
                        <td colSpan="7" className="border border-black p-2">
                            <div className="flex items-center justify-between">
                                <input 
                                    type="text" 
                                    name="unit_opinion"
                                    value={data.unit_opinion || ''}
                                    onChange={handleChange}
                                    {...inputProps}
                                    className="flex-1 outline-none bg-transparent text-black placeholder-red-600 disabled:cursor-not-allowed"
                                    placeholder="同意作业"
                                />
                                <div className="flex items-center gap-2 min-w-[300px]">
                                    <span>签字：</span>
                                    <input 
                                        type="text" 
                                        name="unit_sign"
                                        value={data.unit_sign || ''}
                                        onChange={handleChange}
                                        {...inputProps}
                                        className="w-24 border-b border-black outline-none bg-transparent"
                                        placeholder="(车间有关人员)"
                                    />
                                    <input 
                                        type="datetime-local" 
                                        name="unit_sign_time"
                                        value={data.unit_sign_time || ''}
                                        onChange={handleChange}
                                        {...inputProps}
                                        className="w-48 outline-none bg-transparent"
                                    />
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td className="border border-black p-2 font-medium">完工验收</td>
                        <td colSpan="7" className="border border-black p-2">
                            <div className="flex items-center justify-between">
                                <input 
                                    type="text" 
                                    name="completion_acceptance"
                                    value={data.completion_acceptance || ''}
                                    onChange={handleChange}
                                    {...inputProps}
                                    className="flex-1 outline-none bg-transparent text-black placeholder-red-600 disabled:cursor-not-allowed"
                                    placeholder="受限空间作业已完成"
                                />
                                <div className="flex items-center gap-2 min-w-[300px]">
                                    <span>签字：</span>
                                    <input 
                                        type="text" 
                                        name="acceptance_sign"
                                        value={data.acceptance_sign || ''}
                                        onChange={handleChange}
                                        {...inputProps}
                                        className="w-32 border-b border-black outline-none bg-transparent"
                                        placeholder="(车间人员、作业人员)"
                                    />
                                    <input 
                                        type="datetime-local" 
                                        name="acceptance_sign_time"
                                        value={data.acceptance_sign_time || ''}
                                        onChange={handleChange}
                                        {...inputProps}
                                        className="w-48 outline-none bg-transparent"
                                    />
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
