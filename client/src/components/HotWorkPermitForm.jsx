import React from 'react';

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

    const inputProps = {
        readOnly,
        disabled: readOnly,
        className: "w-full outline-none bg-transparent text-black placeholder-red-600 disabled:cursor-not-allowed"
    };

    return (
        <div className="w-full max-w-7xl mx-auto bg-white p-6 overflow-x-auto">
            <div className="text-center mb-6 relative">
                <h1 className="text-3xl font-bold text-black">动火安全作业票申请表</h1>
                <div className="absolute right-0 top-0 text-base text-black">
                    编号：{data.permit_code}
                </div>
            </div>

            <table className="w-full border-collapse border border-black text-base">
                <tbody>
                    {/* Row 1 */}
                    <tr>
                        <td className="border border-black p-2 w-32 font-medium">作业申请单位</td>
                        <td className="border border-black p-2">
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
                        <td className="border border-black p-2">
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
                        <td className="border border-black p-2 font-medium">作业内容</td>
                        <td className="border border-black p-2">
                            <input 
                                type="text" 
                                name="content"
                                value={data.content || ''}
                                onChange={handleChange}
                                {...inputProps}
                                placeholder={readOnly ? "" : "请输入作业内容"}
                            />
                        </td>
                        <td className="border border-black p-2 font-medium">
                            动火地点<br/>及动火部位
                        </td>
                        <td className="border border-black p-2">
                            <input 
                                type="text" 
                                name="work_location"
                                value={data.work_location || ''}
                                onChange={handleChange}
                                {...inputProps}
                                placeholder={readOnly ? "" : "请输入地点及部位"}
                            />
                        </td>
                    </tr>

                    {/* Row 3 */}
                    <tr>
                        <td className="border border-black p-2 font-medium">动火级别</td>
                        <td className="border border-black p-2">
                            <div className="flex gap-4">
                                {['特级', '一级', '二级'].map(level => (
                                    <label key={level} className="flex items-center gap-1">
                                        <input 
                                            type="radio" 
                                            name="work_level" 
                                            value={level}
                                            checked={data.work_level === level}
                                            onChange={handleChange}
                                            disabled={readOnly}
                                        /> {level}
                                    </label>
                                ))}
                            </div>
                        </td>
                        <td className="border border-black p-2 font-medium">动火方式</td>
                        <td className="border border-black p-2">
                            <input 
                                type="text" 
                                name="work_method"
                                value={data.work_method || ''}
                                onChange={handleChange}
                                {...inputProps}
                                placeholder={readOnly ? "" : "如：电焊、气割"}
                            />
                        </td>
                    </tr>

                    {/* Row 4 */}
                    <tr>
                        <td className="border border-black p-2 font-medium">动火人及证书编号</td>
                        <td colSpan="3" className="border border-black p-2">
                            <input 
                                type="text" 
                                name="worker_cert"
                                value={data.worker_cert || ''}
                                onChange={handleChange}
                                {...inputProps}
                                placeholder={readOnly ? "" : "请输入姓名及证书编号"}
                            />
                        </td>
                    </tr>

                    {/* Row 5 */}
                    <tr>
                        <td className="border border-black p-2 font-medium">作业单位</td>
                        <td className="border border-black p-2">
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
                        <td className="border border-black p-2">
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

                    {/* Gas Analysis Header */}
                    <tr>
                        <td className="border border-black p-2 font-medium text-center">气体取样分析时间</td>
                        <td className="border border-black p-2 font-medium text-center">代表性气体</td>
                        <td className="border border-black p-2 font-medium text-center">分析结果/%</td>
                        <td className="border border-black p-2 font-medium text-center">分析人</td>
                    </tr>

                    {/* Gas Analysis Rows (3 rows) */}
                    {[0, 1, 2].map((idx) => (
                        <tr key={`gas-${idx}`}>
                            <td className="border border-black p-2">
                                <input 
                                    type="text" 
                                    value={data.gas_analysis?.[idx]?.time || ''}
                                    onChange={(e) => handleGasAnalysisChange(idx, 'time', e.target.value)}
                                    {...inputProps}
                                    className="w-full outline-none bg-transparent text-center text-black placeholder-red-600 disabled:cursor-not-allowed"
                                    placeholder={readOnly ? "" : "月 日 时 分"}
                                />
                            </td>
                            <td className="border border-black p-2">
                                <input 
                                    type="text" 
                                    value={data.gas_analysis?.[idx]?.gas || ''}
                                    onChange={(e) => handleGasAnalysisChange(idx, 'gas', e.target.value)}
                                    {...inputProps}
                                    className="w-full outline-none bg-transparent text-center text-black placeholder-red-600 disabled:cursor-not-allowed"
                                />
                            </td>
                            <td className="border border-black p-2">
                                <input 
                                    type="text" 
                                    value={data.gas_analysis?.[idx]?.result || ''}
                                    onChange={(e) => handleGasAnalysisChange(idx, 'result', e.target.value)}
                                    {...inputProps}
                                    className="w-full outline-none bg-transparent text-center text-black placeholder-red-600 disabled:cursor-not-allowed"
                                />
                            </td>
                            <td className="border border-black p-2">
                                <input 
                                    type="text" 
                                    value={data.gas_analysis?.[idx]?.analyst || ''}
                                    onChange={(e) => handleGasAnalysisChange(idx, 'analyst', e.target.value)}
                                    {...inputProps}
                                    className="w-full outline-none bg-transparent text-center text-black placeholder-red-600 disabled:cursor-not-allowed"
                                />
                            </td>
                        </tr>
                    ))}

                    {/* Related Permits */}
                    <tr>
                        <td className="border border-black p-2 font-medium">
                            关联的其他特殊作业<br/>及安全作业票编号
                        </td>
                        <td colSpan="3" className="border border-black p-2">
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
                        <td colSpan="3" className="border border-black p-2">
                            <input 
                                type="text" 
                                name="risk_identification"
                                value={data.risk_identification || ''}
                                onChange={handleChange}
                                {...inputProps}
                            />
                        </td>
                    </tr>

                    {/* Implementation Time */}
                    <tr>
                        <td className="border border-black p-2 font-medium">动火作业实施时间</td>
                        <td colSpan="3" className="border border-black p-2 text-center">
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
                        <td colSpan="2" className="border border-black p-2 font-medium text-center">安全措施</td>
                        <td className="border border-black p-2 font-medium text-center w-24">是否涉及</td>
                        <td className="border border-black p-2 font-medium text-center w-24">确认人</td>
                    </tr>

                    {/* Safety Measures List */}
                    {(data.safety_measures_list || []).map((measure, idx) => (
                        <tr key={measure.id}>
                            <td className="border border-black p-2 text-center">{measure.id}</td>
                            <td colSpan="2" className="border border-black p-2">
                                {measure.content}
                                {measure.id === 16 && (
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

                    {/* Signatures Section */}
                    <tr>
                        <td className="border border-black p-2 font-medium">安全交底人</td>
                        <td className="border border-black p-2">
                            <input type="text" name="safety_discloser" onChange={handleChange} value={data.safety_discloser || ''} {...inputProps}/>
                        </td>
                        <td className="border border-black p-2 font-medium">接受交底人</td>
                        <td className="border border-black p-2">
                            <input type="text" name="disclosure_receiver" onChange={handleChange} value={data.disclosure_receiver || ''} {...inputProps}/>
                        </td>
                    </tr>
                    <tr>
                        <td className="border border-black p-2 font-medium">监护人</td>
                        <td colSpan="3" className="border border-black p-2">
                            <input type="text" name="guardian" onChange={handleChange} value={data.guardian || ''} {...inputProps}/>
                        </td>
                    </tr>

                    {/* Opinions */}
                    <tr>
                        <td colSpan="4" className="border border-black p-0">
                            {[
                                { title: '作业负责人意见', ph: '同意作业' },
                                { title: '所在单位意见', ph: '同意作业' },
                                { title: '安全管理部门意见', ph: '同意作业' },
                                { title: '动火审批人意见', ph: '同意作业' },
                                { title: '动火前，岗位当班班长验票情况', ph: '安全措施到位，已经验票' },
                                { title: '完工验收', ph: '动火作业已完成，作业现场已清理' },
                            ].map((item, idx) => (
                                <div key={idx} className={`p-2 ${idx < 5 ? 'border-b border-black' : ''} flex justify-between items-center`}>
                                    <span className="font-medium">{item.title}</span>
                                    <div className="flex gap-4 w-2/3 justify-end">
                                        <input type="text" placeholder={readOnly ? '' : item.ph} className="flex-1 text-right text-black placeholder-red-600 outline-none disabled:cursor-not-allowed" readOnly={readOnly} disabled={readOnly}/>
                                        <span className="whitespace-nowrap">签字：<input type="text" className="w-24 text-black placeholder-red-600 outline-none disabled:cursor-not-allowed" readOnly={readOnly} disabled={readOnly}/></span>
                                        <span><input type="datetime-local" className="text-black placeholder-red-600 outline-none disabled:cursor-not-allowed" readOnly={readOnly} disabled={readOnly}/></span>
                                    </div>
                                </div>
                            ))}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
