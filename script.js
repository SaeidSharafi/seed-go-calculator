// --- Data Constants ---
const RARITY_DATA = [
    { name: "Common", minBase: 1, maxBase: 10, bonusPts: 4 },
    { name: "Uncommon", minBase: 8, maxBase: 18, bonusPts: 6 },
    { name: "Rare", minBase: 15, maxBase: 35, bonusPts: 8 },
    { name: "Epic", minBase: 28, maxBase: 63, bonusPts: 10 },
    { name: "Legendary", minBase: 50, maxBase: 112, bonusPts: 12 },
];

const BASE_EARNING_COEFFICIENTS = { // Corresponds to T_ in minified code - USED FOR RECOVERY COST ONLY
    Common: { 0: .2, 1: .31, 2: .32, 3: .33, 4: .35, 5: .36, 6: .37, 7: .38, 8: .4, 9: .41, 10: .42, 11: .44, 12: .46, 13: .48, 14: .5, 15: .52, 16: .54, 17: .56, 18: .58, 19: .6, 20: .62, 21: .64, 22: .67, 23: .7, 24: .72, 25: .75, 26: .78, 27: .81, 28: .83, 29: .87, 30: .9 },
    Uncommon: { 0: .3, 1: .41, 2: .43, 3: .45, 4: .46, 5: .48, 6: .5, 7: .51, 8: .53, 9: .55, 10: .68, 11: .72, 12: .74, 13: .77, 14: .79, 15: .83, 16: .85, 17: .89, 18: .92, 19: .96, 20: 1, 21: 1.03, 22: 1.07, 23: 1.1, 24: 1.14, 25: 1.2, 26: 1.24, 27: 1.27, 28: 1.33, 29: 1.38, 30: 1.44 },
    Rare: { 0: .4, 1: .51, 2: .54, 3: .57, 4: .59, 5: .61, 6: .63, 7: .65, 8: .67, 9: .69, 10: .936, 11: .98, 12: 1.01, 13: 1.05, 14: 1.09, 15: 1.13, 16: 1.17, 17: 1.22, 18: 1.26, 19: 1.3, 20: 1.56, 21: 1.62, 22: 1.68, 23: 1.74, 24: 1.8, 25: 1.88, 26: 1.95, 27: 2.01, 28: 2.09, 29: 2.18, 30: 2.25 },
    Epic: { 0: .5, 1: .61, 2: .64, 3: .67, 4: .69, 5: .71, 6: .73, 7: .76, 8: .79, 9: .82, 10: 1.28, 11: 1.34, 12: 1.4, 13: 1.46, 14: 1.5, 15: 1.56, 16: 1.62, 17: 1.68, 18: 1.74, 19: 1.8, 20: 2.48, 21: 2.58, 22: 2.68, 23: 2.78, 24: 2.9, 25: 3, 26: 3.1, 27: 3.22, 28: 3.34, 29: 3.46, 30: 3.6 },
    Legendary: { 0: .6, 1: .71, 2: .74, 3: .77, 4: .79, 5: .81, 6: .83, 7: .88, 8: .92, 9: .96, 10: 1.68, 11: 1.74, 12: 1.8, 13: 1.96, 14: 2.1, 15: 2.16, 16: 2.22, 17: 2.28, 18: 2.34, 19: 2.4, 20: 3.48, 21: 3.58, 22: 3.68, 23: 3.83, 24: 4.1, 25: 4.2, 26: 4.3, 27: 4.52, 28: 4.64, 29: 4.76, 30: 5 },
};

const LEVEL_UP_DATA = [
    { level: "0", priceSlove: "0"}, { level: "1", priceSlove: "1"}, { level: "2", priceSlove: "2"},
    { level: "3", priceSlove: "3"}, { level: "4", priceSlove: "4"}, { level: "5", priceSlove: "20"},
    { level: "6", priceSlove: "6"}, { level: "7", priceSlove: "10.5"}, { level: "8", priceSlove: "12"},
    { level: "9", priceSlove: "13.5"}, { level: "10", priceSlove: "30"}, { level: "11", priceSlove: "16.5"},
    { level: "12", priceSlove: "18"}, { level: "13", priceSlove: "19.5"}, { level: "14", priceSlove: "21"},
    { level: "15", priceSlove: "22.5"}, { level: "16", priceSlove: "24"}, { level: "17", priceSlove: "25.5"},
    { level: "18", priceSlove: "27"}, { level: "19", priceSlove: "28.5"}, { level: "20", priceSlove: "60"},
    { level: "21", priceSlove: "31.5"}, { level: "22", priceSlove: "33"}, { level: "23", priceSlove: "34.5"},
    { level: "24", priceSlove: "36"}, { level: "25", priceSlove: "37.5"}, { level: "26", priceSlove: "39"},
    { level: "27", priceSlove: "40.5"}, { level: "28", priceSlove: "42"}, { level: "29", priceSlove: "43.5"},
    { level: "30", priceSlove: "100"}
];

const FIBONACCI_REDUCTION_PERCENT = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]; // Extended further just in case

// --- Helper Functions ---

function getClassCoefficient(className) {
     switch (className) {
        case "Aqua": return 0.85; case "Reptile": return 0.89;
        case "Beast": return 0.93; case "Plant": return 0.97;
        case "Bird": return 1.00; case "Ghost": return 1.03;
        default: return 0.9;
    }
}

function getFibonacciReductionPercent(year) {
    const maxYearIndex = FIBONACCI_REDUCTION_PERCENT.length - 1;
    const index = Math.min(Math.max(0, year), maxYearIndex); // Ensure index is valid
    return FIBONACCI_REDUCTION_PERCENT[index];
}

function getSloveLevelUpCost(targetLevel) {
    const data = LEVEL_UP_DATA.find(item => parseInt(item.level) === targetLevel);
    return data ? parseFloat(data.priceSlove) : Infinity;
}

function calculateEnduranceConsumedPerHuntAction(totalRecoveryPoints, energyPerAction) {
    if (totalRecoveryPoints <= 0) return Infinity;
    if (energyPerAction <= 0) return 0;
    const enduranceCost = (15 / Math.pow(totalRecoveryPoints, 0.65)) * energyPerAction;
    return parseFloat(enduranceCost.toFixed(6));
}

function calculateBaseSlovePerHuntAction(totalProficiencyPoints, className, energyPerAction) {
    if (totalProficiencyPoints <= 0 || energyPerAction <= 0) return 0;
    const classCoefficient = getClassCoefficient(className);
    const baseSlove = (classCoefficient * Math.sqrt(totalProficiencyPoints)) * energyPerAction;
    // Match output format from minified code example 'l' which uses toFixed(2)
    return parseFloat(baseSlove.toFixed(2));
}

// Boosted SLOV is just Base SLOV as per latest analysis
function calculateBoostedSlovePerHuntAction(totalProficiencyPoints, className, energyPerAction, /* rarityName, level */) {
     return calculateBaseSlovePerHuntAction(totalProficiencyPoints, className, energyPerAction);
}

function calculateSlovRecoveryCostPerHuntAction(enduranceConsumedThisHunt, rarityName, level) {
    const recoveryCostCoefficient = BASE_EARNING_COEFFICIENTS[rarityName]?.[level.toString()] ?? 0;
    const slovCost = enduranceConsumedThisHunt * recoveryCostCoefficient;
    return parseFloat(slovCost.toFixed(2));
}


// --- Main Simulation and Optimization Function ---
function findOptimalDistributionAndSimulate(initialData, targetAge = 7) {
    // Make sure errors are returned as objects for consistent handling
    const {
        rarityName, className, currentLevel, maxLevel,
        currentTotalProficiency, currentTotalRecovery, energyPerAction
    } = initialData;

    // --- Input Validation ---
    const rarityInfo = RARITY_DATA.find(r => r.name === rarityName);
    if (!rarityInfo) return { error: `Invalid Rarity Name: ${rarityName}` };
     // Add check: maxLevel must be >= currentLevel
    if (maxLevel < currentLevel) return { error: `Target Level (${maxLevel}) cannot be less than Current Level (${currentLevel}).` };
    if (maxLevel > 30 || currentLevel < 0) return { error: `Levels must be between 0 and 30. Current: ${currentLevel}, Target: ${maxLevel}.` };
    if (targetAge <= 0) return { error: `Target Age (${targetAge}) must be positive.` };
    if (currentTotalProficiency < 0 || currentTotalRecovery < 0) return { error: `Current stats cannot be negative.` };
    if (energyPerAction <= 0) return { error: `Energy per Action (${energyPerAction}) must be positive.` };

    const totalBonusPointsAtMaxLevel = maxLevel * rarityInfo.bonusPts;
    const bonusPointsAlreadySpent = currentLevel * rarityInfo.bonusPts;
    // Handle case where currentLevel > maxLevel (already checked) or points somehow negative
    const remainingBonusPointsToAllocate = Math.max(0, totalBonusPointsAtMaxLevel - bonusPointsAlreadySpent);

    let bestAllocation = { proficiencyBonusToAdd: -1, recoveryBonusToAdd: -1 };
    let maxTotalBaseSloveEarnedForTargetAge = -1; // Track max *base* slove
    let bestOutcome = null;

    const totalEnduranceForTargetAge = targetAge * 100;

    // console.log(`Calculating for ${rarityName} ${className}, Lv ${currentLevel} -> ${maxLevel}, Target Age: ${targetAge}, Energy/Hunt: ${energyPerAction}`);
    // console.log(`Bonus Points to distribute: ${remainingBonusPointsToAllocate}`);
    // console.log(`Starting Stats: Prof=${currentTotalProficiency}, Rec=${currentTotalRecovery}`);

    // --- Optimization Loop ---
    for (let profBonusToAdd = 0; profBonusToAdd <= remainingBonusPointsToAllocate; profBonusToAdd++) {
        const recBonusToAdd = remainingBonusPointsToAllocate - profBonusToAdd;

        const finalTotalProficiency = currentTotalProficiency + profBonusToAdd;
        const finalTotalRecovery = currentTotalRecovery + recBonusToAdd;

        const enduranceConsumedPerHuntAction = calculateEnduranceConsumedPerHuntAction(finalTotalRecovery, energyPerAction);

        if (!isFinite(enduranceConsumedPerHuntAction) || enduranceConsumedPerHuntAction < 0) continue; // Skip infinite or negative cost
        if (enduranceConsumedPerHuntAction === 0) {
             // Treat 0 cost as problematic for aging calc, skip this distribution
             // console.warn(`Skipping P+${profBonusToAdd}/R+${recBonusToAdd}: Zero endurance cost.`);
             continue;
        }

        const huntsNeededForAge = Math.ceil(totalEnduranceForTargetAge / enduranceConsumedPerHuntAction);

        // *** Use BASE SLOV for earnings calculation ***
        const baseSlovePerHuntActionAtMax = calculateBaseSlovePerHuntAction(
            finalTotalProficiency, className, energyPerAction
        );

        let currentTotalBaseSloveEarnedThisAllocation = 0;
        let cumulativeEnduranceConsumed = 0;

        for (let hunt = 0; hunt < huntsNeededForAge; hunt++) {
            const currentYear = Math.floor(cumulativeEnduranceConsumed / 100);
            const reductionPercent = getFibonacciReductionPercent(currentYear);
            const earningMultiplier = 1 - (reductionPercent / 100);
            currentTotalBaseSloveEarnedThisAllocation += baseSlovePerHuntActionAtMax * earningMultiplier;
            cumulativeEnduranceConsumed += enduranceConsumedPerHuntAction;
        }

        // --- Compare ---
        if (currentTotalBaseSloveEarnedThisAllocation > maxTotalBaseSloveEarnedForTargetAge) {
            maxTotalBaseSloveEarnedForTargetAge = currentTotalBaseSloveEarnedThisAllocation;
            bestAllocation = { proficiencyBonusToAdd: profBonusToAdd, recoveryBonusToAdd: recBonusToAdd };

            bestOutcome = {
                 finalStats: {
                    totalProficiency: finalTotalProficiency,
                    totalRecovery: finalTotalRecovery
                },
                agingOutcome: {
                     enduranceConsumedPerHuntAction: parseFloat(enduranceConsumedPerHuntAction.toFixed(4)),
                     huntsToReachTargetAge: huntsNeededForAge,
                     baseSlovePerHuntActionAtMaxLevel: parseFloat(baseSlovePerHuntActionAtMax.toFixed(2)), // Match output precision
                     maxTotalBaseSloveEarnedByTargetAge: parseFloat(maxTotalBaseSloveEarnedForTargetAge.toFixed(2)),
                     slovRecoveryCostPerHuntActionAtMaxLevel: calculateSlovRecoveryCostPerHuntAction(enduranceConsumedPerHuntAction, rarityName, maxLevel)
                }
            };
        }
    } // End optimization loop

    if (!bestOutcome) {
        return { error: `Could not find any valid allocation for Prof/Rec points that allows aging to level ${maxLevel} and age ${targetAge} (potentially due to very low Recovery causing infinite or zero endurance cost).` };
    }

    // --- Simulate Leveling for the Best Allocation ---
    const levelingSimResults = simulateLevelingProcessWithCorrectedFormulas(initialData, bestAllocation);
    // We must return the best outcome even if leveling sim fails, but include the error.
     if (levelingSimResults.error) {
        console.error("Error during leveling simulation for the best build:", levelingSimResults.error);
         return {
            ...bestOutcome,
            optimalDistributionToAdd: bestAllocation,
            levelingSimulation: { error: levelingSimResults.error }, // Nest the error
            assumption: `Coefficient affects Recovery Cost ONLY. Age reduction applied to BASE earnings. Target age: ${targetAge} years. LEVELING SIMULATION FAILED.`,
            rarity: rarityName, class: className, startLevel: currentLevel, targetLevel: maxLevel, energyPerAction: energyPerAction
         };
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
        levelingSimulation: levelingSimResults, // Full leveling results object
        earningsOutcome: bestOutcome.agingOutcome
    };
}

// --- Leveling Simulation (Corrected based on Base SLOV earnings) ---
function simulateLevelingProcessWithCorrectedFormulas(initialData, optimalDistributionToAdd) {
     const {
        rarityName, className, currentLevel, maxLevel,
        currentTotalProficiency, currentTotalRecovery, energyPerAction
    } = initialData;
    const { proficiencyBonusToAdd, recoveryBonusToAdd } = optimalDistributionToAdd;

    const rarityInfo = RARITY_DATA.find(r => r.name === rarityName);
    const bonusPointsAlreadySpent = currentLevel * rarityInfo.bonusPts;
    const totalBonusPointsAtMaxLevel = maxLevel * rarityInfo.bonusPts;
    const remainingBonusPointsToAllocate = Math.max(0, totalBonusPointsAtMaxLevel - bonusPointsAlreadySpent);

    let simulationCurrentLevel = currentLevel;
    let currentSloveBalance = 0;
    let totalHuntsPerformedThisSim = 0;
    let totalGrossBaseSloveEarnedDuringLeveling = 0;
    let totalSloveSpentOnLeveling = 0;
    let totalEnduranceConsumedThisSim = 0;

    // If already at max level, no simulation needed
    if (simulationCurrentLevel >= maxLevel) {
         return { totalHuntsToReachMaxLevel: 0, totalGrossBaseSloveEarnedDuringLeveling: 0, totalSloveSpentOnLeveling: 0, netSloveAfterLevelingCosts: 0 };
    }

    while (simulationCurrentLevel < maxLevel) {
        const targetLevel = simulationCurrentLevel + 1;
        const levelUpCostSlove = getSloveLevelUpCost(targetLevel);

        if (!isFinite(levelUpCostSlove)) {
            return { error: `Missing or invalid level data for level ${targetLevel}` };
        }

        // Calculate stats at the start of needing to earn for *this* level-up
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

        // *** Use BASE SLOV EARNING rate for this level ***
        const baseSlovePerHuntActionCurrentLevel = calculateBaseSlovePerHuntAction(
            simCurrentTotalProficiency, className, energyPerAction
        );
        const enduranceConsumedThisLevelAction = calculateEnduranceConsumedPerHuntAction(simCurrentTotalRecovery, energyPerAction);

        if (!isFinite(enduranceConsumedThisLevelAction) || enduranceConsumedThisLevelAction < 0) {
             return { error: `Endurance consumption invalid (${enduranceConsumedThisLevelAction.toFixed(4)}) at level ${simulationCurrentLevel} (Rec ${simCurrentTotalRecovery.toFixed(2)}). Cannot simulate.` };
        }

        // Simulate hunts if needed for this level
        if (levelUpCostSlove > currentSloveBalance) {
             const slovNeededForNextLevel = levelUpCostSlove - currentSloveBalance;

             if (baseSlovePerHuntActionCurrentLevel <= 0) {
                  return { error: `Cannot earn SLOV (Base Rate ${baseSlovePerHuntActionCurrentLevel}) to level up from ${simulationCurrentLevel}.` };
             }
              if (enduranceConsumedThisLevelAction === 0) {
                   return { error: `Zero endurance cost at level ${simulationCurrentLevel} while needing SLOV. Cannot determine hunts needed.` };
             }

            let accumulatedSloveThisLevel = 0;
            const maxHuntsPerLevel = 1000000; // Increased limit further

            while(accumulatedSloveThisLevel < slovNeededForNextLevel) {
                 const currentSimYear = Math.floor(totalEnduranceConsumedThisSim / 100);
                 const reductionPercent = getFibonacciReductionPercent(currentSimYear);
                 const earningMultiplier = Math.max(0, 1 - (reductionPercent / 100)); // Ensure multiplier doesn't go negative

                 const sloveEarnedThisAction = baseSlovePerHuntActionCurrentLevel * earningMultiplier;

                 // Check if earning becomes impossible due to age before reaching target
                 if (sloveEarnedThisAction <= 0 && (currentSloveBalance + accumulatedSloveThisLevel < levelUpCostSlove)) {
                      return { error: `Earning rate dropped to zero at year ${currentSimYear} (level ${simulationCurrentLevel}) due to age reduction. Cannot complete leveling.` };
                 }

                 accumulatedSloveThisLevel += sloveEarnedThisAction;
                 totalGrossBaseSloveEarnedDuringLeveling += sloveEarnedThisAction;
                 totalHuntsPerformedThisSim++;
                 totalEnduranceConsumedThisSim += enduranceConsumedThisLevelAction;
                 huntsNeededThisLevel++;

                 if (huntsNeededThisLevel > maxHuntsPerLevel) {
                    console.error(`Stats at error: Level=${simulationCurrentLevel}, BaseEarnRate=${baseSlovePerHuntActionCurrentLevel}, EnduCost=${enduranceConsumedThisLevelAction}, Needed=${slovNeededForNextLevel}, Accumulated=${accumulatedSloveThisLevel}`)
                    return { error: `Hunt limit (${maxHuntsPerLevel}) exceeded for level ${targetLevel}. Potential issue or extreme stats.` };
                 }
            }
             currentSloveBalance += accumulatedSloveThisLevel; // Add the earned amount to balance *after* the loop
        }

        // Pay for level up
        currentSloveBalance -= levelUpCostSlove;
        totalSloveSpentOnLeveling += levelUpCostSlove;
        simulationCurrentLevel++;
    } // End while loop

    return {
        totalHuntsToReachMaxLevel: totalHuntsPerformedThisSim,
        totalGrossBaseSloveEarnedDuringLeveling: parseFloat(totalGrossBaseSloveEarnedDuringLeveling.toFixed(2)),
        totalSloveSpentOnLeveling: parseFloat(totalSloveSpentOnLeveling.toFixed(2)),
        netSloveAfterLevelingCosts: parseFloat(currentSloveBalance.toFixed(2)), // Final balance after all costs
    };
}


// --- DOM Interaction ---

// Get references to HTML elements
const form = document.getElementById('calculator-form');
const raritySelect = document.getElementById('rarity');
const classSelect = document.getElementById('class');
const currentLevelInput = document.getElementById('current-level');
const maxLevelInput = document.getElementById('max-level');
const currentProficiencyInput = document.getElementById('current-proficiency');
const currentRecoveryInput = document.getElementById('current-recovery');
const energyPerActionInput = document.getElementById('energy-per-action');
const targetAgeInput = document.getElementById('target-age');
const calculateButton = document.getElementById('calculate-button');
const resultsArea = document.getElementById('results-area');

// Add event listener to the button
calculateButton.addEventListener('click', () => {
    // Clear previous results
    resultsArea.innerHTML = '<p>Calculating...</p>';
    resultsArea.className = ''; // Reset class

    try {
        // Get values from the form, parsing numbers
        const initialData = {
            rarityName: raritySelect.value,
            className: classSelect.value,
            currentLevel: parseInt(currentLevelInput.value, 10),
            maxLevel: parseInt(maxLevelInput.value, 10),
            currentTotalProficiency: parseInt(currentProficiencyInput.value, 10),
            currentTotalRecovery: parseInt(currentRecoveryInput.value, 10),
            energyPerAction: parseInt(energyPerActionInput.value, 10) // Ensure name matches function expectation
        };
        const targetAge = parseInt(targetAgeInput.value, 10);

        // --- Basic Client-Side Validation (can be more robust) ---
         if (initialData.maxLevel < initialData.currentLevel) {
             throw new Error(`Target Level (${initialData.maxLevel}) cannot be less than Current Level (${initialData.currentLevel}).`);
         }
         if (isNaN(initialData.currentLevel) || isNaN(initialData.maxLevel) ||
             isNaN(initialData.currentTotalProficiency) || isNaN(initialData.currentTotalRecovery) ||
             isNaN(initialData.energyPerAction) || isNaN(targetAge)) {
            throw new Error("Please ensure all inputs are valid numbers.");
         }
         if (initialData.currentTotalProficiency < 0 || initialData.currentTotalRecovery < 0 ||
             initialData.energyPerAction <= 0 || targetAge <= 0 || initialData.currentLevel < 0 || initialData.maxLevel <= 0) {
             throw new Error("Levels, Stats, Energy, and Age must be non-negative (or positive where applicable).");
         }
         // --- End Basic Validation ---


        // Run the simulation
        const result = findOptimalDistributionAndSimulate(initialData, targetAge);

        // Display results or error
        if (result && result.error && !result.finalStats) { // Only top-level error
            resultsArea.innerHTML = `<p class="error">Error: ${result.error}</p>`;
            resultsArea.classList.add('error');
        } else if (result) {
            // Format the successful result object into a readable string
            let output = `<h2>Calculation Results</h2>`;
            output += `<p class="success-summary">Optimal distribution found for ${result.rarity} ${result.class} (Lv ${result.startLevel} -> ${result.targetLevel}, Target Age: ${targetAge}).</p>`;

            output += `<strong>Optimal Bonus Points to Add:</strong>\n`;
            output += `  Proficiency: +${result.optimalDistributionToAdd?.proficiencyBonusToAdd ?? 'N/A'}\n`;
            output += `  Recovery:    +${result.optimalDistributionToAdd?.recoveryBonusToAdd ?? 'N/A'}\n\n`;

            output += `<strong>Final Stats at Level ${result.targetLevel}:</strong>\n`;
            output += `  Total Proficiency: ${result.finalStats?.totalProficiency ?? 'N/A'}\n`;
            output += `  Total Recovery:    ${result.finalStats?.totalRecovery ?? 'N/A'}\n\n`;

            output += `<strong>Leveling Simulation (Lv ${result.startLevel} -> ${result.targetLevel}):</strong>\n`;
            if (result.levelingSimulation?.error) {
                 output += `  <span class="error">ERROR: ${result.levelingSimulation.error}</span>\n\n`;
            } else if (result.levelingSimulation) {
                output += `  Levels Gained: ${result.targetLevel - result.startLevel}\n`;
                output += `  Hunts for Leveling: ${result.levelingSimulation.totalHuntsToReachMaxLevel}\n`;
                output += `  Gross BASE SLOV Earned: ${result.levelingSimulation.totalGrossBaseSloveEarnedDuringLeveling}\n`;
                output += `  SLOV Spent on Levels: ${result.levelingSimulation.totalSloveSpentOnLeveling}\n`;
                output += `  Net SLOV After Leveling: ${result.levelingSimulation.netSloveAfterLevelingCosts}\n\n`;
            } else {
                 output += `  Leveling simulation data not available.\n\n`;
            }

            output += `<strong>Earnings Outcome (Optimal Build, Up to Age ${targetAge}):</strong>\n`;
             if (result.earningsOutcome) {
                output += `  Endurance/Hunt (at Lv ${result.targetLevel}): ${result.earningsOutcome.enduranceConsumedPerHuntAction}\n`;
                output += `  Hunts to Reach Age ${targetAge}: ${result.earningsOutcome.huntsToReachTargetAge}\n`;
                output += `  BASE SLOV/Hunt (Lv ${result.targetLevel}, Year 0): ${result.earningsOutcome.baseSlovePerHuntActionAtMaxLevel}\n`;
                output += `  Max Total BASE SLOV by Age ${targetAge} (Gross, Reduced): ${result.earningsOutcome.maxTotalBaseSloveEarnedByTargetAge}\n`;
                output += `  (Info) Recovery Cost/Hunt (Lv ${result.targetLevel}): ${result.earningsOutcome.slovRecoveryCostPerHuntActionAtMaxLevel} SLOV\n`;
             } else {
                  output += `  Earnings outcome data not available.\n`;
             }

            resultsArea.innerHTML = output; // Use innerHTML to render line breaks from \n within <pre> or use <p> tags
             resultsArea.className = ''; // Remove error class if it was there

        } else {
             resultsArea.innerHTML = `<p class="error">An unknown error occurred. Calculation failed.</p>`;
             resultsArea.classList.add('error');
        }

    } catch (e) {
        // Catch unexpected errors during processing or validation
        console.error("Calculation Error:", e);
        resultsArea.innerHTML = `<p class="error">Error during calculation: ${e.message || e}</p>`;
        resultsArea.classList.add('error');
    }
});
