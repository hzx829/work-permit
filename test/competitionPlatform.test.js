const assert = require('node:assert/strict');
const test = require('node:test');
const {
    CompetitionApiError,
    getLatestGasReadings,
    getPlayInfo,
    toEmergencyGasReading,
} = require('../services/competitionPlatform');

test.afterEach(() => {
    delete process.env.COMPETITION_TOKEN;
    delete process.env.COMPETITION_API_BASE;
    delete process.env.COMPETITION_PRIMARY_DEVICE_ID;
    delete process.env.COMPETITION_PRIMARY_DEVICE_NAME;
});

test('requires the server-side competition token', async () => {
    await assert.rejects(getLatestGasReadings(), (error) => (
        error instanceof CompetitionApiError && error.status === 503
    ));
});

test('forwards gas requests with the fixed token without changing the response', async (context) => {
    process.env.COMPETITION_TOKEN = 'test-secret';
    process.env.COMPETITION_API_BASE = 'https://competition.example.test';
    const originalFetch = global.fetch;
    context.after(() => { global.fetch = originalFetch; });
    global.fetch = async (url, options) => {
        assert.equal(url, 'https://competition.example.test/openapi/v1/gas-readings/latest');
        assert.equal(options.headers.Authorization, 'Bearer test-secret');
        return new Response(JSON.stringify({ serverTime: '2026-09-10T02:00:00Z', devices: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    };

    assert.deepEqual(await getLatestGasReadings(), {
        serverTime: '2026-09-10T02:00:00Z',
        devices: [],
    });
});

test('coalesces concurrent gas polling requests into one upstream call', async (context) => {
    process.env.COMPETITION_TOKEN = 'coalesce-secret';
    process.env.COMPETITION_API_BASE = 'https://coalesce.example.test';
    const originalFetch = global.fetch;
    context.after(() => { global.fetch = originalFetch; });
    let requestCount = 0;
    global.fetch = async () => {
        requestCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return new Response(JSON.stringify({ devices: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    };

    const [first, second] = await Promise.all([getLatestGasReadings(), getLatestGasReadings()]);
    assert.deepEqual(first, { devices: [] });
    assert.deepEqual(second, { devices: [] });
    assert.equal(requestCount, 1);
});

test('validates device ids and supported playback protocols before requesting play info', async () => {
    process.env.COMPETITION_TOKEN = 'test-secret';
    await assert.rejects(() => getPlayInfo('../other-device', 'flv'), (error) => error.status === 400);
    await assert.rejects(() => getPlayInfo('bodycam-01', 'rtsp'), (error) => error.status === 400);
});

test('accepts colon-separated device ids used by existing cameras', async (context) => {
    process.env.COMPETITION_TOKEN = 'test-secret';
    process.env.COMPETITION_API_BASE = 'https://competition.example.test';
    const originalFetch = global.fetch;
    context.after(() => { global.fetch = originalFetch; });
    global.fetch = async (url) => {
        assert.equal(url, 'https://competition.example.test/openapi/v1/devices/33011000%3Adevice_1/play-info?protocol=flv');
        return new Response(JSON.stringify({ deviceId: '33011000:device_1', protocol: 'flv', url: 'http://live.lysafe.tech/live/example.flv' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    };

    const result = await getPlayInfo('33011000:device_1', 'flv');
    assert.equal(result.protocol, 'flv');
});

test('places the configured primary field device first and adds its display name', async (context) => {
    process.env.COMPETITION_TOKEN = 'test-secret';
    process.env.COMPETITION_PRIMARY_DEVICE_ID = 'app_primary';
    process.env.COMPETITION_PRIMARY_DEVICE_NAME = 'BC310D-Pro';
    const originalFetch = global.fetch;
    context.after(() => { global.fetch = originalFetch; });
    global.fetch = async () => new Response(JSON.stringify({
        devices: [{ deviceId: 'camera_other' }, { deviceId: 'app_primary' }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const result = await getLatestGasReadings();
    assert.equal(result.devices[0].deviceId, 'app_primary');
    assert.equal(result.devices[0].deviceName, 'BC310D-Pro');
    assert.equal(result.devices[0].primary, true);
});

test('normalizes the latest fresh competition reading for emergency monitoring', () => {
    assert.deepEqual(toEmergencyGasReading({ devices: [{
        deviceId: 'bodycam-01',
        deviceName: '现场气体检测仪',
        readingId: 'reading-7',
        sampledAt: '2026-09-16T02:00:00Z',
        dataStatus: 'fresh',
        gasData: {
            O2: { value: 18.8, unit: 'Vol' },
            CO: { value: 25, unit: 'ppm' },
        },
    }] }), {
        id: 'reading-7',
        deviceId: 'bodycam-01',
        deviceName: '现场气体检测仪',
        location: '',
        measuredAt: '2026-09-16T02:00:00Z',
        readings: [
            { key: 'O2', label: '氧气浓度', value: 18.8, unit: 'Vol' },
            { key: 'CO', label: '一氧化碳浓度', value: 25, unit: 'ppm' },
        ],
    });
});

test('does not turn stale competition data into an emergency reading', () => {
    assert.equal(toEmergencyGasReading({ devices: [{
        deviceId: 'bodycam-01',
        dataStatus: 'stale',
        gasData: { O2: { value: 18.8, unit: 'Vol' } },
    }] }), null);
});
