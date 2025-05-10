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
                  class="grid grid-cols-6 items-stretch"
                  v-if="action.type === 'HUNT'"
                >
                  <div
                    class="flex items-center col-span-1 font-bold text-lg bg-red-400 px-2 rounded-tl"
                  >
                    HUNT
                  </div>
                  <div class="col-span-4 flex gap-2 p-2">
                    <Badge label="Level" :value="action.level" color="blue" />
                    <Badge
                      label=""
                      :value="'+' + action.sloveEarned + 'SLove'"
                      color="green"
                    />
                    <Badge
                      :label="'-' + action.enduCost"
                      value="Endurance"
                      color="red"
                    />
                    <Badge
                      v-if="s.key !== 'nonLeader' && s.key !== 'nonLeaderBoosted'"
                      label="Stats: "
                      :value="`P:${action.prof} R:${action.rec}`"
                      color="blue"
                    />
                  </div>
                  <span class="text-xs text-gray-500 ml-2 self-center">
                    <IconClock class="w-4 h-4 inline-block" />
                    {{ utils.formatTimeDH(action.currentTotalTimeMin) }}
                  </span>
                </div>
                <div
                  class="grid grid-cols-6 items-stretch"
                  v-else-if="action.type === 'LEVEL_NORMAL_START'"
                >
                  <div
                    class="flex items-center col-span-1 font-bold text-lg bg-green-400 px-2 rounded-tl"
                  >
                    Level-up
                  </div>
                  <div class="col-span-4 flex gap-2 p-2">
                    <Badge
                      label="Level"
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
                  <span class="text-xs text-gray-500 ml-2 self-center">
                    <IconClock class="w-4 h-4 inline-block" />
                    {{ utils.formatTimeDH(action.currentTotalTimeMin) }}
                  </span>
                </div>
                <div
                  class="grid grid-cols-6 items-stretch"
                  v-else-if="action.type === 'LEVEL_BOOST'"
                >
                  <div
                    class="flex items-center col-span-1 font-bold text-xs bg-purple-400 px-2 rounded-tl"
                  >
                    Lvl-up Boosted
                  </div>
                  <div class="col-span-4 flex gap-2 p-2">
                    <Badge
                      label=""
                      :value="`${action.fromLevel} -> ${action.toLevel}`"
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
                      :value="'-' + action.boostCost + ' SLove'"
                      color="red"
                    />
                  </div>
                  <span class="text-xs text-gray-500 ml-2 self-center">
                    <IconClock class="w-4 h-4 inline-block" />
                    {{ utils.formatTimeDH(action.currentTotalTimeMin) }}
                  </span>
                </div>
                <div
                  class="flex gap-2"
                  v-else-if="action.type === 'DECISION_WAIT_FOR_BOOST'"
                >
                  <strong class="text-yellow-700"
                    >Strategy Decision (at Lv {{ action.atLevel }} targeting Lv
                    {{ action.targetLevel }}): Chose to Wait/Hunt (est.
                    {{ utils.formatTimeDH(action.waitTimeEstMin) }}) instead of
                    Normal Level Up ({{
                      utils.formatTimeDH(action.normalTimeMin)
                    }}) to afford boost.</strong
                  >
                </div>
                <div
                  class="grid grid-cols-6 items-stretch"
                  v-else-if="action.type === 'WAIT'"
                >
                  <div
                    class="flex items-center col-span-1 font-bold text-lg bg-gray-400 px-2 rounded-tl w-full"
                  >
                    WAIT
                  </div>
                  <div class="col-span-4 flex gap-2 p-2">
                    <Badge
                      :label="action.reason"
                      :value="utils.formatTimeDH(action.durationMin)"
                      color="green"
                    />
                  </div>
                  <span class="text-xs text-gray-500 ml-2 self-center">
                    <IconClock class="w-4 h-4 inline-block" />
                    {{ utils.formatTimeDH(action.currentTotalTimeMin) }}
                  </span>
                </div>
                <span v-else> Unknown Action: {{ action }} </span>
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
  return "bg-gray-100 rounded px-2 py-1 mb-1 overflow-hidden"; // default class
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
