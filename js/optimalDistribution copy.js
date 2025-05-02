import * as Utils from './utils.js'; // Assuming utils are in './utils.js'
// Assuming simulateLevelingProcessWithCorrectedFormulas is imported or defined elsewhere
// import { simulateLevelingProcessWithCorrectedFormulas } from './levelingSimulator';

// Helper function for formatting time (Days, Hours)


export function findOptimalDistributionAndSimulate(initialData, targetAge = 7, recoverEnergyDuringHunt = false) { // Added flag
    const {
        rarityName, className, currentLevel, maxLevel, currentAge, currentEdurance, // Note: endurance vs edurance typo in original? Using endurance.
        currentTotalProficiency, currentTotalRecovery, energyPerHunt
    } = initialData;

    // --- Input Validation ---
    const rarityInfo = Utils.findRarityInfo(rarityName);
    if (!rarityInfo) return { error: `Invalid Rarity Name: ${rarityName}` };
    if (maxLevel < currentLevel) return { error: `Target Level (${maxLevel}) cannot be less than Current Level (${currentLevel}).` };
    if (maxLevel > 30 || currentLevel < 0) return { error: `Levels must be between 0 and 30. Current: ${currentLevel}, Target: ${maxLevel}.` };
    if (targetAge <= 0) return { error: `Target Age (${targetAge}) must be positive.` };
    if (targetAge < currentAge) return { error: `Target Age (${targetAge}) cannot be less than Current Age (${currentAge}).` };
    if (currentTotalProficiency < 0 || currentTotalRecovery < 0) return { error: `Current stats cannot be negative.` };
    if (energyPerHunt <= 0) return { error: `Energy per Action (${energyPerHunt}) must be positive.` };
    if (currentEdurance < 0 || currentEdurance > 100) return { error: `Current Endurance (${currentEdurance}) must be between 0 and 100.` };

    // --- Initial Calculations ---
    const totalBonusPointsAtMaxLevel = maxLevel * rarityInfo.bonusPts;
    const bonusPointsAlreadySpent = currentLevel * rarityInfo.bonusPts;
    const remainingBonusPointsToAllocate = Math.max(0, totalBonusPointsAtMaxLevel - bonusPointsAlreadySpent);

    // Endurance needed to reach the *start* of the target age year
    // Example: Current Age 5, Target Age 7. Need to consume endurance for Age 5 and Age 6.
    // Total endurance = (7 - 5) * 100 = 200.
    // If currentEndurance is 30 (already consumed in Age 5), need 200 - 30 = 170 more.
    const totalEnduranceToConsume = Math.max(0, (targetAge - currentAge) * 100 - currentEdurance);

    let bestAllocation = { proficiencyBonusToAdd: -1, recoveryBonusToAdd: -1 };
    let maxTotalSloveEarnedForTargetAge = -1; // Renamed for clarity
    let bestOutcome = null;
    let bestYearlyBreakdown = [];
    let bestTimeToLevelUpMinutes = null;
    let bestTimeToTargetAgeMinutes = null;

    // --- Handle Special Case: Target Age is Current Age ---
    if (targetAge === currentAge) {
        // Simulate only 1 hunt action as per requirement, regardless of endurance needed to finish the year.
        // Find the *best* allocation for this single hunt.
        let bestSingleHuntOutcome = -1;
        let bestSingleHuntAllocation = { proficiencyBonusToAdd: -1, recoveryBonusToAdd: -1 };
        let singleHuntYearlyBreakdown = {};

        for (let profBonusToAdd = 0; profBonusToAdd <= remainingBonusPointsToAllocate; profBonusToAdd++) {
            const recBonusToAdd = remainingBonusPointsToAllocate - profBonusToAdd;
            const finalTotalProficiency = currentTotalProficiency + profBonusToAdd;
            const finalTotalRecovery = currentTotalRecovery + recBonusToAdd;

            // Calculate stats assuming points are added instantly (since it's just one hunt simulation)
            const baseSlovePerHuntAction = Utils.calculateBaseSlovePerHuntAction(finalTotalProficiency, className, energyPerHunt);
            const enduranceConsumedPerHuntAction = Utils.calculateEnduranceConsumedPerHuntAction(finalTotalRecovery, energyPerHunt);

            if (!isFinite(enduranceConsumedPerHuntAction) || enduranceConsumedPerHuntAction <= 0) continue;

            const reductionPercent = Utils.getFibonacciReductionPercent(currentAge);
            const earningMultiplier = 1 - (reductionPercent / 100);
            const sloveEarned = baseSlovePerHuntAction * earningMultiplier;

            if (sloveEarned > bestSingleHuntOutcome) {
                bestSingleHuntOutcome = sloveEarned;
                bestSingleHuntAllocation = { proficiencyBonusToAdd: profBonusToAdd, recoveryBonusToAdd: recBonusToAdd };
                singleHuntYearlyBreakdown = { // Storing details for the best single hunt
                    age: currentAge,
                    level: maxLevel, // Assumes points instantly take effect for this calculation
                    slovePerHunt: parseFloat(sloveEarned.toFixed(2)),
                    endurancePerHunt: parseFloat(enduranceConsumedPerHuntAction.toFixed(4)),
                    huntsInYear: 1,
                    totalSloveInYear: parseFloat(sloveEarned.toFixed(2))
                };
                 bestOutcome = { // Also store final stats and aging outcome for this best single hunt
                    finalStats: {
                        totalProficiency: finalTotalProficiency,
                        totalRecovery: finalTotalRecovery
                    },
                    agingOutcome: {
                        enduranceConsumedPerHuntAction: parseFloat(enduranceConsumedPerHuntAction.toFixed(4)),
                        huntsToReachTargetAge: 1, // Only simulating 1 hunt
                        baseSlovePerHuntActionAtMaxLevel: parseFloat(baseSlovePerHuntAction.toFixed(2)),
                        maxTotalBaseSloveEarnedByTargetAge: parseFloat(sloveEarned.toFixed(2)), // This name is a bit misleading here, it's just for this hunt
                        slovRecoveryCostPerHuntActionAtMaxLevel: Utils.calculateSlovRecoveryCostPerHuntAction(enduranceConsumedPerHuntAction, rarityName, maxLevel)
                    }
                };
            }
        }

        if (bestSingleHuntOutcome < 0) {
            return { error: `Could not find a valid allocation for a single hunt at age ${currentAge}. Check Recovery calculation.` };
        }

        // Time for one hunt cycle
        const minutesPerCycle = 24 * 60; // Simplified 24h cycle as requested

        // Call the external leveling simulator if needed (though leveling won't happen in 1 hunt)
        // Ensure it handles the case where maxLevel might already be reached or not reachable.
        const leaderResult = simulateLevelingProcess({ ...initialData, isLeader: true }, bestSingleHuntAllocation); // Call assumed function

        return {
            assumption: `Age reduction applied to BASE earnings. Target age: ${targetAge} years. Simulating only 1 hunt action as target age equals current age.`,
            rarity: rarityName,
            class: className,
            energyPerHunt: energyPerHunt,
            startLevel: currentLevel,
            targetLevel: maxLevel,
            optimalDistributionToAdd: bestSingleHuntAllocation,
            finalStats: bestOutcome.finalStats,
            levelingSimulation: leaderResult, // Result from external function
            earningsOutcome: bestOutcome.agingOutcome,
            yearlyBreakdown: [singleHuntYearlyBreakdown],
            timeToLevelUp: Utils.formatTimeDH(leaderResult?.totalLevelingMinutes ?? null), // Use optional chaining & nullish coalescing
            timeToTargetAge: Utils.formatTimeDH(minutesPerCycle), // Time for one cycle
        };
    }


    // --- Main Simulation Loop for targetAge > currentAge ---
    for (let profBonusToAdd = 0; profBonusToAdd <= remainingBonusPointsToAllocate; profBonusToAdd++) {
        const recBonusToAdd = remainingBonusPointsToAllocate - profBonusToAdd;

        // --- Simulation Variables for this Allocation ---
        let currentTotalSloveEarnedThisAllocation = 0;
        let cumulativeEnduranceConsumed = currentEdurance; // Start with endurance already used this age
        let yearlyBreakdown = [];
        let currentYearEndurance = 0; // Endurance consumed within the current simulated year
        let currentYearEarnings = 0;
        let currentSimAge = currentAge;
        let simulatedLevel = currentLevel;
        let currentSloveBalance = 0; // Tracks Slove available for leveling up
        let nextLevelCost = (simulatedLevel < maxLevel) ? Utils.getSloveLevelUpCost(simulatedLevel + 1) : Infinity;
        let huntCounter = 0;
        let totalSimulatedMinutes = 0;
        let timeToReachMaxLevelMinutes = null; // Track time when maxLevel is hit

        const targetCumulativeEnduranceOverall = (targetAge - currentAge) * 100; // Total endurance limit for aging

        // --- Hunt-by-Hunt Simulation ---
        while (cumulativeEnduranceConsumed < targetCumulativeEnduranceOverall) {
            huntCounter++;
            const yearForThisHunt = Math.floor(cumulativeEnduranceConsumed / 100) + currentAge;

            // Calculate simulated stats FOR THIS HUNT based on current simulated level
            const bonusPointsForSimLevel = simulatedLevel * rarityInfo.bonusPts;
            const bonusPointsAddedSoFar = Math.max(0, bonusPointsForSimLevel - bonusPointsAlreadySpent);

            let simCurrentProfBonus = 0;
            let simCurrentRecBonus = 0;
            // Safely calculate proportional points distribution for the current level
            if (remainingBonusPointsToAllocate > 0 && bonusPointsAddedSoFar > 0) {
                // Calculate proficiency bonus first
                simCurrentProfBonus = bonusPointsAddedSoFar * (profBonusToAdd / remainingBonusPointsToAllocate);
                // Allocate remaining points to recovery to avoid floating point issues losing points
                // Ensure recovery doesn't go negative if profBonus calculation slightly overshoots due to float math
                simCurrentRecBonus = Math.max(0, bonusPointsAddedSoFar - simCurrentProfBonus);

                // Optional: Rounding might be desired depending on game mechanics
                 // simCurrentProfBonus = Math.round(bonusPointsAddedSoFar * (profBonusToAdd / remainingBonusPointsToAllocate));
                 // simCurrentRecBonus = bonusPointsAddedSoFar - simCurrentProfBonus;
            }

            const simProficiency = currentTotalProficiency + simCurrentProfBonus;
            const simRecovery = currentTotalRecovery + simCurrentRecBonus;

            // *** Calculate endurance cost dynamically for THIS hunt ***
            const enduranceCostForThisHunt = Utils.calculateEnduranceConsumedPerHuntAction(simRecovery, energyPerHunt);

            // --- Validity Check ---
            if (!isFinite(enduranceCostForThisHunt) || enduranceCostForThisHunt <= 0) {
                // This allocation path is invalid (e.g., recovery too low/high)
                currentTotalSloveEarnedThisAllocation = -Infinity; // Mark as invalid result
                // console.warn(`Invalid endurance cost (${enduranceCostForThisHunt}) for allocation P:${profBonusToAdd}/R:${recBonusToAdd} at level ${simulatedLevel}. Skipping allocation.`);
                break; // Stop simulating this allocation
            }

            // --- Time Calculation for this hunt cycle ---
            const minutesPerCycle = 24 * 60; // Simplified 24h cycle
            // Optional more complex model:
            // const huntDurationMinutes = energyPerHunt * 10; // 10 min per energy
            // const singleEnergyRefillMinutes = (24 * 60) / energyPerHunt;
            // const fullRefillDurationMinutes = energyPerHunt * singleEnergyRefillMinutes; // Should be 24*60 = 1440
            // let minutesPerCycle;
            // if (recoverEnergyDuringHunt) {
            //     // Assumes hunt time and recovery overlap - cycle time is the longer of the two
            //     minutesPerCycle = Math.max(huntDurationMinutes, fullRefillDurationMinutes); // This interpretation might be wrong
            //     // OR maybe just the refill time matters if you start next hunt immediately after refill?
            //     // minutesPerCycle = fullRefillDurationMinutes;
            // } else {
            //     // Hunt time + Refill time sequentially
            //     minutesPerCycle = huntDurationMinutes + fullRefillDurationMinutes;
            // }
            totalSimulatedMinutes += minutesPerCycle;

            // --- Accumulate Endurance ---
            const enduranceConsumedBeforeHunt = cumulativeEnduranceConsumed;
            cumulativeEnduranceConsumed += enduranceCostForThisHunt;

            // --- Slove Earnings Calculation ---
            const reductionPercent = Utils.getFibonacciReductionPercent(yearForThisHunt);
            const earningMultiplier = 1 - (reductionPercent / 100);
            const currentBaseSlove = Utils.calculateBaseSlovePerHuntAction(simProficiency, className, energyPerHunt);
            const sloveEarned = currentBaseSlove * earningMultiplier;

            currentSloveBalance += sloveEarned;
            currentTotalSloveEarnedThisAllocation += sloveEarned;

            // --- Yearly Breakdown Tracking ---
            const yearAfterHunt = Math.floor(cumulativeEnduranceConsumed / 100) + currentAge;

            // Accumulate within the current simulated year
            currentYearEarnings += sloveEarned;
            // Calculate endurance *actually added* in this year segment
            const enduranceThisYearSegment = cumulativeEnduranceConsumed - Math.max(enduranceConsumedBeforeHunt, (yearForThisHunt - currentAge) * 100);
            currentYearEndurance += enduranceThisYearSegment; // Track endurance consumed within this year


            // --- Leveling Logic ---
            let leveledUpThisHunt = false;
            while (simulatedLevel < maxLevel && currentSloveBalance >= nextLevelCost) {
                currentSloveBalance -= nextLevelCost;
                simulatedLevel++;
                leveledUpThisHunt = true;
                if (simulatedLevel === maxLevel && timeToReachMaxLevelMinutes === null) {
                    timeToReachMaxLevelMinutes = totalSimulatedMinutes; // Record time when max level is first reached
                }
                if (simulatedLevel < maxLevel) {
                    nextLevelCost = Utils.getSloveLevelUpCost(simulatedLevel + 1);
                } else {
                    nextLevelCost = Infinity; // Max level reached
                }
            }

            // --- Store Yearly Breakdown when Year changes or Simulation Ends ---
            // Check if the year changed *after* this hunt OR if the simulation is about to end
             const endOfSimulation = cumulativeEnduranceConsumed >= targetCumulativeEnduranceOverall;
             if (yearAfterHunt > yearForThisHunt || endOfSimulation) {
                // Calculate stats for the year just completed (or partially completed)
                const huntsInYear = Math.round(currentYearEndurance / (currentYearEndurance > 0 ? (currentYearEndurance / (currentYearEarnings / sloveEarned)) : 1)); // Estimate hunts based on avg
                const avgSlovePerHuntInYear = (huntsInYear > 0) ? currentYearEarnings / huntsInYear : 0;

                 yearlyBreakdown.push({
                     age: yearForThisHunt, // The age during which these earnings/hunts occurred
                     level: simulatedLevel, // Level at the *end* of this period/year
                     slovePerHunt: parseFloat(avgSlovePerHuntInYear.toFixed(2)), // Average for the year
                     endurancePerHunt: parseFloat((currentYearEndurance / huntsInYear).toFixed(4)), // Average for the year
                     huntsInYear: huntsInYear,
                     totalSloveInYear: parseFloat(currentYearEarnings.toFixed(2)),
                     sloveBalance: parseFloat(currentSloveBalance.toFixed(2)) // Balance at end of year
                 });

                 // Reset for the next year if simulation continues
                 if (!endOfSimulation) {
                    currentYearEndurance = cumulativeEnduranceConsumed % 100; // Carry over remainder endurance into next year
                    currentYearEarnings = 0; // Reset earnings counter
                    // currentSimAge = yearAfterHunt; // Update current sim age if needed for other logic
                 }
             }
             // Ensure loop terminates if target endurance is reached
             if (endOfSimulation) {
                 break;
             }

        } // End of while loop (hunt simulation)

        // --- Compare results after simulating this allocation ---
        if (currentTotalSloveEarnedThisAllocation > maxTotalSloveEarnedForTargetAge) {
            maxTotalSloveEarnedForTargetAge = currentTotalSloveEarnedThisAllocation;
            bestAllocation = { proficiencyBonusToAdd: profBonusToAdd, recoveryBonusToAdd: recBonusToAdd };
            bestYearlyBreakdown = yearlyBreakdown;
            bestTimeToLevelUpMinutes = timeToReachMaxLevelMinutes; // Store best time found so far
            bestTimeToTargetAgeMinutes = totalSimulatedMinutes; // Store time for this best allocation

            // Recalculate final stats and outcome details based on the *best* allocation found
            const finalTotalProficiency = currentTotalProficiency + bestAllocation.proficiencyBonusToAdd;
            const finalTotalRecovery = currentTotalRecovery + bestAllocation.recoveryBonusToAdd;
            // Use the final recovery to calculate the *final* endurance cost and slov recovery cost for display
            const finalEnduranceCost = Utils.calculateEnduranceConsumedPerHuntAction(finalTotalRecovery, energyPerHunt);
            const finalBaseSlove = Utils.calculateBaseSlovePerHuntAction(finalTotalProficiency, className, energyPerHunt);

            bestOutcome = {
                finalStats: {
                    totalProficiency: finalTotalProficiency,
                    totalRecovery: finalTotalRecovery
                },
                agingOutcome: {
                     // Use the FINAL cost for display purposes, represents end-game state
                    enduranceConsumedPerHuntAction: parseFloat(finalEnduranceCost.toFixed(4)),
                    // Total hunts is the counter from the simulation that achieved this best result
                    huntsToReachTargetAge: huntCounter,
                     // Use the FINAL base slove for display purposes
                    baseSlovePerHuntActionAtMaxLevel: parseFloat(finalBaseSlove.toFixed(2)),
                    // Use the total accumulated SLOVe from the simulation
                    maxTotalSloveEarnedByTargetAge: parseFloat(maxTotalSloveEarnedForTargetAge.toFixed(2)),
                    // Use the FINAL endurance cost to calculate final SLOV recovery cost
                    slovRecoveryCostPerHuntActionAtMaxLevel: Utils.calculateSlovRecoveryCostPerHuntAction(finalEnduranceCost, rarityName, maxLevel)
                }
            };
        }
    } // End of for loop (allocations)

    // --- Final Checks and Return ---
    if (!bestOutcome) {
        return { error: `Could not find any valid allocation for Prof/Rec points that allows aging to level ${maxLevel} and age ${targetAge} (potentially due to invalid endurance costs during simulation).` };
    }

    // Call the external leveling simulator with the BEST allocation found
    // Ensure the function exists and handles potential errors.
    let leaderResult;
    try {
       leaderResult = simulateLevelingProcess({ ...initialData, isLeader: true }, bestAllocation);
    } catch (e) {
        console.error("Error calling simulateLevelingProcessWithCorrectedFormulas:", e);
        leaderResult = { error: "Failed to run leader simulation." }; // Provide a fallback
    }


    return {
        assumption: `Age reduction applied to BASE earnings. Target age: ${targetAge} years. Hunt cycle time: 24h. Energy recovery during hunt: ${recoverEnergyDuringHunt}.`,
        rarity: rarityName,
        class: className,
        energyPerHunt: energyPerHunt,
        startLevel: currentLevel,
        targetLevel: maxLevel,
        optimalDistributionToAdd: bestAllocation,
        finalStats: bestOutcome.finalStats,
        levelingSimulation: leaderResult, // Result from external function
        earningsOutcome: bestOutcome.agingOutcome,
        yearlyBreakdown: bestYearlyBreakdown,
        timeToLevelUp: Utils.formatTimeDH(bestTimeToLevelUpMinutes),
        timeToTargetAge: Utils.formatTimeDH(bestTimeToTargetAgeMinutes),
    };
}
function simulateLevelingScenarios(initialData, bestAllocation) {
    const leaderResult = simulateLevelingProcess({ ...initialData, isLeader: true }, bestAllocation);
    const bulkResult = simulateLevelingProcess({ ...initialData, isLeader: false, bulkLevel: true }, bestAllocation);
    const alternateResult = simulateLevelingProcess({ ...initialData, isLeader: false, alternate: true }, bestAllocation);
}

export function simulateLevelingProcess(initialData, optimalDistributionToAdd) {
    const {
        rarityName, className, currentLevel, maxLevel, currentAge, currentEdurance,
        currentTotalProficiency, currentTotalRecovery, energyPerHunt
    } = initialData;
    const { proficiencyBonusToAdd, recoveryBonusToAdd } = optimalDistributionToAdd;
    const rarityInfo = Utils.findRarityInfo(rarityName);
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
    const maxEnergy = initialData.energyPerHunt;
    const refillRateMinutes = 24 * 60 / maxEnergy;
    const huntTimePerEnergy = 10;

    const scenario = initialData.bulkLevel ? 'bulk' : initialData.alternate ? 'alternate' : 'leader';
    let leaderSlovePerHunt = null;
    if (initialData.bulkLevel || initialData.alternate) {
        leaderSlovePerHunt = Utils.calculateBaseSlovePerHuntAction(
            initialData.leaderProficiency,
            initialData.className,
            initialData.energyPerHunt
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
            const levelUpCostSlove = Utils.getSloveLevelUpCost(targetLevel);
            const levelUpCostSeed = Utils.getSeedLevelUpCost(targetLevel);
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
                const baseSlovePerHuntActionCurrentLevel = Utils.calculateBaseSlovePerHuntAction(profNow, className, energyPerHunt);
                const enduranceConsumedThisLevelAction = Utils.calculateEnduranceConsumedPerHuntAction(recNow, energyPerHunt);
                const currentSimYear = Math.floor(totalEnduranceConsumedThisSim / 100) + currentAge;
                const reductionPercent = Utils.getFibonacciReductionPercent(currentSimYear);
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
                while (simulationCurrentLevel < maxLevel && currentSloveBalance >= Utils.getSloveLevelUpCost(simulationCurrentLevel + 1)) {
                    // AAA: yes -> level up
                    const targetLevel = simulationCurrentLevel + 1;
                    const levelUpCostSlove = Utils.getSloveLevelUpCost(targetLevel);
                    const levelUpCostSeed = Utils.getSeedLevelUpCost(targetLevel);
                    currentSloveBalance -= levelUpCostSlove;
                    totalSloveSpentOnLeveling += levelUpCostSlove;
                    totalSeedSpentOnLeveling += levelUpCostSeed;
                    simulationCurrentLevel++;
                    // Wait for full refill before next possible hunt/level up
                    totalLevelingMinutes += maxEnergy * refillRateMinutes;
                }
                // After leveling, check if we can hunt
                if (simulationCurrentLevel < maxLevel && currentSloveBalance < Utils.getSloveLevelUpCost(simulationCurrentLevel + 1)) {
                    // AAB: not enough SLOV, so hunt
                    const slovePerHunt = leaderSlovePerHunt;
                    totalGrossBaseSloveEarnedDuringLeveling += slovePerHunt;
                    totalHuntsPerformedThisSim++;
                    totalEnduranceConsumedThisSim += Utils.calculateEnduranceConsumedPerHuntAction(initialData.leaderRecovery, energyPerHunt);
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
                if (currentSloveBalance < Utils.getSloveLevelUpCost(simulationCurrentLevel + 1)) {
                    // AAA: not enough SLOV, so hunt
                    const slovePerHunt = leaderSlovePerHunt;
                    totalGrossBaseSloveEarnedDuringLeveling += slovePerHunt;
                    totalHuntsPerformedThisSim++;
                    totalEnduranceConsumedThisSim += Utils.calculateEnduranceConsumedPerHuntAction(initialData.leaderRecovery, energyPerHunt);
                    totalLevelingMinutes += maxEnergy * huntTimePerEnergy;
                    energy = 0;
                    currentSloveBalance += slovePerHunt;
                } else {
                    // AAB: enough SLOV, level up and immediately hunt
                    const targetLevel = simulationCurrentLevel + 1;
                    const levelUpCostSlove = Utils.getSloveLevelUpCost(targetLevel);
                    const levelUpCostSeed = Utils.getSeedLevelUpCost(targetLevel);
                    currentSloveBalance -= levelUpCostSlove;
                    totalSloveSpentOnLeveling += levelUpCostSlove;
                    totalSeedSpentOnLeveling += levelUpCostSeed;
                    simulationCurrentLevel++;
                    // Hunt immediately after level up
                    const slovePerHunt = leaderSlovePerHunt;
                    totalGrossBaseSloveEarnedDuringLeveling += slovePerHunt;
                    totalHuntsPerformedThisSim++;
                    totalEnduranceConsumedThisSim += Utils.calculateEnduranceConsumedPerHuntAction(initialData.leaderRecovery, energyPerHunt);
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
        const levelUpCostSlove = Utils.getSloveLevelUpCost(targetLevel);
        const levelUpCostSeed = Utils.getSeedLevelUpCost(targetLevel);

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
        const baseSlovePerHuntActionCurrentLevel = Utils.calculateBaseSlovePerHuntAction(simCurrentTotalProficiency, className, energyPerHunt);
        const enduranceConsumedThisLevelAction = Utils.calculateEnduranceConsumedPerHuntAction(simCurrentTotalRecovery, energyPerHunt);
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
                const reductionPercent = Utils.getFibonacciReductionPercent(currentSimYear);
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
// --- Mock Utils for testing (replace with your actual implementations) ---
/*
const Utils = {
    findRarityInfo: (rarityName) => ({ bonusPts: rarityName === 'Common' ? 5 : 10 }), // Example
    calculateEnduranceConsumedPerHuntAction: (recovery, energy) => Math.max(0.1, 10 - recovery * 0.05) * (energy / 6), // Example formula
    calculateBaseSlovePerHuntAction: (proficiency, className, energy) => Math.max(1, proficiency * 0.1) * (energy / 6), // Example formula
    getFibonacciReductionPercent: (age) => Math.min(50, [0, 0, 1, 2, 3, 5, 8, 13, 21, 34, 50][age] || 50), // Example sequence capped at 50%
    getSloveLevelUpCost: (level) => level * 100, // Example cost
    calculateSlovRecoveryCostPerHuntAction: (enduranceCost, rarity, level) => enduranceCost * 0.5 // Example cost
};

const initialDataExample = {
    rarityName: 'Uncommon',
    className: 'Ranger',
    currentLevel: 5,
    maxLevel: 20,
    currentAge: 3,
    currentEdurance: 20,
    currentTotalProficiency: 100,
    currentTotalRecovery: 80,
    energyPerHunt: 6
};

// Mock external function if needed for testing
function simulateLevelingProcessWithCorrectedFormulas(data, allocation) {
    console.log("Mock Leader Sim Called with allocation:", allocation);
    // Return some dummy data similar to what the real function would provide
    return {
        totalLevelingMinutes: 5 * 24 * 60, // Dummy time: 5 days
        finalSloveBalance: 1234,
        huntsToMaxLevel: 50
    };
}


const result = findOptimalDistributionAndSimulate(initialDataExample, 7);
console.log(JSON.stringify(result, null, 2));

const resultSameAge = findOptimalDistributionAndSimulate(initialDataExample, 3); // Test same age
console.log(JSON.stringify(resultSameAge, null, 2));
*/