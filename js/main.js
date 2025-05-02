import * as  Utils from './utils.js';
import { findOptimalDistributionAndSimulate } from './optimalDistribution.js';
import { simulateLevelingScenarios } from './simulateLeveling.js';

function validateFormData(data, targetAge) {
    if (data.currentAge > targetAge) return `Target Age (${targetAge}) cannot be less than Current Age (${data.currentAge}).`;
    if (data.maxLevel < data.currentLevel) return `Target Level (${data.maxLevel}) cannot be less than Current Level (${data.currentLevel}).`;
    if ([data.currentLevel, data.maxLevel, data.currentTotalProficiency, data.currentTotalRecovery, data.energyPerHunt, targetAge].some(isNaN)) return "Please ensure all inputs are valid numbers.";
    if (data.currentTotalProficiency < 0 || data.currentTotalRecovery < 0 || data.energyPerHunt <= 0 || targetAge < 0 || data.currentLevel < 0 || data.maxLevel <= 0) return "Levels, Stats, Energy, and Age must be non-negative (or positive where applicable).";
    return null;
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
const energyPerHuntInput = document.getElementById('energy-per-action');
const targetAgeInput = document.getElementById('target-age');
const sloveBalance = document.getElementById('slove-balance');
const calculateButton = document.getElementById('calculate-button');
const resultsArea = document.getElementById('results-area');

// --- Leader DOM Elements ---
const leaderRaritySelect = document.getElementById('leader-rarity');
const leaderProficiencyInput = document.getElementById('leader-proficiency');
const leaderRecoveryInput = document.getElementById('leader-recovery');

// --- Update Inputs for Rarity ---
function updateInputsForRarity(rarity, profInput, recInput) {
    const rarityInfo = Utils.findRarityInfo(rarity);
    if (!rarityInfo) return;
    // Set min/max for proficiency and recovery
    profInput.value = rarityInfo.minBase;
    profInput.min = rarityInfo.minBase;
    recInput.value = rarityInfo.minBase;
    recInput.min = rarityInfo.minBase;
}

// --- Event Listeners for Rarity Changes ---
raritySelect.addEventListener('change', () => {
    updateInputsForRarity(raritySelect.value, currentProficiencyInput, currentRecoveryInput);
});
leaderRaritySelect.addEventListener('change', () => {
    updateInputsForRarity(leaderRaritySelect.value, leaderProficiencyInput, leaderRecoveryInput);
});

// Initialize on page load
updateInputsForRarity(raritySelect.value, currentProficiencyInput, currentRecoveryInput);
updateInputsForRarity(leaderRaritySelect.value, leaderProficiencyInput, leaderRecoveryInput);

// Structured result fields
const resultsCard = document.getElementById('results-card');
const resultsTitle = document.getElementById('results-title');
const resultsSummary = document.getElementById('results-summary');
const resultProficiency = document.getElementById('result-proficiency');
const resultRecovery = document.getElementById('result-recovery');
const resultFinalProficiency = document.getElementById('result-final-proficiency');
const resultFinalRecovery = document.getElementById('result-final-recovery');
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
const scenarioLogContainerEl = document.getElementById('scenario-log-container');

function clearResults() {
    resultsCard.style.display = 'none';
    resultsError.style.display = 'none';
    resultsPlaceholder.style.display = '';
    resultsTableContainer.innerHTML = '';
    
    if (scenarioLogContainerEl) scenarioLogContainerEl.innerHTML = '';
    if (scenarioLogContainerEl) scenarioLogContainerEl.style.display = 'none';

    // --- Corrected Removal of Dynamic Time Rows ---
    
    document.querySelectorAll('.scenario-summary').forEach(e => e.remove());

    const timeLevelUpDD = document.getElementById('result-time-levelup');
    if (timeLevelUpDD) {
        const timeLevelUpDT = timeLevelUpDD.previousElementSibling;
        if (timeLevelUpDT && timeLevelUpDT.tagName === 'DT') timeLevelUpDT.remove();
        timeLevelUpDD.remove();
    }
    const timeTargetAgeDD = document.getElementById('result-time-targetage');
    if (timeTargetAgeDD) {
        const timeTargetAgeDT = timeTargetAgeDD.previousElementSibling;
        if (timeTargetAgeDT && timeTargetAgeDT.tagName === 'DT') timeTargetAgeDT.remove();
        timeTargetAgeDD.remove();
    }
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
        energyPerHunt: parseInt(energyPerHuntInput.value, 10),
        sloveBalance: parseInt(sloveBalance.value, 10),
        leaderLevel: parseInt(document.getElementById('leader-level').value, 10),
        leaderProficiency: parseInt(document.getElementById('leader-proficiency').value, 10),
        leaderRecovery: parseInt(document.getElementById('leader-recovery').value, 10),
        leaderClass: document.getElementById('leader-class').value,
        leaderType: document.getElementById('leader-rarity').value
    };
}
function renderActionLog(actionLog, containerElement) {
    if (!actionLog || actionLog.length === 0) {
        containerElement.innerHTML = '<p>No actions recorded for this scenario.</p>';
        return;
    }

    let logHtml = '<ol class="action-log-list">'; // Use an ordered list

    actionLog.forEach(action => {
        let actionText = '';
        let timeText = `(Time: ${Utils.formatTimeDH(action.currentTotalTimeMin)})`;

        switch (action.type) {
            case 'HUNT':
                actionText = `Level ${action.level}: Hunted (Earned ${action.sloveEarned} SLOV, Used ${action.enduCost} ENDU)`;
                break;
            case 'LEVEL_NORMAL_START':
                actionText = `Level ${action.fromLevel} -> ${action.toLevel}: Started Normal Level Up (Cost ${action.sloveCost} SLOV + ${action.seedCost} SEED, Duration ${Utils.formatTimeDH(action.durationMin)})`;
                // Timestamp is start time, duration is length
                timeText = `(Started at: ${Utils.formatTimeDH(action.currentTotalTimeMin)})`;
                break;
            case 'LEVEL_BOOST':
                actionText = `Level ${action.fromLevel} -> ${action.toLevel}: <strong class="boosted">Boosted Level Up!</strong> (Cost ${action.sloveCost} SLOV + ${action.seedCost} SEED + ${action.boostCost} Boost SLOV)`;
                break;
            case 'DECISION_WAIT_FOR_BOOST':
                actionText = `<strong class="decision-note">Strategy Decision (at Lv ${action.atLevel} targeting Lv ${action.targetLevel}): Chose to Wait/Hunt (est. ${Utils.formatTimeDH(action.waitTimeEstMin)}) instead of Normal Level Up (${Utils.formatTimeDH(action.normalTimeMin)}) to afford boost.</strong>`;
                timeText = `(Decision at: ${Utils.formatTimeDH(action.currentTotalTimeMin)})`;
                break;
            case 'WAIT':
                actionText = `Waited ${Utils.formatTimeDH(action.durationMin)} (${action.reason})`;
                // Timestamp is end time of wait
                timeText = `(Finished at: ${Utils.formatTimeDH(action.currentTotalTimeMin)}, At Level: ${action.level})`;
                break;
            default:
                actionText = `Unknown Action: ${JSON.stringify(action)}`;
                break;
        }
        actionText += action.msg ? ` (${action.msg})` : ''; // Append any additional message
        logHtml += `<li>${actionText} <span class="timestamp">${timeText}</span></li>`;
    });

    logHtml += '</ol>';
    containerElement.innerHTML = logHtml;
}

function renderResults(result, initialData, targetAge) {
    clearResults();

    if (result?.error && !result.finalStats) {
        resultsError.textContent = `Error: ${result.error}`;
        resultsError.style.display = '';
        resultsPlaceholder.style.display = 'none';
        return;
    }

    if (result) {
        resultsCard.style.display = '';
        resultsPlaceholder.style.display = 'none';
        resultsTitle.textContent = 'Calculation Results';
        resultsSummary.textContent = `Optimal distribution found for ${result.rarity} ${result.class} (Lv ${result.startLevel} -> ${result.targetLevel}, Age ${initialData.currentAge} -> ${targetAge}).`;

        // Optimal Distribution & Final Stats
        resultProficiency.textContent = result.optimalDistributionToAdd?.proficiencyBonusToAdd ?? 'N/A';
        resultRecovery.textContent = result.optimalDistributionToAdd?.recoveryBonusToAdd ?? 'N/A';
        resultFinalProficiency.textContent = result.finalStats?.totalProficiency ?? 'N/A';
        resultFinalRecovery.textContent = result.finalStats?.totalRecovery ?? 'N/A';

        // Earnings Outcome Section
        if (result.earningsOutcome) {
            // ... (render earnings outcome as before, including Time to Target Age) ...
            resultEnduranceHunt.textContent = result.earningsOutcome.enduranceConsumedPerHuntAction?.toFixed(4) ?? 'N/A';
            resultHuntsTargetAge.textContent = result.earningsOutcome.huntsToReachTargetAge ?? 'N/A';
            resultBaseSloveHunt.textContent = result.earningsOutcome.baseSlovePerHuntActionAtMaxLevel?.toFixed(2) ?? 'N/A';
            resultMaxTotalSlove.textContent = result.earningsOutcome.maxTotalBaseSloveEarnedByTargetAge?.toFixed(2) ?? 'N/A'; // Check var name
            resultRecoveryCost.textContent = (result.earningsOutcome.slovRecoveryCostPerHuntActionAtMaxLevel?.toFixed(4) ?? 'N/A') + ' SLOV';

            const recoveryCostParent = resultRecoveryCost.parentNode;
            if (recoveryCostParent) {
                let timeAgeRow = document.getElementById('result-time-targetage');
                if (!timeAgeRow) {
                    const dt = document.createElement('dt'); dt.textContent = 'Time to Target Age';
                    const dd = document.createElement('dd'); dd.id = 'result-time-targetage';
                    dt.className = 'important'; dd.className = 'important';
                    recoveryCostParent.appendChild(dt); recoveryCostParent.appendChild(dd);
                    timeAgeRow = dd;
                }
                timeAgeRow.textContent = result.timeToTargetAge ?? 'N/A';
            }
        } else {
            resultEnduranceHunt.textContent = 'N/A';
            resultHuntsTargetAge.textContent = 'N/A';
            resultBaseSloveHunt.textContent = 'N/A';
            resultMaxTotalSlove.textContent = 'N/A';
            resultRecoveryCost.textContent = 'N/A';
            // Remove old time row if it exists
            document.getElementById('result-time-targetage')?.closest('dl')?.querySelector('dt:last-of-type')?.remove(); // Remove dt too
            document.getElementById('result-time-targetage')?.remove();
        }

        // Single Hunt Section
        if (initialData.currentAge === targetAge && result.yearlyBreakdown && result.yearlyBreakdown[0]) {
            resultSingleHuntSection.style.display = '';
            resultSingleHunt.textContent = result.yearlyBreakdown[0].slovePerHunt?.toFixed(2) ?? 'N/A';
        } else {
            resultSingleHuntSection.style.display = 'none';
        }

        // Yearly Breakdown Table
        if (result.yearlyBreakdown && result.yearlyBreakdown.length > 0 && initialData.currentAge !== targetAge) { // Hide if single hunt
            const table = document.createElement('table');
            table.className = 'earnings-table';
            const thead = document.createElement('thead');
            thead.innerHTML = '<tr><th>Age</th><th>End Level</th><th>Avg SLOV/Hunt</th><th>Hunts</th><th>Total SLOV</th><th>End Balance</th></tr>';
            table.appendChild(thead);
            const tbody = document.createElement('tbody');
            result.yearlyBreakdown.forEach(year => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>Year ${year.age}</td><td>Lv ${year.level}</td><td>${year.slovePerHunt}</td><td>${year.huntsInYear}</td><td>${year.totalSloveInYear}</td><td>${year.sloveBalance ?? 0}</td>`;
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            resultsTableContainer.appendChild(table);
        } else if (initialData.currentAge === targetAge) {
            resultsTableContainer.innerHTML = ''; // Don't show table for single hunt
        }
        else {
            resultsTableContainer.innerHTML = '<p>Year-by-year earnings data not available.</p>';
        }


        // Render Leveling Scenarios Table & Boost Notes
        let scenarioSummaryHtml = '';
        let scenarioDetailedLogsHtml = '';

        if (result.scenarioResults) {
            // 1. Build Summary Table
            scenarioSummaryHtml = `
                <div class="results-section scenario-summary">
                    <h3>Leveling Scenario Summary</h3>
                    <table class="earnings-table scenario-summary-table">
                        <thead>
                            <tr>
                                <th>Scenario</th><th>Boost Used</th><th>Hunts</th>
                                <th>Gross SLOV</th><th>SLOV (Lvl)</th><th>SLOV (Boost)</th>
                                <th>SEED</th><th>Net SLOV</th><th>Total Time</th>
                            </tr>
                        </thead>
                        <tbody>`;

            const scenarios = [
                { key: 'leader', label: 'Leader' }, { key: 'leaderBoosted', label: 'Leader' },
                { key: 'bulk', label: 'Bulk' }, { key: 'bulkBoosted', label: 'Bulk' },
                { key: 'alternate', label: 'Alternate' }, { key: 'alternateBoosted', label: 'Alternate' }
            ];

            // 2. Build Detailed Logs (populate scenarioDetailedLogsHtml)
            scenarioDetailedLogsHtml = '<div class="results-section"><h3>Leveling Scenario Details</h3>';

            for (const s of scenarios) {
                const r = result.scenarioResults[s.key];
                const isBoosted = r?.useBoost; // Check if result exists
                const scenarioLabel = `${s.label} ${isBoosted ? '(Boosted)' : '(Normal)'}`;

                if (!r || r.error) {
                    // Add row to summary table
                    scenarioSummaryHtml += `<tr><td>${s.label}</td><td>${isBoosted === undefined ? 'N/A' : (isBoosted ? 'Yes' : 'No')}</td><td colspan="7" class="error">Error: ${r?.error || 'N/A'}</td></tr>`;
                    // Add section to detailed logs
                    scenarioDetailedLogsHtml += `<div class="scenario-detail"><h4>${scenarioLabel}</h4><p class="error">Error: ${r?.error || 'N/A'}</p></div>`;
                } else {
                    // Add row to summary table
                    scenarioSummaryHtml += `
                        <tr>
                            <td>${s.label}</td><td>${isBoosted ? 'Yes' : 'No'}</td>
                            <td>${r.totalHuntsToReachMaxLevel ?? 'N/A'}</td>
                            <td>${r.totalGrossSloveEarnedDuringLeveling ?? 'N/A'}</td>
                            <td>${r.totalSloveSpentOnLeveling ?? 'N/A'}</td>
                            <td>${r.totalBoostCost ?? 'N/A'}</td>
                            <td>${r.totalSeedSpentOnLeveling ?? 'N/A'}</td>
                            <td>${r.netSloveAfterLevelingCosts ?? 'N/A'}</td>
                            <td>${Utils.formatTimeDH(r.totalLevelingMinutes ?? null)}</td>
                        </tr>`;

                    // Add section to detailed logs
                    scenarioDetailedLogsHtml += `<div class="scenario-detail"><h4>${scenarioLabel}</h4>`;
                    const logContainer = document.createElement('div'); // Temp container for renderActionLog
                    renderActionLog(r.actionLog, logContainer); // Use helper to generate log HTML
                    scenarioDetailedLogsHtml += logContainer.innerHTML; // Append generated HTML
                    scenarioDetailedLogsHtml += `</div>`; // Close scenario-detail div
                }
            }
            scenarioSummaryHtml += '</tbody></table></div>'; // Close summary table
            scenarioDetailedLogsHtml += '</div>'; // Close detailed logs section

            // Append scenario summary HTML (e.g., after yearly breakdown)
            resultsTableContainer.insertAdjacentHTML('afterend', scenarioSummaryHtml);

            // Append detailed logs HTML (e.g., after summary)
            if (scenarioLogContainerEl) {
                scenarioLogContainerEl.innerHTML = scenarioDetailedLogsHtml;
                scenarioLogContainerEl.style.display = ''; // Show the container
            }

        }

    } else { // No result object
        resultsPlaceholder.style.display = '';
        resultsPlaceholder.textContent = 'Calculation failed or no result returned.'; // Informative placeholder
    }
}

calculateButton.addEventListener('click', () => {
    clearResults();
    resultsPlaceholder.innerHTML = '<p>Calculating...</p>';
    resultsPlaceholder.style.display = '';
    // Use setTimeout to allow the UI to update before potentially long calculation
    setTimeout(() => {
        try {
            const initialData = getFormData();
            const targetAge = parseInt(targetAgeInput.value, 10);

            // Perform validation
            const validationError = validateFormData(initialData, targetAge);
            if (validationError) {
                throw new Error(validationError); // Throw error to be caught below
            }

            // Run the main optimization
            // This might take time
            const result = findOptimalDistributionAndSimulate(initialData, targetAge);

            // Check for primary error before running scenarios
            if (result.error && !result.finalStats) {
                renderResults(result, initialData, targetAge); // Render just the error
                return;
            }

            // Run all leveling scenarios only if primary sim succeeded
            // This might also take time
            result.scenarioResults = simulateLevelingScenarios(initialData, result.optimalDistributionToAdd);

            // Render combined results
            renderResults(result, initialData, targetAge);

        } catch (e) {
            console.error("Calculation Error:", e); // Log the full error for debugging
            resultsCard.style.display = 'none';
            resultsError.textContent = `Error during calculation: ${e.message || e}`;
            resultsError.style.display = '';
            resultsPlaceholder.style.display = 'none';
        }
    }, 10); // Small delay for UI update
});
