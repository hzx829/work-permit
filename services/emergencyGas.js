const GAS_ALARM_RULES = Object.freeze({
    O2: Object.freeze({ threshold: 18, upperThreshold: 23.5, direction: 'outside', inclusive: true }),
    OXYGEN: Object.freeze({ threshold: 18, upperThreshold: 23.5, direction: 'outside', inclusive: true }),
    CO2: Object.freeze({ threshold: 1, direction: 'max', inclusive: true }),
    CO: Object.freeze({ threshold: 20, direction: 'max', inclusive: false }),
    H2S: Object.freeze({ threshold: 10, direction: 'max', inclusive: false }),
    COMBUSTIBLE: Object.freeze({ threshold: 25, direction: 'max', inclusive: false }),
});
const GAS_FRESH_WINDOW_MS = 2 * 60 * 1000;

function isReadingExceeded(reading) {
    const value = Number(reading?.value);
    if (!Number.isFinite(value)) return false;

    const key = String(reading?.key || '').toUpperCase();
    const rule = GAS_ALARM_RULES[key];
    if (rule?.direction === 'outside') {
        const lowerExceeded = rule.inclusive ? value <= rule.threshold : value < rule.threshold;
        return lowerExceeded || value > rule.upperThreshold;
    }
    if (rule?.direction === 'max') {
        return rule.inclusive ? value >= rule.threshold : value > rule.threshold;
    }

    const threshold = Number(reading?.threshold);
    return Number.isFinite(threshold) && value > threshold;
}

function applyEmergencyGasRules(gas) {
    if (!gas?.readings?.length) return gas;
    return {
        ...gas,
        readings: gas.readings.map((reading) => {
            const key = String(reading?.key || '').toUpperCase();
            const rule = GAS_ALARM_RULES[key];
            const normalized = rule ? {
                ...reading,
                threshold: rule.threshold,
                ...(rule.upperThreshold === undefined ? {} : { upperThreshold: rule.upperThreshold }),
                alarmDirection: rule.direction,
                alarmInclusive: rule.inclusive,
            } : reading;
            return { ...normalized, exceeded: isReadingExceeded(normalized) };
        }),
    };
}

function gasExceeded(gas) {
    return Boolean(gas?.readings?.some(isReadingExceeded));
}

function prioritizeGasAlarmCandidates(realGases, simulationGas) {
    return [
        ...(Array.isArray(realGases) ? realGases.filter(Boolean) : []),
        ...(simulationGas ? [simulationGas] : []),
    ];
}

function getGasAlarmSourceKey(gas) {
    const identity = String(gas?.deviceId || gas?.deviceName || gas?.location || 'unknown').trim();
    return identity.slice(0, 160) || 'unknown';
}

function isAlarmEpisodeStale(state, now = Date.now(), maxAgeMs = GAS_FRESH_WINDOW_MS) {
    if (!state?.active) return false;
    const timestamp = Date.parse(state.last_measured_at || state.started_at || '');
    return Number.isFinite(timestamp) && now - timestamp > maxAgeMs;
}

module.exports = {
    GAS_ALARM_RULES,
    GAS_FRESH_WINDOW_MS,
    applyEmergencyGasRules,
    gasExceeded,
    getGasAlarmSourceKey,
    isReadingExceeded,
    isAlarmEpisodeStale,
    prioritizeGasAlarmCandidates,
};
