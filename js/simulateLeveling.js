import * as Utils from './utils.js'; 

export function simulateLevelingScenarios(initialData, bestAllocation) {
    const leaderResult = simulateLevelingProcess(initialData, bestAllocation, 'leader', false);
    const leaderResultBoosted = simulateLevelingProcess(initialData, bestAllocation, 'leader', true);

    const bulkResult = simulateLevelingProcess(initialData, bestAllocation, 'bulk', false);
    const bulkResultBoosted = simulateLevelingProcess(initialData, bestAllocation, 'bulk', true);

    const alternateResult = simulateLevelingProcess(initialData, bestAllocation, 'alternate', false);
    const alternateResultBoosted = simulateLevelingProcess(initialData, bestAllocation, 'alternate', true);

    return {
        leader: leaderResult, leaderBoosted: leaderResultBoosted,
        bulk: bulkResult, bulkBoosted: bulkResultBoosted,
        alternate: alternateResult, alternateBoosted: alternateResultBoosted
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

    const bonusPointsAlreadySpent = currentLevel * rarityInfo.bonusPts;
    const totalBonusPointsAtMaxLevel = maxLevel * rarityInfo.bonusPts;
    const remainingBonusPointsToAllocate = Math.max(0, totalBonusPointsAtMaxLevel - bonusPointsAlreadySpent);

    const bonusPointsForSimLevel = simulatedLevel * rarityInfo.bonusPts;
    const bonusPointsAddedSoFar = Math.max(0, bonusPointsForSimLevel - bonusPointsAlreadySpent);

    let simCurrentProfBonus = 0;
    let simCurrentRecBonus = 0;

    if (remainingBonusPointsToAllocate > 0 && bonusPointsAddedSoFar > 0) {
        const totalPointsToAddRatioDenom = proficiencyBonusToAdd + recoveryBonusToAdd;
        if (totalPointsToAddRatioDenom > 0) {
            simCurrentProfBonus = bonusPointsAddedSoFar * (proficiencyBonusToAdd / totalPointsToAddRatioDenom);
            simCurrentRecBonus = Math.max(0, bonusPointsAddedSoFar - simCurrentProfBonus);
        }
    }

    return {
        simProficiency: currentTotalProficiency + simCurrentProfBonus,
        simRecovery: currentTotalRecovery + simCurrentRecBonus
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
    } else { // bulk or alternate
        baseSlove = externalLeaderBaseSlovePerHunt;
    }

    if (!isFinite(baseSlove) || baseSlove <= 0) return 0; // Cannot earn

    // Apply age reduction based on current endurance
    const currentSimYear = Math.floor(totalEnduranceConsumed / 100) + currentAge;
    const reductionPercent = Utils.getFibonacciReductionPercent(currentSimYear);
    const earningMultiplier = Math.max(0, 1 - (reductionPercent / 100));

    return baseSlove * earningMultiplier;
}

export function simulateLevelingProcess(initialData, optimalDistributionToAdd, scenario = 'leader', useBoost = true) {
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

    if ((scenario === 'bulk' || scenario === 'alternate')) { /* ... validation ... */ }

    // --- Simulation State Initialization ---
    let simulationCurrentLevel = currentLevel;
    let currentSloveBalance = 0;
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
    if (scenario === 'bulk' || scenario === 'alternate') {
        externalLeaderClassName = initialData.leaderClass || className;
        externalLeaderBaseSlovePerHunt = Utils.calculateBaseSlovePerHuntAction(initialData.leaderProficiency, externalLeaderClassName, energyPerHunt);
        externalLeaderEnduranceCost = Utils.calculateEnduranceConsumedPerHuntAction(initialData.leaderRecovery, energyPerHunt);
         if (!isFinite(externalLeaderEnduranceCost) || externalLeaderEnduranceCost <= 0) return { error: `Invalid endurance cost (${externalLeaderEnduranceCost}) calculated for external leader.` };
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

        const canRefillWhileLeveling = scenario === 'alternate';
        if (currentEnergy < energyPerHunt && (levelUpTimeRemainingMinutes === 0 || canRefillWhileLeveling)) {
             const timeToFullEnergy = (energyPerHunt - currentEnergy) * singleEnergyRefillMinutes;
             if(timeToFullEnergy < timeToWaitMinutes) {
                 timeToWaitMinutes = timeToFullEnergy;
                 waitReason = "Energy Refill";
             }
        }

        if (timeToWaitMinutes === Infinity) {
             if(currentEnergy === energyPerHunt && levelUpTimeRemainingMinutes === 0) {
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
        if (scenario === 'alternate' && currentEnergy === energyPerHunt) {
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
            if (canAffordBoost) {
                decision = 'LEVEL_BOOST';
            } else if (canAffordNormalLevelUp) {
                if (useBoost && levelUpTimeMinutes > 0) {
                    const sloveNeededForBoost = (levelUpCostSlove + boostCost) - currentSloveBalance;
                    const slovePerHuntCycleEst = estimateSlovPerHuntCycle(initialData, rarityInfo, optimalDistributionToAdd, simulationCurrentLevel, totalEnduranceConsumed, scenario, externalLeaderBaseSlovePerHunt);

                    if (slovePerHuntCycleEst > 0) {
                        const huntsNeededEst = Math.ceil(sloveNeededForBoost / slovePerHuntCycleEst);
                        // Estimate time including hunt duration + full refill per hunt
                        estimatedHuntWaitTime = huntsNeededEst * (huntDurationMinutes + fullRefillMinutes);

                        if (estimatedHuntWaitTime < levelUpTimeMinutes) {
                            decision = 'WAIT_FOR_BOOST'; // Will result in HUNT action this turn
                            waitToBoostDecisionData = { // Store data for logging
                                atLevel: simulationCurrentLevel,
                                targetLevel: targetLevel,
                                waitTimeEstMin: Math.round(estimatedHuntWaitTime),
                                normalTimeMin: Math.round(levelUpTimeMinutes)
                            };
                        } else {
                            decision = 'LEVEL_NORMAL';
                        }
                    } else {
                        decision = 'LEVEL_NORMAL';
                    }
                } else {
                    decision = 'LEVEL_NORMAL';
                }
            } else {
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

                    actionLog.push({ type: 'HUNT', level: simulationCurrentLevel, sloveEarned: parseFloat(sloveEarnedThisHunt.toFixed(2)), enduCost: parseFloat(enduranceCost.toFixed(4)), currentTotalTimeMin: Math.round(currentTotalTimeMinutes) });
                    currentSloveBalance += sloveEarnedThisHunt; totalEnduranceConsumed += enduranceCost; actionLogged = true;
                }
            } // End Leader Action

            // --- Bulk Scenario ---
            else if (scenario === 'bulk') {
                 if (levelUpTimeRemainingMinutes > 0 && decision !== null) { /* Wait */ }
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
                     const currentSimYear = Math.floor(totalEnduranceConsumed / 100) + currentAge; const reductionPercent = Utils.getFibonacciReductionPercent(currentSimYear); const earningMultiplier = Math.max(0, 1 - (reductionPercent / 100)); const sloveEarnedThisHunt = externalLeaderBaseSlovePerHunt * earningMultiplier;
                     currentTotalTimeMinutes += huntDurationMinutes; currentEnergy = 0;
                     actionLog.push({ type: 'HUNT', level: simulationCurrentLevel, sloveEarned: parseFloat(sloveEarnedThisHunt.toFixed(2)), enduCost: parseFloat(externalLeaderEnduranceCost.toFixed(4)), currentTotalTimeMin: Math.round(currentTotalTimeMinutes) });
                     currentSloveBalance += sloveEarnedThisHunt; totalEnduranceConsumed += externalLeaderEnduranceCost; actionLogged = true;
                 }
            } // End Bulk Action

            // --- Alternate Scenario ---
             else if (scenario === 'alternate') {
                 let performedHunt = false; // Did we hunt this cycle?

                 if (decision === 'LEVEL_BOOST') {
                     if (levelUpTimeRemainingMinutes === 0) { // Only boost if not already leveling
                         currentSloveBalance -= (levelUpCostSlove + boostCost);
                         actionLog.push({ type: 'LEVEL_BOOST', fromLevel: simulationCurrentLevel, toLevel: targetLevel, sloveCost: levelUpCostSlove, seedCost: levelUpCostSeed, boostCost: boostCost, currentTotalTimeMin: Math.round(currentTotalTimeMinutes) });
                         simulationCurrentLevel++; levelUpTimeRemainingMinutes = 0;
                         if (simulationCurrentLevel >= maxLevel) { actionLogged = true; continue; }
                     }
                     // Proceed to hunt
                     const currentSimYear = Math.floor(totalEnduranceConsumed / 100) + currentAge; const reductionPercent = Utils.getFibonacciReductionPercent(currentSimYear); const earningMultiplier = Math.max(0, 1 - (reductionPercent / 100)); const sloveEarnedThisHunt = externalLeaderBaseSlovePerHunt * earningMultiplier;
                     currentTotalTimeMinutes += huntDurationMinutes; currentEnergy = 0;
                     actionLog.push({ type: 'HUNT', level: simulationCurrentLevel, sloveEarned: parseFloat(sloveEarnedThisHunt.toFixed(2)), enduCost: parseFloat(externalLeaderEnduranceCost.toFixed(4)), currentTotalTimeMin: Math.round(currentTotalTimeMinutes) });
                     currentSloveBalance += sloveEarnedThisHunt; totalEnduranceConsumed += externalLeaderEnduranceCost;
                     actionLogged = true; performedHunt = true;

                 } else if (decision === 'LEVEL_NORMAL') {
                     if (levelUpTimeRemainingMinutes === 0) { // Only start level up if not already leveling
                         currentSloveBalance -= levelUpCostSlove;
                         actionLog.push({ type: 'LEVEL_NORMAL_START', fromLevel: simulationCurrentLevel, toLevel: targetLevel, sloveCost: levelUpCostSlove, seedCost: levelUpCostSeed, durationMin: levelUpTimeMinutes, currentTotalTimeMin: Math.round(currentTotalTimeMinutes) });
                         simulationCurrentLevel++; levelUpTimeRemainingMinutes = levelUpTimeMinutes;
                          if (simulationCurrentLevel >= maxLevel) { actionLogged = true; continue; }
                     }
                     // Proceed to hunt
                     const currentSimYear = Math.floor(totalEnduranceConsumed / 100) + currentAge; const reductionPercent = Utils.getFibonacciReductionPercent(currentSimYear); const earningMultiplier = Math.max(0, 1 - (reductionPercent / 100)); const sloveEarnedThisHunt = externalLeaderBaseSlovePerHunt * earningMultiplier;
                     currentTotalTimeMinutes += huntDurationMinutes; currentEnergy = 0;
                     actionLog.push({ type: 'HUNT', level: simulationCurrentLevel, sloveEarned: parseFloat(sloveEarnedThisHunt.toFixed(2)), enduCost: parseFloat(externalLeaderEnduranceCost.toFixed(4)), currentTotalTimeMin: Math.round(currentTotalTimeMinutes) });
                     currentSloveBalance += sloveEarnedThisHunt; totalEnduranceConsumed += externalLeaderEnduranceCost;
                     actionLogged = true; performedHunt = true;

                 } else { // HUNT or WAIT_FOR_BOOST
                    if (levelUpTimeRemainingMinutes > 0) {
                        // Cannot hunt only if leveling, must wait (wait logged above)
                         actionLogged = false; // No action this cycle except waiting
                    } else {
                         if (waitToBoostDecisionData) actionLog.push({ type: 'DECISION_WAIT_FOR_BOOST', ...waitToBoostDecisionData, currentTotalTimeMin: Math.round(currentTotalTimeMinutes) });
                        // Hunt Only
                        const currentSimYear = Math.floor(totalEnduranceConsumed / 100) + currentAge; const reductionPercent = Utils.getFibonacciReductionPercent(currentSimYear); const earningMultiplier = Math.max(0, 1 - (reductionPercent / 100)); const sloveEarnedThisHunt = externalLeaderBaseSlovePerHunt * earningMultiplier;
                        currentTotalTimeMinutes += huntDurationMinutes; currentEnergy = 0;
                        actionLog.push({ type: 'HUNT', level: simulationCurrentLevel, sloveEarned: parseFloat(sloveEarnedThisHunt.toFixed(2)), enduCost: parseFloat(externalLeaderEnduranceCost.toFixed(4)), currentTotalTimeMin: Math.round(currentTotalTimeMinutes) });
                        currentSloveBalance += sloveEarnedThisHunt; totalEnduranceConsumed += externalLeaderEnduranceCost;
                        actionLogged = true; performedHunt = true;
                    }
                 }
             } // End Alternate Action

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
