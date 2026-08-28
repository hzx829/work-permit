import React, { useCallback, useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';

const LUZHOU_VIEW = { lat: 28.87, lng: 105.44, altitude: 0.28 };
const LUZHOU_MARKER = { name: '泸州市', lat: 28.87, lng: 105.44, color: '#ff3048' };

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

const LUZHOU_LABEL = { level: 'city-focus', name: '泸州市', lat: 28.87, lng: 105.44, color: '#ff4058', selected: true };

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

    if (location.level === 'city-focus') {
        const marker = document.createElement('span');
        marker.style.cssText = 'position:relative;width:18px;height:18px;flex:0 0 18px;background:#ff3048;border:2px solid #ffe4e6;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 0 12px rgba(255,48,72,.95);';
        const markerCore = document.createElement('span');
        markerCore.style.cssText = 'position:absolute;left:50%;top:50%;width:5px;height:5px;border-radius:50%;background:white;transform:translate(-50%,-50%);';
        marker.appendChild(markerCore);
        content.appendChild(marker);
    }

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

export default function SatelliteGlobe() {
    const containerRef = useRef(null);
    const globeRef = useRef(null);
    const [size, setSize] = useState({ width: 640, height: 620 });
    const [geoLevel, setGeoLevel] = useState('city');
    const [cityPolygons, setCityPolygons] = useState([]);
    const [hoveredCity, setHoveredCity] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);

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

        globe.pointOfView(LUZHOU_VIEW, 900);
        const controls = globe.controls();
        controls.enablePan = false;
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.rotateSpeed = 0.5;
        controls.zoomSpeed = 0.8;
        controls.minDistance = 110;
        controls.maxDistance = 650;
        controls.autoRotate = false;
    }, []);

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
            : [LUZHOU_LABEL];
    const visibleBoundaryPaths = geoLevel === 'province' && activeCity
        ? cityPolygons
            .filter((feature) => getCityName(feature) === activeCity)
            .flatMap(featureToBoundaryPaths)
        : [];

    const handleCityLeave = useCallback(() => setHoveredCity(null), []);
    const handleCitySelect = useCallback((cityName) => {
        setSelectedCity((currentCity) => currentCity === cityName ? null : cityName);
    }, []);
    const renderMapLabel = useCallback(
        (location) => createMapLabel(location, setHoveredCity, handleCityLeave, handleCitySelect),
        [handleCityLeave, handleCitySelect],
    );

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
                ringsData={geoLevel === 'city' ? [LUZHOU_MARKER] : []}
                ringLat="lat"
                ringLng="lng"
                ringColor={() => ['rgba(255,58,78,.9)', 'rgba(255,58,78,0)']}
                ringMaxRadius={3.2}
                ringPropagationSpeed={2.2}
                ringRepeatPeriod={850}
                pathsData={visibleBoundaryPaths}
                pathPoints="points"
                pathPointLat="lat"
                pathPointLng="lng"
                pathPointAlt="altitude"
                pathColor={() => '#67e8f9'}
                pathStroke={0.65}
                pathResolution={0.35}
                pathTransitionDuration={0}
                htmlElementsData={visibleLabels}
                htmlLat="lat"
                htmlLng="lng"
                htmlAltitude={0.035}
                htmlElement={renderMapLabel}
                htmlTransitionDuration={180}
                onGlobeReady={handleReady}
                onZoom={handleZoom}
            />
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
