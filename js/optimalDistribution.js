import * as Utils from './utils.js'; 
import { simulateLevelingProcess } from './simulateLeveling.js';


function validateInputs(initialData, targetAge, rarityInfo) {
    const { currentLevel, maxLevel, currentAge, currentEdurance, currentTotalProficiency, currentTotalRecovery, energyPerHunt } = initialData;
    if (!rarityInfo) return `Invalid Rarity Name: ${initialData.rarityName}`;
    if (maxLevel < currentLevel) return `Target Level (${maxLevel}) cannot be less than Current Level (${currentLevel}).`;
    if (maxLevel > 30 || currentLevel < 0) return `Levels must be between 0 and 30. Current: ${currentLevel}, Target: ${maxLevel}.`;
    if (targetAge < 0) return `Target Age (${targetAge}) must be positive.`;
    if (targetAge < currentAge) return `Target Age (${targetAge}) cannot be less than Current Age (${currentAge}).`;
    if (currentTotalProficiency < 0 || currentTotalRecovery < 0) return `Current stats cannot be negative.`;
    if (energyPerHunt <= 0) return `Energy per Action (${energyPerHunt}) must be positive.`;
    if (currentEdurance < 0 || currentEdurance > 100) return `Current Endurance (${currentEdurance}) must be between 0 and 100.`;
    return null; // No error
}

/**
 * Calculates the simulated Proficiency and Recovery for the current hunt,
 * based on the simulated level and the chosen allocation strategy.
 */
function calculateSimulatedStatsForHunt(initialData, rarityInfo, simulatedLevel, allocation, bonusPointsAlreadySpent, remainingBonusPointsToAllocate) {

    const { currentTotalProficiency, currentTotalRecovery } = initialData;

    // Use DIFFERENT names for the destructured values
    const { proficiencyBonusToAdd: allocProfToAdd, recoveryBonusToAdd: allocRecToAdd } = allocation;


    const bonusPointsForSimLevel = simulatedLevel * rarityInfo.bonusPts;
    const bonusPointsAddedSoFar = Math.max(0, bonusPointsForSimLevel - bonusPointsAlreadySpent);

    let simCurrentProfBonus = 0;
    let simCurrentRecBonus = 0;

    if (remainingBonusPointsToAllocate > 0 && bonusPointsAddedSoFar > 0) {
        // Now use the RENAMED variable 'allocProfToAdd'
        simCurrentProfBonus = bonusPointsAddedSoFar * (allocProfToAdd / remainingBonusPointsToAllocate);
        simCurrentRecBonus = Math.max(0, bonusPointsAddedSoFar - simCurrentProfBonus);
    }

    return {
        simProficiency: currentTotalProficiency + simCurrentProfBonus,
        simRecovery: currentTotalRecovery + simCurrentRecBonus
    };
}

/**
 * Simulates the aging and earning process for a *single* given allocation
 * of proficiency and recovery points.
 */
function simulateAllocationRun(initialData, targetAge, rarityInfo, allocation, bonusPointsAlreadySpent, remainingBonusPointsToAllocate) {
    const { currentLevel, maxLevel, currentAge, currentEdurance, className, energyPerHunt } = initialData;
    const targetCumulativeEnduranceOverall = (targetAge - currentAge) * 100; // Target total endurance for aging

    // --- Simulation State ---
    let cumulativeEnduranceConsumed = currentEdurance;
    let currentTotalSloveEarned = 0;
    let yearlyBreakdown = [];
    let currentYearEndurance = 0; // Endurance consumed within the current simulated year
    let currentYearEarnings = 0;
    let simulatedLevel = currentLevel;
    let currentSloveBalance = 0;
    let nextLevelCost = (simulatedLevel < maxLevel) ? Utils.getSloveLevelUpCost(simulatedLevel + 1) : Infinity;
    let huntCounter = 0;
    let totalSimulatedMinutes = 0;
    let timeToReachMaxLevelMinutes = null;
    let isValidRun = true;

    // --- Hunt Loop ---
    while (cumulativeEnduranceConsumed < targetCumulativeEnduranceOverall) {
        huntCounter++;
        const yearForThisHunt = Math.floor(cumulativeEnduranceConsumed / 100) + currentAge;

        // Calculate current stats for this hunt
        const { simProficiency, simRecovery } = calculateSimulatedStatsForHunt(
            initialData, rarityInfo, simulatedLevel, allocation, bonusPointsAlreadySpent, remainingBonusPointsToAllocate
        );

        // Calculate dynamic endurance cost
        const enduranceCostForThisHunt = Utils.calculateEnduranceConsumedPerHuntAction(simRecovery, energyPerHunt);
        if (!isFinite(enduranceCostForThisHunt) || enduranceCostForThisHunt <= 0) {
            isValidRun = false;
            // console.warn(`Invalid endurance cost (${enduranceCostForThisHunt}) at L${simulatedLevel} for allocation P:${allocation.proficiencyBonusToAdd}/R:${allocation.recoveryBonusToAdd}. Skipping.`);
            break; // Stop this simulation run
        }

        // Calculate time for this hunt cycle (Simplified 24h)
        const minutesPerCycle = 24 * 60;
        totalSimulatedMinutes += minutesPerCycle;

        // Accumulate Endurance & check year change boundary
        const enduranceConsumedBeforeHunt = cumulativeEnduranceConsumed;
        cumulativeEnduranceConsumed += enduranceCostForThisHunt;
        const yearAfterHunt = Math.floor(cumulativeEnduranceConsumed / 100) + currentAge;

        // Calculate Slove Earnings
        const reductionPercent = Utils.getFibonacciReductionPercent(yearForThisHunt);
        const earningMultiplier = 1 - (reductionPercent / 100);
        const currentBaseSlove = Utils.calculateBaseSlovePerHuntAction(simProficiency, className, energyPerHunt);
        const sloveEarned = currentBaseSlove * earningMultiplier;

        currentSloveBalance += sloveEarned;
        currentTotalSloveEarned += sloveEarned;

        // Track Yearly Earnings/Endurance
        currentYearEarnings += sloveEarned;
        const enduranceThisYearSegment = cumulativeEnduranceConsumed - Math.max(enduranceConsumedBeforeHunt, (yearForThisHunt - currentAge) * 100);
        currentYearEndurance += enduranceThisYearSegment;

        // Leveling Logic
        while (simulatedLevel < maxLevel && currentSloveBalance >= nextLevelCost) {
            currentSloveBalance -= nextLevelCost;
            simulatedLevel++;
            if (simulatedLevel === maxLevel && timeToReachMaxLevelMinutes === null) {
                timeToReachMaxLevelMinutes = totalSimulatedMinutes;
            }
            nextLevelCost = (simulatedLevel < maxLevel) ? Utils.getSloveLevelUpCost(simulatedLevel + 1) : Infinity;
        }

        // Update Yearly Breakdown when year changes or simulation ends
        const endOfSimulation = cumulativeEnduranceConsumed >= targetCumulativeEnduranceOverall;
        if (yearAfterHunt > yearForThisHunt || endOfSimulation) {
            const huntsInYear = Math.max(1, Math.round(currentYearEndurance / enduranceCostForThisHunt)); // Estimate based on last cost, could average
            const avgSlovePerHuntInYear = (huntsInYear > 0) ? currentYearEarnings / huntsInYear : 0;
            const avgEndurancePerHuntInYear = (huntsInYear > 0) ? currentYearEndurance / huntsInYear : enduranceCostForThisHunt;

            yearlyBreakdown.push({
                age: yearForThisHunt,
                level: simulatedLevel,
                slovePerHunt: parseFloat(avgSlovePerHuntInYear.toFixed(2)),
                endurancePerHunt: parseFloat(avgEndurancePerHuntInYear.toFixed(4)),
                huntsInYear: huntsInYear,
                totalSloveInYear: parseFloat(currentYearEarnings.toFixed(2)),
                sloveBalance: parseFloat(currentSloveBalance.toFixed(2))
            });

            if (!endOfSimulation) {
                currentYearEndurance = 0; // Reset for next year
                currentYearEarnings = 0;
            }
        }

        if (endOfSimulation) {
            break;
        }
    } // End while hunt loop

    return {
        isValidRun,
        totalSloveEarned: isValidRun ? currentTotalSloveEarned : -Infinity,
        yearlyBreakdown,
        timeToLevelUpMinutes: timeToReachMaxLevelMinutes,
        totalSimulatedMinutes,
        huntCounter,
        finalSimulatedLevel: simulatedLevel // Level reached at the end of simulation
    };
}

/**
 * Handles the special case where targetAge is the same as currentAge.
 * Simulates finding the best allocation for a single hunt.
 */
function simulateSingleHuntScenario(initialData, rarityInfo, remainingBonusPointsToAllocate) {
    const { currentAge, currentLevel, maxLevel, className, energyPerHunt, rarityName } = initialData;

    let bestSloveForSingleHunt = -1;
    let bestAllocation = null;
    let bestSingleHuntDetails = null;

    for (let profBonusToAdd = 0; profBonusToAdd <= remainingBonusPointsToAllocate; profBonusToAdd++) {
        const recBonusToAdd = remainingBonusPointsToAllocate - profBonusToAdd;
        const allocation = { proficiencyBonusToAdd: profBonusToAdd, recoveryBonusToAdd: recBonusToAdd };

        // Assume points are instantly allocated for this single hunt scenario
        const finalTotalProficiency = initialData.currentTotalProficiency + profBonusToAdd;
        const finalTotalRecovery = initialData.currentTotalRecovery + recBonusToAdd;

        const baseSlovePerHuntAction = Utils.calculateBaseSlovePerHuntAction(finalTotalProficiency, className, energyPerHunt);
        const enduranceConsumedPerHuntAction = Utils.calculateEnduranceConsumedPerHuntAction(finalTotalRecovery, energyPerHunt);

        if (!isFinite(enduranceConsumedPerHuntAction) || enduranceConsumedPerHuntAction <= 0) continue;

        const reductionPercent = Utils.getFibonacciReductionPercent(currentAge);
        const earningMultiplier = 1 - (reductionPercent / 100);
        const sloveEarned = baseSlovePerHuntAction * earningMultiplier;

        if (sloveEarned > bestSloveForSingleHunt) {
            bestSloveForSingleHunt = sloveEarned;
            bestAllocation = allocation;
            bestSingleHuntDetails = {
                finalStats: { totalProficiency: finalTotalProficiency, totalRecovery: finalTotalRecovery },
                yearlyBreakdown: [{
                    age: currentAge,
                    level: maxLevel, // Assume target level reached instantly for display
                    slovePerHunt: parseFloat(sloveEarned.toFixed(2)),
                    endurancePerHunt: parseFloat(enduranceConsumedPerHuntAction.toFixed(4)),
                    huntsInYear: 1,
                    totalSloveInYear: parseFloat(sloveEarned.toFixed(2))
                }],
                agingOutcome: {
                    enduranceConsumedPerHuntAction: parseFloat(enduranceConsumedPerHuntAction.toFixed(4)),
                    huntsToReachTargetAge: 1,
                    baseSlovePerHuntActionAtMaxLevel: parseFloat(baseSlovePerHuntAction.toFixed(2)),
                    maxTotalSloveEarnedByTargetAge: parseFloat(sloveEarned.toFixed(2)), // For this single hunt
                    slovRecoveryCostPerHuntActionAtMaxLevel: Utils.calculateSlovRecoveryCostPerHuntAction(enduranceConsumedPerHuntAction, rarityName, maxLevel)
                },
                timeToLevelUpMinutes: null, // Cannot level in 1 hunt
                timeToTargetAgeMinutes: 24 * 60 // Time for one cycle
            };
        }
    }

    return { bestAllocation, bestSingleHuntDetails };
}

/**
 * Formats the final simulation results into the desired output object.
 */
 function formatOutputData(initialData, targetAge, bestAllocation, bestSimResult, leaderResult) {
    const { rarityName, className, energyPerHunt, currentLevel, maxLevel } = initialData;

    // Calculate final display stats based on the BEST allocation found
    const finalTotalProficiency = initialData.currentTotalProficiency + bestAllocation.proficiencyBonusToAdd;
    const finalTotalRecovery = initialData.currentTotalRecovery + bestAllocation.recoveryBonusToAdd;
    const finalEnduranceCost = Utils.calculateEnduranceConsumedPerHuntAction(finalTotalRecovery, energyPerHunt);
    const finalBaseSlove = Utils.calculateBaseSlovePerHuntAction(finalTotalProficiency, className, energyPerHunt);
    const finalSlovRecoveryCost = Utils.calculateSlovRecoveryCostPerHuntAction(finalEnduranceCost, rarityName, maxLevel);

    const agingOutcome = {
        enduranceConsumedPerHuntAction: parseFloat(finalEnduranceCost.toFixed(4)),
        huntsToReachTargetAge: bestSimResult.huntCounter,
        baseSlovePerHuntActionAtMaxLevel: parseFloat(finalBaseSlove.toFixed(2)),
        maxTotalSloveEarnedByTargetAge: parseFloat(bestSimResult.totalSloveEarned.toFixed(2)),
        slovRecoveryCostPerHuntActionAtMaxLevel: finalSlovRecoveryCost
    };

    return {
        assumption: `Age reduction applied to BASE earnings. Target age: ${targetAge} years. Hunt cycle time: 24h.`,
        rarity: rarityName,
        class: className,
        energyPerHunt: energyPerHunt,
        startLevel: currentLevel,
        targetLevel: maxLevel,
        optimalDistributionToAdd: bestAllocation,
        finalStats: {
            totalProficiency: finalTotalProficiency,
            totalRecovery: finalTotalRecovery
        },
        levelingSimulation: leaderResult, // Result from external function
        earningsOutcome: agingOutcome,
        yearlyBreakdown: bestSimResult.yearlyBreakdown,
        timeToLevelUp: Utils.formatTimeDH(leaderResult.totalLevelingMinutes),
        timeToTargetAge: Utils.formatTimeDH(bestSimResult.totalSimulatedMinutes),
    };
}


// --- Main Orchestration Function ---

export function findOptimalDistributionAndSimulate(initialData, targetAge = 7) {
    const { rarityName, currentLevel, maxLevel, currentAge } = initialData;

    // --- Get Rarity Info & Validate ---
    const rarityInfo = Utils.findRarityInfo(rarityName);
    console.log("DEBUG: Rarity Info Found:", JSON.stringify(rarityInfo)); // <-- ADD THIS LOG

    const validationError = validateInputs(initialData, targetAge, rarityInfo);
    if (validationError) {
        return { error: validationError };
    }

    // --- Initial Setup ---
    const totalBonusPointsAtMaxLevel = maxLevel * rarityInfo.bonusPts;
    const bonusPointsAlreadySpent = currentLevel * rarityInfo.bonusPts;
    const remainingBonusPointsToAllocate = Math.max(0, totalBonusPointsAtMaxLevel - bonusPointsAlreadySpent);

    // --- Handle Special Case: targetAge === currentAge ---
    if (targetAge === currentAge) {
        const { bestAllocation, bestSingleHuntDetails } = simulateSingleHuntScenario(initialData, rarityInfo, remainingBonusPointsToAllocate);

        if (!bestAllocation) {
            return { error: `Could not find a valid allocation for a single hunt at age ${currentAge}. Check Recovery calculation.` };
        }

        // Call leader simulation (though likely trivial for single hunt)
         let leaderResult;
         try {
            leaderResult = simulateLevelingProcess(initialData, bestAllocation, 'leader');
         } catch (e) {
             console.error("Error calling simulateLevelingProcess for single hunt:", e);
             leaderResult = { error: "Failed to run leader simulation." };
         }

        // Format and return result for single hunt
        return formatOutputData(initialData, targetAge, bestAllocation, {
            // Map single hunt details to the structure expected by formatOutputData
            huntCounter: 1,
            totalSloveEarned: bestSingleHuntDetails.agingOutcome.maxTotalSloveEarnedByTargetAge,
            yearlyBreakdown: bestSingleHuntDetails.yearlyBreakdown,
            timeToLevelUpMinutes: bestSingleHuntDetails.timeToLevelUpMinutes,
            totalSimulatedMinutes: bestSingleHuntDetails.timeToTargetAgeMinutes
        }, leaderResult);
    }

    // --- Find Optimal Allocation via Iteration ---
    let bestAllocationFound = null;
    let bestSimulationResult = null;
    let maxTotalSloveEarned = -Infinity;

    for (let profBonusToAdd = 0; profBonusToAdd <= remainingBonusPointsToAllocate; profBonusToAdd++) {
        const recBonusToAdd = remainingBonusPointsToAllocate - profBonusToAdd;
        const currentAllocation = { proficiencyBonusToAdd: profBonusToAdd, recoveryBonusToAdd: recBonusToAdd };

        // Run the simulation for this specific allocation
        const simResult = simulateAllocationRun(
            initialData, targetAge, rarityInfo, currentAllocation,
            bonusPointsAlreadySpent, remainingBonusPointsToAllocate
        );
    
        // Compare with the best result found so far
        if (simResult.isValidRun && simResult.totalSloveEarned > maxTotalSloveEarned) {
            maxTotalSloveEarned = simResult.totalSloveEarned;
            bestAllocationFound = currentAllocation;
            bestSimulationResult = simResult; // Store the entire result object
        }
    }

    // --- Final Checks and Post-processing ---
    if (!bestAllocationFound) {
       
        
        return { error: `Could not find any valid allocation for Prof/Rec points that allows aging to level ${maxLevel} and age ${targetAge} (potentially due to invalid endurance costs during simulation).` };
    }

    // Call the external leader simulation with the best allocation
    let leaderResult;
    console.log(bestAllocationFound);
    
    try {
        leaderResult = simulateLevelingProcess(initialData, bestAllocationFound, 'leader');
    } catch (e) {
        console.error("Error calling simulateLevelingProcess:", e);
        leaderResult = { error: "Failed to run leader simulation." };
    }

    // --- Format and Return Output ---
    return formatOutputData(initialData, targetAge, bestAllocationFound, bestSimulationResult, leaderResult);
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