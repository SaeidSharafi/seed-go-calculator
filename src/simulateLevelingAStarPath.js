import * as Utils from './utils.js';

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

// --- A* Search Implementation for Optimal Leveling ---

// A* State class to track a specific state in the leveling process
class LevelingState {
    constructor(level, slove, energy, levelUpTimer, timeElapsed, endurance) {
        this.level = level;             // Current level of the monster
        this.slove = slove;            // Current SLOV balance
        this.energy = energy;          // Current energy units (0 to maxEnergyUnits)
        this.levelUpTimer = levelUpTimer; // Minutes remaining for normal level up
        this.timeElapsed = timeElapsed;  // Total minutes elapsed to reach this state
        this.endurance = endurance;    // Total endurance consumed by the leader
    }

    // State equality checking (for visited states)
    equals(other) {
        // Round slove and endurance for comparison to avoid floating point precision issues
        return this.level === other.level &&
            Math.round(this.slove * 100) === Math.round(other.slove * 100) &&
            Math.round(this.energy * 100) === Math.round(other.energy * 100) &&
            Math.round(this.levelUpTimer) === Math.round(other.levelUpTimer);
    }

    // Generate unique key for state
    toKey() {
        return `${this.level}-${Math.round(this.slove * 100)}-${Math.round(this.energy * 100)}-${Math.round(this.levelUpTimer)}`;
    }
}

// Priority Queue implementation for A* open set
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
        energyPerHunt, currentTotalProficiency, currentTotalRecovery,
        sloveBalance = 0
    } = initialData;

    // --- Basic Setup & Validation ---
    if (currentLevel >= maxLevel) {
        return { path: [], totalTimeMinutes: 0, error: null };
    }

    const rarityInfo = Utils.findRarityInfo(rarityName);
    if (!rarityInfo) {
        return { error: `Invalid Rarity Info for ${rarityName}` };
    }

    if (scenario === 'nonLeader' &&
        (initialData.leaderProficiency === undefined || initialData.leaderRecovery === undefined)) {
        return { error: 'Missing leader stats for non-leader scenario' };
    }

    // --- Constants ---
    const huntDurationMinutes = energyPerHunt * 10;
    const fullRefillMinutes = 24 * 60;
    const singleEnergyRefillMinutes = energyPerHunt > 0 ? fullRefillMinutes / energyPerHunt : Infinity;
    const quarterEnergyAmount = energyPerHunt * 0.25;
    const quarterEnergyRefillMinutes = 6 * 60; // 6 hours for 0.25 energy per hunt

    // --- Pre-calculate External Leader Stats ---
    let externalLeaderBaseSlovePerHunt = null;
    let externalLeaderEnduranceCost = null;
    if (scenario === 'nonLeader') {
        const externalLeaderClassName = initialData.leaderClass || className;
        externalLeaderBaseSlovePerHunt = Utils.calculateBaseSlovePerHuntAction(
            initialData.leaderProficiency,
            externalLeaderClassName,
            energyPerHunt
        );
        externalLeaderEnduranceCost = Utils.calculateEnduranceConsumedPerHuntAction(
            initialData.leaderRecovery,
            energyPerHunt
        );

        if (!isFinite(externalLeaderEnduranceCost) || externalLeaderEnduranceCost <= 0) {
            return { error: 'Invalid endurance cost for external leader' };
        }
    }

    // --- Heuristic Function ---
    function calculateHeuristic(state) {
        // If at max level, no more time needed
        if (state.level === maxLevel) return 0;

        // Calculate remaining SLOV needed for all level ups
        let slovNeeded = 0;
        for (let level = state.level + 1; level <= maxLevel; level++) {
            slovNeeded += Utils.getSloveLevelUpCost(level);
        }

        const slovDeficit = Math.max(0, slovNeeded - state.slove);
        if (slovDeficit === 0) return 0; // Already have enough SLOV

        // Estimate SLOV gain rate
        const slovPerHunt = estimateSlovPerHuntCycle(
            initialData,
            rarityInfo,
            optimalDistributionToAdd,
            state.level,
            state.endurance,
            scenario,
            externalLeaderBaseSlovePerHunt
        );

        if (slovPerHunt <= 0) return Infinity; // Can't earn more SLOV

        // Calculate hunts needed and convert to time
        const huntsNeeded = Math.ceil(slovDeficit / slovPerHunt);
        const timeForHunts = huntsNeeded * (huntDurationMinutes + quarterEnergyRefillMinutes);

        // Add minimum level up times
        let timeForLevelUps = 0;
        for (let level = state.level + 1; level <= maxLevel; level++) {
            timeForLevelUps += Utils.getLevelUpTimeHours(level) * 60;
        }

        return Math.max(0, timeForHunts + timeForLevelUps);
    }

    // --- A* Setup ---
    const openSet = new PriorityQueue();
    const closedSet = new Set(); // Track visited states
    const cameFrom = new Map(); // For path reconstruction
    const gScore = new Map();
    const fScore = new Map();

    // Initial state
    const startState = new LevelingState(
        currentLevel,
        sloveBalance,
        energyPerHunt,
        0,
        0,
        currentEdurance
    );

    openSet.enqueue(startState, calculateHeuristic(startState));
    gScore.set(startState.toKey(), 0);
    fScore.set(startState.toKey(), calculateHeuristic(startState));

    // --- A* Search ---
    const MAX_ITERATIONS = 5000;
    let iterations = 0;

    while (!openSet.isEmpty() && iterations < MAX_ITERATIONS) {
        iterations++;
        const current = openSet.dequeue();

        // Goal check
        if (current.level === maxLevel) {
            // Reconstruct path
            const path = reconstructPath(current, cameFrom);
            return {
                path,
                totalTimeMinutes: current.timeElapsed,
                error: null
            };
        }

        // Add to closed set
        closedSet.add(current.toKey());

        // Generate neighbor states
        const neighbors = [];

        // 1. Wait action (for energy or level up)
        if (current.energy < energyPerHunt || current.levelUpTimer > 0) {
            // Calculate minimum wait time
            let waitTime = Infinity;
            if (current.levelUpTimer > 0) {
                waitTime = Math.min(waitTime, current.levelUpTimer);
            }
            if (current.energy < energyPerHunt) {
                const timeToQuarterEnergy = quarterEnergyRefillMinutes;
                waitTime = Math.min(waitTime, timeToQuarterEnergy);
            }

            if (isFinite(waitTime) && waitTime > 0) {
                const afterWait = new LevelingState(
                    current.level,
                    current.slove,
                    Math.min(energyPerHunt, current.energy + (waitTime / singleEnergyRefillMinutes) * energyPerHunt),
                    Math.max(0, current.levelUpTimer - waitTime),
                    current.timeElapsed + waitTime,
                    current.endurance
                );
                neighbors.push({ state: afterWait, action: 'WAIT', cost: waitTime });
            }
        }

        // 2. Hunt action
        if (current.energy >= quarterEnergyAmount &&
            (scenario === 'nonLeader' || current.levelUpTimer === 0)) {
            const energyToUse = current.energy;
            const huntTime = energyToUse * 10; // 10 minutes per energy unit

            // Calculate SLOV earned
            let slovEarned = 0;
            let enduranceCost = 0;

            if (scenario === 'leader') {
                const { simProficiency, simRecovery } = getSimStatsForLevel(
                    initialData,
                    rarityInfo,
                    optimalDistributionToAdd,
                    current.level
                );
                const baseSlove = Utils.calculateBaseSlovePerHuntAction(
                    simProficiency,
                    className,
                    energyToUse
                );
                const reductionPercent = Utils.getFibonacciReductionPercent(
                    Math.floor(current.endurance / 100) + currentAge
                );
                slovEarned = baseSlove * (1 - reductionPercent / 100);
                enduranceCost = Utils.calculateEnduranceConsumedPerHuntAction(
                    simRecovery,
                    energyToUse
                );
            } else {
                const reductionPercent = Utils.getFibonacciReductionPercent(
                    Math.floor(current.endurance / 100) + initialData.leaderAge
                );
                slovEarned = externalLeaderBaseSlovePerHunt * (energyToUse / energyPerHunt) * (1 - reductionPercent / 100);
                enduranceCost = externalLeaderEnduranceCost * (energyToUse / energyPerHunt);
            }

            const afterHunt = new LevelingState(
                current.level,
                current.slove + slovEarned,
                0, // Energy consumed
                current.levelUpTimer,
                current.timeElapsed + huntTime,
                current.endurance + enduranceCost
            );
            neighbors.push({ state: afterHunt, action: 'HUNT', cost: huntTime });
        }

        // 3. Level up actions (only if not currently leveling)
        if (current.levelUpTimer === 0 && current.level < maxLevel) {
            const targetLevel = current.level + 1;
            const levelUpCost = Utils.getSloveLevelUpCost(targetLevel);
            const boostCost = Utils.getBoostCost(targetLevel);

            // Normal level up
            if (current.slove >= levelUpCost && current.energy === energyPerHunt) {
                const levelUpTime = Utils.getLevelUpTimeHours(targetLevel) * 60;
                const afterNormalLevelUp = new LevelingState(
                    targetLevel,
                    current.slove - levelUpCost,
                    current.energy,
                    levelUpTime,
                    current.timeElapsed,
                    current.endurance
                );
                neighbors.push({
                    state: afterNormalLevelUp,
                    action: 'LEVEL_NORMAL',
                    cost: 0 // Time is tracked by level up timer
                });
            }

            // Boosted level up
            if (current.slove >= (levelUpCost + boostCost) && current.energy === energyPerHunt) {
                const afterBoostLevelUp = new LevelingState(
                    targetLevel,
                    current.slove - levelUpCost - boostCost,
                    current.energy,
                    0, // No timer for boost
                    current.timeElapsed,
                    current.endurance
                );
                neighbors.push({
                    state: afterBoostLevelUp,
                    action: 'LEVEL_BOOST',
                    cost: 0 // Boost is instant
                });
            }
        }

        // Process neighbors
        for (const { state: neighbor, action, cost } of neighbors) {
            if (closedSet.has(neighbor.toKey())) continue;

            const tentativeGScore = gScore.get(current.toKey()) + cost;
            const neighborKey = neighbor.toKey();
            const neighborGScore = gScore.get(neighborKey) ?? Infinity;

            if (tentativeGScore < neighborGScore) {
                // This path to neighbor is better than any previous one
                cameFrom.set(neighborKey, {
                    fromState: current,
                    action: action,
                    cost: cost
                });
                gScore.set(neighborKey, tentativeGScore);
                const h = calculateHeuristic(neighbor);
                fScore.set(neighborKey, tentativeGScore + h);

                if (!isFinite(h)) continue; // Skip unreachable states

                openSet.enqueue(neighbor, tentativeGScore + h);
            }
        }
    }

    return {
        error: iterations >= MAX_ITERATIONS
            ? "Search exceeded maximum iterations"
            : "No path found to goal",
        path: null,
        totalTimeMinutes: Infinity
    };
}

// Helper function to reconstruct path from A* search
function reconstructPath(goalState, cameFrom) {
    const path = [];
    let currentState = goalState;

    while (currentState) {
        const previous = cameFrom.get(currentState.toKey());
        if (!previous) break;

        path.unshift({
            action: previous.action,
            fromLevel: previous.fromState.level,
            toLevel: currentState.level,
            timeElapsed: currentState.timeElapsed,
            sloveBalance: currentState.slove,
            energyUnits: currentState.energy,
            endurance: currentState.endurance
        });

        currentState = previous.fromState;
    }

    return path;
}
