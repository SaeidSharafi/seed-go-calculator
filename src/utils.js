import { ENDURANCE_COST_MULTIPLIER, LEVEL_UP_DATA, RARITY_DATA, FIBONACCI_REDUCTION_PERCENT, BOOST_COST_DATA } from './data.js'

export function clamp(num, min, max) {
    return Math.max(min, Math.min(num, max));
}

export function findRarityInfo(rarityName) {
    return RARITY_DATA.find(r => r.name === rarityName);
}

export function getClassCoefficient(className) {
    const coefficients = {
        Aqua: 0.85, Reptile: 0.89, Beast: 0.93, Plant: 0.97, Bird: 1.00, Ghost: 1.03
    };
    return coefficients[className] ?? 0.9;
}

export function getFibonacciReductionPercent(year) {
    return FIBONACCI_REDUCTION_PERCENT[clamp(year, 0, FIBONACCI_REDUCTION_PERCENT.length - 1)];
}

export function getSloveLevelUpCost(targetLevel) {
    const data = LEVEL_UP_DATA.find(item => parseInt(item.level) === targetLevel);
    return data ? parseFloat(data.priceSlove) : Infinity;
}
export function getSeedLevelUpCost(targetLevel) {
    const data = LEVEL_UP_DATA.find(item => parseInt(item.level) === targetLevel);
    return data ? parseFloat(data.priceSeed) : Infinity;
}
export function calculateEnduranceConsumedPerHuntAction(totalRecoveryPoints, energyPerHunt) {
    if (totalRecoveryPoints <= 0) return Infinity;
    if (energyPerHunt <= 0) return 0;
    return parseFloat(((15 / Math.pow(totalRecoveryPoints, 0.65)) * energyPerHunt).toFixed(6));
}
export function formatNumber(num) {
    if (num === null || num === undefined) return "N/A";
    if (!isFinite(num)) return "Infinite";
    return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function calculateBaseSlovePerHuntAction(totalProficiencyPoints, className, energyPerHunt) {
    if (totalProficiencyPoints <= 0 || energyPerHunt <= 0) return 0;
    return parseFloat((getClassCoefficient(className) * Math.sqrt(totalProficiencyPoints) * energyPerHunt).toFixed(2));
}

export function calculateSlovRecoveryCost(enduranceConsumed, rarityName, level) {
    const coeff = ENDURANCE_COST_MULTIPLIER[rarityName]?.[level.toString()] ?? 0;
    return parseFloat((enduranceConsumed * coeff).toFixed(2));
}

export function formatTimeDH(totalMinutes) {
    if (totalMinutes === null || totalMinutes < 0) return "N/A";
    if (!isFinite(totalMinutes)) return "Infinite";
    const totalHours = totalMinutes / 60;
    const days = Math.floor(totalHours / 24);
    const hours = Math.floor(totalHours % 24);
    const mins = Math.floor(totalMinutes % 60);
    return `${days}d ${hours}h ${mins}m`;
}
export function getLevelUpTimeHours(level) {
    const data = LEVEL_UP_DATA.find(item => parseInt(item.level) === level);
    return data ? parseFloat(data.timeHour) : Infinity;
}

export function getBoostCost(targetLevel) {
    const boostData = BOOST_COST_DATA.find(data => data.level === targetLevel);
    if (boostData) {
        const cost = parseFloat(boostData.slove);
        return isFinite(cost) ? cost : 0;
    }

    return 0;
}