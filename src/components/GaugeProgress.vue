<script setup>
import { computed } from "vue";
const props = defineProps({
  value: { type: Number, required: true }, // 0-100
  label: { type: String, default: "" },
  unit: { type: String, default: "%" },
});
const percent = computed(() => Math.max(0, Math.min(100, props.value)));
const gaugeDash = computed(() => `${(percent.value * 100) / 100 / 2} 100`); // 50 is full, 25 is half, etc.
const colorClass = computed(() => {
  if (percent.value >= 80) return "text-green-500";
  if (percent.value >= 50) return "text-orange-600";
  return "text-red-500";
});
</script>
<template>
  <div class="relative size-40 w-full justify-center -mb-16">
    <svg
      class="size-full rotate-180"
      viewBox="0 0 36 36"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Background Circle (Gauge) -->
      <circle
        cx="18"
        cy="18"
        r="16"
        fill="none"
        class="stroke-current text-orange-100 dark:text-neutral-700"
        stroke-width="3"
        stroke-dasharray="50 100"
        stroke-linecap="round"
      ></circle>
      <!-- Gauge Progress -->
      <circle
        cx="18"
        cy="18"
        r="16"
        fill="none"
        class="stroke-current"
        :class="colorClass"
        stroke-width="3"
        :stroke-dasharray="`${percent / 2} 100`"
        stroke-linecap="round"
      ></circle>
    </svg>
    <!-- Value Text -->
    <div
      class="absolute top-9 start-1/2 transform -translate-x-1/2 text-center"
    >
      <span class="text-2xl font-bold" :class="colorClass"
        >{{ percent }}<span class="text-xs">{{ unit }}</span></span
      >
      <span v-if="label" class="text-xs block" :class="colorClass">{{
        label
      }}</span>
    </div>
  </div>
</template>
