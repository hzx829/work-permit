const GAS_DECIMAL_DIGITS = {
    CH4: 3,
    CO2: 3,
    O2: 2,
    OXYGEN: 2,
    CO: 2,
    H2S: 2,
    COMBUSTIBLE: 2,
};

export function formatGasValue(value, key = '') {
    if (value === null || value === undefined || value === '') return '--';
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return String(value);

    return numericValue.toLocaleString('zh-CN', {
        useGrouping: false,
        maximumFractionDigits: GAS_DECIMAL_DIGITS[String(key).toUpperCase()] ?? 3,
    });
}
