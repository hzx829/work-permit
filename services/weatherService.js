const DEFAULT_API_BASE = 'https://api.open-meteo.com/v1/forecast';
const CUSTOMER_API_BASE = 'https://customer-api.open-meteo.com/v1/forecast';
const DEFAULT_LOCATION = '泸州市';
const DEFAULT_LATITUDE = 28.8717;
const DEFAULT_LONGITUDE = 105.4426;
const CACHE_MS = 10 * 60 * 1000;

let weatherCache = null;
let weatherRequest = null;

const WEATHER_CONDITIONS = new Map([
    [0, '晴'],
    [1, '晴间多云'],
    [2, '多云'],
    [3, '阴'],
    [45, '雾'],
    [48, '雾凇'],
    [51, '小毛毛雨'],
    [53, '毛毛雨'],
    [55, '强毛毛雨'],
    [56, '轻微冻雨'],
    [57, '强冻雨'],
    [61, '小雨'],
    [63, '中雨'],
    [65, '大雨'],
    [66, '轻微冻雨'],
    [67, '强冻雨'],
    [71, '小雪'],
    [73, '中雪'],
    [75, '大雪'],
    [77, '米雪'],
    [80, '小阵雨'],
    [81, '阵雨'],
    [82, '强阵雨'],
    [85, '小阵雪'],
    [86, '强阵雪'],
    [95, '雷雨'],
    [96, '雷雨伴冰雹'],
    [99, '强雷雨伴冰雹'],
]);

const WIND_DIRECTIONS = [
    '北风', '北东北风', '东北风', '东东北风',
    '东风', '东东南风', '东南风', '南东南风',
    '南风', '南西南风', '西南风', '西西南风',
    '西风', '西西北风', '西北风', '北西北风',
];

function getConfig() {
    const latitude = Number(process.env.WEATHER_LATITUDE || DEFAULT_LATITUDE);
    const longitude = Number(process.env.WEATHER_LONGITUDE || DEFAULT_LONGITUDE);
    const apiKey = String(process.env.WEATHER_API_KEY || '').trim();

    return {
        apiBase: String(process.env.WEATHER_API_BASE || (apiKey ? CUSTOMER_API_BASE : DEFAULT_API_BASE)),
        apiKey,
        location: String(process.env.WEATHER_LOCATION || DEFAULT_LOCATION).trim() || DEFAULT_LOCATION,
        latitude: Number.isFinite(latitude) ? latitude : DEFAULT_LATITUDE,
        longitude: Number.isFinite(longitude) ? longitude : DEFAULT_LONGITUDE,
    };
}

function windDirectionFromDegrees(value) {
    const degrees = Number(value);
    if (!Number.isFinite(degrees)) return '--';
    const normalized = ((degrees % 360) + 360) % 360;
    return WIND_DIRECTIONS[Math.round(normalized / 22.5) % 16];
}

function beaufortLevel(speedKmh) {
    const speed = Number(speedKmh);
    if (!Number.isFinite(speed)) return null;
    const upperBounds = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118];
    const level = upperBounds.findIndex((upperBound) => speed < upperBound);
    return level === -1 ? 12 : level;
}

function normalizeWeather(data, config) {
    const current = data?.current;
    const temperature = Number(current?.temperature_2m);
    const humidity = Number(current?.relative_humidity_2m);
    const weatherCode = Number(current?.weather_code);
    const windSpeedKmh = Number(current?.wind_speed_10m);
    const windDirectionDegrees = Number(current?.wind_direction_10m);

    if (![temperature, humidity, weatherCode, windSpeedKmh, windDirectionDegrees].every(Number.isFinite)) {
        throw new Error('实时气象接口返回的数据不完整');
    }

    return {
        location: config.location,
        source: 'Open-Meteo',
        attributionUrl: 'https://open-meteo.com/',
        observedAt: current.time || null,
        syncedAt: new Date().toISOString(),
        temperature: Number(temperature.toFixed(1)),
        humidity: Math.round(humidity),
        condition: WEATHER_CONDITIONS.get(weatherCode) || '天气变化',
        weatherCode,
        windDirection: windDirectionFromDegrees(windDirectionDegrees),
        windDirectionDegrees: Math.round(windDirectionDegrees),
        windSpeedKmh: Number(windSpeedKmh.toFixed(1)),
        windLevel: beaufortLevel(windSpeedKmh),
        stale: false,
    };
}

async function requestCurrentWeather(config) {
    if (typeof fetch !== 'function') {
        throw new Error('当前 Node.js 版本不支持实时气象连接，请升级到 Node.js 18 或更高版本');
    }

    const url = new URL(config.apiBase);
    url.searchParams.set('latitude', String(config.latitude));
    url.searchParams.set('longitude', String(config.longitude));
    url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m');
    url.searchParams.set('timezone', 'Asia/Shanghai');
    if (config.apiKey) url.searchParams.set('apikey', config.apiKey);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(url, {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
        });
        if (!response.ok) throw new Error(`实时气象接口返回 HTTP ${response.status}`);
        return normalizeWeather(await response.json(), config);
    } catch (error) {
        if (error?.name === 'AbortError') throw new Error('连接实时气象接口超时');
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

async function getCurrentWeather() {
    if (weatherCache && weatherCache.expiresAt > Date.now()) return weatherCache.data;
    if (weatherRequest) return weatherRequest;

    const config = getConfig();
    weatherRequest = requestCurrentWeather(config)
        .then((data) => {
            weatherCache = { data, expiresAt: Date.now() + CACHE_MS };
            return data;
        })
        .catch((error) => {
            if (weatherCache?.data) return { ...weatherCache.data, stale: true };
            throw error;
        })
        .finally(() => {
            weatherRequest = null;
        });

    return weatherRequest;
}

module.exports = { getCurrentWeather };
