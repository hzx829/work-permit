import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

const LUZHOU_CENTER = [28.89684, 105.41907];
const LUZHOU_BOUNDARIES_URL = 'https://geo.datav.aliyun.com/areas_v3/bound/510500_full.json';
const DISTRICT_COLORS = ['#22d3ee', '#38bdf8', '#818cf8', '#a78bfa', '#2dd4bf', '#60a5fa', '#c084fc'];

function formatMetric(value, unit = '') {
    return value === null || value === undefined ? '--' : `${value}${unit}`;
}

function formatTime(value) {
    if (!value) return '暂无上报';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '暂无上报';
    return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
}

function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
    })[character]);
}

function watchPinIcon(watch, selected) {
    const color = watch.alert ? '#fb7185' : watch.online ? '#22c55e' : '#94a3b8';
    const safeName = escapeHtml(watch.name);
    return L.divIcon({
        className: 'watch-pin-wrapper',
        iconSize: [42, 58],
        iconAnchor: [21, 54],
        html: `
            <div class="watch-pin-label${selected ? ' is-selected' : ''}">${safeName}</div>
            <div class="watch-pin-body${selected ? ' is-selected' : ''}" style="--watch-color:${color}">
                <span></span>
            </div>
        `,
    });
}

function selectedStatusClass(watch) {
    if (watch?.alert) return 'bg-rose-500/25 text-rose-200';
    if (watch?.online) return 'bg-emerald-500/25 text-emerald-200';
    return 'bg-slate-500/25 text-slate-300';
}

export default function RealtimeWatchMap({
    watches = [],
    loading = false,
    error = '',
    updatedAt = null,
    selectedWatchId: controlledSelectedWatchId = '',
    onSelectWatch = null,
}) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const tileLayersRef = useRef(null);
    const markerLayerRef = useRef(null);
    const boundaryLayerRef = useRef(null);
    const boundaryVisibleRef = useRef(true);
    const hasCenteredRef = useRef(false);
    const [mapReady, setMapReady] = useState(false);
    const [baseMode, setBaseMode] = useState('satellite');
    const [showBoundaries, setShowBoundaries] = useState(true);
    const [boundaryNames, setBoundaryNames] = useState([]);
    const [tileError, setTileError] = useState('');
    const [internalSelectedWatchId, setInternalSelectedWatchId] = useState('');
    const [detailsCollapsed, setDetailsCollapsed] = useState(false);
    const selectedWatchId = controlledSelectedWatchId || internalSelectedWatchId;

    const locatedWatches = useMemo(() => watches.filter((watch) => (
        Number.isFinite(watch.lat) && Number.isFinite(watch.lng)
    )), [watches]);
    const selectedWatch = watches.find((watch) => watch.id === selectedWatchId)
        || watches.find((watch) => watch.online && Number.isFinite(watch.lat))
        || watches[0]
        || null;

    const selectWatch = useCallback((watchId) => {
        setInternalSelectedWatchId(watchId);
        onSelectWatch?.(watchId);
    }, [onSelectWatch]);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return undefined;

        const map = L.map(containerRef.current, {
            center: LUZHOU_CENTER,
            zoom: 15,
            minZoom: 8,
            maxZoom: 20,
            zoomControl: false,
            attributionControl: true,
        });
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        const satellite = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
                maxNativeZoom: 17,
                maxZoom: 18,
                attribution: '影像 © Esri, Maxar, Earthstar Geographics',
            },
        );
        const satelliteLabels = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
            { maxNativeZoom: 17, maxZoom: 18, pane: 'overlayPane' },
        );
        const satelliteRoads = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
            { maxNativeZoom: 17, maxZoom: 18, pane: 'overlayPane', opacity: 0.9 },
        );
        const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors',
        });

        [satellite, satelliteRoads, satelliteLabels, street].forEach((layer) => {
            layer.on('tileerror', () => setTileError('部分地图瓦片加载失败，可切换地图模式'));
            layer.on('load', () => setTileError(''));
        });

        tileLayersRef.current = { satellite, satelliteRoads, satelliteLabels, street };
        mapRef.current = map;
        map.whenReady(() => setMapReady(true));

        const observer = new ResizeObserver(() => map.invalidateSize({ animate: false }));
        observer.observe(containerRef.current);

        let cancelled = false;
        fetch(LUZHOU_BOUNDARIES_URL)
            .then((response) => {
                if (!response.ok) throw new Error(`行政区边界加载失败：${response.status}`);
                return response.json();
            })
            .then((data) => {
                if (cancelled) return;
                const names = (data.features || []).map((feature) => feature?.properties?.name).filter(Boolean);
                setBoundaryNames(names);
                const boundaryLayer = L.geoJSON(data, {
                    style: (feature) => {
                        const index = Math.max(0, names.indexOf(feature?.properties?.name));
                        return {
                            color: DISTRICT_COLORS[index % DISTRICT_COLORS.length],
                            weight: 1.6,
                            opacity: 0.9,
                            dashArray: '6 5',
                            fillColor: DISTRICT_COLORS[index % DISTRICT_COLORS.length],
                            fillOpacity: 0.035,
                        };
                    },
                    onEachFeature: (feature, layer) => {
                        const name = escapeHtml(feature?.properties?.name || '行政区');
                        layer.bindTooltip(name, {
                            permanent: true,
                            direction: 'center',
                            className: 'district-name-label',
                        });
                    },
                });
                boundaryLayerRef.current = boundaryLayer;
                if (boundaryVisibleRef.current) boundaryLayer.addTo(map);
            })
            .catch((boundaryError) => console.warn(boundaryError.message));

        return () => {
            cancelled = true;
            observer.disconnect();
            map.remove();
            mapRef.current = null;
            tileLayersRef.current = null;
            markerLayerRef.current = null;
            boundaryLayerRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!mapReady || !mapRef.current || !tileLayersRef.current) return;
        const map = mapRef.current;
        const { satellite, satelliteRoads, satelliteLabels, street } = tileLayersRef.current;
        [satellite, satelliteRoads, satelliteLabels, street]
            .filter(Boolean)
            .forEach((layer) => map.removeLayer(layer));
        if (baseMode === 'satellite') {
            map.setMaxZoom(18);
            if (map.getZoom() > 18) map.setZoom(18);
            satellite.addTo(map);
            satelliteRoads?.addTo(map);
            satelliteLabels.addTo(map);
        } else {
            map.setMaxZoom(19);
            street.addTo(map);
        }
    }, [baseMode, mapReady]);

    useEffect(() => {
        boundaryVisibleRef.current = showBoundaries;
        const map = mapRef.current;
        const boundaryLayer = boundaryLayerRef.current;
        if (!map || !boundaryLayer) return;
        if (showBoundaries) boundaryLayer.addTo(map);
        else map.removeLayer(boundaryLayer);
    }, [showBoundaries]);

    useEffect(() => {
        if (!mapReady || !mapRef.current) return;
        const map = mapRef.current;
        if (markerLayerRef.current) map.removeLayer(markerLayerRef.current);

        const cluster = L.markerClusterGroup({
            maxClusterRadius: 38,
            showCoverageOnHover: false,
            spiderfyOnMaxZoom: true,
            spiderfyDistanceMultiplier: 1.8,
            iconCreateFunction: (markerCluster) => L.divIcon({
                className: 'watch-cluster-wrapper',
                iconSize: [46, 46],
                html: `<div class="watch-cluster"><strong>${markerCluster.getChildCount()}</strong><span>手表</span></div>`,
            }),
        });

        locatedWatches.forEach((watch) => {
            const marker = L.marker([watch.lat, watch.lng], {
                icon: watchPinIcon(watch, watch.id === selectedWatch?.id),
                title: `${watch.name} ${watch.lat.toFixed(6)}, ${watch.lng.toFixed(6)}`,
                keyboard: true,
            });
            marker.on('click', () => selectWatch(watch.id));
            cluster.addLayer(marker);
        });

        markerLayerRef.current = cluster;
        cluster.addTo(map);
        if (!hasCenteredRef.current && locatedWatches.length) {
            map.setView([selectedWatch?.lat || locatedWatches[0].lat, selectedWatch?.lng || locatedWatches[0].lng], 17);
            hasCenteredRef.current = true;
        }
    }, [locatedWatches, mapReady, selectWatch, selectedWatch?.id, selectedWatch?.lat, selectedWatch?.lng]);

    const focusWatch = useCallback((watchId) => {
        const watch = locatedWatches.find((item) => item.id === watchId);
        selectWatch(watchId);
        if (watch && mapRef.current) {
            const map = mapRef.current;
            const focusZoom = baseMode === 'satellite' ? 17 : 18;
            map.stop();
            map.setView([watch.lat, watch.lng], Math.min(focusZoom, map.getMaxZoom()), { animate: false });
            map.invalidateSize({ animate: false, pan: false });
        }
    }, [baseMode, locatedWatches, selectWatch]);

    return (
        <div
            data-testid="realtime-watch-map"
            className="relative h-full min-h-[390px] w-full overflow-hidden rounded-xl border border-cyan-300/55 bg-slate-950 shadow-[0_0_30px_rgba(14,165,233,.3)]"
        >
            <div ref={containerRef} className="absolute inset-0 z-0" aria-label="手表实时定位地图" />

            <style>{`
                .watch-pin-wrapper { background: transparent; border: 0; }
                .watch-pin-body { position:absolute; left:7px; bottom:4px; width:30px; height:30px; transform:rotate(-45deg); border:2px solid white; border-radius:50% 50% 50% 0; background:var(--watch-color); box-shadow:0 0 14px var(--watch-color), 0 5px 9px rgba(0,0,0,.75); }
                .watch-pin-body span { position:absolute; left:50%; top:50%; width:10px; height:10px; transform:translate(-50%,-50%); border:2px solid white; border-radius:50%; background:#07111f; }
                .watch-pin-body.is-selected { animation:watchPulse 1.5s ease-in-out infinite; }
                .watch-pin-label { position:absolute; left:50%; bottom:47px; transform:translateX(-50%); opacity:0; padding:3px 7px; border:1px solid rgba(103,232,249,.7); border-radius:999px; background:rgba(2,12,27,.92); color:white; font:700 11px "Microsoft YaHei",sans-serif; white-space:nowrap; transition:opacity .18s; }
                .watch-pin-wrapper:hover .watch-pin-label, .watch-pin-label.is-selected { opacity:1; }
                .watch-cluster { width:46px; height:46px; display:flex; flex-direction:column; align-items:center; justify-content:center; border:2px solid rgba(255,255,255,.95); border-radius:50% 50% 50% 0; transform:rotate(-45deg); background:rgba(244,63,94,.9); color:white; box-shadow:0 0 20px rgba(244,63,94,.75),0 6px 12px rgba(0,0,0,.65); }
                .watch-cluster strong, .watch-cluster span { transform:rotate(45deg); line-height:1; }
                .watch-cluster strong { font:800 16px ui-monospace,monospace; }
                .watch-cluster span { margin-top:2px; font:700 8px "Microsoft YaHei",sans-serif; }
                .district-name-label { border:1px solid rgba(103,232,249,.35); border-radius:999px; background:rgba(2,12,27,.72); color:#cffafe; box-shadow:none; font:700 10px "Microsoft YaHei",sans-serif; }
                .district-name-label::before { display:none; }
                .leaflet-control-attribution { background:rgba(2,12,27,.72)!important; color:#94a3b8; font-size:9px; }
                .leaflet-control-attribution a { color:#67e8f9; }
                .leaflet-control-zoom a { background:#07182c; border-color:rgba(34,211,238,.3); color:#cffafe; }
                @keyframes watchPulse { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.4)} }
                @media (prefers-reduced-motion:reduce) { .watch-pin-body.is-selected { animation:none; } }
            `}</style>

            <div className="pointer-events-none absolute left-3 top-3 z-[800] rounded-lg border border-cyan-300/35 bg-slate-950/88 px-3 py-2 text-xs text-cyan-100 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <span className="font-bold tracking-wider text-white">手表实时定位</span>
                    <span className="text-emerald-300">在线 {watches.filter((watch) => watch.online).length}</span>
                    <span className="text-slate-300">定位 {locatedWatches.length}/{watches.length}</span>
                </div>
                <div className="mt-1 text-[10px] text-cyan-200/70">
                    {loading ? '正在同步厂家平台...' : error || `最近同步 ${formatTime(updatedAt)}`}
                </div>
            </div>

            <div className="absolute left-3 top-[70px] z-[800] flex overflow-hidden rounded-md border border-cyan-300/30 bg-slate-950/88 text-[10px] font-bold shadow-lg">
                <button type="button" onClick={() => { setTileError(''); setBaseMode('satellite'); }} className={`px-3 py-1.5 ${baseMode === 'satellite' ? 'bg-cyan-500/25 text-white' : 'text-slate-300'}`}>卫星影像</button>
                <button type="button" onClick={() => { setTileError(''); setBaseMode('street'); }} className={`px-3 py-1.5 ${baseMode === 'street' ? 'bg-cyan-500/25 text-white' : 'text-slate-300'}`}>道路地图</button>
                <button type="button" onClick={() => setShowBoundaries((value) => !value)} className={`border-l border-cyan-300/20 px-3 py-1.5 ${showBoundaries ? 'text-cyan-200' : 'text-slate-500'}`}>区县边界</button>
            </div>

            {(tileError || !boundaryNames.length) && (
                <div className="pointer-events-none absolute bottom-8 left-1/2 z-[800] -translate-x-1/2 rounded-full border border-amber-400/35 bg-slate-950/85 px-3 py-1 text-[10px] text-amber-200">
                    {tileError || '正在加载泸州区县边界...'}
                </div>
            )}

            {selectedWatch && (
                <div className={`absolute z-[900] overflow-y-auto rounded-xl border border-cyan-300/45 bg-slate-950/92 text-xs text-slate-200 shadow-2xl backdrop-blur-md ${detailsCollapsed
                    ? 'right-2 top-2 max-w-[calc(100%-1rem)] p-2 sm:right-3 sm:top-3'
                    : 'bottom-2 left-2 right-2 max-h-[46%] p-3 sm:bottom-auto sm:left-auto sm:right-3 sm:top-3 sm:w-[238px] sm:max-h-[calc(100%-1.5rem)]'
                }`}>
                    <div className={`flex items-start justify-between gap-2 ${detailsCollapsed ? '' : 'border-b border-cyan-400/20 pb-2'}`}>
                        <div>
                            <div className="font-bold text-white">{selectedWatch.name}</div>
                            {!detailsCollapsed && <div className="mt-0.5 text-[10px] text-cyan-200/65">设备 {selectedWatch.code}</div>}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${selectedStatusClass(selectedWatch)}`}>
                                {selectedWatch.alert ? '告警' : selectedWatch.online ? '在线' : '离线'}
                            </span>
                            <button
                                type="button"
                                onClick={() => setDetailsCollapsed((value) => !value)}
                                aria-expanded={!detailsCollapsed}
                                aria-controls="watch-details-body"
                                aria-label={detailsCollapsed ? '展开设备详情' : '收起设备详情'}
                                title={detailsCollapsed ? '展开设备详情' : '收起设备详情'}
                                className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-cyan-300/35 bg-cyan-500/10 text-cyan-100 transition hover:bg-cyan-500/25 focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true" className={`h-4 w-4 transition-transform ${detailsCollapsed ? 'rotate-180' : ''}`}>
                                    <path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    {!detailsCollapsed && (
                        <div id="watch-details-body">
                            <label className="mt-2 block text-[9px] tracking-wider text-slate-400">
                                设备切换
                                <select
                                    aria-label="切换智能手表"
                                    value={selectedWatch.id}
                                    onChange={(event) => focusWatch(event.target.value)}
                                    className="mt-1 w-full rounded-md border border-cyan-400/25 bg-slate-900 px-2 py-1 text-[11px] font-semibold text-cyan-50 outline-none focus:border-cyan-300"
                                >
                                    {watches.map((watch) => <option key={watch.id} value={watch.id}>{watch.name} · {watch.online ? '在线' : '离线'}</option>)}
                                </select>
                            </label>
                            <div className="mt-2 rounded-md border border-cyan-400/20 bg-cyan-950/20 px-2 py-2 font-mono text-[10px] text-cyan-100">
                                <div className="flex justify-between font-sans text-[9px] tracking-wider text-cyan-300/70"><span>精确坐标</span><span>WGS84</span></div>
                                <div className="mt-1">纬度 {Number.isFinite(selectedWatch.lat) ? selectedWatch.lat.toFixed(6) : '--'}</div>
                                <div>经度 {Number.isFinite(selectedWatch.lng) ? selectedWatch.lng.toFixed(6) : '--'}</div>
                                <button type="button" onClick={() => focusWatch(selectedWatch.id)} className="mt-2 w-full rounded border border-cyan-400/30 bg-cyan-500/10 py-1 font-sans text-[10px] font-bold text-cyan-100 hover:bg-cyan-500/20">回到地图针</button>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                                <Metric label="心率" value={formatMetric(selectedWatch.heartRate, ' BPM')} color="text-rose-300" />
                                <Metric label="血氧" value={formatMetric(selectedWatch.bloodOxygen, '%')} color="text-cyan-200" />
                                <Metric label="体温" value={formatMetric(selectedWatch.bodyTemperature, '℃')} color="text-amber-200" />
                                <Metric label="血压" value={selectedWatch.systolicPressure && selectedWatch.diastolicPressure ? `${selectedWatch.systolicPressure}/${selectedWatch.diastolicPressure}` : '--'} color="text-violet-200" />
                            </div>
                            <div className="mt-2 border-t border-cyan-400/15 pt-2 text-[10px] text-slate-400">最后通信 {formatTime(selectedWatch.lastCommunicationAt)}</div>
                        </div>
                    )}
                </div>
            )}

            <div className="pointer-events-none absolute bottom-2 left-2 z-[700] hidden max-w-[58%] flex-wrap gap-x-3 gap-y-1 rounded-md border border-cyan-300/20 bg-slate-950/75 px-3 py-2 text-[9px] text-cyan-100 backdrop-blur sm:flex">
                {boundaryNames.map((name, index) => (
                    <span key={name}><i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: DISTRICT_COLORS[index % DISTRICT_COLORS.length] }} />{name}</span>
                ))}
            </div>
        </div>
    );
}

function Metric({ label, value, color }) {
    return (
        <div className="rounded-md border border-cyan-400/15 bg-cyan-950/25 px-2 py-1.5">
            <div className="text-[9px] tracking-wider text-slate-400">{label}</div>
            <div className={`mt-0.5 font-mono text-[11px] font-bold ${color}`}>{value}</div>
        </div>
    );
}
