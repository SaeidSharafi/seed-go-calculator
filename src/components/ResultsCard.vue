<template>
  <div
    id="results-card"
    class="bg-green-50/80 border border-green-100 rounded-2xl p-2 md:p-6 mb-8 shadow-xl animate-fade-in"
  >
    <!-- Tabs (Desktop) -->
    <nav
      class="hidden md:flex justify-between md:justify-start gap-2 mb-4 border-b border-green-100 sticky bottom-0 bg-green-50/80 z-10"
    >
      <button
        v-for="(tab, i) in tabs"
        :key="tab.name"
        @click="setTab(i)"
        :class="[
          'flex-1 md:flex-none flex items-center justify-center gap-1 px-2 py-2 md:px-4 md:py-2 rounded-t-lg font-semibold transition',
          activeTab === i
            ? 'bg-white shadow text-green-700'
            : 'text-gray-500 hover:bg-green-100',
        ]"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        <span class="hidden md:inline">{{ tab.name }}</span>
      </button>
    </nav>
    <!-- Tab Panels -->
    <div v-show="activeTab === 0">
      <!-- Combined Stats & Progress Section -->
      <div
        class="results-section mb-4 grid grid-cols-1 gap-4 text-xs md:text-base"
      >
        <div
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

            <span class="text-xs text-gray-600"
              >(Max drop is 79% at Age 10+)</span
            >
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
              <GaugeProgress
                :value="earningsPercent"
                label="Earnings"
                size="80"
              />
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
                    result.optimalDistributionToAdd?.proficiencyBonusToAdd ??
                    "N/A"
                  }}
                </dd>
                <dt class="flex items-center col-span-2 font-bold gap-1">
                  Recovery
                </dt>
                <dd
                  id="result-recovery"
                  class="font-mono text-green-800 text-lg"
                >
                  {{
                    result.optimalDistributionToAdd?.recoveryBonusToAdd ?? "N/A"
                  }}
                </dd>
              </dl>
            </CardSection>
            <CardSection
              title="Final Stats at Target Level"
              :icon="IconChartBar"
            >
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
    </div>
    <div v-show="activeTab === 1">
      <!-- Earnings Outcome -->
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
              result.earningsOutcome?.enduranceConsumedPerHuntAction?.toFixed(
                4
              ) ?? "N/A"
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
              result.earningsOutcome?.maxTotalSloveEarnedByTargetAge?.toFixed(
                2
              ) ?? "N/A"
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
          <dd
            id="result-time-targetage"
            class="font-bold text-blue-700 font-mono"
          >
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
    <div v-show="activeTab === 2">
      <!-- SLOV Earnings by Age -->
      <slot name="yearly-breakdown"></slot>
    </div>
    <div v-show="activeTab === 3">
      <!-- Leveling Scenario -->
      <slot name="scenario-summary"></slot>
      <slot name="scenario-details"></slot>
    </div>
  </div>
</template>
<script setup>
import { computed, ref } from "vue";
import {
  IconTrophy,
  IconChartBar,
  IconAlertCircle,
  IconCalendar,
  IconListDetails,
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
  form: Object,
  utils: Object,
  activeTab: Number,
});
const emit = defineEmits(["update:activeTab"]);

// Tab navigation state
const tabs = [
  { name: "Stats & Progress", icon: IconAward },
  { name: "Earnings Outcome", icon: IconAlertCircle },
  { name: "SLOV by Age", icon: IconCalendar },
  { name: "Leveling Scenario", icon: IconListDetails },
];

function setTab(i) {
  emit("update:activeTab", i);
}

// Age at which target level is reached
const ageAtTargetLevel = computed(() => {
  // Try to get from result.finalStats or fallback to form.targetAge
  return props.result?.finalStats?.ageAtTargetLevel ?? props.form.targetAge;
});

// Earnings percent at that age
const earningsPercent = computed(() => {
  const drop = props.utils.getFibonacciReductionPercent(props.form.targetAge);
  return Math.max(0, 100 - drop);
});

// Bar color: green (100%), yellow (50-80%), red (<50%)
const earningsBarColor = computed(() => {
  if (earningsPercent.value >= 80) return "bg-green-400";
  if (earningsPercent.value >= 50) return "bg-yellow-400";
  return "bg-red-500";
});

// Age reduction info
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
nav {
  /* sticky bottom for mobile, top for desktop */
  position: sticky;
  bottom: 0;
  top: auto;
  background: inherit;
  z-index: 10;
}
@media (min-width: 768px) {
  nav {
    position: static;
    border-bottom: 1px solid #e0f2f1;
    margin-bottom: 1rem;
  }
}
</style>
