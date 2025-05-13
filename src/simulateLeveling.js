import * as Utils from './utils.js';

export function simulateLevelingScenarios(initialData, bestAllocation) {
    let fastestLeaderLevelingTime = null;
    let fastestNonLeaderLevelingTime = null;

    // Helper function to run a scenario with both hunt strategies and pick the best
    const runWithHuntStrategies = (scenarioType, useBoostFlag, boostThresh) => {
        const resultStratOpportunistic = simulateLevelingProcess(initialData, bestAllocation, scenarioType, useBoostFlag, boostThresh, 'opportunistic');
        const resultStratStrictFull = simulateLevelingProcess(initialData, bestAllocation, scenarioType, useBoostFlag, boostThresh, 'strictFull');

        // Handle potential errors from simulation
        if (resultStratOpportunistic.error && !resultStratStrictFull.error) return resultStratStrictFull;
        if (!resultStratOpportunistic.error && resultStratStrictFull.error) return resultStratOpportunistic;
        if (resultStratOpportunistic.error && resultStratStrictFull.error) {
            // Both errored, prefer opportunistic or return one with error (e.g., opportunistic)
            console.warn(`Both hunt strategies resulted in error for scenario: ${scenarioType}, useBoost: ${useBoostFlag}. Defaulting to opportunistic result.`);
            return resultStratOpportunistic;
        }

        return resultStratOpportunistic.totalLevelingMinutes < resultStratStrictFull.totalLevelingMinutes ?
            resultStratOpportunistic : resultStratStrictFull;
    };

    // Get base non-boosted results (internally compares hunt strategies)
    const leaderResult = runWithHuntStrategies('leader', false);
    const nonLeaderResult = runWithHuntStrategies('nonLeader', false);

    let fastestLeaderBoostedLevelingTime = null;
    let fastestNonLeaderBoostedLevelingTime = null;
    if (initialData.sloveBalance > 0) {
        for (let i = 240; i <= 3200; i += 100) {
            const leaderResultBoosted = runWithHuntStrategies('leader', true, i);
            const nonLeaderResultBoosted = runWithHuntStrategies('nonLeader', true, i);
            if (fastestLeaderBoostedLevelingTime === null
                || leaderResultBoosted.totalLevelingMinutes < fastestLeaderBoostedLevelingTime.totalLevelingMinutes
            ) {
                fastestLeaderBoostedLevelingTime = leaderResultBoosted;
            }

            if (fastestNonLeaderBoostedLevelingTime === null
                || nonLeaderResultBoosted.totalLevelingMinutes < fastestNonLeaderBoostedLevelingTime.totalLevelingMinutes
            ) {
                fastestNonLeaderBoostedLevelingTime = nonLeaderResultBoosted;
            }
        }
    }

    fastestLeaderLevelingTime = fastestLeaderBoostedLevelingTime?.totalLevelingMinutes < leaderResult.totalLevelingMinutes ?
        fastestLeaderBoostedLevelingTime : leaderResult;

    fastestNonLeaderLevelingTime = fastestNonLeaderBoostedLevelingTime?.totalLevelingMinutes < nonLeaderResult.totalLevelingMinutes ?
        fastestNonLeaderBoostedLevelingTime : nonLeaderResult;
    return {
        leader: fastestLeaderLevelingTime,
        nonLeader: fastestNonLeaderLevelingTime
    };
}

/**
 * Helper function to calculate the simulated stats (Proficiency, Recovery)
 * for the monster being leveled at a specific simulation level,
 * based on the optimal point distribution strategy.
 */
function getSimStatsForLevel(initialData, rarityInfo, optimalDistributionToAdd, simulatedLevel) {
    const { currentLevel, currentTotalProficiency, currentTotalRecovery, maxLevel } = initialData;
    const { proficiencyBonusToAdd, recoveryBonusToAdd } = optimalDistributionToAdd;

    const pointsPerLevel = rarityInfo.bonusPts;

    if (pointsPerLevel <= 0) {
        return { simProficiency: currentTotalProficiency, simRecovery: currentTotalRecovery };
    }

    const levelsGained = Math.max(0, simulatedLevel - currentLevel);

    const totalBonusPointsEarned = levelsGained * pointsPerLevel;

    const totalPointsToAllocate = proficiencyBonusToAdd + recoveryBonusToAdd;
    const profRatio = (totalPointsToAllocate > 0) ? proficiencyBonusToAdd / totalPointsToAllocate : 0;

    const idealProfPoints = totalBonusPointsEarned * profRatio;

    let addedProfPoints = Math.round(idealProfPoints);

    addedProfPoints = Math.min(totalBonusPointsEarned, addedProfPoints);
    addedProfPoints = Math.max(0, addedProfPoints); // Ensure non-negative

    let addedRecPoints = totalBonusPointsEarned - addedProfPoints;

    // --- Sanity Check 
    if (addedProfPoints + addedRecPoints !== totalBonusPointsEarned) {
        console.warn(`Point allocation mismatch at level ${simulatedLevel}: Earned=${totalBonusPointsEarned}, Added P=${addedProfPoints}, Added R=${addedRecPoints}`);
        addedRecPoints = totalBonusPointsEarned - addedProfPoints;
    }
    // --- End Sanity Check ---


    // Add the allocated integer points to the initial stats
    const finalSimProficiency = currentTotalProficiency + addedProfPoints;
    const finalSimRecovery = currentTotalRecovery + addedRecPoints;


    return {
        simProficiency: finalSimProficiency,
        simRecovery: finalSimRecovery
    };
}
/**
 * Helper function to estimate SLOV per hunt cycle for waiting calculation.
 * Uses current state for estimation; doesn't predict future state changes during wait.
 */
function estimateSlovPerHuntCycle(initialData, rarityInfo, optimalDistributionToAdd, simulationCurrentLevel, totalEnduranceConsumed, scenario, externalLeaderBaseSlovePerHunt) {
    const { className, energyPerHunt, currentAge } = initialData;
    let baseSlove = 0;

    if (scenario === 'leader') {
        // Use monster's stats at the CURRENT level for estimation
        const { simProficiency } = getSimStatsForLevel(initialData, rarityInfo, optimalDistributionToAdd, simulationCurrentLevel);
        baseSlove = Utils.calculateBaseSlovePerHuntAction(simProficiency, className, energyPerHunt);
    } else { // bulk or nonLeader
        baseSlove = externalLeaderBaseSlovePerHunt;
    }

    if (!isFinite(baseSlove) || baseSlove <= 0) return 0; // Cannot earn

    // Apply age reduction based on current endurance
    const currentSimYear = Math.floor(totalEnduranceConsumed / 100) + currentAge;
    const reductionPercent = Utils.getFibonacciReductionPercent(currentSimYear);
    const earningMultiplier = Math.max(0, 1 - (reductionPercent / 100));

    return baseSlove * earningMultiplier;
}

/**
 * Optimized simulation of the leveling process
 */
export function simulateLevelingProcess(initialData, bestAllocation, scenario = 'leader', useBoost = true, boostThreshold = 12 * 60, huntStrategy = 'opportunistic') {
    if (initialData.currentLevel >= initialData.maxLevel) {
        const zeroTotals = calculateTotalsFromLog([]);
        return { scenario: 'N/A', useBoost, ...zeroTotals, actionLog: [] };
    }

    const state = new LevelingStateManager(initialData, bestAllocation, scenario, useBoost, boostThreshold);

    const MAX_SIMULATION_STEPS = 100000; // Ensured this is 100000
    let simulationSteps = 0;

    while (state.level < initialData.maxLevel && simulationSteps < MAX_SIMULATION_STEPS) {
        simulationSteps++;
        const targetLevel = state.level + 1;

        if (state.isLeveling) {
            state.waitToFinishLevelUp();
            continue;
        }

        // Decision making for next action
        const sloveCostNormal = Utils.getSloveLevelUpCost(targetLevel);
        const boostSloveCost = Utils.getBoostCost(targetLevel);

        const canAffordNormalSlove = state.sloveBalance >= sloveCostNormal;
        const canAffordBoostSlove = state.useBoost && (state.sloveBalance >= (sloveCostNormal + boostSloveCost));

        const hasFullEnergy = state.energyUnits >= state.maxEnergyUnits;
        const shouldBoostThisLevel = state.shouldBoostThisLevel(targetLevel);

        // Priority: Boosted Level Up
        if (state.useBoost && canAffordBoostSlove && hasFullEnergy && shouldBoostThisLevel) {
            state.startBoostedLevelUp(targetLevel);
            continue;
        }

        // Next Priority: Normal Level Up
        if (canAffordNormalSlove && hasFullEnergy) {
            state.startNormalLevelUp(targetLevel);
            continue;
        }

        // If we can afford slove for a level-up (normal or boost) but lack full energy, wait for full energy.
        if ((canAffordNormalSlove || canAffordBoostSlove) && !hasFullEnergy) {
            state.waitToRefillEnergy(true); // true = wait for full energy
            continue;
        }

        let huntActionTaken = false;
        if (huntStrategy === 'opportunistic') {
            const minEnergyToHunt = 0.25 * state.maxEnergyUnits;
            if (state.energyUnits >= minEnergyToHunt) {
                const {
                    potentialSloveGross,
                    costToRecoverBacklogAndCurrent,
                    canAffordBacklogAndCurrentRecovery,
                    isProfitableAfterFullRecovery
                } = state.getPotentialHuntOutcome(state.energyUnits);

                let performHunt = false;

                // Condition 1: Ideal hunt - profitable even after clearing all due recovery
                if (canAffordBacklogAndCurrentRecovery && isProfitableAfterFullRecovery) {
                    performHunt = true;
                }
                // Condition 2: Desperation hunt - cannot afford full recovery, but hunt itself adds Slove (positive gross)
                // This allows accumulating Slove even if it means increasing endurance debt temporarily.
                else if (!canAffordBacklogAndCurrentRecovery && potentialSloveGross > 0) {
                    performHunt = true;
                }

                if (performHunt) {
                    if (state.energyUnits === state.maxEnergyUnits) {
                        state.hunt();
                        huntActionTaken = true;
                    } else {
                        // Partial energy hunt: only if the gross Slove from this hunt covers the Slove deficit for the next intended level-up
                        let sloveNeededForNextTargetLevelUp;
                        if (state.useBoost && shouldBoostThisLevel) {
                            sloveNeededForNextTargetLevelUp = Math.max(0, (sloveCostNormal + boostSloveCost) - state.sloveBalance);
                        } else {
                            sloveNeededForNextTargetLevelUp = Math.max(0, sloveCostNormal - state.sloveBalance);
                        }
                        // For partial hunts, we check against potentialSloveGross because the decision to recover or not is handled inside hunt()
                        if (sloveNeededForNextTargetLevelUp > 0 && potentialSloveGross >= sloveNeededForNextTargetLevelUp) {
                            state.hunt();
                            huntActionTaken = true;
                        }
                    }
                }
            }
        } else if (huntStrategy === 'strictFull') {
            if (state.energyUnits === state.maxEnergyUnits) {
                const {
                    canAffordBacklogAndCurrentRecovery,
                    isProfitableAfterFullRecovery
                } = state.getPotentialHuntOutcome(state.energyUnits);

                // Strict full strategy: Only hunt if it's an "Ideal Hunt" - 
                // i.e., can afford full recovery (backlog + current) AND the hunt is profitable after that full recovery.
                // This avoids accumulating unrecovered endurance with the strict strategy.
                if (canAffordBacklogAndCurrentRecovery && isProfitableAfterFullRecovery) {
                    state.hunt();
                    huntActionTaken = true;
                }
            }
        }

        if (huntActionTaken) {
            continue;
        }

        // Default: Wait for energy (1 cycle) if no other action was taken in this step.
        state.waitToRefillEnergy(false);
    }

    if (simulationSteps >= MAX_SIMULATION_STEPS) {
        console.warn("Simulation ended due to reaching max steps.");
        // Potentially return a partial result or error
        return {
            error: "Max simulation steps reached",
            path: state.actionLog,
            totalTime: state.timeElapsedMin,
            scenario,
            useBoost,
            ...calculateTotalsFromLog(state.actionLog)
        };
    }

    return {
        scenario,
        useBoost,
        ...calculateTotalsFromLog(state.actionLog),
        actionLog: state.actionLog
    };
}

function calculateTotalsFromLog(actionLog) {
    let totalHunts = 0;
    let totalGrossSlove = 0;
    let totalSloveSpentOnLeveling = 0; // slove for normal/boost
    let totalSeedSpentOnLeveling = 0;
    let totalBoostCostApplied = 0; // slove specifically for boost portion
    let totalRecoverySloveCost = 0; // New: To sum Slove spent on endurance recovery
    let lastTimestamp = 0;
    let finalSloveBalance = 0;

    if (!actionLog || actionLog.length === 0) {
        return {
            totalHuntsToReachMaxLevel: 0,
            totalGrossSloveEarnedDuringLeveling: 0,
            totalSloveSpentOnLeveling: 0,
            totalSeedSpentOnLeveling: 0,
            totalBoostCost: 0,
            totalRecoveryCost: 0, // This will now be totalRecoverySloveCost
            netSloveAfterLevelingCosts: 0,
            totalLevelingMinutes: 0,
            finalSloveBalance: 0,
            initialSloveBalance: 0
        };
    }

    const initialState = actionLog.find(a => a.type === 'INITIAL_STATE') || { sloveBalance: 0 };
    const initialSlove = initialState.sloveBalance;

    for (const action of actionLog) {
        lastTimestamp = Math.max(lastTimestamp, action.timeElapsedMin || 0);
        finalSloveBalance = action.sloveBalance !== undefined ? action.sloveBalance : finalSloveBalance;

        if (action.type === 'HUNT') {
            totalHunts++;
            totalGrossSlove += (typeof action.sloveGained === 'number' ? action.sloveGained : 0);
            totalRecoverySloveCost += (typeof action.sloveCostForRecoveryApplied === 'number' ? action.sloveCostForRecoveryApplied : 0);
        } else if (action.type === 'NORMAL_LEVEL_UP') { // Changed from START_NORMAL_LEVEL_UP
            totalSloveSpentOnLeveling += (typeof action.sloveCost === 'number' ? action.sloveCost : 0);
            totalSeedSpentOnLeveling += (typeof action.seedCost === 'number' ? action.seedCost : 0);
        } else if (action.type === 'BOOSTED_LEVEL_UP') { // Changed from START_BOOSTED_LEVEL_UP
            totalSloveSpentOnLeveling += (typeof action.sloveCost === 'number' ? action.sloveCost : 0); // Base cost
            totalSeedSpentOnLeveling += (typeof action.seedCost === 'number' ? action.seedCost : 0);
            totalBoostCostApplied += (typeof action.boostSloveCost === 'number' ? action.boostSloveCost : 0); // Additional boost cost
        }
    }

    const totalSloveActuallySpent = totalSloveSpentOnLeveling + totalBoostCostApplied;
    // Updated netSlove calculation to include recovery costs
    const netSlove = initialSlove + totalGrossSlove - totalSloveActuallySpent - totalRecoverySloveCost;

    return {
        totalHuntsToReachMaxLevel: totalHunts,
        totalGrossSloveEarnedDuringLeveling: parseFloat(totalGrossSlove.toFixed(2)),
        totalSloveSpentOnLeveling: parseFloat(totalSloveSpentOnLeveling.toFixed(2)), // Cost for leveling (base)
        totalSeedSpentOnLeveling: parseFloat(totalSeedSpentOnLeveling.toFixed(2)),
        totalBoostCost: parseFloat(totalBoostCostApplied.toFixed(2)), // Additional cost for boosts
        totalRecoveryCost: parseFloat(totalRecoverySloveCost.toFixed(2)), // Updated to actual recovery Slove cost
        netSloveAfterLevelingCosts: parseFloat(netSlove.toFixed(2)),
        totalLevelingMinutes: Math.round(lastTimestamp),
        finalSloveBalance: parseFloat(finalSloveBalance.toFixed(2)),
        initialSloveBalance: parseFloat(initialSlove.toFixed(2))
    };
}

/**
 * Calculates the optimal boost threshold by analyzing level-up times and costs
 * @param {Object} initialData - Initial monster data
 * @param {Object} bestAllocation - Optimal stat distribution
 * @param {string} scenario - 'leader' or 'nonLeader'
 * @returns {number} Optimal boost threshold in minutes
 */
function calculateOptimalBoostThreshold(initialData, bestAllocation, scenario) {
    const { currentLevel, maxLevel } = initialData;
    const rarityInfo = Utils.findRarityInfo(initialData.rarityName);
    if (!rarityInfo) return 12 * 60; // default 12 hours if no rarity info

    // Calculate average SLOV earning rate per minute
    const simStats = getSimStatsForLevel(initialData, rarityInfo, bestAllocation, currentLevel);
    const baseSlovePerHunt = scenario === 'leader'
        ? Utils.calculateBaseSlovePerHuntAction(simStats.simProficiency, initialData.className, initialData.energyPerHunt)
        : Utils.calculateBaseSlovePerHuntAction(initialData.leaderProficiency, initialData.leaderClass, initialData.energyPerHunt);

    // Calculate average earnings considering age reduction
    const currentAge = scenario === 'leader' ? initialData.currentAge : initialData.leaderAge;
    const reductionPercent = Utils.getFibonacciReductionPercent(currentAge);
    const averageSlovePerHunt = baseSlovePerHunt * (1 - reductionPercent / 100);
    const huntDurationMinutes = initialData.energyPerHunt * 10;
    const slovEarningRatePerMinute = averageSlovePerHunt / huntDurationMinutes;

    // Calculate average boost cost and time saved
    let totalBoostCost = 0;
    let totalTimeSaved = 0;
    let levelCount = 0;

    for (let level = currentLevel + 1; level <= maxLevel; level++) {
        const levelUpTimeHours = Utils.getLevelUpTimeHours(level);
        const boostCost = Utils.getBoostCost(level);

        if (isFinite(levelUpTimeHours) && isFinite(boostCost)) {
            totalBoostCost += boostCost;
            totalTimeSaved += levelUpTimeHours * 60;
            levelCount++;
        }
    }

    if (levelCount === 0) return 12 * 60; // default if no valid levels

    const averageBoostCost = totalBoostCost / levelCount;
    const averageTimeSaved = totalTimeSaved / levelCount;

    // Calculate threshold where boosting becomes worthwhile
    // Time to earn boost cost = boost cost / SLOV earning rate
    const timeToEarnBoostCost = averageBoostCost / slovEarningRatePerMinute;

    // If time to earn boost cost is less than time saved, it's worth boosting
    const optimalThreshold = Math.max(
        timeToEarnBoostCost, // minimum threshold
        averageTimeSaved * 0.5 // or 50% of time saved, whichever is greater
    );

    // Clamp the threshold between 1 hour and 24 hours
    return Math.min(48 * 60, Math.max(60, Math.round(optimalThreshold)));
}

/**
 * Manages the state of a leveling process
 */
class LevelingStateManager {
    constructor(initialData, bestAllocation, scenario = 'leader', useBoost = true, boostThreshold = 12 * 60) {
        this.initialData = initialData;
        this.bestAllocation = bestAllocation;
        this.scenario = scenario;
        this.useBoost = useBoost; // Whether boosting is enabled for this simulation run
        this.boostThreshold = boostThreshold; // Time in minutes, if level up time > this, boost is considered
        this.rarityInfo = Utils.findRarityInfo(initialData.rarityName);

        // Core state from plan
        this.level = initialData.currentLevel;
        this.sloveBalance = initialData.sloveBalance || 0;
        this.maxEnergyUnits = initialData.energyPerHunt; // Max capacity
        this.energyUnits = this.maxEnergyUnits; // Current energy, starts full

        this.timeElapsedMin = 0;
        this.isLeveling = false; // True if monster is undergoing normal (timed) level-up
        this.levelUpTimeLeftMin = 0; // Remaining time for normal level-up
        this.currentNormalLevelUpSloveCost = 0; // Store cost for logging upon completion
        this.currentNormalLevelUpSeedCost = 0; // Store cost for logging upon completion

        // Cumulative endurance tracking
        this.cumulativeEnduranceConsumedByLeader = initialData.currentCumulativeEndurance || initialData.currentEdurance || 0;
        this.cumulativeEnduranceConsumedByDelegate = scenario === 'nonLeader' ? (initialData.leaderCumulativeEndurance || 0) : 0;

        // Monster's current stats (the one being leveled)
        this.currentStats = {
            simProficiency: initialData.currentTotalProficiency,
            simRecovery: initialData.currentTotalRecovery
        };

        // Ensure unrecovered endurance is within [0, 100]
        this.unrecoveredEnduranceByLeader = Math.max(0, Math.min(100, initialData.unrecoveredEnduranceByLeader || 0));
        this.unrecoveredEnduranceByDelegate = Math.max(0, Math.min(100, initialData.unrecoveredEnduranceByDelegate || 0));

        this.actionLog = [];
        this._logAction('INITIAL_STATE');
    }

    _logAction(type, details = {}) {
        const logEntry = {
            type,
            level: this.level,
            sloveBalance: parseFloat(this.sloveBalance.toFixed(2)),
            energyUnits: parseFloat(this.energyUnits.toFixed(2)),
            maxEnergyUnits: this.maxEnergyUnits,
            timeElapsedMin: Math.round(this.timeElapsedMin),
            isLeveling: this.isLeveling,
            levelUpTimeLeftMin: Math.round(this.levelUpTimeLeftMin),
            currentStats: { ...this.currentStats },
            cumulativeEnduranceConsumedByLeader: parseFloat(this.cumulativeEnduranceConsumedByLeader.toFixed(4)),
            cumulativeEnduranceConsumedByDelegate: parseFloat(this.cumulativeEnduranceConsumedByDelegate.toFixed(4)),
            unrecoveredEnduranceByLeader: parseFloat(this.unrecoveredEnduranceByLeader.toFixed(4)),
            unrecoveredEnduranceByDelegate: parseFloat(this.unrecoveredEnduranceByDelegate.toFixed(4)),
            scenario: this.scenario,
            ...details
        };
        if (type === 'INITIAL_STATE') {
            logEntry.initialSloveBalance = this.initialData.sloveBalance || 0;
        }
        this.actionLog.push(logEntry);
    }

    _getHunterDetails() {
        if (this.scenario === 'leader') {
            const unrecovered = this.unrecoveredEnduranceByLeader;
            return {
                prof: this.currentStats.simProficiency,
                rec: this.currentStats.simRecovery,
                className: this.initialData.className,
                rarityName: this.initialData.rarityName,
                level: this.level,
                initialAge: this.initialData.currentAge,
                cumulativeEndurance: this.cumulativeEnduranceConsumedByLeader,
                unrecoveredEndurance: unrecovered,
                currentEndurancePoints: 100 - unrecovered,
                isDelegate: false
            };
        } else { // 'nonLeader' or 'bulk'
            const unrecovered = this.unrecoveredEnduranceByDelegate;
            return {
                prof: this.initialData.leaderProficiency,
                rec: this.initialData.leaderRecovery,
                className: this.initialData.leaderClass,
                rarityName: this.initialData.leaderRarityName,
                level: this.initialData.leaderLevel,
                initialAge: this.initialData.leaderAge,
                cumulativeEndurance: this.cumulativeEnduranceConsumedByDelegate,
                unrecoveredEndurance: unrecovered,
                currentEndurancePoints: 100 - unrecovered,
                isDelegate: true
            };
        }
    }

    _updateMonsterStatsOnLevelUp() {
        if (this.level >= this.initialData.maxLevel) return; // Should not happen if called after level increment
        const newStats = getSimStatsForLevel(
            this.initialData, // initialData contains base stats before any simulated level ups
            this.rarityInfo,
            this.bestAllocation,
            this.level // new current level
        );
        this.currentStats.simProficiency = newStats.simProficiency;
        this.currentStats.simRecovery = newStats.simRecovery;
    }

    _applyEnergyRefill(durationToAdvance) {
        const energyRefillCycleMinutes = 360; // 6 hours
        const energyPerCycle = 0.25 * this.maxEnergyUnits;

        const numCycles = Math.floor(durationToAdvance / energyRefillCycleMinutes);
        const energyGained = numCycles * energyPerCycle;

        this.energyUnits = Math.min(this.maxEnergyUnits, this.energyUnits + energyGained);
        return energyGained; // Return for logging
    }

    calculatePotentialHuntSlove(energyToUse) {
        const hunter = this._getHunterDetails();

        // 1. Apply Endurance-based Slove Earning Efficiency
        let enduranceEfficiencyMultiplier = 0;
        if (hunter.currentEndurancePoints > 70) {
            enduranceEfficiencyMultiplier = 1.0; // 100%
        } else if (hunter.currentEndurancePoints > 40) {
            enduranceEfficiencyMultiplier = 0.8; // 80%
        } else if (hunter.currentEndurancePoints > 0) {
            enduranceEfficiencyMultiplier = 0.2; // 20%
        } else {
            enduranceEfficiencyMultiplier = 0; // 0% if no endurance
        }

        if (enduranceEfficiencyMultiplier === 0) {
            return 0; // No Slove earned if efficiency is zero
        }

        // 2. Apply Age-based (Fibonacci) Reduction
        const cumulativeEnduranceForAgeCalc = hunter.isDelegate ? hunter.cumulativeEndurance : this.cumulativeEnduranceConsumedByLeader;
        const hunterSimulatedYear = hunter.initialAge + Math.floor(cumulativeEnduranceForAgeCalc / 100);
        const fibonacciReductionPercent = Utils.getFibonacciReductionPercent(hunterSimulatedYear);
        const ageEfficiencyMultiplier = Math.max(0, 1 - (fibonacciReductionPercent / 100));

        if (ageEfficiencyMultiplier === 0) {
            return 0; // No Slove earned if age reduction is 100%
        }

        // 3. Calculate Base Slove
        const baseSlove = Utils.calculateBaseSlovePerHuntAction(hunter.prof, hunter.className, energyToUse);
        // Apply both multipliers
        return baseSlove * enduranceEfficiencyMultiplier * ageEfficiencyMultiplier;
    }

    getPotentialHuntOutcome(energyToUse) {
        if (energyToUse <= 0) {
            return {
                potentialSloveGross: 0,
                enduranceConsumedThisHunt: 0,
                costToRecoverBacklogAndCurrent: 0,
                canAffordBacklogAndCurrentRecovery: false,
                isProfitableAfterFullRecovery: false
            };
        }

        const hunter = this._getHunterDetails();
        const potentialSloveGross = this.calculatePotentialHuntSlove(energyToUse); // Gross Slove from this specific hunt
        const enduranceConsumedThisHunt = Utils.calculateEnduranceConsumedPerHuntAction(hunter.rec, energyToUse);

        // Determine whose unrecovered endurance backlog to use
        const currentUnrecoveredEndurance = hunter.isDelegate ? this.unrecoveredEnduranceByDelegate : this.unrecoveredEnduranceByLeader;
        const totalEnduranceToConsiderRecovering = currentUnrecoveredEndurance + enduranceConsumedThisHunt;

        let costToRecoverBacklogAndCurrent = 0;
        if (totalEnduranceToConsiderRecovering > 0) {
            costToRecoverBacklogAndCurrent = Utils.calculateSlovRecoveryCost(
                totalEnduranceToConsiderRecovering,
                hunter.rarityName,
                hunter.level
            );
        }

        // Can the monster being leveled afford this recovery cost from its current balance + this hunt's gross earnings?
        const canAffordBacklogAndCurrentRecovery = (this.sloveBalance + potentialSloveGross) >= costToRecoverBacklogAndCurrent;
        const isProfitableAfterFullRecovery = potentialSloveGross > costToRecoverBacklogAndCurrent;

        return {
            potentialSloveGross,
            enduranceConsumedThisHunt,
            costToRecoverBacklogAndCurrent,
            canAffordBacklogAndCurrentRecovery,
            isProfitableAfterFullRecovery // Is the hunt itself profitable if all due recovery is paid?
        };
    }

    hunt() {
        const energyToSpend = this.energyUnits;
        if (energyToSpend <= 0) return;

        const huntDurationMinutes = energyToSpend * 10;
        this.timeElapsedMin += huntDurationMinutes;
        this._applyEnergyRefill(huntDurationMinutes);

        const hunter = this._getHunterDetails();
        const sloveGainedFromThisHunt = this.calculatePotentialHuntSlove(energyToSpend);
        const enduranceConsumedThisHunt = Utils.calculateEnduranceConsumedPerHuntAction(hunter.rec, energyToSpend);

        // Add Slove gained from this hunt to the main balance first
        this.sloveBalance += sloveGainedFromThisHunt;

        let sloveCostForRecoveryApplied = 0;
        let enduranceRecoveredThisCycle = 0;
        let recoveryDetails = { reason: 'No recovery needed or attempted', amountSkipped: 0 };

        // Determine whose unrecovered endurance to update and current backlog
        const currentUnrecoveredEndurance = hunter.isDelegate ? this.unrecoveredEnduranceByDelegate : this.unrecoveredEnduranceByLeader;
        const totalEnduranceToPotentiallyRecover = currentUnrecoveredEndurance + enduranceConsumedThisHunt;

        if (totalEnduranceToPotentiallyRecover > 0) {
            const costToRecoverTotal = Utils.calculateSlovRecoveryCost(totalEnduranceToPotentiallyRecover, hunter.rarityName, hunter.level);

            if (this.sloveBalance >= costToRecoverTotal) {
                this.sloveBalance -= costToRecoverTotal;
                sloveCostForRecoveryApplied = costToRecoverTotal;
                enduranceRecoveredThisCycle = totalEnduranceToPotentiallyRecover;
                if (hunter.isDelegate) {
                    this.unrecoveredEnduranceByDelegate = 0;
                } else {
                    this.unrecoveredEnduranceByLeader = 0;
                }
                recoveryDetails = { reason: 'Full recovery of backlog and current hunt successful.', amountSkipped: 0 };
            } else {
                // Cannot afford full recovery, so skip Slove cost, add current hunt's endurance to backlog
                if (hunter.isDelegate) {
                    this.unrecoveredEnduranceByDelegate = Math.min(100, this.unrecoveredEnduranceByDelegate + enduranceConsumedThisHunt);
                } else {
                    this.unrecoveredEnduranceByLeader = Math.min(100, this.unrecoveredEnduranceByLeader + enduranceConsumedThisHunt);
                }
                recoveryDetails = {
                    reason: 'Slove insufficient for full recovery of backlog and current hunt. Current hunt endurance added to backlog.',
                    amountSkipped: totalEnduranceToPotentiallyRecover // Amount of endurance that ideally needed recovery but couldn't be.
                };
            }
        }

        this.energyUnits = 0; // All energy consumed by the hunt

        // Update cumulative endurance for the correct entity
        if (hunter.isDelegate) {
            this.cumulativeEnduranceConsumedByDelegate += enduranceConsumedThisHunt;
        } else {
            this.cumulativeEnduranceConsumedByLeader += enduranceConsumedThisHunt;
        }

        this._logAction('HUNT', {
            energySpent: parseFloat(energyToSpend.toFixed(2)),
            durationMin: huntDurationMinutes,
            sloveGained: parseFloat(sloveGainedFromThisHunt.toFixed(2)), // Gross Slove from this hunt
            enduranceConsumedThisHunt: parseFloat(enduranceConsumedThisHunt.toFixed(4)),
            sloveCostForRecoveryApplied: parseFloat(sloveCostForRecoveryApplied.toFixed(2)),
            enduranceRecoveredThisCycle: parseFloat(enduranceRecoveredThisCycle.toFixed(4)),
            recoveryDetails, // Contains reason and amount skipped
            unrecoveredEnduranceByLeaderAfterHunt: parseFloat(this.unrecoveredEnduranceByLeader.toFixed(4)),
            unrecoveredEnduranceByDelegateAfterHunt: parseFloat(this.unrecoveredEnduranceByDelegate.toFixed(4)),
            huntedBy: hunter.isDelegate ? 'delegate' : 'leader'
        });
    }

    shouldBoostThisLevel(targetLevel) {
        if (!this.useBoost) return false;
        const levelUpTimeHours = Utils.getLevelUpTimeHours(targetLevel);
        const levelUpTimeMinutes = levelUpTimeHours * 60;
        return levelUpTimeMinutes > this.boostThreshold;
    }

    startNormalLevelUp(targetLevel) {
        if (this.energyUnits < this.maxEnergyUnits) return; // Requires full energy

        const sloveCost = Utils.getSloveLevelUpCost(targetLevel);
        const seedCost = Utils.getSeedLevelUpCost(targetLevel); // Keep seed cost as it's in utils
        if (this.sloveBalance < sloveCost) return; // Should be guarded by caller

        this.sloveBalance -= sloveCost;
        // Energy is NOT consumed by starting a level up, only required to be full.

        this.isLeveling = true;
        this.levelUpTimeLeftMin = Utils.getLevelUpTimeHours(targetLevel) * 60;

        // Store costs for logging when level up finishes
        this.currentNormalLevelUpSloveCost = sloveCost;
        this.currentNormalLevelUpSeedCost = seedCost;

        // Time advances by a nominal 1 minute as per plan (or 0, let's use 0 and let wait handle time)
        // this.timeElapsedMin += 0; // Let wait handle time advancement primarily

        // No log action here; will be logged upon completion
    }

    startBoostedLevelUp(targetLevel) {
        if (this.energyUnits < this.maxEnergyUnits) return; // Requires full energy

        const sloveCost = Utils.getSloveLevelUpCost(targetLevel);
        const boostSloveCost = Utils.getBoostCost(targetLevel);
        const seedCost = Utils.getSeedLevelUpCost(targetLevel);
        if (this.sloveBalance < (sloveCost + boostSloveCost)) return; // Guarded by caller

        this.sloveBalance -= (sloveCost + boostSloveCost);
        // Energy is NOT consumed by starting a level up, only required to be full.

        this.level = targetLevel;
        this._updateMonsterStatsOnLevelUp(); // Stats update immediately

        // Time does not increase for boosted level up
        this._logAction('BOOSTED_LEVEL_UP', { // Renamed from START_BOOSTED_LEVEL_UP
            targetLevel,
            sloveCost: parseFloat(sloveCost.toFixed(2)),
            seedCost: parseFloat(seedCost.toFixed(2)),
            boostSloveCost: parseFloat(boostSloveCost.toFixed(2)),
        });
    }

    waitToFinishLevelUp() {
        if (!this.isLeveling || this.levelUpTimeLeftMin <= 0) return;

        const waitDuration = this.levelUpTimeLeftMin;
        this.timeElapsedMin += waitDuration;
        const energyGained = this._applyEnergyRefill(waitDuration);

        this.levelUpTimeLeftMin = 0;
        this.isLeveling = false;
        const previousLevel = this.level;
        this.level++; // Monster levels up
        this._updateMonsterStatsOnLevelUp();

        this._logAction('NORMAL_LEVEL_UP', { // Changed from FINISH_NORMAL_LEVEL_UP
            fromLevel: previousLevel,
            toLevel: this.level,
            sloveCost: parseFloat(this.currentNormalLevelUpSloveCost.toFixed(2)),
            seedCost: parseFloat(this.currentNormalLevelUpSeedCost.toFixed(2)),
            durationMin: waitDuration,
            energyGained: parseFloat(energyGained.toFixed(2))
        });
        this.currentNormalLevelUpSloveCost = 0; // Reset
        this.currentNormalLevelUpSeedCost = 0; // Reset
    }

    waitToRefillEnergy(waitForFull = false) {
        let waitDuration;
        let reason;

        if (waitForFull && this.energyUnits < this.maxEnergyUnits) {
            // Calculate time to get to full energy
            const energyNeeded = this.maxEnergyUnits - this.energyUnits;
            const energyPerCycle = 0.25 * this.maxEnergyUnits;
            const cyclesNeeded = Math.ceil(energyNeeded / energyPerCycle);
            waitDuration = cyclesNeeded * 360; // 360 min per cycle
            reason = 'Waiting for Full Energy';
        } else {
            waitDuration = 360; // Standard 6-hour wait cycle
            reason = 'Waiting for Energy Refill (1 cycle)';
        }

        this.timeElapsedMin += waitDuration;
        const energyGainedThisCycle = this._applyEnergyRefill(waitDuration);

        // If monster is leveling (non-leader scenario) and this wait occurs
        // This logging needs to happen before potential consolidation of the parent WAIT_FOR_ENERGY log.
        if (this.isLeveling && this.scenario === 'nonLeader') {
            const oldLevelUpTimeLeft = this.levelUpTimeLeftMin;
            this.levelUpTimeLeftMin = Math.max(0, this.levelUpTimeLeftMin - waitDuration);

            if (this.levelUpTimeLeftMin === 0 && oldLevelUpTimeLeft > 0) {
                this.isLeveling = false;
                const previousLevel = this.level;
                this.level++;
                this._updateMonsterStatsOnLevelUp();
                this._logAction('NORMAL_LEVEL_UP', {
                    fromLevel: previousLevel,
                    toLevel: this.level,
                    sloveCost: parseFloat(this.currentNormalLevelUpSloveCost.toFixed(2)),
                    seedCost: parseFloat(this.currentNormalLevelUpSeedCost.toFixed(2)),
                    durationMin: oldLevelUpTimeLeft,
                    concurrentWaitDuration: waitDuration,
                    energyGainedDuringWait: parseFloat(energyGainedThisCycle.toFixed(2))
                });
                this.currentNormalLevelUpSloveCost = 0;
                this.currentNormalLevelUpSeedCost = 0;
            }
        }

        const lastAction = this.actionLog.length > 0 ? this.actionLog[this.actionLog.length - 1] : null;

        // Consolidate if:
        // 1. There is a last action.
        // 2. The last action was 'WAIT_FOR_ENERGY'.
        // 3. The current wait is NOT a specific 'Waiting for Full Energy' (i.e., !waitForFull).
        // 4. The PREVIOUS wait was also NOT a specific 'Waiting for Full Energy'.
        if (lastAction &&
            lastAction.type === 'WAIT_FOR_ENERGY' &&
            !waitForFull && // Current wait is a standard cycle
            lastAction.reason && lastAction.reason !== 'Waiting for Full Energy') { // Previous wait was also standard or multi-cycle standard

            lastAction.timeElapsedMin = Math.round(this.timeElapsedMin); // Update timestamp to end of this new cycle
            lastAction.energyUnits = parseFloat(this.energyUnits.toFixed(2)); // Update energy to current
            // sloveBalance and level in lastAction remain from the start of the first wait in the sequence.

            lastAction.durationMin = (lastAction.durationMin || 0) + waitDuration;
            lastAction.energyGained = parseFloat(((lastAction.energyGained || 0) + energyGainedThisCycle).toFixed(2));
            lastAction.reason = 'Waiting for Energy Refill (multiple cycles)'; // Update reason
        } else {
            // Log as a new action
            this._logAction('WAIT_FOR_ENERGY', {
                durationMin: waitDuration,
                reason, // Original reason for this specific wait cycle
                energyGained: parseFloat(energyGainedThisCycle.toFixed(2))
            });
        }
    }
}
