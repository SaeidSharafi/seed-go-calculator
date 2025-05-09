import * as Utils from './utils.js';


export function simulateLevelingScenarios(initialData, bestAllocation) {
    let fastestLeaderLevelingTime = null;
    let fastestNonLeaderLevelingTime = null;
    const leaderResult = simulateLevelingProcess(initialData, bestAllocation, 'leader', false);
    const nonLeaderResult = simulateLevelingProcess(initialData, bestAllocation, 'nonLeader', false);

    for (let i = 60; i <= 12000; i += 30) {
        const leaderResultBoosted = simulateLevelingProcess(initialData, bestAllocation, 'leader', true, i);
        const nonLeaderResultBoosted = simulateLevelingProcess(initialData, bestAllocation, 'nonLeader', true, i);
        if (fastestLeaderLevelingTime === null
            || leaderResultBoosted.totalLevelingMinutes < fastestLeaderLevelingTime.totalLevelingMinutes
        ) {
            fastestLeaderLevelingTime = leaderResultBoosted;
        }

        if (fastestNonLeaderLevelingTime === null
            || nonLeaderResultBoosted.totalLevelingMinutes < fastestNonLeaderLevelingTime.totalLevelingMinutes
        ) {
            fastestNonLeaderLevelingTime = nonLeaderResultBoosted;
        }
    }


    /**
     * TO DO - Fix A* Search for Optimal Path
     * WARNING: This can be very slow and memory-intensive.
     * Uncomment the following lines to run the A* search.
     */
    //console.log(findOptimalLevelingPathAStar(initialData, bestAllocation, 'leader'));


    return {
        leader: leaderResult, leaderBoosted: fastestLeaderLevelingTime,
        nonLeader: nonLeaderResult, nonLeaderBoosted: fastestNonLeaderLevelingTime
    }
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

// Only boost if normal level up takes > 12 hours

export function simulateLevelingProcess(initialData, optimalDistributionToAdd, scenario = 'leader', useBoost = true, BOOST_WORTHINESS_THRESHOLD_MINUTES = 12 * 60) {
    const {
        rarityName, className, currentLevel, maxLevel, currentAge, currentEdurance,
        energyPerHunt,
        currentTotalProficiency, currentTotalRecovery
    } = initialData;

    // --- Basic Setup & Validation ---
    if (currentLevel >= maxLevel) {
        // Return empty log and zero values
        const zeroTotals = calculateTotalsFromLog([]); // Use helper to get structure
        return { scenario: 'N/A', useBoost, ...zeroTotals, actionLog: [] };
    }

    const rarityInfo = Utils.findRarityInfo(rarityName);
    if (!rarityInfo) return { error: `Invalid Rarity Info for ${rarityName}` };


    // --- Simulation State Initialization ---
    let simulationCurrentLevel = currentLevel;
    let currentSloveBalance = initialData.sloveBalance || 0;

    let totalEnduranceConsumed = currentEdurance;
    let currentEnergy = energyPerHunt;
    let levelUpTimeRemainingMinutes = 0;
    let currentTotalTimeMinutes = 0; // Tracks overall simulation time
    let actionLog = []; // Initialize the detailed log

    // --- Time Constants ---
    const huntDurationMinutes = energyPerHunt * 10;
    const fullRefillMinutes = 24 * 60;
    const singleEnergyRefillMinutes = (energyPerHunt > 0) ? fullRefillMinutes / energyPerHunt : Infinity;
    // HUNT_CYCLE_MINUTES is now less relevant as we track time differently

    // --- Pre-calculate External Leader Hunt Details ---
    let externalLeaderBaseSlovePerHunt = null;
    let externalLeaderEnduranceCost = null;
    let externalLeaderClassName = null;
    if (scenario === 'nonLeader') {
        externalLeaderClassName = initialData.leaderClass || className;
        externalLeaderBaseSlovePerHunt = Utils.calculateBaseSlovePerHuntAction(initialData.leaderProficiency, externalLeaderClassName, energyPerHunt);
        externalLeaderEnduranceCost = Utils.calculateEnduranceConsumedPerHuntAction(initialData.leaderRecovery, energyPerHunt);
        if (!isFinite(externalLeaderEnduranceCost) || externalLeaderEnduranceCost <= 0) return { error: `Invalid endurance cost (${externalLeaderEnduranceCost}) calculated for external leader.` };
    }

    // --- Helper for nonLeader scenario: simulate optimal hunt/level sequence ---
    function simulateNonLeaderLevelingStep({
        simulationCurrentLevel,
        currentSloveBalance,
        totalEnduranceConsumed,
        currentEnergy,
        currentTotalTimeMinutes,
        actionLog,
        maxLevel,
        initialData,
        optimalDistributionToAdd,
        rarityInfo,
        useBoost,
        BOOST_WORTHINESS_THRESHOLD_MINUTES,
        externalLeaderBaseSlovePerHunt,
        externalLeaderEnduranceCost,
        energyPerHunt,
        singleEnergyRefillMinutes,
        huntDurationMinutes,
        fullRefillMinutes
    }) {
        const currentAge = initialData.leaderAge;
        let levelUpTimeRemainingMinutes = 0;
        let performedAction = false;
        while (simulationCurrentLevel < maxLevel && !performedAction) {
            const targetLevel = simulationCurrentLevel + 1;
            if (targetLevel > maxLevel) break;
            const levelUpCostSlove = Utils.getSloveLevelUpCost(targetLevel);
            const levelUpCostSeed = Utils.getSeedLevelUpCost(targetLevel);
            const levelUpTimeHours = Utils.getLevelUpTimeHours(targetLevel);
            const boostCost = useBoost ? Utils.getBoostCost(targetLevel) : 0;
            if (!isFinite(levelUpCostSlove) || !isFinite(levelUpCostSeed) || !isFinite(levelUpTimeHours) || !isFinite(boostCost)) {
                return { error: `Missing or invalid level/boost data for level ${targetLevel}` };
            }
            const levelUpTimeMinutes = levelUpTimeHours * 60;
            const canAffordNormalLevelUp = currentSloveBalance >= levelUpCostSlove;
            const canAffordBoost = useBoost && (currentSloveBalance >= (levelUpCostSlove + boostCost));
            // --- Decision: Boost, Normal, or Hunt ---
            let decision = null;
            if (canAffordBoost && levelUpTimeMinutes > BOOST_WORTHINESS_THRESHOLD_MINUTES) {
                decision = 'LEVEL_BOOST';
            } else if (canAffordNormalLevelUp) {
                decision = 'LEVEL_NORMAL';
            } else {
                decision = 'HUNT';
            }
            // --- Execute ---
            if (decision === 'LEVEL_BOOST') {
                // Boost is instant, then hunt if energy full
                currentSloveBalance -= (levelUpCostSlove + boostCost);
                actionLog.push({ type: 'LEVEL_BOOST', fromLevel: simulationCurrentLevel, toLevel: targetLevel, sloveCost: levelUpCostSlove, seedCost: levelUpCostSeed, boostCost: boostCost, currentTotalTimeMin: Math.round(currentTotalTimeMinutes) });
                simulationCurrentLevel++;
                // After boost, if energy full, hunt
                if (currentEnergy === energyPerHunt) {
                    const currentSimYear = Math.floor(totalEnduranceConsumed / 100) + currentAge;
                    const reductionPercent = Utils.getFibonacciReductionPercent(currentSimYear);
                    const earningMultiplier = Math.max(0, 1 - (reductionPercent / 100));
                    const sloveEarnedThisHunt = externalLeaderBaseSlovePerHunt * earningMultiplier;
                    currentTotalTimeMinutes += huntDurationMinutes;
                    currentEnergy = 0;
                    actionLog.push({ type: 'HUNT', level: simulationCurrentLevel, sloveEarned: parseFloat(sloveEarnedThisHunt.toFixed(2)), enduCost: parseFloat(externalLeaderEnduranceCost.toFixed(4)), currentTotalTimeMin: Math.round(currentTotalTimeMinutes) });
                    currentSloveBalance += sloveEarnedThisHunt;
                    totalEnduranceConsumed += externalLeaderEnduranceCost;
                }
                performedAction = true;
            } else if (decision === 'LEVEL_NORMAL') {
                // Start level up, then hunt as many times as possible during level-up
                currentSloveBalance -= levelUpCostSlove;
                actionLog.push({ type: 'LEVEL_NORMAL_START', fromLevel: simulationCurrentLevel, toLevel: targetLevel, sloveCost: levelUpCostSlove, seedCost: levelUpCostSeed, durationMin: levelUpTimeMinutes, currentTotalTimeMin: Math.round(currentTotalTimeMinutes) });
                simulationCurrentLevel++;
                levelUpTimeRemainingMinutes = levelUpTimeMinutes;
                // Hunt as many times as possible during level-up
                while (levelUpTimeRemainingMinutes > 0) {
                    // Wait for energy if not full
                    if (currentEnergy < energyPerHunt) {
                        const timeToFullEnergy = (energyPerHunt - currentEnergy) * singleEnergyRefillMinutes;
                        if (timeToFullEnergy > levelUpTimeRemainingMinutes) {
                            // Wait only the remaining level-up time
                            actionLog.push({ type: 'WAIT', durationMin: Math.round(levelUpTimeRemainingMinutes), reason: 'Finish Level Up', currentTotalTimeMin: Math.round(currentTotalTimeMinutes + levelUpTimeRemainingMinutes), level: simulationCurrentLevel });
                            currentTotalTimeMinutes += levelUpTimeRemainingMinutes;
                            levelUpTimeRemainingMinutes = 0;
                            break;
                        } else {
                            actionLog.push({ type: 'WAIT', durationMin: Math.round(timeToFullEnergy), reason: 'Energy Refill', currentTotalTimeMin: Math.round(currentTotalTimeMinutes + timeToFullEnergy), level: simulationCurrentLevel });
                            currentTotalTimeMinutes += timeToFullEnergy;
                            levelUpTimeRemainingMinutes -= timeToFullEnergy;
                            currentEnergy = energyPerHunt;
                        }
                    }
                    // If energy full and enough time left for a hunt
                    if (currentEnergy === energyPerHunt && levelUpTimeRemainingMinutes >= huntDurationMinutes) {
                        const currentSimYear = Math.floor(totalEnduranceConsumed / 100) + currentAge;
                        const reductionPercent = Utils.getFibonacciReductionPercent(currentSimYear);
                        const earningMultiplier = Math.max(0, 1 - (reductionPercent / 100));
                        const sloveEarnedThisHunt = externalLeaderBaseSlovePerHunt * earningMultiplier;
                        currentTotalTimeMinutes += huntDurationMinutes;
                        levelUpTimeRemainingMinutes -= huntDurationMinutes;
                        currentEnergy = 0;
                        actionLog.push({ type: 'HUNT', level: simulationCurrentLevel, sloveEarned: parseFloat(sloveEarnedThisHunt.toFixed(2)), enduCost: parseFloat(externalLeaderEnduranceCost.toFixed(4)), currentTotalTimeMin: Math.round(currentTotalTimeMinutes) });
                        currentSloveBalance += sloveEarnedThisHunt;
                        totalEnduranceConsumed += externalLeaderEnduranceCost;
                    } else {
                        // Not enough time for another hunt, just wait out the rest
                        if (levelUpTimeRemainingMinutes > 0) {
                            actionLog.push({ type: 'WAIT', durationMin: Math.round(levelUpTimeRemainingMinutes), reason: 'Finish Level Up', currentTotalTimeMin: Math.round(currentTotalTimeMinutes + levelUpTimeRemainingMinutes), level: simulationCurrentLevel });
                            currentTotalTimeMinutes += levelUpTimeRemainingMinutes;
                            levelUpTimeRemainingMinutes = 0;
                        }
                    }
                }
                performedAction = true;
            } else if (decision === 'HUNT') {
                // Hunt to earn more SLOV
                const currentSimYear = Math.floor(totalEnduranceConsumed / 100) + currentAge;
                const reductionPercent = Utils.getFibonacciReductionPercent(currentSimYear);
                const earningMultiplier = Math.max(0, 1 - (reductionPercent / 100));
                const sloveEarnedThisHunt = externalLeaderBaseSlovePerHunt * earningMultiplier;
                currentTotalTimeMinutes += huntDurationMinutes;
                currentEnergy = 0;
                actionLog.push({ type: 'HUNT', level: simulationCurrentLevel, sloveEarned: parseFloat(sloveEarnedThisHunt.toFixed(2)), enduCost: parseFloat(externalLeaderEnduranceCost.toFixed(4)), currentTotalTimeMin: Math.round(currentTotalTimeMinutes) });
                currentSloveBalance += sloveEarnedThisHunt;
                totalEnduranceConsumed += externalLeaderEnduranceCost;
                performedAction = true;
            }
        }
        return {
            simulationCurrentLevel,
            currentSloveBalance,
            totalEnduranceConsumed,
            currentEnergy,
            currentTotalTimeMinutes,
            actionLog
        };
    }

    // --- Main Simulation Loop ---
    while (simulationCurrentLevel < maxLevel) {

        // --- I. Determine Time Until Next Event ---
        let timeToWaitMinutes = Infinity;
        let waitReason = "Unknown";

        if (levelUpTimeRemainingMinutes > 0) {
            timeToWaitMinutes = levelUpTimeRemainingMinutes;
            waitReason = `Finishing Level Up (to Lv ${simulationCurrentLevel + 1})`; // More descriptive reason
        }

        const canRefillWhileLeveling = scenario === 'nonLeader';
        if (currentEnergy < energyPerHunt && (levelUpTimeRemainingMinutes === 0 || canRefillWhileLeveling)) {
            const timeToFullEnergy = (energyPerHunt - currentEnergy) * singleEnergyRefillMinutes;
            if (timeToFullEnergy < timeToWaitMinutes) {
                timeToWaitMinutes = timeToFullEnergy;
                waitReason = "Energy Refill";
            }
        }

        if (timeToWaitMinutes === Infinity) {
            if (currentEnergy === energyPerHunt && levelUpTimeRemainingMinutes === 0) {
                timeToWaitMinutes = 0; // Can act now
                waitReason = "Ready for Action";
            } else {
                console.error(`SIM ERROR (Log): Stuck! Lvl=${simulationCurrentLevel}, E=${currentEnergy}, LvlT=${levelUpTimeRemainingMinutes}, Boost=${useBoost}. Scenario=${scenario}. Inputs:`, initialData);
                return { error: `Simulation logic error (Log): Cannot determine time to wait at level ${simulationCurrentLevel}.` };
            }
        }

        // --- II. Advance Time and Log Wait Period ---
        if (timeToWaitMinutes > 0) {
            // Log the waiting period *before* updating state
            actionLog.push({
                type: 'WAIT',
                durationMin: Math.round(timeToWaitMinutes),
                reason: waitReason,
                currentTotalTimeMin: Math.round(currentTotalTimeMinutes + timeToWaitMinutes), // Time at END of wait
                level: simulationCurrentLevel // Level during wait
            });

            currentTotalTimeMinutes += timeToWaitMinutes;
            if (levelUpTimeRemainingMinutes > 0) {
                levelUpTimeRemainingMinutes = Math.max(0, levelUpTimeRemainingMinutes - timeToWaitMinutes);
            }
            const energyGained = timeToWaitMinutes / singleEnergyRefillMinutes;
            currentEnergy = Math.min(energyPerHunt, currentEnergy + energyGained);
        }

        // --- III. Check for and Execute Actions (if ready) ---
        let canStartNewAction = currentEnergy === energyPerHunt && levelUpTimeRemainingMinutes === 0;
        if (scenario === 'nonLeader' && currentEnergy === energyPerHunt) {
            canStartNewAction = true; // Alternate can start hunt if energy full, even if level timer running
        }

        if (canStartNewAction) {
            const targetLevel = simulationCurrentLevel + 1;
            if (targetLevel > maxLevel) continue;

            // Fetch costs/times
            const levelUpCostSlove = Utils.getSloveLevelUpCost(targetLevel);
            const levelUpCostSeed = Utils.getSeedLevelUpCost(targetLevel);
            const levelUpTimeHours = Utils.getLevelUpTimeHours(targetLevel);
            const boostCost = useBoost ? Utils.getBoostCost(targetLevel) : 0;

            if (!isFinite(levelUpCostSlove) || !isFinite(levelUpCostSeed) || !isFinite(levelUpTimeHours) || !isFinite(boostCost)) {
                return { error: `Missing or invalid level/boost data for level ${targetLevel}` };
            }
            const levelUpTimeMinutes = levelUpTimeHours * 60;
            const canAffordNormalLevelUp = currentSloveBalance >= levelUpCostSlove;
            const canAffordBoost = useBoost && (currentSloveBalance >= (levelUpCostSlove + boostCost));

            let decision = null;
            let estimatedHuntWaitTime = null;
            let waitToBoostDecisionData = null; // Store data if wait chosen

            // --- Decision Logic ---
            if (canAffordBoost && levelUpTimeMinutes > BOOST_WORTHINESS_THRESHOLD_MINUTES) { // <-- Added threshold check
                decision = 'LEVEL_BOOST';
            } else if (canAffordNormalLevelUp) {
                // Check if we should wait for boost (only if boost is worthwhile and affordable eventually)
                if (useBoost && levelUpTimeMinutes > BOOST_WORTHINESS_THRESHOLD_MINUTES) { // <-- Added threshold check here too
                    const sloveNeededForBoost = (levelUpCostSlove + boostCost) - currentSloveBalance;
                    // Estimate time to get SLOV needed for boost
                    const slovePerHuntCycleEst = estimateSlovPerHuntCycle(initialData, rarityInfo, optimalDistributionToAdd, simulationCurrentLevel, totalEnduranceConsumed, scenario, externalLeaderBaseSlovePerHunt);

                    if (slovePerHuntCycleEst > 0) {
                        const huntsNeededEst = Math.ceil(sloveNeededForBoost / slovePerHuntCycleEst);
                        estimatedHuntWaitTime = huntsNeededEst * (huntDurationMinutes + fullRefillMinutes);

                        // Decide: Wait for boost only if it's faster than normal level up AND boost is deemed worthwhile
                        if (estimatedHuntWaitTime < levelUpTimeMinutes) {
                            decision = 'WAIT_FOR_BOOST';
                            waitToBoostDecisionData = { // Store data for logging
                                atLevel: simulationCurrentLevel,
                                targetLevel: targetLevel,
                                waitTimeEstMin: Math.round(estimatedHuntWaitTime),
                                normalTimeMin: Math.round(levelUpTimeMinutes)
                            };
                        } else {
                            // Waiting is slower OR boost isn't worthwhile -> Level normally
                            decision = 'LEVEL_NORMAL';
                        }
                    } else { // Cannot earn SLOV to boost
                        decision = 'LEVEL_NORMAL';
                    }
                } else { // Not using boost OR boost isn't worthwhile for this level -> Level normally
                    decision = 'LEVEL_NORMAL';
                }
            } else { // Cannot afford normal level up
                decision = 'HUNT';
            }

            // --- Action Execution & Logging ---
            let actionLogged = false;

            // --- Leader Scenario ---
            if (scenario === 'leader') {
                if (levelUpTimeRemainingMinutes > 0 && decision !== null) { /* Wait */ } // Should not happen here
                else if (decision === 'LEVEL_BOOST') {
                    currentSloveBalance -= (levelUpCostSlove + boostCost);
                    actionLog.push({ type: 'LEVEL_BOOST', fromLevel: simulationCurrentLevel, toLevel: targetLevel, sloveCost: levelUpCostSlove, seedCost: levelUpCostSeed, boostCost: boostCost, currentTotalTimeMin: Math.round(currentTotalTimeMinutes) });
                    simulationCurrentLevel++; levelUpTimeRemainingMinutes = 0; actionLogged = true;
                } else if (decision === 'LEVEL_NORMAL') {
                    currentSloveBalance -= levelUpCostSlove;
                    actionLog.push({ type: 'LEVEL_NORMAL_START', fromLevel: simulationCurrentLevel, toLevel: targetLevel, sloveCost: levelUpCostSlove, seedCost: levelUpCostSeed, durationMin: levelUpTimeMinutes, currentTotalTimeMin: Math.round(currentTotalTimeMinutes) });
                    simulationCurrentLevel++; levelUpTimeRemainingMinutes = levelUpTimeMinutes; actionLogged = true;
                } else { // HUNT or WAIT_FOR_BOOST
                    if (waitToBoostDecisionData) actionLog.push({ type: 'DECISION_WAIT_FOR_BOOST', ...waitToBoostDecisionData, currentTotalTimeMin: Math.round(currentTotalTimeMinutes) });

                    const { simProficiency, simRecovery } = getSimStatsForLevel(initialData, rarityInfo, optimalDistributionToAdd, simulationCurrentLevel);
                    const baseSlove = Utils.calculateBaseSlovePerHuntAction(simProficiency, className, energyPerHunt);
                    const enduranceCost = Utils.calculateEnduranceConsumedPerHuntAction(simRecovery, energyPerHunt);
                    if (!isFinite(enduranceCost) || enduranceCost <= 0) return { error: `Invalid endurance cost (${enduranceCost}) for leader at level ${simulationCurrentLevel}` };
                    const currentSimYear = Math.floor(totalEnduranceConsumed / 100) + currentAge; const reductionPercent = Utils.getFibonacciReductionPercent(currentSimYear); const earningMultiplier = Math.max(0, 1 - (reductionPercent / 100)); const sloveEarnedThisHunt = baseSlove * earningMultiplier;

                    currentTotalTimeMinutes += huntDurationMinutes; currentEnergy = 0; // Add hunt time, consume energy

                    actionLog.push({ type: 'HUNT', level: simulationCurrentLevel, sloveEarned: parseFloat(sloveEarnedThisHunt.toFixed(2)), enduCost: parseFloat(enduranceCost.toFixed(4)), currentTotalTimeMin: Math.round(currentTotalTimeMinutes), prof: simProficiency, rec: simRecovery });
                    currentSloveBalance += sloveEarnedThisHunt; totalEnduranceConsumed += enduranceCost; actionLogged = true;
                }
            } // End Leader Action

            // --- Alternate Scenario ---
            else if (scenario === 'nonLeader') {
                // Use new helper for nonLeader
                const result = simulateNonLeaderLevelingStep({
                    simulationCurrentLevel,
                    currentSloveBalance,
                    totalEnduranceConsumed,
                    currentEnergy,
                    currentTotalTimeMinutes,
                    actionLog,
                    maxLevel,
                    initialData,
                    optimalDistributionToAdd,
                    rarityInfo,
                    useBoost,
                    BOOST_WORTHINESS_THRESHOLD_MINUTES,
                    externalLeaderBaseSlovePerHunt,
                    externalLeaderEnduranceCost,
                    energyPerHunt,
                    singleEnergyRefillMinutes,
                    huntDurationMinutes,
                    fullRefillMinutes
                });
                if (result.error) return { error: result.error };
                simulationCurrentLevel = result.simulationCurrentLevel;
                currentSloveBalance = result.currentSloveBalance;
                totalEnduranceConsumed = result.totalEnduranceConsumed;
                currentEnergy = result.currentEnergy;
                currentTotalTimeMinutes = result.currentTotalTimeMinutes;
                actionLog = result.actionLog;
                continue;
            }

        } // End if(canStartNewAction)

    } // End while level < maxLevel

    // --- Calculate Final Totals from Log ---
    const finalTotals = calculateTotalsFromLog(actionLog);

    // --- Return Results ---
    return {
        scenario: scenario,
        useBoost: useBoost,
        ...finalTotals, // Spread the calculated totals
        actionLog: actionLog // Return the detailed log
    };
}

function calculateTotalsFromLog(actionLog) {
    let totalHunts = 0;
    let totalGrossSlove = 0;
    let totalSloveSpent = 0;
    let totalSeedSpent = 0;
    let totalBoostCost = 0;
    let lastTimestamp = 0;

    if (!actionLog || actionLog.length === 0) {
        return { totalHuntsToReachMaxLevel: 0, totalGrossSloveEarnedDuringLeveling: 0, totalSloveSpentOnLeveling: 0, totalSeedSpentOnLeveling: 0, totalBoostCost: 0, netSloveAfterLevelingCosts: 0, totalLevelingMinutes: 0 };
    }

    for (const action of actionLog) {
        // Find the latest timestamp
        lastTimestamp = Math.max(lastTimestamp, action.currentTotalTimeMin || 0);

        if (action.type === 'HUNT') {
            totalHunts++;
            // Ensure sloveEarned is a number before adding
            totalGrossSlove += (typeof action.sloveEarned === 'number' ? action.sloveEarned : 0);
        } else if (action.type === 'LEVEL_NORMAL_START') { // Cost applied when STARTING normal level up
            totalSloveSpent += (typeof action.sloveCost === 'number' ? action.sloveCost : 0);
            totalSeedSpent += (typeof action.seedCost === 'number' ? action.seedCost : 0);
        } else if (action.type === 'LEVEL_BOOST') {
            totalSloveSpent += (typeof action.sloveCost === 'number' ? action.sloveCost : 0);
            totalSeedSpent += (typeof action.seedCost === 'number' ? action.seedCost : 0);
            totalBoostCost += (typeof action.boostCost === 'number' ? action.boostCost : 0);
        }
        // LEVEL_NORMAL_START logs the cost when it starts, WAIT doesn't add cost
        // DECISION_WAIT_FOR_BOOST is just informational
    }
    const netSlove = totalGrossSlove - totalSloveSpent - totalBoostCost;

    return {
        totalHuntsToReachMaxLevel: totalHunts,
        totalGrossSloveEarnedDuringLeveling: parseFloat(totalGrossSlove.toFixed(2)),
        totalSloveSpentOnLeveling: parseFloat(totalSloveSpent.toFixed(2)),
        totalSeedSpentOnLeveling: parseFloat(totalSeedSpent.toFixed(2)),
        totalBoostCost: parseFloat(totalBoostCost.toFixed(2)),
        netSloveAfterLevelingCosts: parseFloat(netSlove.toFixed(2)),
        totalLevelingMinutes: Math.round(lastTimestamp) // Total time is the timestamp of the last action completion/start
    };
}

// --- A* Search Implementation for Optimal Leveling ---

// Simple Priority Queue using Array Sort (Not efficient for large scale)
class PriorityQueue {
    constructor() {
        this.elements = [];
    }

    enqueue(element, priority) {
        this.elements.push({ element, priority });
        this.sort();
    }

    dequeue() {
        return this.elements.shift().element;
    }

    isEmpty() {
        return this.elements.length === 0;
    }

    sort() {
        this.elements.sort((a, b) => a.priority - b.priority);
    }
}

/**
 * A* Search to find the theoretically optimal (fastest time) leveling path.
 * WARNING: Can be very computationally expensive (slow, high memory usage).
 *
 * @param {object} initialData - Same initial data as simulateLevelingProcess.
 * @param {object} optimalDistributionToAdd - Point allocation strategy.
 * @param {string} scenario - 'leader' or 'nonLeader'.
 * @returns {object} Result object with path and stats, or error.
 */
export function findOptimalLevelingPathAStar(initialData, optimalDistributionToAdd, scenario = 'leader') {
    const {
        rarityName, className, currentLevel, maxLevel, currentAge, currentEdurance,
        energyPerHunt, currentTotalProficiency, currentTotalRecovery
    } = initialData;

    // --- Basic Setup & Validation (Similar to simulateLevelingProcess) ---
    if (currentLevel >= maxLevel) return { path: [], totalTimeMinutes: 0, error: null };
    const rarityInfo = Utils.findRarityInfo(rarityName);
    if (!rarityInfo) return { error: `Invalid Rarity Info for ${rarityName}` };
    if (scenario === 'nonLeader' && (initialData.leaderProficiency === undefined || initialData.leaderRecovery === undefined)) {
        return { error: `Missing leaderProficiency or leaderRecovery for 'nonLeader' scenario.` };
    }

    // --- Constants ---
    const huntDurationMinutes = energyPerHunt * 10;
    const fullRefillMinutes = 24 * 60;
    const singleEnergyRefillMinutes = (energyPerHunt > 0) ? fullRefillMinutes / energyPerHunt : Infinity;

    // --- External Leader Stats (if needed) ---
    let externalLeaderBaseSlovePerHunt = null;
    let externalLeaderEnduranceCost = null;
    if (scenario === 'nonLeader') {
        const externalLeaderClassName = initialData.leaderClass || className;
        externalLeaderBaseSlovePerHunt = Utils.calculateBaseSlovePerHuntAction(initialData.leaderProficiency, externalLeaderClassName, energyPerHunt);
        externalLeaderEnduranceCost = Utils.calculateEnduranceConsumedPerHuntAction(initialData.leaderRecovery, energyPerHunt);
        if (!isFinite(externalLeaderEnduranceCost) || externalLeaderEnduranceCost <= 0) return { error: `Invalid endurance cost (${externalLeaderEnduranceCost}) for external leader.` };
    }

    // --- Heuristic Function (h) ---
    const calculateHeuristic = (state) => {
        let estimatedRemainingSlovNeeded = 0;
        for (let lvl = state.level + 1; lvl <= maxLevel; lvl++) {
            estimatedRemainingSlovNeeded += Utils.getSloveLevelUpCost(lvl);
        }
        const sloveDeficit = Math.max(0, estimatedRemainingSlovNeeded - state.slove);

        // If no more SLOV is needed (or we already have enough), heuristic cost is 0
        if (sloveDeficit <= 0) return 0;

        // Estimate SLOV gain rate
        const slovePerHuntCycleEst = estimateSlovPerHuntCycle(
            initialData, rarityInfo, optimalDistributionToAdd, state.level,
            state.endurance, scenario, externalLeaderBaseSlovePerHunt
        );

        // If estimation shows no SLOV can be earned, the goal is unreachable *from this state* via hunting
        if (slovePerHuntCycleEst <= 0) {
            // console.log(`Heuristic: Unreachable (SLOV gain <= 0) at Level ${state.level}, Endu ${state.endurance.toFixed(2)}, Time ${state.time.toFixed(0)}`); // Added logging
            return Infinity;
        }

        const huntsNeededEst = sloveDeficit / slovePerHuntCycleEst;
        const estimatedTimeToHunt = huntsNeededEst * (huntDurationMinutes + fullRefillMinutes); // Includes refill time

        // Return estimated time, ensuring it's non-negative
        return Math.max(0, estimatedTimeToHunt);
    };

    // --- A* Initialization ---
    const openSet = new PriorityQueue();
    const cameFrom = new Map(); // Stores the path: stateKey -> {prevStateKey, action, cost}
    const gScore = new Map(); // Cost (time) from start to stateKey
    const fScore = new Map(); // gScore + heuristic

    const initialState = {
        level: currentLevel,
        slove: initialData.sloveBalance || 0,
        energy: energyPerHunt,
        levelUpTimer: 0, // Minutes remaining for current level-up
        time: 0, // Current total time elapsed
        endurance: currentEdurance
    };
    const startKey = `${initialState.level}-${initialState.slove.toFixed(2)}`; // Use toFixed(2) for key

    gScore.set(startKey, 0);
    fScore.set(startKey, calculateHeuristic(initialState));
    openSet.enqueue(initialState, fScore.get(startKey));

    // --- A* Search Loop ---
    let iterations = 0;
    const MAX_ITERATIONS = 5000000; // Safety break for performance

    while (!openSet.isEmpty()) {
        iterations++;
        if (iterations > MAX_ITERATIONS) {
            console.error("A* search exceeded max iterations");
            return { error: "A* search took too long (exceeded max iterations)" };
        }

        const current = openSet.dequeue();
        const currentKey = `${current.level}-${current.slove.toFixed(2)}`; // Use toFixed(2) for key

        // --- Logging Current State ---
        // console.log(`Dequeued: Lvl ${current.level}, SLOV ${current.slove.toFixed(2)}, E ${current.energy.toFixed(1)}, Timer ${current.levelUpTimer.toFixed(0)}, Time ${current.time.toFixed(0)}, gScore ${gScore.get(currentKey)?.toFixed(0)}, fScore ${fScore.get(currentKey)?.toFixed(0)}`);

        // --- Goal Check ---
        if (current.level === maxLevel) {
            // Reconstruct path
            const path = [];
            let tempKey = currentKey;
            while (cameFrom.has(tempKey)) {
                const { prevStateKey, action, cost } = cameFrom.get(tempKey);
                path.push({ action, cost }); // Add action and its time cost
                tempKey = prevStateKey;
            }
            path.reverse();
            const finalTotals = calculateTotalsFromLog(path); // Use existing log calculator
            return {
                scenario: scenario + "-A*",
                useBoost: true, // A* considers boost implicitly
                ...finalTotals,
                actionLog: path, // Rename for consistency?
                totalLevelingMinutes: Math.round(current.time),
                error: null
            };
        }

        // --- Explore Neighbors (Possible Actions) ---
        const possibleActions = [];

        // 1. WAIT Action: Always possible if needed
        let timeToWait = Infinity;
        if (current.levelUpTimer > 0) timeToWait = Math.min(timeToWait, current.levelUpTimer);
        if (current.energy < energyPerHunt) {
            const timeToFullEnergy = (energyPerHunt - current.energy) * singleEnergyRefillMinutes;
            timeToWait = Math.min(timeToWait, timeToFullEnergy);
        }
        if (timeToWait === Infinity && current.energy === energyPerHunt && current.levelUpTimer === 0) {
            timeToWait = 0; // Ready for action now
        }

        if (timeToWait > 0 && timeToWait !== Infinity) {
            possibleActions.push({ type: 'WAIT', duration: timeToWait });
        }

        // 2. Actions possible only if energy is full and (for leader) level timer is 0
        let canAct = (scenario === 'leader' && current.energy === energyPerHunt && current.levelUpTimer === 0) ||
            (scenario === 'nonLeader' && current.energy === energyPerHunt);

        if (canAct) {
            const targetLevel = current.level + 1;
            if (targetLevel <= maxLevel) {
                const levelUpCostSlove = Utils.getSloveLevelUpCost(targetLevel);
                const levelUpTimeHours = Utils.getLevelUpTimeHours(targetLevel);
                const levelUpTimeMinutes = levelUpTimeHours * 60;
                const boostCost = Utils.getBoostCost(targetLevel);

                // 2a. HUNT Action
                possibleActions.push({ type: 'HUNT' });

                // 2b. LEVEL_NORMAL Action
                if (current.slove >= levelUpCostSlove && current.levelUpTimer === 0) { // Can only start if timer is 0
                    possibleActions.push({ type: 'LEVEL_NORMAL', cost: levelUpCostSlove, duration: levelUpTimeMinutes, targetLevel: targetLevel });
                }

                // 2c. LEVEL_BOOST Action
                if (current.slove >= (levelUpCostSlove + boostCost) && current.levelUpTimer === 0) { // Can only start if timer is 0
                    possibleActions.push({ type: 'LEVEL_BOOST', cost: levelUpCostSlove, boostCost: boostCost, targetLevel: targetLevel });
                }
            }
        }

        // --- Process Each Possible Action --- 
        for (const action of possibleActions) {
            let neighbor = { ...current }; // Create next state based on current
            let actionCost = 0; // Time cost of this specific action/wait

            // Apply action to create neighbor state
            if (action.type === 'WAIT') {
                actionCost = action.duration;
                neighbor.time += actionCost;
                if (neighbor.levelUpTimer > 0) {
                    neighbor.levelUpTimer = Math.max(0, neighbor.levelUpTimer - actionCost);
                }
                const energyGained = actionCost / singleEnergyRefillMinutes;
                neighbor.energy = Math.min(energyPerHunt, neighbor.energy + energyGained);
            }
            else if (action.type === 'HUNT') {
                actionCost = huntDurationMinutes;
                neighbor.time += actionCost;
                neighbor.energy = 0; // Consumed energy

                let sloveEarned = 0;
                let enduCost = 0;
                const currentSimYear = Math.floor(neighbor.endurance / 100) + currentAge;
                const reductionPercent = Utils.getFibonacciReductionPercent(currentSimYear);
                const earningMultiplier = Math.max(0, 1 - (reductionPercent / 100));

                if (scenario === 'leader') {
                    const { simProficiency, simRecovery } = getSimStatsForLevel(initialData, rarityInfo, optimalDistributionToAdd, neighbor.level);
                    const baseSlove = Utils.calculateBaseSlovePerHuntAction(simProficiency, className, energyPerHunt);
                    enduCost = Utils.calculateEnduranceConsumedPerHuntAction(simRecovery, energyPerHunt);
                    sloveEarned = baseSlove * earningMultiplier;
                } else { // nonLeader
                    sloveEarned = externalLeaderBaseSlovePerHunt * earningMultiplier;
                    enduCost = externalLeaderEnduranceCost;
                }
                neighbor.slove += sloveEarned;
                neighbor.endurance += enduCost;
            }
            else if (action.type === 'LEVEL_NORMAL') {
                actionCost = 0; // Starting level up is instant, time progresses via WAIT
                neighbor.slove -= action.cost;
                neighbor.level = action.targetLevel;
                neighbor.levelUpTimer = action.duration; // Set the timer
                // Note: Time doesn't advance here, it advances in subsequent WAIT steps
            }
            else if (action.type === 'LEVEL_BOOST') {
                actionCost = 0; // Boosting is instant
                neighbor.slove -= (action.cost + action.boostCost);
                neighbor.level = action.targetLevel;
                neighbor.levelUpTimer = 0; // No timer for boost
            }

            // --- Check if this path to neighbor is better ---
            const neighborKey = `${neighbor.level}-${neighbor.slove.toFixed(2)}`; // Use toFixed(2) for key
            const tentative_gScore = (gScore.get(currentKey) ?? 0) + actionCost; // Ensure gScore exists for currentKey

            const current_gScore_for_neighbor = gScore.get(neighborKey) ?? Infinity;

            if (tentative_gScore < current_gScore_for_neighbor) {
                // This path to neighbor is better than any previous one. Record it.
                cameFrom.set(neighborKey, { prevStateKey: currentKey, action: action, cost: actionCost });
                gScore.set(neighborKey, tentative_gScore);

                const h = calculateHeuristic(neighbor);

                if (h === Infinity && neighbor.level < maxLevel) {
                    // console.log(`Pruning path at Lvl ${neighbor.level}, SLOV ${neighbor.slove.toFixed(2)} due to h=Infinity`); // Added logging
                    continue; // Skip adding this neighbor to openSet
                }

                fScore.set(neighborKey, tentative_gScore + h);

                // Check if neighbor is already in openSet to update priority (simplified check)
                // A more robust implementation would use a Map for faster lookups or update priority directly if PQ supports it.
                let foundInOpen = false;
                for (let item of openSet.elements) {
                    // Compare elements based on a unique key representation
                    const itemKey = `${item.element.level}-${Math.round(item.element.slove)}`;
                    if (itemKey === neighborKey) {
                        item.priority = fScore.get(neighborKey); // Update priority in place (relies on next sort)
                        foundInOpen = true;
                        break;
                    }
                }
                if (!foundInOpen) {
                    openSet.enqueue(neighbor, fScore.get(neighborKey));
                } else {
                    openSet.sort(); // Re-sort if an existing element's priority was updated
                }

            } else {
                // --- Logging Discarded Path ---
                // console.log(`  Discarded path to Lvl ${neighbor.level}, SLOV ${neighbor.slove.toFixed(2)} via ${action.type}. New gScore ${tentative_gScore.toFixed(0)} >= Existing ${current_gScore_for_neighbor.toFixed(0)}`);
            } // End if tentative_gScore is better
        } // End processing actions
    } // End while openSet not empty

    // If loop finishes without finding the goal
    console.error(`A* search completed exploration but did not find a path to level ${maxLevel}. Explored ${iterations} states.`);
    return { error: `A* search failed to find a path to the goal level ${maxLevel}. Possible reasons: goal unreachable, heuristic issue, or state space problem.` };
}
