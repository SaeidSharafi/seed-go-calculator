<script setup>
import { ref, reactive, onMounted, watch, nextTick } from "vue";
import * as Utils from "./utils.js";
import { findOptimalDistributionAndSimulate } from "./optimalDistribution.js";
import { simulateLevelingScenarios } from "./simulateLeveling.js";
import { RARITY_DATA } from "./data.js";
import MonsterForm from "./components/MonsterForm.vue";
import YearlyBreakdownTable from "./components/YearlyBreakdownTable.vue";
import ScenarioSummaryTable from "./components/ScenarioSummaryTable.vue";
import ScenarioDetails from "./components/ScenarioDetails.vue";
import BottomNavBar from "./components/BottomNavBar.vue";
import CalculateButton from "./components/CalculateButton.vue";
import StatsProgressTab from "./components/StatsProgressTab.vue";
import EarningsOutcomeTab from "./components/EarningsOutcomeTab.vue";
import SlovByAgeTab from "./components/SlovByAgeTab.vue";
import LevelingScenarioTab from "./components/LevelingScenarioTab.vue";
import {
  IconAward,
  IconAlertCircle,
  IconCalendar,
  IconListDetails,
} from "@tabler/icons-vue";

// --- State ---
const form = reactive({
  rarityName: "Common",
  className: "Aqua",
  currentLevel: 0,
  maxLevel: 30,
  currentAge: 0,
  currentEdurance: 0,
  currentTotalProficiency: 1,
  currentTotalRecovery: 1,
  energyPerHunt: 1,
  sloveBalance: 0,
  leaderLevel: 0,
  leaderAge: 0,
  leaderProficiency: 1,
  leaderRecovery: 1,
  leaderClass: "Aqua",
  leaderType: "Common",
  targetAge: 10,
});

const result = ref(null);
const scenarioResults = ref(null);
const error = ref("");
const calculating = ref(false);
const activeTab = ref(0);
const levelingTabLoading = ref(false);

const showCoffeeModal = ref(false);
const evmAddress = '0x43ce96adb065716716a0e0a8a4433c646a71ec5b';
const suiAddress = '0xc456dbf399aa4b418ccdfd267d58eb8f7f101e05d6b02b6a17010db1b459ab79';
const copyCryptoAddress = (address) => {
  navigator.clipboard.writeText(address);
};

const tabDefs = [
  { name: "Stats & Progress", icon: IconAward },
  { name: "Earnings Outcome", icon: IconAlertCircle },
  { name: "SLOV by Age", icon: IconCalendar },
  { name: "Leveling Scenario", icon: IconListDetails },
];

function updateInputsForRarity(rarity, profKey, recKey) {
  const rarityInfo = Utils.findRarityInfo(rarity);
  if (!rarityInfo) return;
  form[profKey] = rarityInfo.minBase;
  form[recKey] = rarityInfo.minBase;
}

function validateFormData() {
  if (form.currentAge > form.targetAge)
    return `Target Age (${form.targetAge}) cannot be less than Current Age (${form.currentAge}).`;
  if (form.maxLevel < form.currentLevel)
    return `Target Level (${form.maxLevel}) cannot be less than Current Level (${form.currentLevel}).`;
  if (
    [
      form.currentLevel,
      form.maxLevel,
      form.currentTotalProficiency,
      form.currentTotalRecovery,
      form.energyPerHunt,
      form.targetAge,
    ].some(isNaN)
  )
    return "Please ensure all inputs are valid numbers.";
  if (
    form.currentTotalProficiency < 0 ||
    form.currentTotalRecovery < 0 ||
    form.energyPerHunt <= 0 ||
    form.targetAge < 0 ||
    form.currentLevel < 0 ||
    form.maxLevel <= 0
  )
    return "Levels, Stats, Energy, and Age must be non-negative (or positive where applicable).";
  return null;
}

function calculate() {
  error.value = "";
  result.value = null;
  scenarioResults.value = null;
  calculating.value = true;
  setTimeout(() => {
    try {
      const validationError = validateFormData();
      if (validationError) throw new Error(validationError);
      const initialData = { ...form };
      const res = findOptimalDistributionAndSimulate(
        initialData,
        form.targetAge
      );
      if (res.error && !res.finalStats) {
        error.value = res.error;
        calculating.value = false;
        return;
      }
      res.scenarioResults = simulateLevelingScenarios(
        initialData,
        res.optimalDistributionToAdd
      );
      result.value = res;
      scenarioResults.value = res.scenarioResults;
    } catch (e) {
      error.value = e.message || e;
    } finally {
      calculating.value = false;
    }
  }, 10);
}

watch(activeTab, async (val, oldVal) => {
  if (val === 3 && oldVal !== 3) {
    levelingTabLoading.value = true;
    await nextTick();
    setTimeout(() => {
      levelingTabLoading.value = false;
    }, 400); // Simulate loading delay for heavy tab
  }
});

onMounted(() => {
  updateInputsForRarity(
    form.rarityName,
    "currentTotalProficiency",
    "currentTotalRecovery"
  );
  updateInputsForRarity(form.leaderType, "leaderProficiency", "leaderRecovery");
});
</script>

<template>
  <div
    class="mb-10 min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-blue-100 flex flex-col"
  >
    <header
      class="top-0 z-20 bg-gradient-to-r from-green-400 to-blue-500 shadow-lg text-white py-4 mb-6 rounded-b-2xl"
    >
      <h1
        class="text-3xl md:text-4xl font-extrabold text-center tracking-tight drop-shadow-lg"
      >
        <span class="inline-flex items-center gap-2">
          SeedGO Level-up Optimizer
        </span>
      </h1>
      <div class="flex justify-center mt-2">
        <button
          @click="showCoffeeModal = true"
          class="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-1 px-3 rounded shadow flex items-center gap-1 text-sm"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8a6 6 0 01-12 0"/><path d="M6 8V6a6 6 0 0112 0v2"/><path d="M4 19h16"/><path d="M8 21h8"/></svg>
          Buy me a coffee?
        </button>
      </div>
      <p
        class="text-center text-blue-100 text-sm mt-1 font-medium tracking-wide"
      >
        Optimize your monster's journey!
      </p>
    </header>
    <!-- Buy Me a Coffee Modal -->
    <div v-if="showCoffeeModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" @click.self="showCoffeeModal = false">
      <div class="bg-white rounded-lg shadow-lg p-6 max-w-xs w-full text-center relative">
        <button @click="showCoffeeModal = false" class="absolute top-2 right-2 text-gray-400 hover:text-gray-700">&times;</button>
        <div class="mb-2 text-lg font-bold text-yellow-700">Buy me a coffee ☕</div>
        <div class="mb-2 text-gray-700 text-sm">If you found this tool useful, you can support me with crypto:</div>
        <div class="mb-2">
          <div class="font-semibold text-xs text-gray-600 mb-1">EVM (ETH, BSC, etc):</div>
          <div class="font-mono text-xs bg-gray-100 rounded p-2 break-all select-all cursor-pointer mb-1" @click="copyCryptoAddress(evmAddress)">
            {{ evmAddress }}
          </div>
          <button @click="copyCryptoAddress(evmAddress)" class="mb-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs">Copy EVM Address</button>
        </div>
        <div class="mb-2">
          <div class="font-semibold text-xs text-gray-600 mb-1">Sui Address:</div>
          <div class="font-mono text-xs bg-gray-100 rounded p-2 break-all select-all cursor-pointer mb-1" @click="copyCryptoAddress(suiAddress)">
            {{ suiAddress }}
          </div>
          <button @click="copyCryptoAddress(suiAddress)" class="mb-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs">Copy Sui Address</button>
        </div>
        <div class="mt-3 text-gray-400 text-xs">Thank you! 💙</div>
      </div>
    </div>
    <main
      class="flex-1 w-full max-w-3xl mx-auto px-2 sm:px-4 py-2 rounded-xl bg-white/80 shadow-lg border border-blue-100"
    >
      <MonsterForm
        :form="form"
        :rarityData="RARITY_DATA"
        :calculating="calculating"
        @updateInputsForRarity="updateInputsForRarity"
        @submit="calculate"
      />
      <div id="results-area">
        <transition name="fade-slide" mode="out-in">
          <template v-if="result">
            <keep-alive>
              <div>
                <StatsProgressTab
                  v-if="activeTab === 0"
                  :result="result"
                  :form="form"
                  :utils="Utils"
                />
                <EarningsOutcomeTab
                  v-else-if="activeTab === 1"
                  :result="result"
                  :form="form"
                />
                <SlovByAgeTab
                  v-else-if="activeTab === 2"
                  :result="result"
                  :form="form"
                >
                  <YearlyBreakdownTable :result="result" :form="form" />
                </SlovByAgeTab>
                <LevelingScenarioTab
                  v-else-if="activeTab === 3"
                  :scenarioResults="scenarioResults"
                  :utils="Utils"
                >
                  <template #default>
                    <div
                      v-if="levelingTabLoading"
                      class="flex justify-center items-center py-8"
                    >
                      <svg
                        class="animate-spin w-8 h-8 text-blue-500"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          class="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="4"
                        ></circle>
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        ></path>
                      </svg>
                    </div>
                    <div v-else>
                      <ScenarioSummaryTable
                        :scenarioResults="scenarioResults"
                        :utils="Utils"
                      />
                      <ScenarioDetails
                        :scenarioResults="scenarioResults"
                        :utils="Utils"
                      />
                    </div>
                  </template>
                </LevelingScenarioTab>
              </div>
            </keep-alive>
          </template>
          <div
            v-else
            id="results-placeholder"
            class="text-center text-gray-500 py-8 animate-fade-in"
          >
            <svg
              class="mx-auto w-16 h-16 text-blue-300 mb-2 animate-bounce"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 2C7 2 2 7 2 12c0 5 5 10 10 10s10-5 10-10c0-5-5-10-10-10zm0 0v10m0 0l3-3m-3 3l-3-3"
              />
            </svg>
            <p>
              Enter your monster's details and click
              <span class="font-bold text-blue-700">Calculate</span>.
            </p>
          </div>
        </transition>
      </div>
    </main>
    <!-- Bottom Navigation and Calculate Button at Layout Level -->
    <div
      class="fixed bottom-0 left-0 w-full z-40 flex flex-col gap-0 pointer-events-none"
    >
      <BottomNavBar
        :tabs="tabDefs"
        :activeTab="activeTab"
        :show="!!(result && result.earningsOutcome)"
        @update:activeTab="activeTab = $event"
        class="pointer-events-auto"
      />
      <CalculateButton
        :loading="calculating"
        :disabled="calculating"
        @click="calculate"
        class="pointer-events-auto"
      />
    </div>
    <footer
      class="text-center text-xs text-gray-400 py-4 mt-8 rounded-t-2xl bg-white/60 border-t border-blue-100"
    >
      
    </footer>
  </div>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
.animate-fade-in {
  animation: fadeIn 1s ease;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
