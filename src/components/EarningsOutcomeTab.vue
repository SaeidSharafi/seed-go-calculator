<template>
  
    <div
      v-if="scenarioResults.leader.error"
      class="bg-green-50 rounded-xl p-4 shadow flex flex-col gap-2 border border-green-100 text-red-500"
    >
      <p class="font-semibold">Error</p>
      <p>Impossible to Level up</p>
    </div>
  <div v-else>
  <div
    class="results-section mb-4 bg-yellow-50 rounded-xl p-4 shadow border border-yellow-100 text-sm md:text-base"
  >
    <h3 class="font-bold mb-1 flex items-center gap-1 text-yellow-700">
      <IconAlertCircle class="w-4 h-4" />
      Earnings Outcome
    </h3>
    <dl class="grid grid-cols-3 gap-2">
      <dt class="col-span-2">Endurance/Hunt</dt>
      <dd id="result-endurance-hunt" class="font-mono">
        {{
          result.earningsOutcome?.enduranceConsumedPerHuntAction?.toFixed(4) ??
          "N/A"
        }}
      </dd>
      <dt class="col-span-2">Hunts to Target Age</dt>
      <dd id="result-hunts-target-age" class="font-mono">
        {{ result.earningsOutcome?.huntsToReachTargetAge ?? "N/A" }}
      </dd>
      <dt class="col-span-2">BASE SLOV/Hunt</dt>
      <dd id="result-base-slove-hunt" class="font-mono">
        {{
          result.earningsOutcome?.baseSlovePerHuntActionAtMaxLevel?.toFixed(
            2
          ) ?? "N/A"
        }}
      </dd>
      <dt class="col-span-2">Max Total BASE SLOV</dt>
      <dd id="result-max-total-slove" class="font-mono">
        {{
          result.earningsOutcome?.maxTotalSloveEarnedByTargetAge?.toFixed(2) ??
          "N/A"
        }}
      </dd>
      <dt class="col-span-2">Recovery Cost/Hunt</dt>
      <dd id="result-recovery-cost" class="font-mono">
        {{
          (result.earningsOutcome?.slovRecoveryCostPerHuntActionAtMaxLevel?.toFixed(
            4
          ) ?? "N/A") + " SLOV"
        }}
      </dd>
      <dt class="font-bold text-blue-700 col-span-2">Time to Target Age</dt>
      <dd id="result-time-targetage" class="font-bold text-blue-700 font-mono">
        {{ result.timeToTargetAge ?? "N/A" }}
      </dd>
    </dl>
  </div>
  <div
    class="results-section mb-4 bg-pink-50 rounded-xl p-4 shadow border border-pink-100 text-sm md:text-base"
    id="results-single-hunt-section"
    v-if="
      form.currentAge === form.targetAge &&
      result.yearlyBreakdown &&
      result.yearlyBreakdown[0]
    "
  >
    <h3 class="font-bold mb-1 flex items-center gap-1 text-pink-700">
      <IconCalendar class="w-4 h-4" />
      Single Hunt Earnings
    </h3>
    <dl class="grid grid-cols-2 gap-2">
      <dt>SLOV Earned</dt>
      <dd id="result-single-hunt" class="font-mono text-pink-800 text-lg">
        {{ result.yearlyBreakdown[0].slovePerHunt?.toFixed(2) ?? "N/A" }}
      </dd>
    </dl>
  </div>
  </div>

</template>
<script setup>
import { IconAlertCircle, IconCalendar } from "@tabler/icons-vue";
const props = defineProps({
  result: Object,
  scenarioResults: Object,
  form: Object,
});
</script>
