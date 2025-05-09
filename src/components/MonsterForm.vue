<template>
  <form
    @submit.prevent="onSubmit"
    id="calculator-form"
    class="bg-white/90 border border-blue-200 rounded-2xl p-6 mb-8 shadow-xl animate-fade-in"
  >
    <h2
      class="text-xl font-extrabold mb-4 flex items-center gap-2 text-blue-700"
    >
      <svg
        class="w-4 h-4 text-blue-400 animate-bounce"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </svg>
      Monster Details
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Monster Details -->
      <div class="flex flex-col gap-2">
        <label for="rarity" class="font-semibold flex items-center gap-1">
          <svg
            class="w-4 h-4 text-blue-400"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
          </svg>
          Rarity:
        </label>
        <select
          v-model="form.rarityName"
          @change="
            updateInputsForRarity(
              form.rarityName,
              'currentTotalProficiency',
              'currentTotalRecovery'
            )
          "
          id="rarity"
          required
          class="input input-bordered rounded-lg focus:ring-2 focus:ring-blue-400 bg-white border border-blue-300 shadow-sm h-12 px-4 py-3 text-base"
        >
          <option v-for="r in rarityData" :key="r.name" :value="r.name">
            {{ r.name }}
          </option>
        </select>
      </div>
      <div class="flex flex-col gap-2">
        <label for="class" class="font-semibold flex items-center gap-1">
          <svg
            class="w-4 h-4 text-purple-400"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path d="M12 4v16m8-8H4" />
          </svg>
          Class:
        </label>
        <select
          v-model="form.className"
          id="class"
          required
          class="input input-bordered rounded-lg focus:ring-2 focus:ring-blue-400 bg-white border border-blue-300 shadow-sm h-12 px-4 py-3 text-base"
        >
          <option value="Aqua">Aqua</option>
          <option value="Reptile">Reptile</option>
          <option value="Beast">Beast</option>
          <option value="Plant">Plant</option>
          <option value="Bird">Bird</option>
          <option value="Ghost">Ghost</option>
        </select>
      </div>
      <div class="flex flex-col gap-2">
        <label for="current-level" class="font-semibold"
          >Current Level (0-29):</label
        >
        <input
          type="number"
          v-model.number="form.currentLevel"
          id="current-level"
          min="0"
          max="29"
          step="1"
          required
          class="input input-bordered rounded-lg focus:ring-2 focus:ring-blue-400 bg-white border border-blue-300 shadow-sm placeholder-gray-400 h-12 px-4 py-3 text-base"
        />
      </div>
      <div class="flex flex-col gap-2">
        <label for="max-level" class="font-semibold"
          >Target Level (1-30):</label
        >
        <input
          type="number"
          v-model.number="form.maxLevel"
          id="max-level"
          min="1"
          max="30"
          step="1"
          required
          class="input input-bordered rounded-lg focus:ring-2 focus:ring-blue-400 bg-white border border-blue-300 shadow-sm placeholder-gray-400 h-12 px-4 py-3 text-base"
        />
      </div>
      <div class="flex flex-col gap-2">
        <label for="current-age" class="font-semibold"
          >Current Age (Years):</label
        >
        <input
          type="number"
          v-model.number="form.currentAge"
          id="current-age"
          min="0"
          step="1"
          required
          class="input input-bordered rounded-lg focus:ring-2 focus:ring-blue-400 bg-white border border-blue-300 shadow-sm placeholder-gray-400 h-12 px-4 py-3 text-base"
        />
      </div>
      <div class="flex flex-col gap-2">
        <label for="current-edurance" class="font-semibold"
          >Endurance Used
          <span class="text-xs">(For Age calculation)</span>:</label
        >
        <input
          type="number"
          v-model.number="form.currentEdurance"
          id="current-edurance"
          max="99"
          step="1"
          required
          class="input input-bordered rounded-lg focus:ring-2 focus:ring-blue-400 bg-white border border-blue-300 shadow-sm placeholder-gray-400 h-12 px-4 py-3 text-base"
        />
      </div>
      <div class="flex flex-col gap-2">
        <label for="current-proficiency" class="font-semibold"
          >Current Total Proficiency:</label
        >
        <input
          type="number"
          v-model.number="form.currentTotalProficiency"
          id="current-proficiency"
          min="0"
          step="1"
          required
          class="input input-bordered rounded-lg focus:ring-2 focus:ring-blue-400 bg-white border border-blue-300 shadow-sm placeholder-gray-400 h-12 px-4 py-3 text-base"
        />
      </div>
      <div class="flex flex-col gap-2">
        <label for="current-recovery" class="font-semibold"
          >Current Total Recovery:</label
        >
        <input
          type="number"
          v-model.number="form.currentTotalRecovery"
          id="current-recovery"
          min="0"
          step="1"
          required
          class="input input-bordered rounded-lg focus:ring-2 focus:ring-blue-400 bg-white border border-blue-300 shadow-sm placeholder-gray-400 h-12 px-4 py-3 text-base"
        />
      </div>
      <div class="flex flex-col gap-2">
        <label for="energy-per-action" class="font-semibold"
          >Energy per Hunt Action:</label
        >
        <input
          type="number"
          v-model.number="form.energyPerHunt"
          id="energy-per-action"
          min="1"
          step="1"
          required
          class="input input-bordered rounded-lg focus:ring-2 focus:ring-blue-400 bg-white border border-blue-300 shadow-sm placeholder-gray-400 h-12 px-4 py-3 text-base"
        />
      </div>
      <div class="flex flex-col gap-2">
        <label for="target-age" class="font-semibold"
          >Target Age (Years):</label
        >
        <input
          type="number"
          v-model.number="form.targetAge"
          id="target-age"
          min="1"
          step="1"
          required
          class="input input-bordered rounded-lg focus:ring-2 focus:ring-blue-400 bg-white border border-blue-300 shadow-sm placeholder-gray-400 h-12 px-4 py-3 text-base"
        />
      </div>
      <div class="flex flex-col gap-2">
        <label for="slove-balance" class="font-semibold"
          >Slove Balance:
          <span class="text-xs text-gray-500"
            >used for leveling simulation</span
          >
        </label>
        <input
          type="number"
          v-model.number="form.sloveBalance"
          id="slove-balance"
          min="0"
          step="1"
          required
          class="input input-bordered rounded-lg focus:ring-2 focus:ring-blue-400 bg-white border border-blue-300 shadow-sm placeholder-gray-400 h-12 px-4 py-3 text-base"
        />
      </div>
    </div>
    <fieldset class="border border-blue-100 rounded-xl p-4 mt-6 bg-blue-50/60">
      <legend class="font-bold text-blue-700 px-2">Leader Stats</legend>
      <span class="text-xs text-gray-500 block mb-2"
        >Leader stats are used for Leveling Scenarios only. If you are using the
        Simulation target as the leader ignore this</span
      >
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="flex flex-col gap-2">
          <label for="leader-rarity" class="font-semibold"
            >Leader Rarity:</label
          >
          <select
            v-model="form.leaderType"
            @change="
              updateInputsForRarity(
                form.leaderType,
                'leaderProficiency',
                'leaderRecovery'
              )
            "
            id="leader-rarity"
            required
            class="input input-bordered rounded-lg focus:ring-2 focus:ring-blue-400 bg-white border border-blue-300 shadow-sm h-12 px-4 py-3 text-base"
          >
            <option v-for="r in rarityData" :key="r.name" :value="r.name">
              {{ r.name }}
            </option>
          </select>
        </div>
        <div class="flex flex-col gap-2">
          <label for="leader-class" class="font-semibold">Leader Class:</label>
          <select
            v-model="form.leaderClass"
            id="leader-class"
            required
            class="input input-bordered rounded-lg focus:ring-2 focus:ring-blue-400 bg-white border border-blue-300 shadow-sm h-12 px-4 py-3 text-base"
          >
            <option value="Aqua">Aqua</option>
            <option value="Reptile">Reptile</option>
            <option value="Beast">Beast</option>
            <option value="Plant">Plant</option>
            <option value="Bird">Bird</option>
            <option value="Ghost">Ghost</option>
          </select>
        </div>
        <div class="flex flex-col gap-2">
          <label for="leader-level" class="font-semibold">Leader Level:</label>
          <input
            type="number"
            v-model.number="form.leaderLevel"
            id="leader-level"
            min="0"
            max="30"
            step="1"
            required
            class="input input-bordered rounded-lg focus:ring-2 focus:ring-blue-400 bg-white border border-blue-300 shadow-sm placeholder-gray-400 h-12 px-4 py-3 text-base"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="leader-age" class="font-semibold">Leader Age:</label>
          <input
            type="number"
            v-model.number="form.leaderAge"
            id="leader-age"
            min="0"
            step="1"
            required
            class="input input-bordered rounded-lg focus:ring-2 focus:ring-blue-400 bg-white border border-blue-300 shadow-sm placeholder-gray-400 h-12 px-4 py-3 text-base"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="leader-proficiency" class="font-semibold"
            >Leader Proficiency:</label
          >
          <input
            type="number"
            v-model.number="form.leaderProficiency"
            id="leader-proficiency"
            min="0"
            step="1"
            required
            class="input input-bordered rounded-lg focus:ring-2 focus:ring-blue-400 bg-white border border-blue-300 shadow-sm placeholder-gray-400 h-12 px-4 py-3 text-base"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="leader-recovery" class="font-semibold"
            >Leader Recovery:</label
          >
          <input
            type="number"
            v-model.number="form.leaderRecovery"
            id="leader-recovery"
            min="0"
            step="1"
            required
            class="input input-bordered rounded-lg focus:ring-2 focus:ring-blue-400 bg-white border border-blue-300 shadow-sm placeholder-gray-400 h-12 px-4 py-3 text-base"
          />
        </div>
      </div>
    </fieldset>
  </form>
</template>
<script setup>
import { computed } from "vue";
const props = defineProps({
  form: Object,
  rarityData: Array,
  calculating: Boolean,
});
const emit = defineEmits(["updateInputsForRarity", "submit"]);
function onSubmit() {
  emit("submit");
}
function updateInputsForRarity(rarity, profKey, recKey) {
  emit("updateInputsForRarity", rarity, profKey, recKey);
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
