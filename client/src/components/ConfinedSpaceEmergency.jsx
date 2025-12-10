import React from 'react';

export default function ConfinedSpaceEmergency() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[800px]">
            <div className="flex justify-between items-center mb-10 border-b border-gray-100 pb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">有限空间应急处置</h3>
                    <p className="text-sm text-gray-500 mt-1">专项应急预案与处置流程</p>
                </div>
                <button className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                    <i className="fas fa-download mr-2"></i>
                    下载预案文档
                </button>
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="bg-slate-50 p-10 rounded-2xl border border-slate-200 relative">
                    <h4 className="text-center font-bold text-xl text-slate-800 mb-12">有限空间作业事故应急处置流程图</h4>
                    
                    {/* SVG Connector Layer */}
                    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                            </marker>
                            <marker id="arrowhead-blue" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                            </marker>
                        </defs>
                        
                        {/* Main Vertical Line */}
                        {/* Note: Coordinates are estimated based on element positions. 
                            In a real dynamic system we would calculate these. 
                            Here we hardcode for the layout. 
                            Assumed Center X: 50%
                        */}
                        
                        {/* Start -> Info Report */}
                        <line x1="50%" y1="130" x2="50%" y2="160" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
                        
                        {/* Info Report -> Alert */}
                        <line x1="50%" y1="210" x2="50%" y2="240" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
                        
                        {/* Alert -> Protection */}
                        <line x1="50%" y1="290" x2="50%" y2="320" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
                        
                        {/* Protection -> Action (Decision) */}
                        <line x1="50%" y1="370" x2="50%" y2="400" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />

                        {/* Action -> Left Branch (Non-entry) */}
                        {/* Path: Center -> Left -> Down */}
                        <path d="M 400 450 L 250 450 L 250 480" fill="none" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowhead-blue)" className="hidden md:block" />
                        
                        {/* Action -> Right Branch (Entry) */}
                        {/* Path: Center -> Right -> Down */}
                        <path d="M 496 450 L 646 450 L 646 480" fill="none" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowhead-blue)" className="hidden md:block" />

                        {/* Mobile view paths would need media query logic in JS or CSS, but for now optimizing for desktop container */}

                        {/* Left Branch -> Merge */}
                        <path d="M 250 540 L 250 570 L 400 570" fill="none" stroke="#94a3b8" strokeWidth="2" className="hidden md:block" />

                        {/* Right Branch -> Merge */}
                        <path d="M 646 540 L 646 570 L 496 570" fill="none" stroke="#94a3b8" strokeWidth="2" className="hidden md:block" />
                        
                        {/* Merge -> Medical */}
                        <line x1="50%" y1="570" x2="50%" y2="600" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />

                        {/* Medical -> End */}
                        <line x1="50%" y1="650" x2="50%" y2="680" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />

                    </svg>

                    <div className="flex flex-col items-center relative z-10 gap-8">
                        {/* Start Node */}
                        <div className="relative group">
                            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-10 py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center font-bold text-lg border-2 border-red-400">
                                <i className="fas fa-exclamation-triangle mr-3 text-yellow-300 animate-pulse"></i>
                                有限空间作业事故
                            </div>
                            <div className="absolute -right-32 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded shadow text-xs text-gray-500 w-28 hidden group-hover:block border border-gray-100">
                                触发应急响应机制
                            </div>
                        </div>

                        {/* Step 1 */}
                        <div className="w-72 bg-white border-l-4 border-orange-500 shadow-sm rounded-r-lg p-4 text-center font-semibold text-gray-700 hover:shadow-md transition-shadow">
                            <div className="text-xs text-orange-500 mb-1 font-bold uppercase tracking-wider">Step 01</div>
                            信息报告
                        </div>

                        {/* Step 2 */}
                        <div className="w-72 bg-white border-l-4 border-orange-500 shadow-sm rounded-r-lg p-4 text-center font-semibold text-gray-700 hover:shadow-md transition-shadow">
                            <div className="text-xs text-orange-500 mb-1 font-bold uppercase tracking-wider">Step 02</div>
                            事故警戒
                        </div>

                        {/* Step 3 */}
                        <div className="w-72 bg-white border-l-4 border-orange-500 shadow-sm rounded-r-lg p-4 text-center font-semibold text-gray-700 hover:shadow-md transition-shadow">
                            <div className="text-xs text-orange-500 mb-1 font-bold uppercase tracking-wider">Step 03</div>
                            救援防护
                        </div>

                        {/* Decision Diamond Area */}
                        <div className="w-full flex justify-center items-center py-4 relative h-40">
                            {/* Diamond Shape */}
                            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32">
                                <div className="w-full h-full bg-orange-500 rotate-45 rounded-lg shadow-lg flex items-center justify-center border-4 border-white ring-4 ring-orange-100">
                                    <div className="-rotate-45 text-white font-bold text-center">
                                        救援<br/>行动
                                    </div>
                                </div>
                            </div>
                            
                            {/* Branch Nodes positioned absolutely relative to container for precise alignment with SVG */}
                            <div className="absolute left-[calc(50%-200px)] top-[calc(50%+40px)] transform -translate-x-1/2">
                                <div className="w-48 bg-blue-50 border-2 border-blue-500 text-blue-700 font-bold p-3 rounded-lg shadow-sm text-center">
                                    非进入式救援
                                </div>
                            </div>

                            <div className="absolute right-[calc(50%-200px)] top-[calc(50%+40px)] transform translate-x-1/2">
                                <div className="w-48 bg-blue-50 border-2 border-blue-500 text-blue-700 font-bold p-3 rounded-lg shadow-sm text-center">
                                    进入式救援
                                </div>
                            </div>
                        </div>
                        
                        {/* Spacer for branches merge back */}
                        <div className="h-8"></div>

                        {/* Step 5 */}
                        <div className="w-72 bg-white border-l-4 border-orange-500 shadow-sm rounded-r-lg p-4 text-center font-semibold text-gray-700 hover:shadow-md transition-shadow">
                            <div className="text-xs text-orange-500 mb-1 font-bold uppercase tracking-wider">Step 05</div>
                            医疗救护
                        </div>

                        {/* End Node */}
                        <div className="w-80 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-full p-4 text-center font-bold shadow-lg hover:bg-slate-900 transition-colors border-4 border-slate-200">
                            清理现场等后续工作
                        </div>
                    </div>
                </div>

                <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
                    <h5 className="font-bold text-blue-800 mb-3 flex items-center">
                        <i className="fas fa-info-circle mr-2"></i>
                        流程说明
                    </h5>
                    <p className="text-sm text-blue-700 leading-relaxed">
                        当发生有限空间作业事故时，应立即启动应急响应程序。首先进行<span className="font-bold">信息报告</span>并确认，随即开展<span className="font-bold">现场警戒</span>与<span className="font-bold">救援防护</span>准备。
                        根据现场情况判断采取<span className="font-bold text-indigo-700">非进入式救援</span>（优先）或<span className="font-bold text-indigo-700">进入式救援</span>（必须佩戴正压式空气呼吸器）。
                        救援成功后立即进行<span className="font-bold">医疗救护</span>，最后进行现场清理与事故调查。
                    </p>
                </div>
            </div>
        </div>
    );
}
