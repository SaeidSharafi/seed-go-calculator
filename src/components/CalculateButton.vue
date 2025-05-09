<template>
  <button
    class="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-green-400 text-white font-bold rounded-none shadow hover:from-blue-600 hover:to-green-500 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <span v-if="loading" class="flex items-center gap-2 justify-center">
      <svg
        class="w-5 h-5 animate-spin"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
      </svg>
      Calculating...
    </span>
    <span v-else>
      <slot>Calculate Optimal Build</slot>
    </span>
  </button>
</template>
<script setup>
const props = defineProps({
  loading: Boolean,
  disabled: Boolean,
});
const emit = defineEmits(["click"]);
</script>
