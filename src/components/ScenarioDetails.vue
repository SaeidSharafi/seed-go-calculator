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
          { key: 'nonLeader', label: 'non-Leader' },
        ]"
        :key="s.key"
        class="scenario-detail mb-6 bg-white/80 rounded-xl p-4 shadow-sm"
      >
        <h4
          class="font-semibold mb-2 flex items-center gap-1 text-green-800 cursor-pointer select-none group"
          @click="toggleOpen(s.key)"
          :aria-expanded="openStates[s.key]"
          :aria-controls="'scenario-' + s.key"
          title="Toggle details"
        >
          <span class="mr-2 group-hover:scale-110 transition-transform">
            <span v-if="openStates[s.key]">▼</span>
            <span v-else>►</span>
          </span>
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
        <div v-show="openStates[s.key]">
          <div
            v-if="
              scenarioResults[s.key] &&
              scenarioResults[s.key].actionLog &&
              scenarioResults[s.key].actionLog.length
            "
          >
            <ul class="list-inside space-y-1 !p-0">
              <li
                v-for="(action, idx) in scenarioResults[s.key].actionLog"
                :key="idx"
                :class="getActionClass(action)"
                class="!p-0"
              >
                <div
                  class="md:grid grid-cols-6 items-stretch flex flex-col"
                  v-if="action.type === 'HUNT'"
                >
                  <div
                    class="flex items-center col-span-1 font-bold text-lg bg-red-400 px-2 rounded-tl"
                  >
                    HUNT
                  </div>
                  <div class="col-span-4 flex flex-wrap gap-2 p-2">
                    <Badge label="Level" :value="action.level" color="blue" />
                    <Badge
                      label="Slove Gained (Gross)"
                      :value="'+' + utils.formatNumber(action.sloveGained)"
                      color="green"
                    />
                    <Badge
                      label="Endurance Consumed"
                      :value="
                        '-' +
                        utils.formatNumber(action.enduranceConsumedThisHunt, 2)
                      "
                      color="red"
                    />
                    <Badge
                      v-if="action.sloveCostForRecoveryApplied > 0"
                      label="Slove Cost (Recovery)"
                      :value="
                        '-' +
                        utils.formatNumber(action.sloveCostForRecoveryApplied)
                      "
                      color="orange"
                    />
                    <Badge
                      v-if="action.enduranceRecoveredThisCycle > 0"
                      label="Endurance Recovered"
                      :value="
                        '+' +
                        utils.formatNumber(
                          action.enduranceRecoveredThisCycle,
                          2
                        )
                      "
                      color="teal"
                    />
                    <Badge
                      v-if="
                        action.recoveryDetails &&
                        action.recoveryDetails.amountSkipped > 0
                      "
                      :label="
                        'Recovery Skipped (' +
                        action.recoveryDetails.reason +
                        ')'
                      "
                      :value="
                        utils.formatNumber(
                          action.recoveryDetails.amountSkipped,
                          2
                        ) + ' End.'
                      "
                      color="yellow"
                    />
                    <Badge
                     v-if="s.key === 'leader'"
                      label="Unrecovered Endurance"
                      :value="
                        utils.formatNumber(
                          action.unrecoveredEnduranceByLeaderAfterHunt,
                          2
                        )
                      "
                      color="pink"
                    />
                    <Badge
                    v-else
                      label="Unrecovered Endurance"
                      :value="
                        utils.formatNumber(
                          action.unrecoveredEnduranceByDelegateAfterHunt,
                          2
                        )
                      "
                      color="purple"
                    />
                    <Badge
                      v-if="
                        s.key !== 'nonLeader' &&
                        s.key !== 'nonLeaderBoosted' &&
                        action.currentStats
                      "
                      label="Stats: "
                      :value="`P:${action.currentStats.simProficiency} R:${action.currentStats.simRecovery}`"
                      color="blue"
                    />
                  </div>
                  <span class="text-xs text-gray-500 md:ml-2 text-center self-center bg-gray-100 w-full md:w-auto md:bg-none">
                    <IconClock class="w-4 h-4 inline-block" />
                    {{ utils.formatTimeDH(action.timeElapsedMin) }}
                  </span>
                </div>
                <div
                  class="md:grid grid-cols-6 items-stretch flex flex-col"
                  v-else-if="action.type === 'NORMAL_LEVEL_UP'"
                >
                  <div
                    class="flex items-center col-span-1 font-bold text-lg bg-green-400 px-2 rounded-tl"
                  >
                    Level-up
                  </div>
                  <div class="col-span-4 flex gap-2 p-2  flex-wrap ">
                    <Badge
                      label=""
                      :value="`${action.fromLevel} -> ${action.toLevel}`"
                      color="green"
                    />
                    <Badge
                      label=""
                      :value="'-' + action.sloveCost + ' SLove'"
                      color="red"
                    />
                    <Badge
                      label=""
                      :value="'-' + action.seedCost + ' SEED'"
                      color="red"
                    />
                    <Badge
                      label="Duration: "
                      :value="utils.formatTimeDH(action.durationMin)"
                      color="green"
                    />
                  </div>
                  <span class="text-xs text-gray-500 md:ml-2 text-center self-center bg-gray-100 w-full md:w-auto md:bg-none">
                    <IconClock class="w-4 h-4 inline-block" />
                    {{ utils.formatTimeDH(action.timeElapsedMin) }}
                  </span>
                </div>
                <div
                  class="md:grid grid-cols-6 items-stretch flex flex-col"
                  v-else-if="action.type === 'BOOSTED_LEVEL_UP'"
                >
                  <div
                    class="flex items-center col-span-1 font-bold text-xs bg-purple-400 px-2 rounded-tl"
                  >
                    Lvl-up Boosted
                  </div>
                  <div class="col-span-4  flex-wrap  flex gap-2 p-2">
                    <Badge
                      label=""
                      :value="`${action.level -1 } -> ${action.level}`"
                      color="green"
                    />
                    <Badge
                      label=""
                      :value="'-' + action.sloveCost + ' SLove'"
                      color="green"
                    />
                    <Badge
                      label=""
                      :value="'-' + action.seedCost + ' SEED'"
                      color="red"
                    />
                    <Badge
                      label="Boosted"
                      :value="'-' + action.boostSloveCost + ' SLove'"
                      color="red"
                    />
                  </div>
                  <span class="text-xs text-gray-500 md:ml-2 text-center self-center bg-gray-100 w-full md:w-auto md:bg-none">
                    <IconClock class="w-4 h-4 inline-block" />
                    {{ utils.formatTimeDH(action.timeElapsedMin) }}
                  </span>
                </div>
                <div
                  class="md:grid grid-cols-6 items-stretch flex flex-col"
                  v-else-if="action.type === 'WAIT_FOR_ENERGY'"
                >
                  <div
                    class="flex items-center col-span-1 font-bold text-lg bg-gray-400 px-2 rounded-tl w-full"
                  >
                    WAIT
                  </div>
                  <div class="col-span-4 flex gap-2 p-2  flex-wrap ">
                    <Badge
                      :label="action.reason"
                      :value="utils.formatTimeDH(action.durationMin)"
                      color="green"
                    />
                    <Badge
                      label="Energy Gained"
                      :value="action.energyGained"
                      color="blue"
                    />
                  </div>
                  <span class="text-xs text-gray-500 md:ml-2 text-center self-center bg-gray-100 w-full md:w-auto md:bg-none">
                    <IconClock class="w-4 h-4 inline-block" />
                    {{ utils.formatTimeDH(action.timeElapsedMin) }}
                  </span>
                </div>
                <div
                  class="items-stretch flex justify-between px-4"
                  v-else-if="action.type === 'INITIAL_STATE'"
                >
                  <strong class="text-blue-700"
                    >Simulation Start: Level {{ action.level }}, Slove
                    {{ action.sloveBalance }}</strong
                  >
                  <span class="text-xs text-gray-500 text-center self-center bg-gray-100 w-full md:w-auto md:bg-none">
                    <IconClock class="w-4 h-4 inline-block mr-1" />
                    {{ utils.formatTimeDH(action.timeElapsedMin) }}
                  </span>
                </div>
                <span v-else>
                  Unknown Action Type: {{ action.type }} - {{ action }}
                </span>
              </li>
            </ul>
          </div>
          <div v-else>
            <p class="text-gray-500">No actions recorded for this scenario.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from "vue";
import { IconClock } from "@tabler/icons-vue";
import Badge from "./Badge.vue";

const props = defineProps({
  scenarioResults: Object,
  utils: Object,
});

// Collapsible state for each scenario key
const openStates = ref({
  leader: false,
  leaderBoosted: false,
  nonLeader: false,
  nonLeaderBoosted: false,
});

function toggleOpen(key) {
  openStates.value[key] = !openStates.value[key];
}

function getActionClass(action) {
  if (action.type === "HUNT")
    return "bg-red-50 border border-red-200 rounded px-2 py-1 mb-1 overflow-hidden";
  if (action.type === "NORMAL_LEVEL_UP" || action.type === "BOOSTED_LEVEL_UP")
    return "bg-green-50 border border-green-200 rounded px-2 py-1 mb-1 overflow-hidden";
  if (action.type === "WAIT_FOR_ENERGY")
    return "bg-yellow-50 border border-yellow-200 rounded px-2 py-1 mb-1 overflow-hidden";
  if (action.type === "INITIAL_STATE")
    return "bg-blue-50 border border-blue-200 rounded px-2 py-1 mb-1 overflow-hidden";
  return "bg-gray-50 border border-gray-200 rounded px-2 py-1 mb-1 overflow-hidden"; // Default for unknown or new types
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
