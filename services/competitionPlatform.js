const DEFAULT_API_BASE = 'https://dev.api.lingan.tech';
const REQUEST_TIMEOUT_MS = 10 * 1000;

class CompetitionApiError extends Error {
    constructor(message, status = 502, body = null) {
        super(message);
        this.name = 'CompetitionApiError';
        this.status = status;
        this.body = body;
    }
}

function getConfig() {
    return {
        token: String(process.env.COMPETITION_TOKEN || '').trim(),
        apiBase: String(process.env.COMPETITION_API_BASE || DEFAULT_API_BASE).replace(/\/$/, ''),
        primaryDeviceId: String(process.env.COMPETITION_PRIMARY_DEVICE_ID || '').trim(),
        primaryDeviceName: String(process.env.COMPETITION_PRIMARY_DEVICE_NAME || '').trim(),
    };
}

async function requestJson(pathname) {
    const config = getConfig();
    if (!config.token) {
        throw new CompetitionApiError('后台尚未配置比赛设备接口凭证', 503);
    }
    if (typeof fetch !== 'function') {
        throw new CompetitionApiError('当前 Node.js 版本不支持比赛设备接口，请升级到 Node.js 18 或更高版本', 503);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        const response = await fetch(`${config.apiBase}/openapi/v1${pathname}`, {
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${config.token}`,
            },
            cache: 'no-store',
            redirect: 'error',
            signal: controller.signal,
        });
        const text = await response.text();
        let body = null;
        if (text) {
            try {
                body = JSON.parse(text);
            } catch {
                body = null;
            }
        }
        if (!response.ok) {
            throw new CompetitionApiError(
                body?.message || `比赛设备接口返回 HTTP ${response.status}`,
                response.status,
                body,
            );
        }
        if (!body || typeof body !== 'object') {
            throw new CompetitionApiError('比赛设备接口返回了无效数据');
        }
        return body;
    } catch (error) {
        if (error?.name === 'AbortError') {
            throw new CompetitionApiError('连接比赛设备接口超时', 504);
        }
        if (error instanceof CompetitionApiError) throw error;
        throw new CompetitionApiError(`比赛设备接口连接失败：${error?.message || String(error)}`);
    } finally {
        clearTimeout(timeout);
    }
}

function validateDeviceId(deviceId) {
    const value = String(deviceId || '').trim();
    // Existing GB/T 28181 and camera identifiers can contain ':' separators.
    // Keep the accepted set path-safe and always URL-encode it upstream.
    if (!value || value.length > 160 || !/^[a-zA-Z0-9_.:-]+$/.test(value)) {
        throw new CompetitionApiError('设备 ID 格式无效', 400);
    }
    return value;
}

async function getLatestGasReadings() {
    const result = await requestJson('/gas-readings/latest');
    const config = getConfig();
    if (!Array.isArray(result.devices) || !config.primaryDeviceId) return result;

    const devices = result.devices.map((device) => (
        device.deviceId === config.primaryDeviceId
            ? { ...device, deviceName: config.primaryDeviceName || device.deviceName || device.deviceId, primary: true }
            : device
    )).sort((left, right) => Number(Boolean(right.primary)) - Number(Boolean(left.primary)));
    return { ...result, devices };
}

async function getPlayInfo(deviceId, protocol = 'flv') {
    const safeDeviceId = validateDeviceId(deviceId);
    if (!['flv', 'hls', 'webrtc'].includes(protocol)) {
        throw new CompetitionApiError('不支持的视频播放协议', 400);
    }
    return requestJson(`/devices/${encodeURIComponent(safeDeviceId)}/play-info?protocol=${encodeURIComponent(protocol)}`);
}

module.exports = {
    CompetitionApiError,
    getLatestGasReadings,
    getPlayInfo,
};
