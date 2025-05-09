<template>
  <div class="results-section scenario-summary mb-4 animate-fade-in">
    <div
      class="bg-blue-50/80 border border-blue-200 rounded-2xl shadow p-4 overflow-x-auto text-sm md:text-base"
    >
      <h3 class="font-bold mb-2 flex items-center gap-2 text-blue-700">
        <svg
          class="w-4 h-4 text-blue-400"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" />
        </svg>
        Leveling Scenario Summary
      </h3>
      <table
        class="min-w-full text-sm rounded-xl overflow-hidden font-mono bg-blue-50/60 border border-blue-100"
      >
        <thead class="bg-blue-100 text-blue-900">
          <tr>
            <th class="p-2 font-semibold">Scenario</th>
            <th class="p-2 font-semibold">Boost Used</th>
            <th class="p-2 font-semibold">Hunts</th>
            <th class="p-2 font-semibold">Gross SLOV</th>
            <th class="p-2 font-semibold">SLOV (Lvl)</th>
            <th class="p-2 font-semibold">SLOV (Boost)</th>
            <th class="p-2 font-semibold">SEED</th>
            <th class="p-2 font-semibold">Net SLOV</th>
            <th class="p-2 font-semibold">Total Time</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="s in [
              { key: 'leader', label: 'Leader' },
              { key: 'leaderBoosted', label: 'Leader' },
              { key: 'nonLeader', label: 'non-Leader' },
              { key: 'nonLeaderBoosted', label: 'non-Leader' },
            ]"
            :key="s.key"
            class="even:bg-blue-50 hover:bg-blue-100 transition font-mono"
          >
            <template
              v-if="scenarioResults[s.key] && !scenarioResults[s.key].error"
            >
              <td class="p-2 font-mono">{{ s.label }}</td>
              <td class="p-2 font-mono">
                {{ scenarioResults[s.key].useBoost ? "Yes" : "No" }}
              </td>
              <td class="p-2 font-mono">
                {{ scenarioResults[s.key].totalHuntsToReachMaxLevel ?? "N/A" }}
              </td>
              <td class="p-2 font-mono">
                {{
                  scenarioResults[s.key].totalGrossSloveEarnedDuringLeveling ??
                  "N/A"
                }}
              </td>
              <td class="p-2 font-mono">
                {{ scenarioResults[s.key].totalSloveSpentOnLeveling ?? "N/A" }}
              </td>
              <td class="p-2 font-mono">
                {{ scenarioResults[s.key].totalBoostCost ?? "N/A" }}
              </td>
              <td class="p-2 font-mono">
                {{ scenarioResults[s.key].totalSeedSpentOnLeveling ?? "N/A" }}
              </td>
              <td class="p-2 font-mono">
                {{ scenarioResults[s.key].netSloveAfterLevelingCosts ?? "N/A" }}
              </td>
              <td class="p-2 font-mono">
                {{
                  utils.formatTimeDH(
                    scenarioResults[s.key].totalLevelingMinutes ?? null
                  )
                }}
              </td>
            </template>
            <template v-else>
              <td class="p-2 font-mono">{{ s.label }}</td>
              <td class="p-2 font-mono">
                {{
                  scenarioResults[s.key]?.useBoost === undefined
                    ? "N/A"
                    : scenarioResults[s.key]?.useBoost
                    ? "Yes"
                    : "No"
                }}
              </td>
              <td colspan="7" class="p-2 text-red-700 font-mono">
                Error: {{ scenarioResults[s.key]?.error || "N/A" }}
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  scenarioResults: Object,
  utils: Object,
});
</script>
<style scoped>
.animate-fade-in {
  animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@media (max-width: 640px) {
  table,
  thead,
  tbody,
  th,
  td,
  tr {
    display: block;
  }
  thead tr {
    display: none;
  }
  tbody tr {
    margin-bottom: 1rem;
    border-radius: 1rem;
    box-shadow: 0 1px 4px #60a5fa;
    background: #dbeafe;
  }
  td {
    padding-left: 70%;
    position: relative;
    min-height: 2.5rem;
    border: none;
  }
  td:before {
    position: absolute;
    left: 1rem;
    top: 0.5rem;
    width: 70%;
    text-align: left;
    white-space: nowrap;
    font-weight: bold;
    color: #1e40af;
  }
  td:nth-of-type(1):before {
    content: "Scenario";
  }
  td:nth-of-type(2):before {
    content: "Boost Used";
  }
  td:nth-of-type(3):before {
    content: "Hunts";
  }
  td:nth-of-type(4):before {
    content: "Gross SLOV";
  }
  td:nth-of-type(5):before {
    content: "SLOV (Lvl)";
  }
  td:nth-of-type(6):before {
    content: "SLOV (Boost)";
  }
  td:nth-of-type(7):before {
    content: "SEED";
  }
  td:nth-of-type(8):before {
    content: "Net SLOV";
  }
  td:nth-of-type(9):before {
    content: "Total Time";
  }
}
</style>
