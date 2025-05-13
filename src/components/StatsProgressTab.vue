<template>
  <div class="results-section mb-4 grid grid-cols-1 gap-4 text-xs md:text-base">
    <div
      v-if="scenarioResults.leader.error"
      class="bg-green-50 rounded-xl p-4 shadow flex flex-col gap-2 border border-green-100 text-red-500"
    >
      <p class="font-semibold">Error</p>
      <p>Impossible to Level up</p>
    </div>
    <div
      v-else
      class="bg-green-50 rounded-xl p-4 shadow flex flex-col gap-2 border border-green-100"
    >
      <h3 class="font-bold mb-2 flex items-center gap-1 text-green-700">
        <IconAward class="w-4 h-4" />
        Stats & Progress
      </h3>
      <div
        class="mb-2 flex flex-col items-center gap-2 p-2 rounded-lg bg-yellow-100 border border-yellow-300 text-yellow-900"
      >
        <div class="flex items-center gap-1">
          <IconInfoCircle class="w-4 h-4" />
          <span class="font-semibold"
            >Earnings drop at Age {{ ageAtTargetLevel }}:</span
          >
          <span class="font-mono">-{{ ageReduction.percent }}%</span>
        </div>
        <span class="text-xs text-gray-600">(Max drop is 79% at Age 10+)</span>
      </div>
      <div class="mb-2 grid grid-cols-1 md:grid-cols-2 gap-4">
        <CardSection title="Level Progress" :icon="IconStar">
          <StepPorgress
            :steps="30"
            :active="result.targetLevel"
            color="green"
            :label="`Lv ${result.targetLevel}/30`"
          />
        </CardSection>
        <CardSection title="Age Progress" :icon="IconClock">
          <StepPorgress
            :steps="10"
            :active="form.targetAge"
            color="blue"
            :label="`Age ${form.targetAge}/10`"
          />
        </CardSection>
        <CardSection title="Earnings Efficiency" :icon="IconTrendingUp">
          <GaugeProgress :value="earningsPercent" label="Earnings" size="80" />
        </CardSection>
        <CardSection title="Information" :icon="IconInfoCircle">
          <dl class="grid grid-cols-3 gap-2 text-xs md:text-base">
            <dt class="col-span-2 font-bold">Total SLove earned</dt>
            <dd id="result-max-total-slove" class="font-mono">
              {{
                result.earningsOutcome?.maxTotalSloveEarnedByTargetAge?.toFixed(
                  2
                ) ?? "N/A"
              }}
            </dd>
            <dt class="col-span-2 font-bold">Time to Target Age</dt>
            <dd id="result-time-targetage" class="font-mono text-sm">
              {{ result.timeToTargetAge ?? "N/A" }}
            </dd>
          </dl>
        </CardSection>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CardSection title="Optimal Bonus Points" :icon="IconTrophy">
          <dl class="grid grid-cols-3 gap-2">
            <dt class="flex items-center col-span-2 font-bold gap-1">
              Proficiency
            </dt>
            <dd
              id="result-proficiency"
              class="font-mono text-green-800 text-lg"
            >
              {{
                result.optimalDistributionToAdd?.proficiencyBonusToAdd ?? "N/A"
              }}
            </dd>
            <dt class="flex items-center col-span-2 font-bold gap-1">
              Recovery
            </dt>
            <dd id="result-recovery" class="font-mono text-green-800 text-lg">
              {{ result.optimalDistributionToAdd?.recoveryBonusToAdd ?? "N/A" }}
            </dd>
          </dl>
        </CardSection>
        <CardSection title="Final Stats at Target Level" :icon="IconChartBar">
          <dl class="grid grid-cols-3 gap-2">
            <dt class="col-span-2 font-bold flex items-center gap-1">
              Total Proficiency
            </dt>
            <dd
              id="result-final-proficiency"
              class="font-mono text-blue-800 text-lg"
            >
              {{ result.finalStats?.totalProficiency ?? "N/A" }}
            </dd>
            <dt class="col-span-2 font-bold flex items-center gap-1">
              Total Recovery
            </dt>
            <dd
              id="result-final-recovery"
              class="font-mono text-blue-800 text-lg"
            >
              {{ result.finalStats?.totalRecovery ?? "N/A" }}
            </dd>
          </dl>
        </CardSection>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed } from "vue";
import {
  IconTrophy,
  IconChartBar,
  IconInfoCircle,
  IconStar,
  IconAward,
  IconTrendingUp,
  IconClock,
} from "@tabler/icons-vue";
import StepPorgress from "./StepPorgress.vue";
import GaugeProgress from "./GaugeProgress.vue";
import CardSection from "./CardSection.vue";
const props = defineProps({
  result: Object,
  scenarioResults: Object,
  form: Object,
  utils: Object,
});
const ageAtTargetLevel = computed(() => {
  return props.result?.finalStats?.ageAtTargetLevel ?? props.form.targetAge;
});
const earningsPercent = computed(() => {
  const drop = props.utils.getFibonacciReductionPercent(props.form.targetAge);
  return Math.max(0, 100 - drop);
});
const ageReduction = computed(() => {
  if (ageAtTargetLevel.value > 0) {
    const percent = props.utils.getFibonacciReductionPercent(
      ageAtTargetLevel.value
    );
    return { percent, show: ageAtTargetLevel.value > 10 };
  }
  return { percent: 0, show: false };
});
</script>
