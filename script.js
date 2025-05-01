// --- Data Constants ---
const RARITY_DATA = [
    { name: "Common", minBase: 1, maxBase: 10, bonusPts: 4 },
    { name: "Uncommon", minBase: 8, maxBase: 18, bonusPts: 6 },
    { name: "Rare", minBase: 15, maxBase: 35, bonusPts: 8 },
    { name: "Epic", minBase: 28, maxBase: 63, bonusPts: 10 },
    { name: "Legendary", minBase: 50, maxBase: 112, bonusPts: 12 },
];

const BASE_EARNING_COEFFICIENTS = {
    Common: {
        0: 0.2, 1: 0.31, 2: 0.32, 3: 0.33, 4: 0.35, 5: 0.36, 6: 0.37, 7: 0.38, 8: 0.4, 9: 0.41, 10: 0.42, 11: 0.44, 12: 0.46, 13: 0.48, 14: 0.5, 15: 0.52, 16: 0.54, 17: 0.56, 18: 0.58, 19: 0.6, 20: 0.62, 21: 0.64, 22: 0.67, 23: 0.7, 24: 0.72, 25: 0.75, 26: 0.78, 27: 0.81, 28: 0.83, 29: 0.87, 30: 0.9
    },
    Uncommon: {
        0: 0.3, 1: 0.41, 2: 0.43, 3: 0.45, 4: 0.46, 5: 0.48, 6: 0.5, 7: 0.51, 8: 0.53, 9: 0.55, 10: 0.68, 11: 0.72, 12: 0.74, 13: 0.77, 14: 0.79, 15: 0.83, 16: 0.85, 17: 0.89, 18: 0.92, 19: 0.96, 20: 1, 21: 1.03, 22: 1.07, 23: 1.1, 24: 1.14, 25: 1.2, 26: 1.24, 27: 1.27, 28: 1.33, 29: 1.38, 30: 1.44
    },
    Rare: {
        0: 0.4, 1: 0.51, 2: 0.54, 3: 0.57, 4: 0.59, 5: 0.61, 6: 0.63, 7: 0.65, 8: 0.67, 9: 0.69, 10: 0.936, 11: 0.98, 12: 1.01, 13: 1.05, 14: 1.09, 15: 1.13, 16: 1.17, 17: 1.22, 18: 1.26, 19: 1.3, 20: 1.56, 21: 1.62, 22: 1.68, 23: 1.74, 24: 1.8, 25: 1.88, 26: 1.95, 27: 2.01, 28: 2.09, 29: 2.18, 30: 2.25
    },
    Epic: {
        0: 0.5, 1: 0.61, 2: 0.64, 3: 0.67, 4: 0.69, 5: 0.71, 6: 0.73, 7: 0.76, 8: 0.79, 9: 0.82, 10: 1.28, 11: 1.34, 12: 1.4, 13: 1.46, 14: 1.5, 15: 1.56, 16: 1.62, 17: 1.68, 18: 1.74, 19: 1.8, 20: 2.48, 21: 2.58, 22: 2.68, 23: 2.78, 24: 2.9, 25: 3, 26: 3.1, 27: 3.22, 28: 3.34, 29: 3.46, 30: 3.6
    },
    Legendary: {
        0: 0.6, 1: 0.71, 2: 0.74, 3: 0.77, 4: 0.79, 5: 0.81, 6: 0.83, 7: 0.88, 8: 0.92, 9: 0.96, 10: 1.68, 11: 1.74, 12: 1.8, 13: 1.96, 14: 2.1, 15: 2.16, 16: 2.22, 17: 2.28, 18: 2.34, 19: 2.4, 20: 3.48, 21: 3.58, 22: 3.68, 23: 3.83, 24: 4.1, 25: 4.2, 26: 4.3, 27: 4.52, 28: 4.64, 29: 4.76, 30: 5
    }
};

const LEVEL_UP_DATA = [
    { level: "0", priceSlove: "0", priceSeed: "0", timeHour: "0" },
    { level: "1", priceSlove: "1", priceSeed: "10", timeHour: "1" },
    { level: "2", priceSlove: "2", priceSeed: "20", timeHour: "2" },
    { level: "3", priceSlove: "3", priceSeed: "30", timeHour: "3" },
    { level: "4", priceSlove: "4", priceSeed: "40", timeHour: "4" },
    { level: "5", priceSlove: "20", priceSeed: "100", timeHour: "5" },
    { level: "6", priceSlove: "9", priceSeed: "69", timeHour: "6" },
    { level: "7", priceSlove: "10.5", priceSeed: "105", timeHour: "7" },
    { level: "8", priceSlove: "12", priceSeed: "120", timeHour: "8" },
    { level: "9", priceSlove: "13.5", priceSeed: "135", timeHour: "9" },
    { level: "10", priceSlove: "30", priceSeed: "300", timeHour: "10" },
    { level: "11", priceSlove: "16.5", priceSeed: "165", timeHour: "11" },
    { level: "12", priceSlove: "18", priceSeed: "180", timeHour: "12" },
    { level: "13", priceSlove: "19.5", priceSeed: "195", timeHour: "13" },
    { level: "14", priceSlove: "21", priceSeed: "210", timeHour: "14" },
    { level: "15", priceSlove: "22.5", priceSeed: "225", timeHour: "15" },
    { level: "16", priceSlove: "24", priceSeed: "240", timeHour: "16" },
    { level: "17", priceSlove: "25.5", priceSeed: "255", timeHour: "17" },
    { level: "18", priceSlove: "27", priceSeed: "270", timeHour: "18" },
    { level: "19", priceSlove: "28.5", priceSeed: "285", timeHour: "19" },
    { level: "20", priceSlove: "60", priceSeed: "600", timeHour: "20" },
    { level: "21", priceSlove: "31.5", priceSeed: "315", timeHour: "21" },
    { level: "22", priceSlove: "33", priceSeed: "330", timeHour: "22" },
    { level: "23", priceSlove: "34.5", priceSeed: "345", timeHour: "23" },
    { level: "24", priceSlove: "36", priceSeed: "360", timeHour: "24" },
    { level: "25", priceSlove: "37.5", priceSeed: "375", timeHour: "25" },
    { level: "26", priceSlove: "39", priceSeed: "390", timeHour: "26" },
    { level: "27", priceSlove: "40.5", priceSeed: "405", timeHour: "27" },
    { level: "28", priceSlove: "42", priceSeed: "420", timeHour: "28" },
    { level: "29", priceSlove: "43.5", priceSeed: "435", timeHour: "29" },
    { level: "30", priceSlove: "100", priceSeed: "1000", timeHour: "30" }
];

const FIBONACCI_REDUCTION_PERCENT = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34];

// --- Utility Functions ---
function clamp(num, min, max) {
    return Math.max(min, Math.min(num, max));
}

function findRarityInfo(rarityName) {
    return RARITY_DATA.find(r => r.name === rarityName);
}

function getClassCoefficient(className) {
    const coefficients = {
        Aqua: 0.85, Reptile: 0.89, Beast: 0.93, Plant: 0.97, Bird: 1.00, Ghost: 1.03
    };
    return coefficients[className] ?? 0.9;
}

function getFibonacciReductionPercent(year) {
    return FIBONACCI_REDUCTION_PERCENT[clamp(year, 0, FIBONACCI_REDUCTION_PERCENT.length - 1)];
}

function getSloveLevelUpCost(targetLevel) {
    const data = LEVEL_UP_DATA.find(item => parseInt(item.level) === targetLevel);
    return data ? parseFloat(data.priceSlove) : Infinity;
}
function getSeedLevelUpCost(targetLevel) {
    const data = LEVEL_UP_DATA.find(item => parseInt(item.level) === targetLevel);
    return data ? parseFloat(data.priceSeed) : Infinity;
}
function calculateEnduranceConsumedPerHuntAction(totalRecoveryPoints, energyPerAction) {
    if (totalRecoveryPoints <= 0) return Infinity;
    if (energyPerAction <= 0) return 0;
    return parseFloat(((15 / Math.pow(totalRecoveryPoints, 0.65)) * energyPerAction).toFixed(6));
}

function calculateBaseSlovePerHuntAction(totalProficiencyPoints, className, energyPerAction) {
    if (totalProficiencyPoints <= 0 || energyPerAction <= 0) return 0;
    return parseFloat((getClassCoefficient(className) * Math.sqrt(totalProficiencyPoints) * energyPerAction).toFixed(2));
}

function calculateSlovRecoveryCostPerHuntAction(enduranceConsumedThisHunt, rarityName, level) {
    const coeff = BASE_EARNING_COEFFICIENTS[rarityName]?.[level.toString()] ?? 0;
    return parseFloat((enduranceConsumedThisHunt * coeff).toFixed(2));
}

function validateFormData(data, targetAge) {
    if (data.currentAge > targetAge) return `Target Age (${targetAge}) cannot be less than Current Age (${data.currentAge}).`;
    if (data.maxLevel < data.currentLevel) return `Target Level (${data.maxLevel}) cannot be less than Current Level (${data.currentLevel}).`;
    if ([data.currentLevel, data.maxLevel, data.currentTotalProficiency, data.currentTotalRecovery, data.energyPerAction, targetAge].some(isNaN)) return "Please ensure all inputs are valid numbers.";
    if (data.currentTotalProficiency < 0 || data.currentTotalRecovery < 0 || data.energyPerAction <= 0 || targetAge <= 0 || data.currentLevel < 0 || data.maxLevel <= 0) return "Levels, Stats, Energy, and Age must be non-negative (or positive where applicable).";
    return null;
}

function formatTimeDH(totalMinutes) {
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = Math.floor(totalMinutes % 60);
    return `${days}d ${hours}h ${minutes}m`;
}

// --- Main Calculation Logic ---
function findOptimalDistributionAndSimulate(initialData, targetAge = 7) {
    const {
        rarityName, className, currentLevel, maxLevel, currentAge, currentEdurance,
        currentTotalProficiency, currentTotalRecovery, energyPerAction
    } = initialData;

    const rarityInfo = findRarityInfo(rarityName);
    if (!rarityInfo) return { error: `Invalid Rarity Name: ${rarityName}` };
    if (maxLevel < currentLevel) return { error: `Target Level (${maxLevel}) cannot be less than Current Level (${currentLevel}).` };
    if (maxLevel > 30 || currentLevel < 0) return { error: `Levels must be between 0 and 30. Current: ${currentLevel}, Target: ${maxLevel}.` };
    if (targetAge <= 0) return { error: `Target Age (${targetAge}) must be positive.` };
    if (currentTotalProficiency < 0 || currentTotalRecovery < 0) return { error: `Current stats cannot be negative.` };
    if (energyPerAction <= 0) return { error: `Energy per Action (${energyPerAction}) must be positive.` };

    const totalBonusPointsAtMaxLevel = maxLevel * rarityInfo.bonusPts;
    const bonusPointsAlreadySpent = currentLevel * rarityInfo.bonusPts;
    const remainingBonusPointsToAllocate = Math.max(0, totalBonusPointsAtMaxLevel - bonusPointsAlreadySpent);

    let bestAllocation = { proficiencyBonusToAdd: -1, recoveryBonusToAdd: -1 };
    let maxTotalBaseSloveEarnedForTargetAge = -1;
    let bestOutcome = null;
    let bestYearlyBreakdown = [];
    let bestLevelingTime = null;

    const totalEnduranceForTargetAge = ((targetAge - currentAge) * 100) - currentEdurance;

    for (let profBonusToAdd = 0; profBonusToAdd <= remainingBonusPointsToAllocate; profBonusToAdd++) {
        const recBonusToAdd = remainingBonusPointsToAllocate - profBonusToAdd;
        const finalTotalProficiency = currentTotalProficiency + profBonusToAdd;
        const finalTotalRecovery = currentTotalRecovery + recBonusToAdd;
        const enduranceConsumedPerHuntAction = calculateEnduranceConsumedPerHuntAction(finalTotalRecovery, energyPerAction);
        if (!isFinite(enduranceConsumedPerHuntAction) || enduranceConsumedPerHuntAction < 0) continue;
        if (enduranceConsumedPerHuntAction === 0) continue;
        const huntsNeededForAge = Math.ceil(totalEnduranceForTargetAge / enduranceConsumedPerHuntAction);
        const baseSlovePerHuntActionAtMax = calculateBaseSlovePerHuntAction(finalTotalProficiency, className, energyPerAction);
        let currentTotalBaseSloveEarnedThisAllocation = 0;
        let cumulativeEnduranceConsumed = currentEdurance;
        let yearlyBreakdown = [];
        let currentYearEndurance = 0;
        let currentYearEarnings = 0;
        let currentSimYear = currentAge;
        let simulatedLevel = currentLevel;
        if (targetAge === currentAge) {
            const baseSlovePerHunt = baseSlovePerHuntActionAtMax;
            const reductionPercent = getFibonacciReductionPercent(currentAge);
            const earningMultiplier = 1 - (reductionPercent / 100);
            const slovePerHunt = baseSlovePerHunt * earningMultiplier;
            yearlyBreakdown.push({
                age: currentAge,
                level: maxLevel,
                slovePerHunt: parseFloat(slovePerHunt.toFixed(2)),
                endurancePerHunt: enduranceConsumedPerHuntAction,
                huntsInYear: 1,
                totalSloveInYear: parseFloat(slovePerHunt.toFixed(2))
            });
        } else {
            let currentSloveBalance = 0;
            let nextLevelCost = getSloveLevelUpCost(simulatedLevel + 1);
            for (let hunt = 0; hunt < huntsNeededForAge; hunt++) {
                const currentYear = Math.floor(cumulativeEnduranceConsumed / 100) + currentAge;
                const reductionPercent = getFibonacciReductionPercent(currentYear);
                const earningMultiplier = 1 - (reductionPercent / 100);
                const bonusPointsForSimLevel = simulatedLevel * rarityInfo.bonusPts;
                const bonusPointsAddedSoFar = Math.max(0, bonusPointsForSimLevel - bonusPointsAlreadySpent);
                let simCurrentProfBonus = 0;
                let simCurrentRecBonus = 0;
                if (remainingBonusPointsToAllocate > 0) {
                    simCurrentProfBonus = bonusPointsAddedSoFar * (profBonusToAdd / remainingBonusPointsToAllocate);
                    simCurrentRecBonus = bonusPointsAddedSoFar * (recBonusToAdd / remainingBonusPointsToAllocate);
                }
                const simProficiency = currentTotalProficiency + simCurrentProfBonus;
                const simRecovery = currentTotalRecovery + simCurrentRecBonus;
                const currentBaseSlove = calculateBaseSlovePerHuntAction(simProficiency, className, energyPerAction);
                const sloveEarned = currentBaseSlove * earningMultiplier;
                currentSloveBalance += sloveEarned;
                currentTotalBaseSloveEarnedThisAllocation += sloveEarned;
                currentYearEarnings += sloveEarned;
                currentYearEndurance += enduranceConsumedPerHuntAction;
                cumulativeEnduranceConsumed += enduranceConsumedPerHuntAction;
                while (simulatedLevel < maxLevel && currentSloveBalance >= nextLevelCost) {
                    currentSloveBalance -= nextLevelCost;
                    simulatedLevel++;
                    if (simulatedLevel < maxLevel) {
                        nextLevelCost = getSloveLevelUpCost(simulatedLevel + 1);
                    }
                }
                const nextYear = Math.floor(cumulativeEnduranceConsumed / 100) + currentAge;
                if (nextYear > currentSimYear) {
                    yearlyBreakdown.push({
                        age: currentSimYear,
                        level: simulatedLevel,
                        slovePerHunt: parseFloat((currentYearEarnings / (currentYearEndurance / enduranceConsumedPerHuntAction)).toFixed(2)),
                        endurancePerHunt: enduranceConsumedPerHuntAction,
                        huntsInYear: Math.floor(currentYearEndurance / enduranceConsumedPerHuntAction),
                        totalSloveInYear: parseFloat(currentYearEarnings.toFixed(2)),
                        sloveBalance: parseFloat(currentSloveBalance.toFixed(2))
                    });
                    currentYearEndurance = 0;
                    currentYearEarnings = 0;
                    currentSimYear = nextYear;
                }
            }
            if (currentYearEndurance > 0) {
                yearlyBreakdown.push({
                    age: currentSimYear,
                    level: simulatedLevel,
                    slovePerHunt: parseFloat((currentYearEarnings / (currentYearEndurance / enduranceConsumedPerHuntAction)).toFixed(2)),
                    endurancePerHunt: enduranceConsumedPerHuntAction,
                    huntsInYear: Math.ceil(currentYearEndurance / enduranceConsumedPerHuntAction),
                    totalSloveInYear: parseFloat(currentYearEarnings.toFixed(2)),
                    sloveBalance: parseFloat(currentSloveBalance.toFixed(2))
                });
            }
        }
        if (currentTotalBaseSloveEarnedThisAllocation > maxTotalBaseSloveEarnedForTargetAge) {
            maxTotalBaseSloveEarnedForTargetAge = currentTotalBaseSloveEarnedThisAllocation;
            bestAllocation = { proficiencyBonusToAdd: profBonusToAdd, recoveryBonusToAdd: recBonusToAdd };
            bestYearlyBreakdown = yearlyBreakdown;
            bestOutcome = {
                finalStats: {
                    totalProficiency: finalTotalProficiency,
                    totalRecovery: finalTotalRecovery
                },
                agingOutcome: {
                    enduranceConsumedPerHuntAction: parseFloat(enduranceConsumedPerHuntAction.toFixed(4)),
                    huntsToReachTargetAge: huntsNeededForAge,
                    baseSlovePerHuntActionAtMaxLevel: parseFloat(baseSlovePerHuntActionAtMax.toFixed(2)),
                    maxTotalBaseSloveEarnedByTargetAge: parseFloat(maxTotalBaseSloveEarnedForTargetAge.toFixed(2)),
                    slovRecoveryCostPerHuntActionAtMaxLevel: calculateSlovRecoveryCostPerHuntAction(enduranceConsumedPerHuntAction, rarityName, maxLevel)
                }
            };
        }
    }
    if (!bestOutcome) {
        return { error: `Could not find any valid allocation for Prof/Rec points that allows aging to level ${maxLevel} and age ${targetAge} (potentially due to very low Recovery causing infinite or zero endurance cost).` };
    }
    const leaderResult = simulateLevelingProcessWithCorrectedFormulas({ ...initialData, isLeader: true }, bestAllocation);
    const bulkResult = simulateLevelingProcessWithCorrectedFormulas({ ...initialData, isLeader: false, bulkLevel: true }, bestAllocation);
    const alternateResult = simulateLevelingProcessWithCorrectedFormulas({ ...initialData, isLeader: false, alternate: true }, bestAllocation);
    const enduranceConsumedPerHuntAction = bestOutcome.agingOutcome.enduranceConsumedPerHuntAction;
    const huntsNeededForAge = bestOutcome.agingOutcome.huntsToReachTargetAge;
    let totalAgeMinutes = 0;
    const maxEnergy = initialData.energyPerAction;
    const refillRateMinutes = 24 * 60 / maxEnergy;
    const huntTimePerEnergy = 10;
    for (let i = 0; i < huntsNeededForAge; i++) {
        totalAgeMinutes += maxEnergy * huntTimePerEnergy;
        if (i < huntsNeededForAge - 1) {
            totalAgeMinutes += maxEnergy * refillRateMinutes;
        }
    }
    return {
        assumption: `Coefficient affects Recovery Cost ONLY. Age reduction applied to BASE earnings. Target age: ${targetAge} years.`,
        rarity: rarityName,
        class: className,
        energyPerAction: energyPerAction,
        startLevel: currentLevel,
        targetLevel: maxLevel,
        optimalDistributionToAdd: bestAllocation,
        finalStats: bestOutcome.finalStats,
        levelingSimulation: leaderResult,
        earningsOutcome: bestOutcome.agingOutcome,
        yearlyBreakdown: bestYearlyBreakdown,
        timeToLevelUp: formatTimeDH(leaderResult.totalLevelingMinutes),
        timeToTargetAge: formatTimeDH(totalAgeMinutes),
        scenarioResults: {
            leader: leaderResult,
            bulk: bulkResult,
            alternate: alternateResult
        }
    };
}

function simulateLevelingProcessWithCorrectedFormulas(initialData, optimalDistributionToAdd) {
    const {
        rarityName, className, currentLevel, maxLevel, currentAge, currentEdurance,
        currentTotalProficiency, currentTotalRecovery, energyPerAction
    } = initialData;
    const { proficiencyBonusToAdd, recoveryBonusToAdd } = optimalDistributionToAdd;
    const rarityInfo = findRarityInfo(rarityName);
    const bonusPointsAlreadySpent = currentLevel * rarityInfo.bonusPts;
    const totalBonusPointsAtMaxLevel = maxLevel * rarityInfo.bonusPts;
    const remainingBonusPointsToAllocate = Math.max(0, totalBonusPointsAtMaxLevel - bonusPointsAlreadySpent);
    let simulationCurrentLevel = currentLevel;
    let currentSloveBalance = 0;
    let totalHuntsPerformedThisSim = 0;
    let totalGrossBaseSloveEarnedDuringLeveling = 0;
    let totalSloveSpentOnLeveling = 0;
    let totalSeedSpentOnLeveling = 0;
    let totalEnduranceConsumedThisSim = currentEdurance;
    let totalLevelingMinutes = 0;
    const maxEnergy = initialData.energyPerAction;
    const refillRateMinutes = 24 * 60 / maxEnergy;
    const huntTimePerEnergy = 10;

    const scenario = initialData.bulkLevel ? 'bulk' : initialData.alternate ? 'alternate' : 'leader';
    let leaderSlovePerHunt = null;
    if (initialData.bulkLevel || initialData.alternate) {
        leaderSlovePerHunt = calculateBaseSlovePerHuntAction(
            initialData.leaderProficiency,
            initialData.className,
            initialData.energyPerAction
        );
    }

    if (simulationCurrentLevel >= maxLevel) {
        return { totalHuntsToReachMaxLevel: 0, totalGrossBaseSloveEarnedDuringLeveling: 0, totalSloveSpentOnLeveling: 0, totalSeedpentOnLeveling: 0, netSloveAfterLevelingCosts: 0, totalLevelingMinutes: 0 };
    }
    if (scenario === 'leader') {
        let profBonusAccum = 0;
        let recBonusAccum = 0;
        while (simulationCurrentLevel < maxLevel) {
            const targetLevel = simulationCurrentLevel + 1;
            const levelUpCostSlove = getSloveLevelUpCost(targetLevel);
            const levelUpCostSeed = getSeedLevelUpCost(targetLevel);
            if (!isFinite(levelUpCostSlove) || !isFinite(levelUpCostSeed)) {
                return { error: `Missing or invalid level data for level ${targetLevel}` };
            }
            // Only hunt if not enough SLOV for level up
            if (currentSloveBalance < levelUpCostSlove) {
                const totalBonusPoints = rarityInfo.bonusPts;
                const profRatio = proficiencyBonusToAdd / (proficiencyBonusToAdd + recoveryBonusToAdd);
                const recRatio = recoveryBonusToAdd / (proficiencyBonusToAdd + recoveryBonusToAdd);
                let profBonusThisLevel = 0;
                let recBonusThisLevel = 0;
                if (proficiencyBonusToAdd + recoveryBonusToAdd > 0) {
                    profBonusThisLevel = totalBonusPoints * profRatio;
                    recBonusThisLevel = totalBonusPoints * recRatio;
                }
                const profNow = currentTotalProficiency + profBonusAccum;
                const recNow = currentTotalRecovery + recBonusAccum;
                const baseSlovePerHuntActionCurrentLevel = calculateBaseSlovePerHuntAction(profNow, className, energyPerAction);
                const enduranceConsumedThisLevelAction = calculateEnduranceConsumedPerHuntAction(recNow, energyPerAction);
                const currentSimYear = Math.floor(totalEnduranceConsumedThisSim / 100) + currentAge;
                const reductionPercent = getFibonacciReductionPercent(currentSimYear);
                const earningMultiplier = Math.max(0, 1 - (reductionPercent / 100));
                const sloveEarnedThisAction = baseSlovePerHuntActionCurrentLevel * earningMultiplier;
                totalGrossBaseSloveEarnedDuringLeveling += sloveEarnedThisAction;
                totalHuntsPerformedThisSim++;
                totalEnduranceConsumedThisSim += enduranceConsumedThisLevelAction;
                totalLevelingMinutes += maxEnergy * huntTimePerEnergy;
                totalLevelingMinutes += maxEnergy * refillRateMinutes;
                currentSloveBalance += sloveEarnedThisAction;
                totalLevelingMinutes += maxEnergy * refillRateMinutes;
                continue;
            }
            currentSloveBalance -= levelUpCostSlove;
            totalSloveSpentOnLeveling += levelUpCostSlove;
            totalSeedSpentOnLeveling += levelUpCostSeed;
            simulationCurrentLevel++;
            const totalBonusPoints = rarityInfo.bonusPts;
            const profRatio = proficiencyBonusToAdd / (proficiencyBonusToAdd + recoveryBonusToAdd);
            const recRatio = recoveryBonusToAdd / (proficiencyBonusToAdd + recoveryBonusToAdd);
            let profBonusThisLevel = 0;
            let recBonusThisLevel = 0;
            if (proficiencyBonusToAdd + recoveryBonusToAdd > 0) {
                profBonusThisLevel = totalBonusPoints * profRatio;
                recBonusThisLevel = totalBonusPoints * recRatio;
            }
            profBonusAccum += profBonusThisLevel;
            recBonusAccum += recBonusThisLevel;
            totalLevelingMinutes += maxEnergy * refillRateMinutes;
        }
        return {
            totalHuntsToReachMaxLevel: totalHuntsPerformedThisSim,
            totalGrossBaseSloveEarnedDuringLeveling: parseFloat(totalGrossBaseSloveEarnedDuringLeveling.toFixed(2)),
            totalSloveSpentOnLeveling: parseFloat(totalSloveSpentOnLeveling.toFixed(2)),
            totalSeedSpentOnLeveling: parseFloat(totalSeedSpentOnLeveling.toFixed(2)),
            netSloveAfterLevelingCosts: parseFloat(currentSloveBalance.toFixed(2)),
            totalLevelingMinutes
        };
    }
    // Bulk scenario: level up as soon as we have SLOV, otherwise hunt if energy is full, otherwise wait
    if (scenario === 'bulk') {
        let profBonusAccum = 0;
        let recBonusAccum = 0;
        let energy = maxEnergy;
        while (simulationCurrentLevel < maxLevel) {
            // A: is our energy full and not leveling up?
            if (energy === maxEnergy) {
                // AA: do we have enough SLOV for next level?
                while (simulationCurrentLevel < maxLevel && currentSloveBalance >= getSloveLevelUpCost(simulationCurrentLevel + 1)) {
                    // AAA: yes -> level up
                    const targetLevel = simulationCurrentLevel + 1;
                    const levelUpCostSlove = getSloveLevelUpCost(targetLevel);
                    const levelUpCostSeed = getSeedLevelUpCost(targetLevel);
                    currentSloveBalance -= levelUpCostSlove;
                    totalSloveSpentOnLeveling += levelUpCostSlove;
                    totalSeedSpentOnLeveling += levelUpCostSeed;
                    simulationCurrentLevel++;
                    // Wait for full refill before next possible hunt/level up
                    totalLevelingMinutes += maxEnergy * refillRateMinutes;
                }
                // After leveling, check if we can hunt
                if (simulationCurrentLevel < maxLevel && currentSloveBalance < getSloveLevelUpCost(simulationCurrentLevel + 1)) {
                    // AAB: not enough SLOV, so hunt
                    const slovePerHunt = leaderSlovePerHunt;
                    totalGrossBaseSloveEarnedDuringLeveling += slovePerHunt;
                    totalHuntsPerformedThisSim++;
                    totalEnduranceConsumedThisSim += calculateEnduranceConsumedPerHuntAction(initialData.leaderRecovery, energyPerAction);
                    totalLevelingMinutes += maxEnergy * huntTimePerEnergy;
                    energy = 0;
                    currentSloveBalance += slovePerHunt;
                }
            } else {
                // AB: energy not full, wait
                const refillNeeded = maxEnergy - energy;
                totalLevelingMinutes += refillNeeded * refillRateMinutes;
                energy = maxEnergy;
            }
        }
        return {
            totalHuntsToReachMaxLevel: totalHuntsPerformedThisSim,
            totalGrossBaseSloveEarnedDuringLeveling: parseFloat(totalGrossBaseSloveEarnedDuringLeveling.toFixed(2)),
            totalSloveSpentOnLeveling: parseFloat(totalSloveSpentOnLeveling.toFixed(2)),
            totalSeedSpentOnLeveling: parseFloat(totalSeedSpentOnLeveling.toFixed(2)),
            netSloveAfterLevelingCosts: parseFloat(currentSloveBalance.toFixed(2)),
            totalLevelingMinutes
        };
    }
    // Alternate scenario: hunt or level up+immediate hunt, otherwise wait
    if (scenario === 'alternate') {
        let profBonusAccum = 0;
        let recBonusAccum = 0;
        let energy = maxEnergy;
        while (simulationCurrentLevel < maxLevel) {
            // A: is our energy full and not leveling up?
            if (energy === maxEnergy) {
                // AA: do we have enough SLOV for next level?
                if (currentSloveBalance < getSloveLevelUpCost(simulationCurrentLevel + 1)) {
                    // AAA: not enough SLOV, so hunt
                    const slovePerHunt = leaderSlovePerHunt;
                    totalGrossBaseSloveEarnedDuringLeveling += slovePerHunt;
                    totalHuntsPerformedThisSim++;
                    totalEnduranceConsumedThisSim += calculateEnduranceConsumedPerHuntAction(initialData.leaderRecovery, energyPerAction);
                    totalLevelingMinutes += maxEnergy * huntTimePerEnergy;
                    energy = 0;
                    currentSloveBalance += slovePerHunt;
                } else {
                    // AAB: enough SLOV, level up and immediately hunt
                    const targetLevel = simulationCurrentLevel + 1;
                    const levelUpCostSlove = getSloveLevelUpCost(targetLevel);
                    const levelUpCostSeed = getSeedLevelUpCost(targetLevel);
                    currentSloveBalance -= levelUpCostSlove;
                    totalSloveSpentOnLeveling += levelUpCostSlove;
                    totalSeedSpentOnLeveling += levelUpCostSeed;
                    simulationCurrentLevel++;
                    // Hunt immediately after level up
                    const slovePerHunt = leaderSlovePerHunt;
                    totalGrossBaseSloveEarnedDuringLeveling += slovePerHunt;
                    totalHuntsPerformedThisSim++;
                    totalEnduranceConsumedThisSim += calculateEnduranceConsumedPerHuntAction(initialData.leaderRecovery, energyPerAction);
                    totalLevelingMinutes += maxEnergy * huntTimePerEnergy;
                    energy = 0;
                    currentSloveBalance += slovePerHunt;
                }
            } else {
                // AB: energy not full, wait
                const refillNeeded = maxEnergy - energy;
                totalLevelingMinutes += refillNeeded * refillRateMinutes;
                energy = maxEnergy;
            }
        }
        return {
            totalHuntsToReachMaxLevel: totalHuntsPerformedThisSim,
            totalGrossBaseSloveEarnedDuringLeveling: parseFloat(totalGrossBaseSloveEarnedDuringLeveling.toFixed(2)),
            totalSloveSpentOnLeveling: parseFloat(totalSloveSpentOnLeveling.toFixed(2)),
            totalSeedSpentOnLeveling: parseFloat(totalSeedSpentOnLeveling.toFixed(2)),
            netSloveAfterLevelingCosts: parseFloat(currentSloveBalance.toFixed(2)),
            totalLevelingMinutes
        };
    }
    while (simulationCurrentLevel < maxLevel) {
        const targetLevel = simulationCurrentLevel + 1;
        const levelUpCostSlove = getSloveLevelUpCost(targetLevel);
        const levelUpCostSeed = getSeedLevelUpCost(targetLevel);

        if (!isFinite(levelUpCostSlove) || !isFinite(levelUpCostSeed)) {
            return { error: `Missing or invalid level data for level ${targetLevel}` };
        }

        const bonusPointsUpToCurrentSimLevel = simulationCurrentLevel * rarityInfo.bonusPts;
        const bonusPointsAddedDuringSimSoFar = Math.max(0, bonusPointsUpToCurrentSimLevel - bonusPointsAlreadySpent);
        const simCurrentProfBonusAdded = (remainingBonusPointsToAllocate > 0)
            ? (bonusPointsAddedDuringSimSoFar * (proficiencyBonusToAdd / remainingBonusPointsToAllocate))
            : 0;
        const simCurrentRecBonusAdded = (remainingBonusPointsToAllocate > 0)
            ? (bonusPointsAddedDuringSimSoFar * (recoveryBonusToAdd / remainingBonusPointsToAllocate))
            : 0;
        const simCurrentTotalProficiency = currentTotalProficiency + simCurrentProfBonusAdded;
        const simCurrentTotalRecovery = currentTotalRecovery + simCurrentRecBonusAdded;
        const baseSlovePerHuntActionCurrentLevel = calculateBaseSlovePerHuntAction(simCurrentTotalProficiency, className, energyPerAction);
        const enduranceConsumedThisLevelAction = calculateEnduranceConsumedPerHuntAction(simCurrentTotalRecovery, energyPerAction);
        if (!isFinite(enduranceConsumedThisLevelAction) || enduranceConsumedThisLevelAction < 0) {
            return { error: `Endurance consumption invalid (${enduranceConsumedThisLevelAction.toFixed(4)}) at level ${simulationCurrentLevel} (Rec ${simCurrentTotalRecovery.toFixed(2)}). Cannot simulate.` };
        }
        let huntsNeededThisLevel = 0;
        let energyUsedThisLevel = 0;
        if (levelUpCostSlove > currentSloveBalance) {
            const slovNeededForNextLevel = levelUpCostSlove - currentSloveBalance;
            const slovePerHunt = leaderSlovePerHunt || baseSlovePerHuntActionCurrentLevel;
            if (slovePerHunt <= 0) {
                return { error: `Cannot earn SLOV (Base Rate ${slovePerHunt}) to level up from ${simulationCurrentLevel}.` };
            }
            if (enduranceConsumedThisLevelAction === 0) {
                return { error: `Zero endurance cost at level ${simulationCurrentLevel} while needing SLOV. Cannot determine hunts needed.` };
            }
            let accumulatedSloveThisLevel = 0;
            const maxHuntsPerLevel = 1000000;
            while (accumulatedSloveThisLevel < slovNeededForNextLevel) {
                const currentSimYear = Math.floor(totalEnduranceConsumedThisSim / 100) + currentAge;
                const reductionPercent = getFibonacciReductionPercent(currentSimYear);
                const earningMultiplier = Math.max(0, 1 - (reductionPercent / 100));
                const sloveEarnedThisAction = slovePerHunt;
                if (sloveEarnedThisAction <= 0 && (currentSloveBalance + accumulatedSloveThisLevel < levelUpCostSlove)) {
                    return { error: `Earning rate dropped to zero at year ${currentSimYear} (level ${simulationCurrentLevel}) due to age reduction. Cannot complete leveling.` };
                }
                accumulatedSloveThisLevel += sloveEarnedThisAction;
                totalGrossBaseSloveEarnedDuringLeveling += sloveEarnedThisAction;
                totalHuntsPerformedThisSim++;
                totalEnduranceConsumedThisSim += enduranceConsumedThisLevelAction;
                huntsNeededThisLevel++;
                totalLevelingMinutes += maxEnergy * huntTimePerEnergy;
                totalLevelingMinutes += maxEnergy * refillRateMinutes;
                if (huntsNeededThisLevel > maxHuntsPerLevel) {
                    console.error(`Stats at error: Level=${simulationCurrentLevel}, BaseEarnRate=${baseSlovePerHuntActionCurrentLevel}, EnduCost=${enduranceConsumedThisLevelAction}, Needed=${slovNeededForNextLevel}, Accumulated=${accumulatedSloveThisLevel}`)
                    return { error: `Hunt limit (${maxHuntsPerLevel}) exceeded for level ${targetLevel}. Potential issue or extreme stats.` };
                }
            }
            currentSloveBalance += accumulatedSloveThisLevel;
        }
        totalLevelingMinutes += maxEnergy * refillRateMinutes;
        currentSloveBalance -= levelUpCostSlove;
        totalSloveSpentOnLeveling += levelUpCostSlove;
        totalSeedSpentOnLeveling += levelUpCostSeed;
        simulationCurrentLevel++;
    }
    return {
        totalHuntsToReachMaxLevel: totalHuntsPerformedThisSim,
        totalGrossBaseSloveEarnedDuringLeveling: parseFloat(totalGrossBaseSloveEarnedDuringLeveling.toFixed(2)),
        totalSloveSpentOnLeveling: parseFloat(totalSloveSpentOnLeveling.toFixed(2)),
        totalSeedSpentOnLeveling: parseFloat(totalSeedSpentOnLeveling.toFixed(2)),
        netSloveAfterLevelingCosts: parseFloat(currentSloveBalance.toFixed(2)),
        totalLevelingMinutes
    };
}

// --- DOM Interaction ---
const form = document.getElementById('calculator-form');
const raritySelect = document.getElementById('rarity');
const classSelect = document.getElementById('class');
const currentLevelInput = document.getElementById('current-level');
const currentAgeInput = document.getElementById('current-age');
const currentEduranceInput = document.getElementById('current-edurance');
const maxLevelInput = document.getElementById('max-level');
const currentProficiencyInput = document.getElementById('current-proficiency');
const currentRecoveryInput = document.getElementById('current-recovery');
const energyPerActionInput = document.getElementById('energy-per-action');
const targetAgeInput = document.getElementById('target-age');
const calculateButton = document.getElementById('calculate-button');
const resultsArea = document.getElementById('results-area');

// Structured result fields
const resultsCard = document.getElementById('results-card');
const resultsTitle = document.getElementById('results-title');
const resultsSummary = document.getElementById('results-summary');
const resultProficiency = document.getElementById('result-proficiency');
const resultRecovery = document.getElementById('result-recovery');
const resultFinalProficiency = document.getElementById('result-final-proficiency');
const resultFinalRecovery = document.getElementById('result-final-recovery');
const resultLevelsGained = document.getElementById('result-levels-gained');
const resultHuntsLeveling = document.getElementById('result-hunts-leveling');
const resultGrossSlove = document.getElementById('result-gross-slove');
const resultSloveSpent = document.getElementById('result-slove-spent');
const resultSeedSpent = document.getElementById('result-seed-spent');
const resultNetSlove = document.getElementById('result-net-slove');
const resultLevelingError = document.getElementById('result-leveling-error');
const resultEnduranceHunt = document.getElementById('result-endurance-hunt');
const resultHuntsTargetAge = document.getElementById('result-hunts-target-age');
const resultBaseSloveHunt = document.getElementById('result-base-slove-hunt');
const resultMaxTotalSlove = document.getElementById('result-max-total-slove');
const resultRecoveryCost = document.getElementById('result-recovery-cost');
const resultSingleHuntSection = document.getElementById('results-single-hunt-section');
const resultSingleHunt = document.getElementById('result-single-hunt');
const resultsTableContainer = document.getElementById('results-table-container');
const resultsError = document.getElementById('results-error');
const resultsPlaceholder = document.getElementById('results-placeholder');

function clearResults() {
    resultsCard.style.display = 'none';
    resultsError.style.display = 'none';
    resultsPlaceholder.style.display = '';
    resultsTableContainer.innerHTML = '';
}

function getFormData() {
    return {
        rarityName: raritySelect.value,
        className: classSelect.value,
        currentLevel: parseInt(currentLevelInput.value, 10),
        maxLevel: parseInt(maxLevelInput.value, 10),
        currentAge: parseInt(currentAgeInput.value, 10),
        currentEdurance: parseInt(currentEduranceInput.value, 10),
        currentTotalProficiency: parseInt(currentProficiencyInput.value, 10),
        currentTotalRecovery: parseInt(currentRecoveryInput.value, 10),
        energyPerAction: parseInt(energyPerActionInput.value, 10),
        leaderLevel: parseInt(document.getElementById('leader-level').value, 10),
        leaderProficiency: parseInt(document.getElementById('leader-proficiency').value, 10),
        leaderRecovery: parseInt(document.getElementById('leader-recovery').value, 10),
        leaderClass: document.getElementById('leader-class').value,
        leaderType: document.getElementById('leader-type').value
    };
}

function renderResults(result, initialData, targetAge) {
    clearResults();
    if (result && result.error && !result.finalStats) {
        resultsError.textContent = `Error: ${result.error}`;
        resultsError.style.display = '';
        return;
    } else if (result) {
        resultsCard.style.display = '';
        resultsPlaceholder.style.display = 'none';
        resultsTitle.textContent = 'Calculation Results';
        resultsSummary.textContent = `Optimal distribution found for ${result.rarity} ${result.class} (Lv ${result.startLevel} -> ${result.targetLevel}, Age ${initialData.currentAge} -> ${targetAge}).`;
        resultProficiency.textContent = result.optimalDistributionToAdd?.proficiencyBonusToAdd ?? 'N/A';
        resultRecovery.textContent = result.optimalDistributionToAdd?.recoveryBonusToAdd ?? 'N/A';
        resultFinalProficiency.textContent = result.finalStats?.totalProficiency ?? 'N/A';
        resultFinalRecovery.textContent = result.finalStats?.totalRecovery ?? 'N/A';
        if (result.levelingSimulation?.error) {
            resultLevelingError.textContent = result.levelingSimulation.error;
            resultLevelingError.style.display = '';
            resultLevelsGained.textContent = '';
            resultHuntsLeveling.textContent = '';
            resultGrossSlove.textContent = '';
            resultSloveSpent.textContent = '';
            resultSeedSpent.textContent = '';
            resultNetSlove.textContent = '';
        } else if (result.levelingSimulation) {
            resultLevelingError.style.display = 'none';
            resultLevelsGained.textContent = result.targetLevel - result.startLevel;
            resultHuntsLeveling.textContent = result.levelingSimulation.totalHuntsToReachMaxLevel;
            resultGrossSlove.textContent = result.levelingSimulation.totalGrossBaseSloveEarnedDuringLeveling;
            resultSloveSpent.textContent = result.levelingSimulation.totalSloveSpentOnLeveling;
            resultSeedSpent.textContent = result.levelingSimulation.totalSeedSpentOnLeveling;
            resultNetSlove.textContent = result.levelingSimulation.netSloveAfterLevelingCosts;
            let timeRow = document.getElementById('result-time-levelup');
            if (!timeRow) {
                const dt = document.createElement('dt');
                dt.textContent = 'Time to Level Up';
                const dd = document.createElement('dd');
                dd.id = 'result-time-levelup';
                dt.className = 'important';
                dd.className = 'important';
                resultNetSlove.parentNode.insertBefore(dd, resultNetSlove.nextSibling);
                resultNetSlove.parentNode.insertBefore(dt, dd);
                timeRow = dd;
            }
            timeRow.textContent = result.timeToLevelUp;
        } else {
            resultLevelingError.textContent = 'Leveling simulation data not available.';
            resultLevelingError.style.display = '';
        }
        if (result.earningsOutcome) {
            resultEnduranceHunt.textContent = result.earningsOutcome.enduranceConsumedPerHuntAction;
            resultHuntsTargetAge.textContent = result.earningsOutcome.huntsToReachTargetAge;
            resultBaseSloveHunt.textContent = result.earningsOutcome.baseSlovePerHuntActionAtMaxLevel;
            resultMaxTotalSlove.textContent = result.earningsOutcome.maxTotalBaseSloveEarnedByTargetAge;
            resultRecoveryCost.textContent = result.earningsOutcome.slovRecoveryCostPerHuntActionAtMaxLevel + ' SLOV';
            let timeAgeRow = document.getElementById('result-time-targetage');
            if (!timeAgeRow) {
                const dt = document.createElement('dt');
                dt.textContent = 'Time to Target Age';
                const dd = document.createElement('dd');
                dd.id = 'result-time-targetage';
                dt.className = 'important';
                dd.className = 'important';
                resultRecoveryCost.parentNode.insertBefore(dd, resultRecoveryCost.nextSibling);
                resultRecoveryCost.parentNode.insertBefore(dt, dd);
                timeAgeRow = dd;
            }
            timeAgeRow.textContent = result.timeToTargetAge;
        } else {
            resultEnduranceHunt.textContent = '';
            resultHuntsTargetAge.textContent = '';
            resultBaseSloveHunt.textContent = '';
            resultMaxTotalSlove.textContent = '';
            resultRecoveryCost.textContent = '';
        }
        if (initialData.currentAge === targetAge && result.yearlyBreakdown && result.yearlyBreakdown[0]) {
            resultSingleHuntSection.style.display = '';
            resultSingleHunt.textContent = result.yearlyBreakdown[0].slovePerHunt ?? 'N/A';
        } else {
            resultSingleHuntSection.style.display = 'none';
        }
        if (result.yearlyBreakdown && result.yearlyBreakdown.length > 0) {
            const table = document.createElement('table');
            table.className = 'earnings-table';
            const thead = document.createElement('thead');
            thead.innerHTML = '<tr><th>Age</th><th>Level</th><th>SLOV/Hunt</th><th>Hunts</th><th>Total SLOV</th><th>Balance</th></tr>';
            table.appendChild(thead);
            const tbody = document.createElement('tbody');
            result.yearlyBreakdown.forEach(year => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>Year ${year.age}</td><td>Lv ${year.level}</td><td>${year.slovePerHunt}</td><td>${year.huntsInYear}</td><td>${year.totalSloveInYear}</td><td>${year.sloveBalance || 0}</td>`;
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            resultsTableContainer.innerHTML = '';
            resultsTableContainer.appendChild(table);
        } else {
            resultsTableContainer.innerHTML = '<p>Year-by-year earnings data not available.</p>';
        }
        if (result && result.scenarioResults) {
            let scenarioHtml = '<h3>Leveling Scenarios</h3>';
            scenarioHtml += '<table class="earnings-table"><thead><tr><th>Scenario</th><th>Hunts</th><th>Gross SLOV</th><th>SLOV Spent</th><th>SEED Spent</th><th>Net SLOV</th><th>Time to Level Up</th></tr></thead><tbody>';
            const scenarios = [
                { key: 'leader', label: 'Leader (No Hunt During Level Up)' },
                { key: 'bulk', label: 'Non-Leader (Bulk Level Up After Hunt)' },
                { key: 'alternate', label: 'Non-Leader (Alternate Level Up & Hunt)' }
            ];
            for (const s of scenarios) {
                const r = result.scenarioResults[s.key];
                scenarioHtml += `<tr><td>${s.label}</td><td>${r.totalHuntsToReachMaxLevel ?? 'N/A'}</td><td>${r.totalGrossBaseSloveEarnedDuringLeveling ?? 'N/A'}</td><td>${r.totalSloveSpentOnLeveling ?? 'N/A'}</td><td>${r.totalSeedSpentOnLeveling ?? 'N/A'}</td><td>${r.netSloveAfterLevelingCosts ?? 'N/A'}</td><td>${formatTimeDH(r.totalLevelingMinutes ?? 0)}</td></tr>`;
            }
            scenarioHtml += '</tbody></table>';
            resultsSummary.innerHTML += scenarioHtml;
        }
    } else {
        resultsPlaceholder.style.display = '';
    }
}

calculateButton.addEventListener('click', () => {
    clearResults();
    resultsPlaceholder.innerHTML = '<p>Calculating...</p>';
    try {
        const initialData = getFormData();
        const targetAge = parseInt(targetAgeInput.value, 10);
        const validationError = validateFormData(initialData, targetAge);
        if (validationError) throw new Error(validationError);
        const result = findOptimalDistributionAndSimulate(initialData, targetAge);
        renderResults(result, initialData, targetAge);
    } catch (e) {
        resultsCard.style.display = 'none';
        resultsError.textContent = `Error during calculation: ${e.message || e}`;
        resultsError.style.display = '';
        resultsPlaceholder.style.display = 'none';
    }
});
