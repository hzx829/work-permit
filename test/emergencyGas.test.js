const assert = require('node:assert/strict');
const test = require('node:test');
const {
    applyEmergencyGasRules,
    gasExceeded,
    getGasAlarmSourceKey,
    isAlarmEpisodeStale,
    isReadingExceeded,
    prioritizeGasAlarmCandidates,
} = require('../services/emergencyGas');

test('keeps normal oxygen and carbon dioxide readings below the alarm boundary', () => {
    const gas = applyEmergencyGasRules({
        readings: [
            { key: 'O2', value: 19.2, unit: 'Vol' },
            { key: 'CO2', value: 0.06, unit: 'Vol' },
        ],
    });

    assert.equal(gasExceeded(gas), false);
    assert.deepEqual(gas.readings.map((reading) => reading.exceeded), [false, false]);
});

test('triggers at the inclusive oxygen lower boundary', () => {
    assert.equal(isReadingExceeded({ key: 'O2', value: 18 }), true);
    assert.equal(isReadingExceeded({ key: 'O2', value: 18.01 }), false);
});

test('triggers at the inclusive carbon dioxide upper boundary', () => {
    assert.equal(isReadingExceeded({ key: 'CO2', value: 1 }), true);
    assert.equal(isReadingExceeded({ key: 'CO2', value: 0.99 }), false);
});

test('triggers when either configured condition is met', () => {
    assert.equal(gasExceeded({ readings: [
        { key: 'O2', value: 17.9 },
        { key: 'CO2', value: 0.06 },
    ] }), true);
    assert.equal(gasExceeded({ readings: [
        { key: 'O2', value: 19.2 },
        { key: 'CO2', value: 1.01 },
    ] }), true);
});

test('uses a stable device identity for one continuous alarm episode', () => {
    assert.equal(getGasAlarmSourceKey({ deviceId: 'gas-detector-01', measuredAt: 'first' }), 'gas-detector-01');
    assert.equal(getGasAlarmSourceKey({ deviceId: 'gas-detector-01', measuredAt: 'later' }), 'gas-detector-01');
    assert.equal(getGasAlarmSourceKey({ deviceName: '备用检测仪' }), '备用检测仪');
});

test('expires an active alarm episode after its device stops reporting', () => {
    const now = Date.parse('2026-09-17T09:00:00Z');
    assert.equal(isAlarmEpisodeStale({
        active: 1,
        last_measured_at: '2026-09-17T08:57:59Z',
    }, now), true);
    assert.equal(isAlarmEpisodeStale({
        active: 1,
        last_measured_at: '2026-09-17T08:58:01Z',
    }, now), false);
    assert.equal(isAlarmEpisodeStale({
        active: 0,
        last_measured_at: '2026-09-17T08:00:00Z',
    }, now), false);
});

test('keeps real detector alarms ahead of the simulation fallback', () => {
    const realAlarm = { deviceId: 'REAL-GAS-001' };
    const simulationAlarm = { deviceId: 'SIM-GAS-001', simulated: true };

    assert.deepEqual(
        prioritizeGasAlarmCandidates([realAlarm], simulationAlarm),
        [realAlarm, simulationAlarm],
    );
    assert.deepEqual(
        prioritizeGasAlarmCandidates([], simulationAlarm),
        [simulationAlarm],
    );
});
