<script setup>
import { computed } from "vue";
const props = defineProps({
  steps: { type: Number, default: 4 },
  active: { type: Number, default: 1 }, // 1-based index
  color: { type: String, default: "teal" },
  completeColor: { type: String, default: "" },
  incompleteColor: { type: String, default: "" },
  label: { type: String, default: "" },
  showPercent: { type: Boolean, default: true },
  maxValue: { type: Number, default: 100 },
  title: { type: String, default: "" },
});
const percent = computed(() => Math.round((props.active / props.steps) * 100));
const getColor = (idx) => {
  if (props.completeColor && idx < props.active) return props.completeColor;
  if (props.incompleteColor && idx >= props.active)
    return props.incompleteColor;
  if (idx < props.active) return `bg-green-500`;
  return "bg-gray-300";
};
</script>
<template>
  <div class="flex flex-col items-center w-full">
    <div class="w-full flex flex-col items-center">
      <slot name="title">
        <span v-if="title" class="block text-sm font-bold text-gray-700 mb-1">{{
          title
        }}</span>
      </slot>
      <div class="flex items-center gap-x-1 w-full">
        <div
          v-for="i in steps"
          :key="i"
          class="w-full h-2.5 flex flex-col justify-center overflow-hidden rounded transition duration-500"
          :class="getColor(i - 1)"
          role="progressbar"
          :aria-valuenow="percent"
          aria-valuemin="0"
          :aria-valuemax="maxValue"
        ></div>
      </div>
      <div class="w-full flex justify-center mt-1">
        <span v-if="label" class="text-xs text-gray-800">{{ label }}</span>
        <span v-else-if="showPercent" class="text-xs text-gray-800"
          >{{ percent }}%</span
        >
      </div>
    </div>
  </div>
</template>
