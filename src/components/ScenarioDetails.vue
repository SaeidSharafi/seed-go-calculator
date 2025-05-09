<template>
  <div class="results-section animate-fade-in font-mono text-xs md:text-base">
    <div class="bg-green-50/80 border border-green-200 rounded-2xl shadow p-4">
      <h3 class="font-bold mb-2 flex items-center gap-2 text-green-700">
        <svg
          class="w-5 h-5 text-green-400"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" />
        </svg>
        Leveling Scenario Details
      </h3>
      <div
        v-for="s in [
          { key: 'leader', label: 'Leader' },
          { key: 'leaderBoosted', label: 'Leader' },
          { key: 'nonLeader', label: 'non-Leader' },
          { key: 'nonLeaderBoosted', label: 'non-Leader' },
        ]"
        :key="s.key"
        class="scenario-detail mb-6 bg-white/80 rounded-xl p-4 shadow-sm"
      >
        <h4 class="font-semibold mb-2 flex items-center gap-1 text-green-800">
          <svg
            class="w-4 h-4 text-green-400"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
          </svg>
          {{ s.label }}
          <span
            v-if="scenarioResults[s.key]?.useBoost"
            class="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-bold"
            >Boosted</span
          >
          <span
            v-else
            class="ml-2 px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-bold"
            >Normal</span
          >
        </h4>
        <div
          v-if="
            scenarioResults[s.key] &&
            scenarioResults[s.key].actionLog &&
            scenarioResults[s.key].actionLog.length
          "
        >
          <ol class="list-decimal list-inside space-y-1">
            <li
              v-for="(action, idx) in scenarioResults[s.key].actionLog"
              :key="idx"
              :class="getActionClass(action)"
            >
              <span v-if="action.type === 'HUNT'">
                Level {{ action.level }}: Hunted (Earned
                {{ action.sloveEarned }} SLOV, Used {{ action.enduCost }} ENDU)
                <span class="block">Profeciency points: 
                  <span class="text-red-600 font-bold">{{ action.prof }}</span>
                </span>
                <span class="block">Recovery Points: 
                  <span class="text-red-600 font-bold">{{ action.rec }}</span>
                </span>
              </span>
              <span v-else-if="action.type === 'LEVEL_NORMAL_START'">
                Level {{ action.fromLevel }} → {{ action.toLevel }}: Started
                Normal Level Up (Cost {{ action.sloveCost }} SLOV +
                {{ action.seedCost }} SEED, Duration
                {{ utils.formatTimeDH(action.durationMin) }})
              </span>
              <span v-else-if="action.type === 'LEVEL_BOOST'">
                Level {{ action.fromLevel }} → {{ action.toLevel }}:
                <strong class="text-blue-700">Boosted Level Up!</strong>
                (Cost {{ action.sloveCost }} SLOV + {{ action.seedCost }} SEED +
                {{ action.boostCost }} Boost SLOV)
              </span>
              <span v-else-if="action.type === 'DECISION_WAIT_FOR_BOOST'">
                <strong class="text-yellow-700"
                  >Strategy Decision (at Lv {{ action.atLevel }} targeting Lv
                  {{ action.targetLevel }}): Chose to Wait/Hunt (est.
                  {{ utils.formatTimeDH(action.waitTimeEstMin) }}) instead of
                  Normal Level Up ({{
                    utils.formatTimeDH(action.normalTimeMin)
                  }}) to afford boost.</strong
                >
              </span>
              <span v-else-if="action.type === 'WAIT'">
                Waited {{ utils.formatTimeDH(action.durationMin) }} ({{
                  action.reason
                }})
              </span>
              <span v-else> Unknown Action: {{ action }} </span>
              <span class="text-xs text-gray-500 ml-2">
                (Time: {{ utils.formatTimeDH(action.currentTotalTimeMin) }})
              </span>
            </li>
          </ol>
        </div>
        <div v-else>
          <p class="text-gray-500">No actions recorded for this scenario.</p>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  scenarioResults: Object,
  utils: Object,
});

function getActionClass(action) {
  if (action.type === "HUNT") return "bg-purple-200 rounded px-2 py-1 mb-1"; // "we have no money"
  if (action.type === "LEVEL_NORMAL_START" || action.type === "LEVEL_BOOST")
    return "bg-green-200 rounded px-2 py-1 mb-1"; // "good color"
  if (action.type === "DECISION_WAIT_FOR_BOOST" || action.type === "WAIT")
    return "bg-orange-200 text-black rounded px-2 py-1 mb-1"; // "ahhh shit"
  return "bg-red-100 rounded px-2 py-1 mb-1";
}
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
</style>
