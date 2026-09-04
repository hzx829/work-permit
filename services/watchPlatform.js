const crypto = require('crypto');

const DEFAULT_API_BASE = 'https://webapi.aiday.com.cn:8197/api';
const PASSWORD_PASSPHRASE = 'oviphone20250718UserPwdShanghai';
const SNAPSHOT_CACHE_MS = 15 * 1000;
const SESSION_CACHE_MS = 20 * 60 * 1000;
const ONLINE_WINDOW_MS = 12 * 60 * 1000;
const DEFAULT_DEVICE_NAMES = ['化院1', '化院2'];

let sessionCache = null;
let snapshotCache = null;
let snapshotRequest = null;

function getConfig() {
    const configuredNames = String(process.env.WATCH_PLATFORM_DEVICE_NAMES || '')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);

    return {
        username: String(process.env.WATCH_PLATFORM_USERNAME || '').trim(),
        password: String(process.env.WATCH_PLATFORM_PASSWORD || ''),
        apiBase: String(process.env.WATCH_PLATFORM_API_BASE || DEFAULT_API_BASE).replace(/\/$/, ''),
        deviceNames: configuredNames.length ? configuredNames : DEFAULT_DEVICE_NAMES,
    };
}

function evpBytesToKey(password, salt, length) {
    const blocks = [];
    let previous = Buffer.alloc(0);

    while (Buffer.concat(blocks).length < length) {
        previous = crypto
            .createHash('md5')
            .update(Buffer.concat([previous, password, salt]))
            .digest();
        blocks.push(previous);
    }

    return Buffer.concat(blocks).subarray(0, length);
}

function encryptVendorPassword(password) {
    const salt = crypto.randomBytes(8);
    const material = evpBytesToKey(Buffer.from(PASSWORD_PASSPHRASE), salt, 48);
    const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        material.subarray(0, 32),
        material.subarray(32, 48),
    );
    const encrypted = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()]);

    return Buffer.concat([Buffer.from('Salted__'), salt, encrypted]).toString('base64');
}

async function postVendorApi(apiBase, pathName, body, bearerToken = '') {
    if (typeof fetch !== 'function') {
        throw new Error('当前 Node.js 版本不支持手表平台连接，请升级到 Node.js 18 或更高版本');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(`${apiBase}${pathName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error(`厂家平台接口返回 HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        if (error?.name === 'AbortError') {
            throw new Error('连接厂家手表平台超时');
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

async function login(config) {
    const fingerprint = `${config.apiBase}|${config.username}`;
    if (
        sessionCache
        && sessionCache.fingerprint === fingerprint
        && sessionCache.expiresAt > Date.now()
    ) {
        return sessionCache;
    }

    const result = await postVendorApi(config.apiBase, '/User/Login', {
        Name: config.username,
        Pass: encryptVendorPassword(config.password),
        Language: 'zhCn',
    });

    if (result?.State !== 0 || !result?.Item?.UserId || !result?.refreshToken) {
        throw new Error('厂家手表平台登录失败，请检查接入账号');
    }

    sessionCache = {
        fingerprint,
        userId: result.Item.UserId,
        bearerToken: result.refreshToken,
        expiresAt: Date.now() + SESSION_CACHE_MS,
    };

    return sessionCache;
}

function shanghaiDateString(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);
    const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${value.year}-${value.month}-${value.day}`;
}

function asNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function positiveNumber(value) {
    const number = asNumber(value);
    return number !== null && number > 0 ? number : null;
}

function parseVendorUtc(value) {
    if (!value || /^1899-|^1900-/.test(String(value))) return null;
    const normalized = String(value).trim().replace(' ', 'T');
    const timestamp = Date.parse(/[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized) ? normalized : `${normalized}Z`);
    return Number.isFinite(timestamp) ? timestamp : null;
}

function toIsoTimestamp(value) {
    const timestamp = parseVendorUtc(value);
    return timestamp === null ? null : new Date(timestamp).toISOString();
}

const COORDINATE_PI = Math.PI;
const BD09_X_PI = (Math.PI * 3000) / 180;
const GCJ_A = 6378245;
const GCJ_EE = 0.006693421622965943;

function outsideChina(lat, lng) {
    return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

function transformLatitude(lat, lng) {
    let value = -100 + (2 * lng) + (3 * lat) + (0.2 * lat * lat)
        + (0.1 * lng * lat) + (0.2 * Math.sqrt(Math.abs(lng)));
    value += ((20 * Math.sin(6 * lng * COORDINATE_PI)) + (20 * Math.sin(2 * lng * COORDINATE_PI))) * 2 / 3;
    value += ((20 * Math.sin(lat * COORDINATE_PI)) + (40 * Math.sin(lat / 3 * COORDINATE_PI))) * 2 / 3;
    value += ((160 * Math.sin(lat / 12 * COORDINATE_PI)) + (320 * Math.sin(lat * COORDINATE_PI / 30))) * 2 / 3;
    return value;
}

function transformLongitude(lat, lng) {
    let value = 300 + lng + (2 * lat) + (0.1 * lng * lng)
        + (0.1 * lng * lat) + (0.1 * Math.sqrt(Math.abs(lng)));
    value += ((20 * Math.sin(6 * lng * COORDINATE_PI)) + (20 * Math.sin(2 * lng * COORDINATE_PI))) * 2 / 3;
    value += ((20 * Math.sin(lng * COORDINATE_PI)) + (40 * Math.sin(lng / 3 * COORDINATE_PI))) * 2 / 3;
    value += ((150 * Math.sin(lng / 12 * COORDINATE_PI)) + (300 * Math.sin(lng / 30 * COORDINATE_PI))) * 2 / 3;
    return value;
}

function wgs84ToGcj02(lat, lng) {
    if (outsideChina(lat, lng)) return { lat, lng };

    let deltaLat = transformLatitude(lat - 35, lng - 105);
    let deltaLng = transformLongitude(lat - 35, lng - 105);
    const radLat = lat / 180 * COORDINATE_PI;
    let magic = Math.sin(radLat);
    magic = 1 - (GCJ_EE * magic * magic);
    const sqrtMagic = Math.sqrt(magic);
    deltaLat = (deltaLat * 180) / (((GCJ_A * (1 - GCJ_EE)) / (magic * sqrtMagic)) * COORDINATE_PI);
    deltaLng = (deltaLng * 180) / ((GCJ_A / sqrtMagic) * Math.cos(radLat) * COORDINATE_PI);
    return { lat: lat + deltaLat, lng: lng + deltaLng };
}

function gcj02ToWgs84(lat, lng) {
    let wgsLat = lat;
    let wgsLng = lng;

    for (let index = 0; index < 10; index += 1) {
        const converted = wgs84ToGcj02(wgsLat, wgsLng);
        const deltaLat = converted.lat - lat;
        const deltaLng = converted.lng - lng;
        wgsLat -= deltaLat;
        wgsLng -= deltaLng;
        if (Math.abs(deltaLat) < 0.0000001 && Math.abs(deltaLng) < 0.0000001) break;
    }

    return { lat: wgsLat, lng: wgsLng };
}

function bd09ToWgs84(lat, lng) {
    const x = lng - 0.0065;
    const y = lat - 0.006;
    const z = Math.sqrt((x * x) + (y * y)) - (0.00002 * Math.sin(y * BD09_X_PI));
    const theta = Math.atan2(y, x) - (0.000003 * Math.cos(x * BD09_X_PI));
    return gcj02ToWgs84(z * Math.sin(theta), z * Math.cos(theta));
}

function usableCoordinates(lat, lng) {
    return lat !== null
        && lng !== null
        && lat >= -90
        && lat <= 90
        && lng >= -180
        && lng <= 180
        && !(lat === 0 && lng === 0)
        && !(lat === -1 && lng === -1);
}

function normalizeCoordinates(device) {
    const candidates = [
        [device?._Latitude, device?._Longitude, 'WGS84'],
        [device?._OLat, device?._OLng, 'WGS84'],
    ];

    for (const [latValue, lngValue, coordinateSystem] of candidates) {
        const lat = asNumber(latValue);
        const lng = asNumber(lngValue);
        if (usableCoordinates(lat, lng)) {
            return { lat, lng, coordinateSystem, sourceCoordinateSystem: coordinateSystem };
        }
    }

    const baiduLat = asNumber(device?._BaiduLat);
    const baiduLng = asNumber(device?._BaiduLng);
    if (usableCoordinates(baiduLat, baiduLng)) {
        const converted = bd09ToWgs84(baiduLat, baiduLng);
        return {
            lat: converted.lat,
            lng: converted.lng,
            coordinateSystem: 'WGS84',
            sourceCoordinateSystem: 'BD09',
        };
    }

    return { lat: null, lng: null, coordinateSystem: null, sourceCoordinateSystem: null };
}

function normalizeWatch(device, healthByImei, now) {
    const imei = String(device?._SerialNumber || '').trim();
    const shortCode = imei ? imei.slice(-5) : String(device?._DeviceID || '未知');
    const health = healthByImei.get(imei) || {};
    const lastCommunicationTimestamp = parseVendorUtc(device?.LastCommunicationStr);
    const online = lastCommunicationTimestamp !== null
        && now - lastCommunicationTimestamp <= ONLINE_WINDOW_MS;
    const coordinates = normalizeCoordinates(device);
    const alert = Boolean(
        (asNumber(device?._SosStatus) || 0) > 0
        || (typeof device?._Exception === 'string' && device._Exception.trim())
    );

    return {
        id: String(device?._DeviceID || imei || shortCode),
        name: String(device?._Nickname || device?._DeviceName || shortCode).trim() || shortCode,
        code: shortCode,
        model: String(device?._ModelName || device?._Model || '').trim(),
        online,
        alert,
        lat: coordinates.lat,
        lng: coordinates.lng,
        coordinateSystem: coordinates.coordinateSystem,
        sourceCoordinateSystem: coordinates.sourceCoordinateSystem,
        lastCommunicationAt: toIsoTimestamp(device?.LastCommunicationStr),
        deviceTime: toIsoTimestamp(device?.DeviceUtcDateStr),
        healthUpdatedAt: toIsoTimestamp(health.LastUpdate),
        heartRate: positiveNumber(health.Heartbeat ?? device?._HeartRate),
        bloodOxygen: positiveNumber(health.BloodOxygen ?? device?._BloodOxygen),
        systolicPressure: positiveNumber(health.Shrink),
        diastolicPressure: positiveNumber(health.Diastolic),
        bodyTemperature: positiveNumber(health.BodyTtemperature ?? device?._Temperature),
        wristTemperature: positiveNumber(health.WristTemperature),
        steps: asNumber(health.Step ?? device?._Steps ?? device?._Step),
        signal: positiveNumber(device?._Signal ?? device?._Singal),
    };
}

async function fetchSnapshot(config, allowRetry = true) {
    const session = await login(config);
    const day = shanghaiDateString();
    const commonDeviceQuery = {
        UserId: session.userId,
        Id: session.userId,
        PageCount: 100,
        imei: '',
        modelId: 0,
        PageNo: 1,
        timeZone: 0,
    };

    const [deviceResult, healthResult] = await Promise.all([
        postVendorApi(config.apiBase, '/Device/devicesByUserId', commonDeviceQuery, session.bearerToken),
        postVendorApi(config.apiBase, '/Device/allHealthDataPage', {
            BaseUid: session.userId,
            UserId: session.userId,
            StartTime: `${day} 00:00:00`,
            endTime: `${day} 23:59:59`,
            imei: '',
            timeZone: 0,
            PageNo: 1,
            PageCount: 100,
        }, session.bearerToken),
    ]);

    if (deviceResult?.State === 1100 || healthResult?.State === 1100) {
        if (!allowRetry) throw new Error('厂家手表平台登录状态已失效');
        sessionCache = null;
        return fetchSnapshot(config, false);
    }

    if (deviceResult?.State !== 200) {
        throw new Error('厂家手表平台未返回设备数据');
    }

    const healthRows = healthResult?.State === 200 && Array.isArray(healthResult.list)
        ? healthResult.list
        : [];
    const healthByImei = new Map(
        healthRows.map((item) => [String(item.Imei || '').trim(), item]),
    );
    const now = Date.now();
    const allowedNames = new Set(config.deviceNames);
    const watches = (deviceResult.devices || [])
        .filter((device) => allowedNames.has(String(device?._Nickname || device?._DeviceName || '').trim()))
        .map((device) => normalizeWatch(device, healthByImei, now))
        .sort((left, right) => Number(right.online) - Number(left.online));

    return {
        configured: true,
        source: 'aiday',
        updatedAt: new Date().toISOString(),
        stats: {
            total: watches.length,
            online: watches.filter((watch) => watch.online).length,
            offline: watches.filter((watch) => !watch.online).length,
            located: watches.filter((watch) => watch.lat !== null && watch.lng !== null).length,
            withHealthData: watches.filter((watch) => watch.heartRate !== null).length,
            alerts: watches.filter((watch) => watch.alert).length,
        },
        watches,
    };
}

async function getWatchSnapshot() {
    const config = getConfig();
    if (!config.username || !config.password) {
        return {
            configured: false,
            source: 'aiday',
            updatedAt: new Date().toISOString(),
            stats: { total: 0, online: 0, offline: 0, located: 0, withHealthData: 0, alerts: 0 },
            watches: [],
        };
    }

    if (snapshotCache && snapshotCache.expiresAt > Date.now()) {
        return snapshotCache.value;
    }

    if (!snapshotRequest) {
        snapshotRequest = fetchSnapshot(config)
            .then((value) => {
                snapshotCache = { value, expiresAt: Date.now() + SNAPSHOT_CACHE_MS };
                return value;
            })
            .finally(() => {
                snapshotRequest = null;
            });
    }

    return snapshotRequest;
}

module.exports = {
    getWatchSnapshot,
    encryptVendorPassword,
};
