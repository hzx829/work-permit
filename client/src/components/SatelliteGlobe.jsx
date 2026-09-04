import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Globe from 'react-globe.gl';

const LUZHOU_VIEW = { lat: 28.87, lng: 105.44, altitude: 0.28 };

const CHINA_PROVINCES = [
    ['北京市', 39.9, 116.41], ['天津市', 39.34, 117.36], ['河北省', 38.04, 114.51], ['山西省', 37.87, 112.55],
    ['内蒙古', 40.82, 111.77], ['辽宁省', 41.81, 123.43], ['吉林省', 43.82, 125.32], ['黑龙江省', 45.74, 126.66],
    ['上海市', 31.23, 121.47], ['江苏省', 32.06, 118.8], ['浙江省', 30.27, 120.16], ['安徽省', 31.82, 117.23],
    ['福建省', 26.07, 119.3], ['江西省', 28.68, 115.86], ['山东省', 36.65, 117.12], ['河南省', 34.75, 113.63],
    ['湖北省', 30.59, 114.31], ['湖南省', 28.23, 112.94], ['广东省', 23.13, 113.26], ['广西', 22.82, 108.37],
    ['海南省', 20.04, 110.2], ['重庆市', 29.56, 106.55], ['四川省', 30.57, 104.07], ['贵州省', 26.65, 106.63],
    ['云南省', 25.04, 102.72], ['西藏', 29.65, 91.12], ['陕西省', 34.34, 108.94], ['甘肃省', 36.06, 103.83],
    ['青海省', 36.62, 101.78], ['宁夏', 38.49, 106.23], ['新疆', 43.83, 87.62], ['香港', 22.32, 114.17],
    ['澳门', 22.2, 113.54], ['台湾省', 25.03, 121.57],
].map(([name, lat, lng]) => ({ name, lat, lng, level: 'province-name', color: name === '四川省' ? '#67e8f9' : '#e0f2fe', highlighted: name === '四川省' }));

const SICHUAN_CITIES = [
    ['成都市', 30.57, 104.07], ['自贡市', 29.34, 104.78], ['攀枝花市', 26.58, 101.72], ['泸州市', 28.87, 105.44],
    ['德阳市', 31.13, 104.4], ['绵阳市', 31.47, 104.68], ['广元市', 32.44, 105.84], ['遂宁市', 30.53, 105.59],
    ['内江市', 29.58, 105.06], ['乐山市', 29.55, 103.77], ['南充市', 30.84, 106.11], ['眉山市', 30.08, 103.85],
    ['宜宾市', 28.75, 104.64], ['广安市', 30.46, 106.63], ['达州市', 31.21, 107.47], ['雅安市', 29.98, 103.01],
    ['巴中市', 31.87, 106.75], ['资阳市', 30.13, 104.63], ['阿坝州', 31.9, 102.22], ['甘孜州', 30.05, 101.96],
    ['凉山州', 27.88, 102.27],
].map(([name, lat, lng]) => ({
    name,
    geoName: ({ 阿坝州: '阿坝藏族羌族自治州', 甘孜州: '甘孜藏族自治州', 凉山州: '凉山彝族自治州' })[name] || name,
    lat,
    lng,
    level: 'city-name',
    color: '#d5f5ff',
}));

function levelFromAltitude(altitude) {
    if (altitude <= 0.3) return 'city';
    if (altitude <= 0.7) return 'province';
    return 'country';
}

function createMapLabel(location, onEnter, onLeave, onSelect) {
    const root = document.createElement('div');
    const interactive = location.level === 'city-name';
    root.style.pointerEvents = interactive ? 'auto' : 'none';
    root.style.cursor = interactive ? 'pointer' : 'default';

    const content = document.createElement('div');
    content.style.cssText = 'display:flex;align-items:center;gap:7px;white-space:nowrap;padding:2px 4px;border-radius:5px;background:rgba(2,12,27,.2);filter:drop-shadow(0 1px 5px rgba(0,0,0,.95));';

    const text = document.createElement('span');
    text.textContent = location.name;
    const fontSize = location.level === 'city-focus' ? 16 : location.level === 'province-name' ? 11 : 10;
    text.style.cssText = `font-family:"Microsoft YaHei","PingFang SC",sans-serif;font-size:${fontSize}px;font-weight:${location.selected || location.highlighted ? 800 : 600};letter-spacing:.04em;color:${location.color};text-shadow:0 1px 4px #000,0 0 7px rgba(0,0,0,.95);`;

    content.appendChild(text);
    root.appendChild(content);

    if (interactive) {
        root.setAttribute('role', 'button');
        root.setAttribute('aria-label', `高亮${location.name}行政区轮廓`);
        root.addEventListener('mouseenter', () => onEnter(location.geoName));
        root.addEventListener('mouseleave', onLeave);
        root.addEventListener('click', (event) => {
            event.stopPropagation();
            onSelect(location.geoName);
        });
    }

    return root;
}

function createWatchPin(watch, onSelect) {
    const root = document.createElement('button');
    root.type = 'button';
    root.setAttribute('aria-label', `查看${watch.name}手表数据`);
    root.title = `${watch.name} · ${watch.lat.toFixed(6)}, ${watch.lng.toFixed(6)}`;
    root.style.cssText = `position:relative;width:38px;height:52px;transform:translate(-50%,-100%);border:0;background:transparent;padding:0;cursor:pointer;pointer-events:auto;z-index:${watch.selected ? 8 : 4};filter:drop-shadow(0 4px 7px rgba(0,0,0,.8));`;

    const color = watch.alert ? '#fb7185' : watch.online ? '#22c55e' : '#94a3b8';
    const pin = document.createElement('span');
    pin.style.cssText = `position:absolute;left:50%;bottom:2px;width:29px;height:29px;transform:translateX(-50%) rotate(-45deg);border:2px solid rgba(255,255,255,.95);border-radius:50% 50% 50% 0;background:${color};box-shadow:0 0 ${watch.selected ? 18 : 10}px ${color};`;
    const core = document.createElement('span');
    core.style.cssText = 'position:absolute;left:50%;top:50%;width:9px;height:9px;transform:translate(-50%,-50%);border-radius:50%;background:#07111f;border:2px solid white;';
    pin.appendChild(core);
    root.appendChild(pin);

    if (watch.selected) {
        const label = document.createElement('span');
        label.textContent = watch.clusterSize > 1 ? `${watch.name} · 同位置${watch.clusterSize}台` : watch.name;
        label.style.cssText = 'position:absolute;left:50%;bottom:39px;transform:translateX(-50%);padding:4px 8px;border:1px solid rgba(103,232,249,.65);border-radius:999px;background:rgba(2,12,27,.94);color:#f8fafc;font:700 11px "Microsoft YaHei","PingFang SC",sans-serif;white-space:nowrap;box-shadow:0 0 14px rgba(34,211,238,.28);';
        root.appendChild(label);
    }

    root.addEventListener('click', (event) => {
        event.stopPropagation();
        onSelect(watch);
    });

    return root;
}

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
        hour12: false,
    });
}

function formatCoordinate(value) {
    return Number.isFinite(value) ? value.toFixed(6) : '--';
}

function distanceInMeters(left, right) {
    const earthRadius = 6371000;
    const lat1 = left.lat * Math.PI / 180;
    const lat2 = right.lat * Math.PI / 180;
    const deltaLat = (right.lat - left.lat) * Math.PI / 180;
    const deltaLng = (right.lng - left.lng) * Math.PI / 180;
    const value = Math.sin(deltaLat / 2) ** 2
        + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
    return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function getCityName(feature) {
    return feature?.properties?.name || '';
}

function featureToBoundaryPaths(feature) {
    const { geometry } = feature || {};
    if (!geometry) return [];

    const polygons = geometry.type === 'Polygon'
        ? [geometry.coordinates]
        : geometry.type === 'MultiPolygon'
            ? geometry.coordinates
            : [];

    return polygons.flatMap((polygon) => polygon.map((ring) => ({
        cityName: getCityName(feature),
        points: ring.map(([lng, lat]) => ({ lat, lng, altitude: 0.012 })),
    })));
}

export default function SatelliteGlobe({ watches = [], loading = false, error = '', updatedAt = null }) {
    const containerRef = useRef(null);
    const globeRef = useRef(null);
    const focusedWatchesRef = useRef(false);
    const [size, setSize] = useState({ width: 640, height: 620 });
    const [geoLevel, setGeoLevel] = useState('city');
    const [cityPolygons, setCityPolygons] = useState([]);
    const [hoveredCity, setHoveredCity] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const [selectedWatchId, setSelectedWatchId] = useState(null);

    const locatedWatches = useMemo(() => watches.filter((watch) => (
        Number.isFinite(watch.lat) && Number.isFinite(watch.lng)
    )), [watches]);
    const selectedWatch = watches.find((watch) => watch.id === selectedWatchId)
        || watches.find((watch) => watch.online)
        || watches[0]
        || null;
    const watchPins = useMemo(() => locatedWatches
        .map((watch) => ({
            ...watch,
            level: 'watch-pin',
            selected: watch.id === selectedWatch?.id,
            clusterSize: locatedWatches.filter((item) => distanceInMeters(watch, item) <= 20).length,
        }))
        .sort((left, right) => Number(left.selected) - Number(right.selected)), [locatedWatches, selectedWatch?.id]);

    useEffect(() => {
        let cancelled = false;

        fetch('/sichuan-prefectures.geojson')
            .then((response) => {
                if (!response.ok) throw new Error(`行政区边界加载失败：${response.status}`);
                return response.json();
            })
            .then((data) => {
                if (!cancelled) setCityPolygons(data.features || []);
            })
            .catch((error) => console.error(error));

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!containerRef.current) return undefined;

        const updateSize = () => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            setSize({
                width: Math.max(320, Math.floor(rect.width)),
                height: Math.max(390, Math.floor(rect.height)),
            });
        };

        updateSize();
        const observer = new ResizeObserver(updateSize);
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const handleReady = useCallback(() => {
        const globe = globeRef.current;
        if (!globe) return;

        const firstWatch = locatedWatches.find((watch) => watch.online) || locatedWatches[0];
        globe.pointOfView(
            firstWatch ? { lat: firstWatch.lat, lng: firstWatch.lng, altitude: 0.28 } : LUZHOU_VIEW,
            900,
        );
        focusedWatchesRef.current = Boolean(firstWatch);
        const controls = globe.controls();
        controls.enablePan = false;
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.rotateSpeed = 0.5;
        controls.zoomSpeed = 0.8;
        controls.minDistance = 110;
        controls.maxDistance = 650;
        controls.autoRotate = false;
    }, [locatedWatches]);

    useEffect(() => {
        if (focusedWatchesRef.current || !locatedWatches.length || !globeRef.current) return;
        const firstWatch = locatedWatches.find((watch) => watch.online) || locatedWatches[0];
        globeRef.current.pointOfView({ lat: firstWatch.lat, lng: firstWatch.lng, altitude: 0.28 }, 900);
        focusedWatchesRef.current = true;
    }, [locatedWatches]);

    const handleZoom = useCallback(({ altitude }) => {
        const nextLevel = levelFromAltitude(altitude);
        if (nextLevel !== 'province') {
            setHoveredCity(null);
            setSelectedCity(null);
        }
        setGeoLevel((currentLevel) => currentLevel === nextLevel ? currentLevel : nextLevel);
    }, []);

    const activeCity = hoveredCity || selectedCity;
    const visibleLabels = geoLevel === 'country'
        ? CHINA_PROVINCES
        : geoLevel === 'province'
            ? SICHUAN_CITIES
            : [];
    const visibleBoundaryPaths = geoLevel === 'province' && activeCity
        ? cityPolygons
            .filter((feature) => getCityName(feature) === activeCity)
            .flatMap(featureToBoundaryPaths)
        : [];
    const visibleWatchPins = geoLevel === 'city'
        ? watchPins
        : [];
    const visibleGlobeLabels = [...visibleLabels, ...visibleWatchPins];

    const handleCityLeave = useCallback(() => setHoveredCity(null), []);
    const handleCitySelect = useCallback((cityName) => {
        setSelectedCity((currentCity) => currentCity === cityName ? null : cityName);
    }, []);
    const renderMapLabel = useCallback(
        (location) => location.level === 'watch-pin'
            ? createWatchPin(location, (watch) => {
                setSelectedWatchId(watch.id);
                globeRef.current?.pointOfView({ lat: watch.lat, lng: watch.lng, altitude: 0.18 }, 650);
            })
            : createMapLabel(location, setHoveredCity, handleCityLeave, handleCitySelect),
        [handleCityLeave, handleCitySelect],
    );

    const handleDeviceChange = useCallback((watchId) => {
        const watch = locatedWatches.find((item) => item.id === watchId);
        setSelectedWatchId(watchId);
        if (watch) globeRef.current?.pointOfView({ lat: watch.lat, lng: watch.lng, altitude: 0.18 }, 650);
    }, [locatedWatches]);

    return (
        <div
            ref={containerRef}
            data-testid="satellite-globe"
            data-geo-level={geoLevel}
            data-active-city={activeCity || ''}
            data-boundary-paths={visibleBoundaryPaths.length}
            className="relative h-full min-h-[390px] w-full overflow-hidden rounded-xl border border-cyan-300/55 bg-[radial-gradient(circle_at_center,#092f50_0%,#030b18_58%,#01040a_100%)] shadow-[0_0_30px_rgba(14,165,233,.3)]"
        >
            <Globe
                ref={globeRef}
                width={size.width}
                height={size.height}
                backgroundColor="rgba(0,0,0,0)"
                globeImageUrl="/earth-blue-marble.jpg"
                bumpImageUrl="/earth-topology.png"
                showAtmosphere
                atmosphereColor="#38bdf8"
                atmosphereAltitude={0.15}
                waitForGlobeReady
                animateIn
                ringsData={geoLevel === 'city' ? locatedWatches.filter((watch) => watch.online || watch.alert) : []}
                ringLat="lat"
                ringLng="lng"
                ringColor={(watch) => watch.alert
                    ? ['rgba(251,113,133,.95)', 'rgba(251,113,133,0)']
                    : ['rgba(34,197,94,.8)', 'rgba(34,197,94,0)']}
                ringMaxRadius={0.55}
                ringPropagationSpeed={1.4}
                ringRepeatPeriod={1400}
                pathsData={visibleBoundaryPaths}
                pathPoints="points"
                pathPointLat="lat"
                pathPointLng="lng"
                pathPointAlt="altitude"
                pathColor={() => '#67e8f9'}
                pathStroke={0.65}
                pathResolution={0.35}
                pathTransitionDuration={0}
                htmlElementsData={visibleGlobeLabels}
                htmlLat="lat"
                htmlLng="lng"
                htmlAltitude={(item) => item.level === 'watch-pin' ? 0.012 : 0.035}
                htmlElement={renderMapLabel}
                htmlTransitionDuration={180}
                onGlobeReady={handleReady}
                onZoom={handleZoom}
            />
            <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-cyan-300/30 bg-slate-950/85 px-3 py-2 text-xs text-cyan-100 shadow-[0_0_18px_rgba(14,165,233,.22)] backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <span className="font-bold tracking-wider text-white">实时卫星定位</span>
                    <span className="text-emerald-300">在线 {watches.filter((watch) => watch.online).length}</span>
                    <span className="text-slate-300">定位 {locatedWatches.length}/{watches.length}</span>
                </div>
                <div className="mt-1 text-[10px] text-cyan-200/65">
                    {loading
                        ? '正在同步厂家平台...'
                        : error || (updatedAt ? `最近同步 ${formatTime(updatedAt)}` : '等待厂家平台数据')}
                </div>
            </div>
            {selectedWatch && (
                <div className="absolute right-2 top-20 w-[min(230px,calc(100%-1rem))] rounded-xl border border-cyan-300/40 bg-slate-950/90 p-3 text-xs text-slate-200 shadow-[0_0_24px_rgba(14,165,233,.3)] backdrop-blur-md sm:right-3 sm:top-3">
                    <div className="flex items-start justify-between gap-2 border-b border-cyan-400/20 pb-2">
                        <div>
                            <div className="font-bold text-white">{selectedWatch.name}</div>
                            <div className="mt-0.5 text-[10px] text-cyan-200/65">设备 {selectedWatch.code}</div>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${selectedWatch.alert ? 'bg-rose-500/25 text-rose-200' : selectedWatch.online ? 'bg-emerald-500/25 text-emerald-200' : 'bg-slate-500/25 text-slate-300'}`}>
                            {selectedWatch.alert ? '告警' : selectedWatch.online ? '在线' : '离线'}
                        </span>
                    </div>
                    {watches.length > 1 && (
                        <label className="mt-2 block text-[9px] tracking-wider text-slate-400">
                            设备切换
                            <select
                                aria-label="切换智能手表"
                                value={selectedWatch.id}
                                onChange={(event) => handleDeviceChange(event.target.value)}
                                className="mt-1 w-full rounded-md border border-cyan-400/25 bg-slate-900 px-2 py-1 text-[11px] font-semibold text-cyan-50 outline-none focus:border-cyan-300"
                            >
                                {watches.map((watch) => (
                                    <option key={watch.id} value={watch.id}>
                                        {watch.name} · {watch.online ? '在线' : '离线'}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                    <div className="mt-2 rounded-md border border-cyan-400/20 bg-cyan-950/20 px-2 py-2 font-mono text-[10px] text-cyan-100">
                        <div className="flex items-center justify-between font-sans text-[9px] tracking-wider text-cyan-300/70">
                            <span>精确坐标</span>
                            <span>WGS84</span>
                        </div>
                        <div className="mt-1 flex justify-between gap-3">
                            <span>纬度 {formatCoordinate(selectedWatch.lat)}</span>
                            <span>经度 {formatCoordinate(selectedWatch.lng)}</span>
                        </div>
                        <button
                            type="button"
                            disabled={!Number.isFinite(selectedWatch.lat) || !Number.isFinite(selectedWatch.lng)}
                            onClick={() => handleDeviceChange(selectedWatch.id)}
                            className="mt-2 w-full rounded border border-cyan-400/30 bg-cyan-500/10 py-1 font-sans text-[10px] font-bold text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            定位到地图针
                        </button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <WatchMetric label="心率" value={formatMetric(selectedWatch.heartRate, ' BPM')} accent="text-rose-300" />
                        <WatchMetric label="血氧" value={formatMetric(selectedWatch.bloodOxygen, '%')} accent="text-cyan-200" />
                        <WatchMetric label="体温" value={formatMetric(selectedWatch.bodyTemperature, '℃')} accent="text-amber-200" />
                        <WatchMetric label="血压" value={selectedWatch.systolicPressure && selectedWatch.diastolicPressure ? `${selectedWatch.systolicPressure}/${selectedWatch.diastolicPressure}` : '--'} accent="text-violet-200" />
                        <WatchMetric label="步数" value={formatMetric(selectedWatch.steps)} accent="text-emerald-200" />
                        <WatchMetric label="信号" value={formatMetric(selectedWatch.signal)} accent="text-blue-200" />
                    </div>
                    <div className="mt-2 border-t border-cyan-400/15 pt-2 text-[10px] text-slate-400">
                        最后通信 {formatTime(selectedWatch.lastCommunicationAt)}
                    </div>
                </div>
            )}
            <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-3 rounded-full border border-cyan-300/20 bg-slate-950/65 px-3 py-1 text-[10px] text-slate-300">
                <span><i className="mr-1 inline-block h-2 w-2 rotate-45 rounded-[50%_50%_50%_0] bg-emerald-500" />在线地图针</span>
                <span><i className="mr-1 inline-block h-2 w-2 rotate-45 rounded-[50%_50%_50%_0] bg-slate-400" />离线</span>
                <span><i className="mr-1 inline-block h-2 w-2 rotate-45 rounded-[50%_50%_50%_0] bg-rose-400" />告警</span>
            </div>
            <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-cyan-300/25 bg-slate-950/70 px-4 py-1.5 text-[11px] tracking-wider text-cyan-100/75">
                <span className={geoLevel === 'country' ? 'font-bold text-white' : ''}>中国</span>
                <span className="text-cyan-500">›</span>
                <span className={geoLevel === 'province' ? 'font-bold text-cyan-200' : ''}>四川省</span>
                <span className="text-cyan-500">›</span>
                <span className={geoLevel === 'city' ? 'font-bold text-rose-300' : ''}>泸州市</span>
            </div>
        </div>
    );
}

function WatchMetric({ label, value, accent }) {
    return (
        <div className="rounded-md border border-cyan-400/15 bg-cyan-950/25 px-2 py-1.5">
            <div className="text-[9px] tracking-wider text-slate-400">{label}</div>
            <div className={`mt-0.5 font-mono text-[11px] font-bold ${accent}`}>{value}</div>
        </div>
    );
}
